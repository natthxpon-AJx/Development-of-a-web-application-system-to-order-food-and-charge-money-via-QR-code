import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import pool from "./db.js";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { canAccess, issueSession, publicUser, verifySession } from "./auth.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try { await pool.query("SELECT 1"); res.json({ connected: true }); }
  catch { res.status(503).json({ error: "เชื่อมต่อฐานข้อมูลไม่ได้" }); }
});

// Customer reads stay public; every staff operation is checked on the server.
app.use("/api", async (req, res, next) => {
  let access = null;
  if (/^\/(staff|auth\/me)(\/|$)/.test(req.path)) {
    access = req.path.startsWith("/staff") ? req.method === "GET" ? "staff-directory" : "admin" : "authenticated";
  }
  if (/^\/(menu|categories|option-groups)(\/|$)/.test(req.path) && (req.method !== "GET" || req.path.startsWith("/option-groups"))) access = "owner-tools";
  if (req.path === "/store-settings/payment-qr" && ["GET", "PUT"].includes(req.method)) access = req.method === "GET" ? "owner-tools-or-cashier" : "owner-tools";
  if (req.path === "/tables/count" || req.path === "/payments" && req.method === "POST") access = "cashier";
  if (req.path === "/orders" && req.method === "GET" && !req.query.table) access = "staff";
  if (req.path === "/payments" && req.method === "GET" && !req.query.table) access = "owner-tools-or-cashier";
  if (/^\/orders\/[^/]+\/status$/.test(req.path)) access = "kitchen";
  if (/^\/order-items\/[^/]+\/status$/.test(req.path) && req.body?.status !== "received") access = "kitchen";
  if (!access) return next();
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const session = verifySession(token);
  if (!session) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบใหม่" });
  try {
    const [users] = await pool.query("SELECT * FROM users WHERE user_id = ?", [session.sub]);
    const user = users[0];
    if (!user || !verifySession(token, user)) return res.status(401).json({ error: "บัญชีหรือการเข้าสู่ระบบนี้ไม่สามารถใช้งานได้" });
    if (!canAccess(user, access)) return res.status(403).json({ error: "คุณไม่มีสิทธิ์ใช้งานส่วนนี้" });
    req.user = user;
    next();
  } catch (err) { next(err); }
});

app.get("/api/auth/me", (req, res) => res.json(publicUser(req.user)));

const PORT = process.env.PORT || 4000;
const DEFAULT_TABLE_COUNT = 8;
const ORDER_STATUSES = ["waiting", "cooking", "served", "completed", "cancelled"];
// สถานะรายเมนู แยกจากสถานะออเดอร์โดยรวม — ใช้ให้ครัวติ๊กเสร็จทีละเมนูก่อนจะปิดออเดอร์ทั้งใบได้
const ITEM_STATUSES = ["waiting", "done", "received", "cancelled"];
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function nowThai() {
  return new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });
}

function timeThai(dt) {
  return new Date(dt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });
}

function bangkokMonthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit" }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}${month}`;
}

async function reserveMonthlyOrderNumber(conn, createdAt) {
  const orderMonth = bangkokMonthKey(createdAt);
  const settingKey = `order_number_${orderMonth}`;
  await conn.query("INSERT IGNORE INTO store_settings (setting_key, setting_value) VALUES (?, ?)", [settingKey, "0"]);
  const [rows] = await conn.query("SELECT setting_value FROM store_settings WHERE setting_key = ? FOR UPDATE", [settingKey]);
  const monthlyNumber = Number(rows[0]?.setting_value || 0) + 1;
  await conn.query("UPDATE store_settings SET setting_value = ? WHERE setting_key = ?", [String(monthlyNumber), settingKey]);
  return { orderMonth, monthlyNumber };
}

// selected_options / options_config อาจถูกส่งกลับมาจาก mysql2 เป็น object อยู่แล้ว (คอลัมน์ชนิด JSON)
// แต่กันเหนียวไว้เผื่อบางไดรเวอร์/เวอร์ชันส่งเป็น string
function parseJsonColumn(value) {
  if (value == null) return null;
  return typeof value === "string" ? JSON.parse(value) : value;
}

// รวมค่าใน selected_options ({"sweetness":"50%","topping":"นมข้น"}) ให้เป็นข้อความเดียวไว้แสดงผล
function formatOptionsNote(raw) {
  const obj = parseJsonColumn(raw);
  if (!obj || typeof obj !== "object") return "";
  if (Array.isArray(obj)) {
    return obj.flatMap((group) => (group.items || []).map((item) => item.name || item)).filter(Boolean).join(" · ");
  }
  return Object.values(obj).filter(Boolean).join(" · ");
}

async function fetchOptionGroupsForMenus(conn, menuIds) {
  if (!menuIds.length) return {};
  const placeholders = menuIds.map(() => "?").join(",");
  const result = {};

  const [links] = await conn.query(
    `SELECT mog.menu_id, og.option_group_id, og.name, og.is_required, og.max_selections,
            mog.sort_order
       FROM menu_option_groups mog
       JOIN option_groups og ON og.option_group_id = mog.option_group_id AND og.is_active = 1
      WHERE mog.menu_id IN (${placeholders})
      ORDER BY mog.sort_order, og.sort_order, og.option_group_id`,
    menuIds
  );
  const [items] = await conn.query(
    `SELECT option_item_id, option_group_id, name, price_delta, sort_order
       FROM option_items
      WHERE is_active = 1 AND option_group_id IN (
        SELECT option_group_id FROM menu_option_groups WHERE menu_id IN (${placeholders})
      )
      ORDER BY sort_order, option_item_id`,
    menuIds
  );
  const itemsByGroup = {};
  items.forEach((item) => {
    if (!itemsByGroup[item.option_group_id]) itemsByGroup[item.option_group_id] = [];
    itemsByGroup[item.option_group_id].push({
      id: item.option_item_id,
      name: item.name,
      priceDelta: Number(item.price_delta),
    });
  });
  links.forEach((group) => {
    if (!result[group.menu_id]) result[group.menu_id] = [];
    result[group.menu_id].push({
      id: group.option_group_id,
      name: group.name,
      required: !!group.is_required,
      maxSelections: Number(group.max_selections),
      items: itemsByGroup[group.option_group_id] || [],
    });
  });
  return result;
}

function normalizeSelectedOptions(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return Object.entries(raw).map(([groupName, value]) => ({
    groupName,
    items: [{ name: value, priceDelta: 0 }],
  }));
}

function selectedOptionsNote(raw) {
  return normalizeSelectedOptions(raw)
    .flatMap((group) => (group.items || []).map((item) => item.name || item))
    .filter(Boolean)
    .join(" · ");
}

async function validateOrderItemOptions(conn, item) {
  const menuId = Number(item.menuId);
  if (!Number.isInteger(menuId) || menuId < 1) throw new Error("ไม่พบเมนูที่เลือก กรุณาโหลดเมนูใหม่");
  if (!Number.isInteger(Number(item.qty)) || Number(item.qty) < 1 || Number(item.qty) > 999) throw new Error("จำนวนรายการต้องอยู่ระหว่าง 1 ถึง 999");
  const [menuRows] = await conn.query("SELECT name, price, is_available FROM menu_items WHERE menu_id = ? FOR UPDATE", [menuId]);
  if (!menuRows.length) throw new Error("ไม่พบเมนูที่เลือก");
  if (!menuRows[0].is_available) throw new Error(`${menuRows[0].name} หมดชั่วคราว กรุณานำออกจากตะกร้า`);
  const groupsByMenu = await fetchOptionGroupsForMenus(conn, [menuId]);
  const groups = groupsByMenu[menuId] || [];
  const selected = normalizeSelectedOptions(item.options);
  let optionTotal = 0;
  const normalized = [];
  groups.forEach((group) => {
    const selectedGroup = selected.find((value) => Number(value.groupId) === group.id || value.groupName === group.name);
    const selectedItems = selectedGroup?.items || [];
    if (group.required && selectedItems.length === 0) throw new Error(`กรุณาเลือก ${group.name}`);
    if (selectedItems.length > group.maxSelections) throw new Error(`${group.name} เลือกได้ไม่เกิน ${group.maxSelections} รายการ`);
    const validItems = selectedItems.map((selectedItem) => {
      const found = group.items.find((option) => Number(selectedItem.itemId ?? selectedItem.id) === option.id || selectedItem.name === option.name);
      if (!found) throw new Error(`ตัวเลือกของ ${group.name} ไม่ถูกต้อง`);
      optionTotal += found.priceDelta;
      return { itemId: found.id, name: found.name, priceDelta: found.priceDelta };
    });
    if (new Set(validItems.map((option) => option.itemId)).size !== validItems.length) throw new Error("ตัวเลือกซ้ำกัน กรุณาเลือกใหม่");
    if (validItems.length) normalized.push({ groupId: group.id, groupName: group.name, items: validItems });
  });
  const price = Math.round((Number(menuRows[0].price) + optionTotal) * 100) / 100;
  if (!Number.isFinite(price) || price < 0) throw new Error(`${menuRows[0].name} มีราคาไม่ถูกต้อง กรุณาติดต่อพนักงาน`);
  if (Math.round(Number(item.price) * 100) !== Math.round(price * 100)) throw new Error(`${menuRows[0].name} มีการเปลี่ยนราคา กรุณาตรวจสอบราคาในเมนูแล้วเพิ่มรายการใหม่`);
  return { name: menuRows[0].name, price, selectedOptions: normalized };
}

async function fetchOrderItemsMap(conn, orderIds) {
  if (!orderIds.length) return {};
  const [rows] = await conn.query(
    `SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => "?").join(",")})`,
    orderIds
  );
  const map = {};
  rows.forEach((it) => {
    if (!map[it.order_id]) map[it.order_id] = [];
    map[it.order_id].push({
      id: it.order_item_id,
      name: it.item_name,
      note: formatOptionsNote(it.selected_options),
      price: Number(it.price_at_order),
      qty: it.quantity,
      status: it.item_status,
    });
  });
  return map;
}

function formatOrderRow(o, items) {
  return {
    id: o.order_id,
    orderNumber: Number(o.monthly_number) || Number(o.order_id),
    table: o.table_number,
    time: timeThai(o.created_at),
    createdAt: o.created_at,
    paidAt: o.paid_at || null,
    paymentId: o.payment_id || null,
    status: o.status,
    paid: !!o.is_paid,
    total: Number(o.total_price),
    items: items || [],
  };
}

function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      reject(new Error("Cloudinary credentials ยังไม่ถูกตั้งค่าใน .env"));
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "chamakmai/menu", resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("อัปโหลดรูปไม่สำเร็จ"));
          return;
        }
        resolve(result);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

async function ensureCategoriesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      category_id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [rows] = await pool.query(
    "SELECT DISTINCT category FROM menu_items WHERE category IS NOT NULL"
  );

  for (const row of rows) {
    if (!row.category) continue;
    await pool.query("INSERT IGNORE INTO categories (name) VALUES (?)", [row.category]);
  }
}

async function ensureOptionTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS option_groups (
      option_group_id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      is_required BOOLEAN NOT NULL DEFAULT 0,
      max_selections INT NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS option_items (
      option_item_id INT PRIMARY KEY AUTO_INCREMENT,
      option_group_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      price_delta DECIMAL(10,2) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      FOREIGN KEY (option_group_id) REFERENCES option_groups(option_group_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_option_groups (
      menu_id INT NOT NULL,
      option_group_id INT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      PRIMARY KEY (menu_id, option_group_id),
      FOREIGN KEY (menu_id) REFERENCES menu_items(menu_id) ON DELETE CASCADE,
      FOREIGN KEY (option_group_id) REFERENCES option_groups(option_group_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureTableSettings() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS store_settings (
      setting_key VARCHAR(50) PRIMARY KEY,
      setting_value TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const [columns] = await pool.query("SHOW COLUMNS FROM store_settings LIKE 'setting_value'");
  if (columns[0]?.Type?.startsWith("varchar(")) {
    await pool.query("ALTER TABLE store_settings MODIFY setting_value TEXT NOT NULL");
  }
  await pool.query(
    "INSERT IGNORE INTO store_settings (setting_key, setting_value) VALUES ('table_count', ?)",
    [DEFAULT_TABLE_COUNT]
  );
  await pool.query("INSERT IGNORE INTO store_settings (setting_key, setting_value) VALUES ('payment_qr_url', '')");
}

// Add columns without replacing tables or deleting existing orders/users.
export async function ensureOperationalColumns() {
  const additions = [
    ["orders", "paid_at", "DATETIME NULL"],
    ["orders", "payment_id", "VARCHAR(36) NULL"],
    ["orders", "request_key", "VARCHAR(80) NULL"],
    ["orders", "request_hash", "CHAR(64) NULL"],
    ["orders", "order_month", "CHAR(6) NULL"],
    ["orders", "monthly_number", "INT UNSIGNED NULL"],
    ["users", "is_active", "BOOLEAN NOT NULL DEFAULT 1"],
  ];
  for (const [table, column, definition] of additions) {
    const [columns] = await pool.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
    if (!columns.length) await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
  const [unassignedOrders] = await pool.query("SELECT order_id FROM orders WHERE order_month IS NULL OR monthly_number IS NULL LIMIT 1");
  if (unassignedOrders.length) {
    const [orders] = await pool.query("SELECT order_id, DATE_FORMAT(created_at, '%Y%m') AS month_key FROM orders ORDER BY created_at, order_id");
    const counters = new Map();
    for (const order of orders) {
      const orderMonth = order.month_key;
      const monthlyNumber = (counters.get(orderMonth) || 0) + 1;
      counters.set(orderMonth, monthlyNumber);
      await pool.query("UPDATE orders SET order_month = ?, monthly_number = ? WHERE order_id = ?", [orderMonth, monthlyNumber, order.order_id]);
    }
  }
  const [orderMonthColumn] = await pool.query("SHOW COLUMNS FROM orders LIKE 'order_month'");
  if (orderMonthColumn[0]?.Null === "YES") await pool.query("ALTER TABLE orders MODIFY order_month CHAR(6) NOT NULL");
  const [monthlyNumberColumn] = await pool.query("SHOW COLUMNS FROM orders LIKE 'monthly_number'");
  if (monthlyNumberColumn[0]?.Null === "YES") await pool.query("ALTER TABLE orders MODIFY monthly_number INT UNSIGNED NOT NULL");
  const [monthCounters] = await pool.query("SELECT order_month, MAX(monthly_number) AS last_number FROM orders GROUP BY order_month");
  for (const counter of monthCounters) {
    await pool.query(
      "INSERT INTO store_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = GREATEST(CAST(setting_value AS UNSIGNED), CAST(VALUES(setting_value) AS UNSIGNED))",
      [`order_number_${counter.order_month}`, String(counter.last_number)]
    );
  }
  const [indexes] = await pool.query("SHOW INDEX FROM orders WHERE Key_name = 'orders_request_key_unique'");
  if (!indexes.length) await pool.query("ALTER TABLE orders ADD UNIQUE INDEX orders_request_key_unique (request_key)");
  const [monthlyIndexes] = await pool.query("SHOW INDEX FROM orders WHERE Key_name = 'orders_monthly_number_unique'");
  if (!monthlyIndexes.length) await pool.query("ALTER TABLE orders ADD UNIQUE INDEX orders_monthly_number_unique (order_month, monthly_number)");
}

async function syncTableOccupancy(conn, table) {
  const [active] = await conn.query(
    "SELECT order_id FROM orders WHERE table_number = ? AND status <> 'cancelled' AND (is_paid = 0 OR status IN ('waiting', 'cooking')) ORDER BY order_id DESC LIMIT 1", [table]
  );
  await conn.query("UPDATE `tables` SET status = ?, current_order_id = ? WHERE table_id = ?", [active.length ? "occupied" : "available", active[0]?.order_id || null, table]);
}

async function getTableCount(conn = pool, lock = false) {
  const [rows] = await conn.query("SELECT setting_value FROM store_settings WHERE setting_key = 'table_count'" + (lock ? " FOR UPDATE" : ""));
  const count = Number(rows[0]?.setting_value);
  return Number.isInteger(count) && count > 0 ? count : DEFAULT_TABLE_COUNT;
}

function tableNumberFromCode(table) {
  const match = /^T(\d+)$/i.exec(String(table || ""));
  return match ? Number(match[1]) : null;
}

async function migrateLegacyMenuOptions() {
  const [columns] = await pool.query("SHOW COLUMNS FROM menu_items LIKE 'options_config'");
  if (!columns.length) return;
  const [menus] = await pool.query("SELECT menu_id, options_config FROM menu_items WHERE options_config IS NOT NULL");
  for (const menu of menus) {
    const legacyOptions = parseJsonColumn(menu.options_config);
    if (!legacyOptions || typeof legacyOptions !== "object") continue;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [existingLinks] = await conn.query("SELECT option_group_id FROM menu_option_groups WHERE menu_id = ?", [menu.menu_id]);
      if (!existingLinks.length) {
        let sortOrder = 0;
        for (const [groupName, values] of Object.entries(legacyOptions)) {
          const optionValues = Array.isArray(values) ? values : [values];
          const [groupResult] = await conn.query(
            "INSERT INTO option_groups (name, is_required, max_selections, sort_order) VALUES (?, 0, 1, ?)",
            [groupName, sortOrder++]
          );
          for (const [itemOrder, value] of optionValues.entries()) {
            await conn.query(
              "INSERT INTO option_items (option_group_id, name, price_delta, sort_order) VALUES (?, ?, 0, ?)",
              [groupResult.insertId, String(value), itemOrder]
            );
          }
          await conn.query(
            "INSERT INTO menu_option_groups (menu_id, option_group_id, sort_order) VALUES (?, ?, ?)",
            [menu.menu_id, groupResult.insertId, sortOrder - 1]
          );
        }
      }
      await conn.query("UPDATE menu_items SET options_config = NULL WHERE menu_id = ?", [menu.menu_id]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn?.release();
    }
  }
}

// ---------------------------------------------------------------------------
// เมนู (menu_items) — รวม sku
// ---------------------------------------------------------------------------
app.get("/api/menu", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM menu_items ORDER BY menu_id ASC");
    const optionGroups = await fetchOptionGroupsForMenus(pool, rows.map((row) => row.menu_id));
    const menu = rows.map((r) => ({
      id: r.menu_id,
      sku: r.sku,
      name: r.name,
      type: r.type,
      category: r.category,
      price: Number(r.price),
      image: r.image_url,
      active: !!r.is_available,
      optionGroups: optionGroups[r.menu_id] || [],
    }));
    res.json(menu);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "โหลดเมนูจากฐานข้อมูลไม่สำเร็จ" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    await ensureCategoriesTable();
    const [rows] = await pool.query("SELECT name FROM categories ORDER BY name ASC");
    res.json(["ทั้งหมด", ...rows.map((r) => r.name)]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "โหลดหมวดหมู่ไม่สำเร็จ" });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const { name } = req.body || {};
    const trimmed = String(name || "").trim();

    if (!trimmed) {
      return res.status(400).json({ error: "กรุณากรอกชื่อหมวดหมู่" });
    }

    await ensureCategoriesTable();
    const [result] = await pool.query("INSERT INTO categories (name) VALUES (?)", [trimmed]);
    res.status(201).json({ id: result.insertId, name: trimmed });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "หมวดหมู่นี้มีอยู่แล้ว" });
    }
    console.error(err);
    res.status(500).json({ error: "เพิ่มหมวดหมู่ไม่สำเร็จ" });
  }
});

app.patch("/api/categories/:name", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const oldName = decodeURIComponent(req.params.name || "").trim();
    const newName = String(req.body?.name || "").trim();
    if (!oldName || !newName) return res.status(400).json({ error: "ชื่อหมวดหมู่ไม่ถูกต้อง" });
    await ensureCategoriesTable();
    await conn.beginTransaction();
    const [result] = await conn.query("UPDATE categories SET name = ? WHERE name = ?", [newName, oldName]);
    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(404).json({ error: "ไม่พบหมวดหมู่นี้" });
    }
    await conn.query("UPDATE menu_items SET category = ? WHERE category = ?", [newName, oldName]);
    await conn.commit();
    res.json({ success: true, oldName, name: newName });
  } catch (err) {
    if (conn) await conn.rollback();
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "หมวดหมู่นี้มีอยู่แล้ว" });
    console.error(err);
    res.status(500).json({ error: "แก้ไขหมวดหมู่ไม่สำเร็จ" });
  } finally {
    conn?.release();
  }
});

app.delete("/api/categories/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name || "").trim();
    if (!name) return res.status(400).json({ error: "ชื่อหมวดหมู่ไม่ถูกต้อง" });
    await ensureCategoriesTable();
    const [menuRows] = await pool.query("SELECT COUNT(*) AS count FROM menu_items WHERE category = ?", [name]);
    if (Number(menuRows[0].count) > 0) {
      return res.status(409).json({ error: "ลบหมวดหมู่นี้ไม่ได้ เพราะยังมีเมนูใช้งานอยู่" });
    }
    const [result] = await pool.query("DELETE FROM categories WHERE name = ?", [name]);
    if (!result.affectedRows) return res.status(404).json({ error: "ไม่พบหมวดหมู่นี้" });
    res.json({ success: true, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ลบหมวดหมู่ไม่สำเร็จ" });
  }
});

app.post("/api/menu/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "กรุณาเลือกไฟล์ภาพก่อน" });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer);
    res.json({ imageUrl: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "อัปโหลดรูปไม่สำเร็จ" });
  }
});

app.get("/api/store-settings/payment-qr", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT setting_value FROM store_settings WHERE setting_key = ?", ["payment_qr_url"]);
    res.json({ imageUrl: rows[0]?.setting_value || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "โหลด QR รับชำระเงินไม่สำเร็จ" });
  }
});

app.put("/api/store-settings/payment-qr", async (req, res) => {
  const imageUrl = req.body?.imageUrl;
  if (imageUrl !== null && typeof imageUrl !== "string") {
    return res.status(400).json({ error: "รูปแบบ URL ของ QR ไม่ถูกต้อง" });
  }
  const normalizedUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";
  if (normalizedUrl.length > 2048) {
    return res.status(400).json({ error: "URL ของ QR ยาวเกินกำหนด" });
  }
  if (normalizedUrl) {
    try {
      if (new URL(normalizedUrl).protocol !== "https:") throw new Error("invalid protocol");
    } catch {
      return res.status(400).json({ error: "กรุณาใช้ URL ภาพแบบ HTTPS" });
    }
  }
  try {
    await pool.query(
      "INSERT INTO store_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
      ["payment_qr_url", normalizedUrl]
    );
    res.json({ imageUrl: normalizedUrl || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "บันทึก QR รับชำระเงินไม่สำเร็จ" });
  }
});

// ---------------------------------------------------------------------------
// ออเดอร์ (orders + order_items)
// ---------------------------------------------------------------------------
// GET /api/tables -> จำนวนโต๊ะที่เปิดใช้งานร่วมกันทุกบทบาท
app.get("/api/tables", async (req, res) => {
  try {
    const count = await getTableCount();
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "โหลดจำนวนโต๊ะไม่สำเร็จ" });
  }
});

// PATCH /api/tables/count body: { count }
app.patch("/api/tables/count", async (req, res) => {
  let conn;
  try {
    const count = Number(req.body?.count);
    if (!Number.isInteger(count) || count < 1) {
      return res.status(400).json({ error: "จำนวนโต๊ะต้องเป็นเลขจำนวนเต็มมากกว่า 0" });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();
    const currentCount = await getTableCount(conn, true);
    if (count < currentCount) {
      const [activeOrders] = await conn.query(
        "SELECT table_number FROM orders WHERE status <> 'cancelled' AND (is_paid = 0 OR status IN ('waiting', 'cooking')) AND CAST(SUBSTRING(table_number, 2) AS UNSIGNED) > ? LIMIT 1 FOR UPDATE",
        [count]
      );
      if (activeOrders.length) {
        await conn.rollback();
        return res.status(409).json({ error: `โต๊ะ ${activeOrders[0].table_number} ยังมีบิลค้างหรืออาหารที่ทำไม่เสร็จ ไม่สามารถลดจำนวนโต๊ะได้` });
      }
    }

    await conn.query("UPDATE store_settings SET setting_value = ? WHERE setting_key = 'table_count'", [count]);
    await conn.commit();
    res.json({ count });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "บันทึกจำนวนโต๊ะไม่สำเร็จ" });
  } finally { conn?.release(); }
});

// GET /api/orders?table=T05
app.get("/api/orders", async (req, res) => {
  try {
    const { table } = req.query;
    const [orderRows] = table
      ? await pool.query("SELECT * FROM orders WHERE table_number = ? ORDER BY order_id DESC", [table])
      : await pool.query("SELECT * FROM orders ORDER BY order_id DESC");
    if (!orderRows.length) return res.json([]);
    const itemsMap = await fetchOrderItemsMap(pool, orderRows.map((o) => o.order_id));
    res.json(orderRows.map((o) => formatOrderRow(o, itemsMap[o.order_id])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "โหลดออเดอร์ไม่สำเร็จ" });
  }
});

// POST /api/orders  body: { table, items: [{ menuId, sku, name, price, qty, options }] }
app.post("/api/orders", async (req, res) => {
  let conn;
  try {
    const { table, items, requestId } = req.body || {};
    if (!table || !Array.isArray(items) || !items.length || items.length > 100) return res.status(400).json({ error: "กรุณาระบุโต๊ะและรายการอาหาร 1 ถึง 100 รายการ" });
    if (requestId && !/^[a-zA-Z0-9_-]{8,80}$/.test(requestId)) return res.status(400).json({ error: "รหัสส่งออเดอร์ไม่ถูกต้อง" });
    const number = tableNumberFromCode(table);
    if (!number) return res.status(400).json({ error: "โต๊ะนี้ไม่เปิดให้บริการในขณะนี้" });
    const canonicalTable = "T" + String(number).padStart(2, "0");
    const requestHash = createHash("sha256").update(JSON.stringify({ table: canonicalTable, items })).digest("hex");
    conn = await pool.getConnection();
    await conn.beginTransaction();
    if (number > await getTableCount(conn, true)) { await conn.rollback(); return res.status(400).json({ error: "โต๊ะนี้ไม่เปิดให้บริการในขณะนี้" }); }
    await conn.query("INSERT IGNORE INTO `tables` (table_id, status) VALUES (?, 'available')", [canonicalTable]);
    await conn.query("SELECT table_id FROM `tables` WHERE table_id = ? FOR UPDATE", [canonicalTable]);
    if (requestId) {
      const [existing] = await conn.query("SELECT * FROM orders WHERE request_key = ?", [requestId]);
      if (existing.length) {
        if (existing[0].request_hash !== requestHash) { await conn.rollback(); return res.status(409).json({ error: "รายการสั่งซื้อนี้เปลี่ยนไป กรุณาตรวจสอบตะกร้า" }); }
        const existingItems = await fetchOrderItemsMap(conn, [existing[0].order_id]);
        await conn.commit();
        return res.json(formatOrderRow(existing[0], existingItems[existing[0].order_id]));
      }
    }
    const validatedItems = [];
    for (const item of items) {
      const validated = await validateOrderItemOptions(conn, item);
      validatedItems.push({ ...item, name: validated.name, price: validated.price, qty: Number(item.qty), options: validated.selectedOptions });
    }
    const totalPrice = validatedItems.reduce((sum, it) => sum + Math.round(it.price * 100) * it.qty, 0) / 100;
    const createdAt = new Date();
    const { orderMonth, monthlyNumber } = await reserveMonthlyOrderNumber(conn, createdAt);
    const [result] = await conn.query("INSERT INTO orders (table_number, total_price, order_month, monthly_number, created_at, status, is_paid, request_key, request_hash) VALUES (?, ?, ?, ?, ?, 'waiting', 0, ?, ?)", [canonicalTable, totalPrice, orderMonth, monthlyNumber, createdAt, requestId || null, requestId ? requestHash : null]);
    for (const item of validatedItems) {
      await conn.query("INSERT INTO order_items (order_id, menu_id, item_name, price_at_order, quantity, selected_options, item_status) VALUES (?, ?, ?, ?, ?, ?, 'waiting')", [result.insertId, item.menuId, item.name, item.price, item.qty, JSON.stringify(item.options)]);
    }
    await conn.query("UPDATE `tables` SET status = 'occupied', current_order_id = ?, last_active = NOW() WHERE table_id = ?", [result.insertId, canonicalTable]);
    const [rows] = await conn.query("SELECT * FROM orders WHERE order_id = ?", [result.insertId]);
    const itemMap = await fetchOrderItemsMap(conn, [result.insertId]);
    const response = formatOrderRow(rows[0], itemMap[result.insertId]);
    await conn.commit();
    res.status(201).json(response);
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(err.code ? 500 : 400).json({ error: err.code ? "สร้างออเดอร์ไม่สำเร็จ กรุณาลองใหม่" : err.message });
  } finally { conn?.release(); }
});

app.patch("/api/orders/:id/status", async (req, res) => {
  let conn;
  try {
    const id = Number(req.params.id);
    const status = req.body?.status;
    if (!Number.isInteger(id) || !["cooking", "served", "cancelled"].includes(status)) return res.status(400).json({ error: "สถานะออเดอร์ไม่ถูกต้อง" });
    conn = await pool.getConnection();
    const [location] = await conn.query("SELECT table_number FROM orders WHERE order_id = ?", [id]);
    if (!location.length) return res.status(404).json({ error: "ไม่พบออเดอร์นี้" });
    await conn.beginTransaction();
    // All operational mutations lock the table before the order/items.
    await conn.query("INSERT IGNORE INTO `tables` (table_id, status) VALUES (?, 'available')", [location[0].table_number]);
    await conn.query("SELECT table_id FROM `tables` WHERE table_id = ? FOR UPDATE", [location[0].table_number]);
    const [rows] = await conn.query("SELECT * FROM orders WHERE order_id = ? FOR UPDATE", [id]);
    const order = rows[0];
    if (!order) { await conn.rollback(); return res.status(404).json({ error: "ไม่พบออเดอร์นี้" }); }
    const target = status === "served" && order.is_paid ? "completed" : status;
    if (order.status !== target) {
      const valid = order.status === "waiting" && status === "cooking" || order.status === "cooking" && status === "served" || order.status === "waiting" && !order.is_paid && status === "cancelled";
      if (!valid) { await conn.rollback(); return res.status(409).json({ error: "สถานะออเดอร์เปลี่ยนไปแล้ว กรุณาโหลดข้อมูลใหม่" }); }
      if (status === "served") {
        const [pending] = await conn.query("SELECT order_item_id FROM order_items WHERE order_id = ? AND item_status NOT IN ('done', 'received', 'cancelled', 'served', 'completed') LIMIT 1", [id]);
        if (pending.length) { await conn.rollback(); return res.status(409).json({ error: "ยังมีอาหารที่ทำไม่เสร็จ" }); }
      }
      if (status === "cancelled") {
        await conn.query("UPDATE order_items SET item_status = 'cancelled' WHERE order_id = ?", [id]);
        await conn.query("UPDATE orders SET total_price = 0 WHERE order_id = ?", [id]);
      }
      await conn.query("UPDATE orders SET status = ? WHERE order_id = ?", [target, id]);
    }
    await syncTableOccupancy(conn, order.table_number);
    const [fresh] = await conn.query("SELECT * FROM orders WHERE order_id = ?", [id]);
    const map = await fetchOrderItemsMap(conn, [id]);
    await conn.commit();
    res.json(formatOrderRow(fresh[0], map[id]));
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "อัปเดตสถานะออเดอร์ไม่สำเร็จ" });
  } finally { conn?.release(); }
});

app.patch("/api/order-items/:id/status", async (req, res) => {
  let conn;
  try {
    const id = Number(req.params.id);
    const { status, table } = req.body || {};
    if (!Number.isInteger(id) || !ITEM_STATUSES.includes(status)) return res.status(400).json({ error: "สถานะรายการไม่ถูกต้อง" });
    conn = await pool.getConnection();
    const [location] = await conn.query("SELECT oi.order_id, o.table_number FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE oi.order_item_id = ?", [id]);
    if (!location.length) return res.status(404).json({ error: "ไม่พบรายการเมนูนี้" });
    await conn.beginTransaction();
    await conn.query("INSERT IGNORE INTO `tables` (table_id, status) VALUES (?, 'available')", [location[0].table_number]);
    await conn.query("SELECT table_id FROM `tables` WHERE table_id = ? FOR UPDATE", [location[0].table_number]);
    await conn.query("SELECT * FROM orders WHERE order_id = ? FOR UPDATE", [location[0].order_id]);
    const [rows] = await conn.query("SELECT oi.*, o.table_number, o.status AS order_status, o.is_paid FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE oi.order_item_id = ? FOR UPDATE", [id]);
    const item = rows[0];
    if (!item) { await conn.rollback(); return res.status(404).json({ error: "ไม่พบรายการเมนูนี้" }); }
    if (status === "received" && item.table_number !== table) { await conn.rollback(); return res.status(403).json({ error: "รายการนี้ไม่ได้อยู่ในโต๊ะของคุณ" }); }
    if (item.item_status !== status) {
      const valid = status === "received" && item.item_status === "done"
        || status === "done" && ["waiting", "cooking"].includes(item.item_status) && item.order_status === "cooking"
        || status === "cancelled" && item.order_status === "waiting" && !item.is_paid && item.item_status === "waiting";
      if (!valid) { await conn.rollback(); return res.status(409).json({ error: "รายการนี้เปลี่ยนสถานะไปแล้ว กรุณาโหลดข้อมูลใหม่" }); }
      await conn.query("UPDATE order_items SET item_status = ? WHERE order_item_id = ?", [status, id]);
      if (status === "cancelled") {
        const [remaining] = await conn.query("SELECT COUNT(*) AS count, COALESCE(SUM(price_at_order * quantity), 0) AS total FROM order_items WHERE order_id = ? AND item_status <> 'cancelled'", [item.order_id]);
        await conn.query("UPDATE orders SET total_price = ?, status = CASE WHEN ? = 0 THEN 'cancelled' ELSE status END WHERE order_id = ? AND is_paid = 0", [remaining[0].total, Number(remaining[0].count), item.order_id]);
      }
    }
    await syncTableOccupancy(conn, item.table_number);
    await conn.commit();
    res.json({ id, status });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "อัปเดตสถานะรายการไม่สำเร็จ" });
  } finally { conn?.release(); }
});

app.get("/api/payments", async (req, res) => {
  try {
    const { table } = req.query;
    const [orders] = table
      ? await pool.query("SELECT * FROM orders WHERE table_number = ? AND is_paid = 1 ORDER BY COALESCE(paid_at, created_at) DESC", [table])
      : await pool.query("SELECT * FROM orders WHERE is_paid = 1 ORDER BY COALESCE(paid_at, created_at) DESC");
    const map = await fetchOrderItemsMap(pool, orders.map((order) => order.order_id));
    res.json(orders.map((order) => ({ id: order.order_id, orderNumber: Number(order.monthly_number) || Number(order.order_id), paymentId: order.payment_id || null,
      table: order.table_number, amount: Number(order.total_price), total: Number(order.total_price),
      method: order.payment_method, time: timeThai(order.paid_at || order.created_at),
      paidAt: order.paid_at || null, createdAt: order.created_at,
      items: (map[order.order_id] || []).filter((item) => item.status !== "cancelled") })));
  } catch (err) { console.error(err); res.status(500).json({ error: "โหลดประวัติการชำระเงินไม่สำเร็จ" }); }
});

app.post("/api/payments", async (req, res) => {
  let conn;
  try {
    const { table, method, orderIds, expectedAmount } = req.body || {};
    if (!table || !["cash", "qr_code"].includes(method)) return res.status(400).json({ error: "กรุณาระบุโต๊ะและวิธีชำระเงินให้ถูกต้อง" });
    conn = await pool.getConnection();
    await conn.beginTransaction();
    await conn.query("SELECT table_id FROM `tables` WHERE table_id = ? FOR UPDATE", [table]);
    const [unpaid] = await conn.query("SELECT * FROM orders WHERE table_number = ? AND is_paid = 0 AND status <> 'cancelled' FOR UPDATE", [table]);
    if (!unpaid.length) { await conn.rollback(); return res.status(409).json({ error: "โต๊ะนี้ไม่มีบิลค้างชำระ" }); }
    const amount = unpaid.reduce((sum, order) => sum + Math.round(Number(order.total_price) * 100), 0) / 100;
    const ids = unpaid.map((order) => Number(order.order_id));
    if (method === "cash" && (orderIds || expectedAmount != null)) {
      const selectedIds = Array.isArray(orderIds) ? [...new Set(orderIds.map(Number))] : [];
      if (selectedIds.length !== ids.length || ids.some((id) => !selectedIds.includes(id)) || !Number.isFinite(Number(expectedAmount)) || Math.round(Number(expectedAmount) * 100) !== Math.round(amount * 100)) {
        await conn.rollback(); return res.status(409).json({ error: "รายการหรือยอดบิลเปลี่ยนไป กรุณาตรวจสอบยอดล่าสุดก่อนรับเงิน" });
      }
    }
    const paymentId = randomUUID();
    const paidAt = new Date();
    await conn.query(`UPDATE orders SET is_paid = 1, payment_method = ?, paid_at = ?, payment_id = ?, status = CASE WHEN status = 'served' THEN 'completed' ELSE status END WHERE order_id IN (${ids.map(() => "?").join(",")})`, [method, paidAt, paymentId, ...ids]);
    await syncTableOccupancy(conn, table);
    await conn.commit();
    res.status(201).json({ table, amount, method, orderIds: ids, paymentId, paidAt, time: timeThai(paidAt) });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err); res.status(500).json({ error: "บันทึกการชำระเงินไม่สำเร็จ" });
  } finally { conn?.release(); }
});
async function syncMenuOptionGroups(conn, menuId, optionGroupIds) {
  const ids = [...new Set((Array.isArray(optionGroupIds) ? optionGroupIds : []).map(Number).filter(Boolean))];
  if (ids.length) {
    const [groups] = await conn.query(
      `SELECT option_group_id FROM option_groups WHERE is_active = 1 AND option_group_id IN (${ids.map(() => "?").join(",")})`,
      ids
    );
    if (groups.length !== ids.length) throw new Error("พบกลุ่มตัวเลือกที่ไม่ถูกต้อง");
  }
  await conn.query("DELETE FROM menu_option_groups WHERE menu_id = ?", [menuId]);
  for (const [index, groupId] of ids.entries()) {
    await conn.query(
      "INSERT INTO menu_option_groups (menu_id, option_group_id, sort_order) VALUES (?, ?, ?)",
      [menuId, groupId, index]
    );
  }
}

function formatOptionGroup(group, items = []) {
  return {
    id: group.option_group_id,
    name: group.name,
    required: !!group.is_required,
    maxSelections: Number(group.max_selections),
    items: items.map((item) => ({ id: item.option_item_id, name: item.name, priceDelta: Number(item.price_delta) })),
  };
}

app.get("/api/option-groups", async (req, res) => {
  try {
    const [groups] = await pool.query("SELECT * FROM option_groups ORDER BY sort_order, option_group_id");
    const [items] = await pool.query("SELECT * FROM option_items WHERE is_active = 1 ORDER BY sort_order, option_item_id");
    res.json(groups.map((group) => formatOptionGroup(group, items.filter((item) => item.option_group_id === group.option_group_id))));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "โหลดกลุ่มตัวเลือกไม่สำเร็จ" });
  }
});

app.post("/api/option-groups", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { name, required = false, maxSelections = 1, items = [] } = req.body || {};
    const trimmedName = String(name || "").trim();
    const max = Number(maxSelections);
    if (!trimmedName || !Number.isInteger(max) || max < 1 || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "กรุณาระบุชื่อกลุ่ม จำนวนที่เลือก และตัวเลือกอย่างน้อย 1 รายการ" });
    }
    await conn.beginTransaction();
    const [groupResult] = await conn.query(
      "INSERT INTO option_groups (name, is_required, max_selections) VALUES (?, ?, ?)",
      [trimmedName, required ? 1 : 0, max]
    );
    const groupId = groupResult.insertId;
    for (const [index, item] of items.entries()) {
      const itemName = String(item.name || "").trim();
      if (!itemName) throw new Error("ชื่อตัวเลือกย่อยไม่ถูกต้อง");
      await conn.query(
        "INSERT INTO option_items (option_group_id, name, price_delta, sort_order) VALUES (?, ?, ?, ?)",
        [groupId, itemName, Number(item.priceDelta) || 0, index]
      );
    }
    const [groups] = await conn.query("SELECT * FROM option_groups WHERE option_group_id = ?", [groupId]);
    const [createdItems] = await conn.query("SELECT * FROM option_items WHERE option_group_id = ? ORDER BY sort_order", [groupId]);
    await conn.commit();
    res.status(201).json(formatOptionGroup(groups[0], createdItems));
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(400).json({ error: err.message || "สร้างกลุ่มตัวเลือกไม่สำเร็จ" });
  } finally {
    conn?.release();
  }
});

app.patch("/api/option-groups/:id", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const id = Number(req.params.id);
    const { name, required, maxSelections, items } = req.body || {};
    await conn.beginTransaction();
    await conn.query(
      "UPDATE option_groups SET name = COALESCE(?, name), is_required = COALESCE(?, is_required), max_selections = COALESCE(?, max_selections) WHERE option_group_id = ?",
      [name === undefined ? null : String(name).trim(), required === undefined ? null : (required ? 1 : 0), maxSelections === undefined ? null : Number(maxSelections), id]
    );
    if (Array.isArray(items)) {
      await conn.query("DELETE FROM option_items WHERE option_group_id = ?", [id]);
      for (const [index, item] of items.entries()) {
        await conn.query(
          "INSERT INTO option_items (option_group_id, name, price_delta, sort_order) VALUES (?, ?, ?, ?)",
          [id, String(item.name || "").trim(), Number(item.priceDelta) || 0, index]
        );
      }
    }
    const [groups] = await conn.query("SELECT * FROM option_groups WHERE option_group_id = ?", [id]);
    if (!groups.length) { await conn.rollback(); return res.status(404).json({ error: "ไม่พบกลุ่มตัวเลือกนี้" }); }
    const [updatedItems] = await conn.query("SELECT * FROM option_items WHERE option_group_id = ? ORDER BY sort_order", [id]);
    await conn.commit();
    res.json(formatOptionGroup(groups[0], updatedItems));
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(400).json({ error: err.message || "แก้ไขกลุ่มตัวเลือกไม่สำเร็จ" });
  } finally {
    conn?.release();
  }
});

app.delete("/api/option-groups/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM option_groups WHERE option_group_id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: "ไม่พบกลุ่มตัวเลือกนี้" });
    res.json({ success: true, id: Number(req.params.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ลบกลุ่มตัวเลือกไม่สำเร็จ" });
  }
});

// POST /api/menu  body: { sku, name, type, category, price, imageUrl, optionsConfig }
app.post("/api/menu", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { sku, name, type, category, price, imageUrl, optionGroupIds = [], isAvailable = true } = req.body || {};
    if (typeof name !== "string" || !name.trim() || !type || price == null || price === "" || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: "ต้องระบุ name, type และ price" });
    }
    if (!["food", "drink"].includes(type)) {
      return res.status(400).json({ error: "type ต้องเป็น food หรือ drink" });
    }
    if (typeof isAvailable !== "boolean") return res.status(400).json({ error: "สถานะเมนูไม่ถูกต้อง" });
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO menu_items (sku, name, type, category, price, image_url, is_available)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sku || null, name, type, category || null, price, imageUrl || null, isAvailable ? 1 : 0]
    );
    await syncMenuOptionGroups(conn, result.insertId, optionGroupIds);
    const optionGroups = await fetchOptionGroupsForMenus(conn, [result.insertId]);
    await conn.commit();
    res.status(201).json({
      id: result.insertId,
      sku: sku || null,
      name,
      type,
      category: category || null,
      price: Number(price),
      image: imageUrl || null,
      active: isAvailable,
      optionGroups: optionGroups[result.insertId] || [],
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "SKU นี้มีอยู่แล้วในระบบ" });
    }
    res.status(500).json({ error: "เพิ่มเมนูใหม่ไม่สำเร็จ" });
  } finally {
    conn?.release();
  }
});

// PATCH /api/menu/:id  body: { isAvailable, sku, name, type, category, price, imageUrl }
app.patch("/api/menu/:id", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { id } = req.params;
    const { isAvailable, sku, name, type, category, price, imageUrl, optionGroupIds } = req.body || {};
    const updates = [];
    const values = [];

    if (typeof isAvailable === "boolean") {
      updates.push("is_available = ?");
      values.push(isAvailable ? 1 : 0);
    }

    if (sku !== undefined) {
      updates.push("sku = ?");
      values.push(sku || null);
    }

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ error: "ชื่อเมนูไม่ถูกต้อง" });
      }
      updates.push("name = ?");
      values.push(trimmedName);
    }

    if (type !== undefined) {
      if (!["food", "drink"].includes(type)) {
        return res.status(400).json({ error: "type ต้องเป็น food หรือ drink" });
      }
      updates.push("type = ?");
      values.push(type);
    }

    if (category !== undefined) {
      updates.push("category = ?");
      values.push(category || null);
    }

    if (price !== undefined) {
      const numericPrice = Number(price);
      if (price === null || price === "" || !Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ error: "ราคาไม่ถูกต้อง" });
      }
      updates.push("price = ?");
      values.push(numericPrice);
    }

    if (imageUrl !== undefined) {
      updates.push("image_url = ?");
      values.push(imageUrl || null);
    }

    if (!updates.length && optionGroupIds === undefined) {
      return res.status(400).json({ error: "ไม่มีข้อมูลที่ต้องการอัปเดต" });
    }

    values.push(Number(id));
    await conn.beginTransaction();
    if (updates.length) {
      const [result] = await conn.query(`UPDATE menu_items SET ${updates.join(", ")} WHERE menu_id = ?`, values);
      if (result.affectedRows === 0) throw new Error("ไม่พบเมนูนี้");
    }
    if (optionGroupIds !== undefined) await syncMenuOptionGroups(conn, Number(id), optionGroupIds);
    const [rows] = await conn.query("SELECT * FROM menu_items WHERE menu_id = ?", [id]);
    const row = rows[0];
    if (!row) { await conn.rollback(); return res.status(404).json({ error: "ไม่พบเมนูนี้" }); }
    const optionGroups = await fetchOptionGroupsForMenus(conn, [Number(id)]);
    await conn.commit();
    res.json({
      id: Number(id),
      sku: row.sku,
      name: row.name,
      type: row.type,
      category: row.category,
      price: Number(row.price),
      image: row.image_url,
      active: !!row.is_available,
      optionGroups: optionGroups[Number(id)] || [],
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "อัปเดตเมนูไม่สำเร็จ" });
  } finally {
    conn?.release();
  }
});

app.delete("/api/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM menu_items WHERE menu_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "ไม่พบเมนูนี้" });
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ลบเมนูไม่สำเร็จ" });
  }
});

// ---------------------------------------------------------------------------
// จัดการผู้ใช้งาน / พนักงาน (users) — สำหรับหน้าเจ้าของร้าน
// phone, position เป็นคอลัมน์ส่วนขยาย (ไม่ได้อยู่ใน Database Design เดิม) เพื่อรองรับ
// ฟอร์ม "จัดการพนักงาน" ที่มีอยู่แล้วในโปรเจกต์ — ไม่ส่ง password_hash กลับไปฝั่ง client เด็ดขาด
// ---------------------------------------------------------------------------
function staffValues(body, existing = {}) {
  const value = { ...publicUser({ ...existing, is_active: existing.is_active ?? 1 }), ...body };
  if (typeof value.displayName !== "string" || !value.displayName.trim() || value.displayName.length > 100) throw new Error("กรุณาระบุชื่อพนักงานไม่เกิน 100 ตัวอักษร");
  if (!["admin", "staff"].includes(value.role)) throw new Error("สิทธิ์พนักงานไม่ถูกต้อง");
  if (!["ครัว", "แคชเชียร์", "เจ้าของร้าน"].includes(value.position)) throw new Error("กรุณาระบุตำแหน่งครัว แคชเชียร์ หรือเจ้าของร้าน");
  if (value.role === "admin" && value.position !== "เจ้าของร้าน") throw new Error("ตำแหน่งอื่นกำหนดสิทธิ์ได้เฉพาะพนักงาน");
  if (value.password && (typeof value.password !== "string" || value.password.length < 8 || value.password.length > 72)) throw new Error("รหัสผ่านใหม่ต้องยาว 8 ถึง 72 ตัวอักษร");
  if (value.phone != null && (typeof value.phone !== "string" || value.phone.length > 20)) throw new Error("เบอร์โทรไม่ถูกต้อง");
  if (typeof value.active !== "boolean") throw new Error("สถานะบัญชีไม่ถูกต้อง");
  return { ...value, displayName: value.displayName.trim() };
}

app.get("/api/staff", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT user_id, username, display_name, role, phone, position, is_active FROM users ORDER BY user_id ASC");
    res.json(rows.map(publicUser));
  } catch (err) { console.error(err); res.status(500).json({ error: "โหลดรายชื่อพนักงานไม่สำเร็จ" }); }
});

app.post("/api/staff", async (req, res) => {
  try {
    const data = staffValues({ active: true, ...req.body });
    if (typeof data.username !== "string" || !data.username.trim() || data.username.length > 50 || !data.password) return res.status(400).json({ error: "กรุณาระบุชื่อผู้ใช้งานและรหัสผ่าน" });
    const passwordHash = await bcrypt.hash(data.password, 10);
    const [result] = await pool.query("INSERT INTO users (username, password_hash, display_name, role, phone, position, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)", [data.username.trim(), passwordHash, data.displayName, data.role, data.phone || null, data.position, data.active]);
    res.status(201).json({ id: result.insertId, username: data.username.trim(), displayName: data.displayName, role: data.role, phone: data.phone, position: data.position, active: data.active });
  } catch (err) {
    console.error(err);
    res.status(err.code === "ER_DUP_ENTRY" ? 409 : err.code ? 500 : 400).json({ error: err.code === "ER_DUP_ENTRY" ? "ชื่อผู้ใช้งานนี้มีอยู่แล้ว" : err.code ? "เพิ่มพนักงานไม่สำเร็จ" : err.message });
  }
});

app.patch("/api/staff/:id", async (req, res) => {
  let conn;
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "รหัสพนักงานไม่ถูกต้อง" });
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [admins] = await conn.query("SELECT user_id FROM users WHERE role = 'admin' AND is_active = 1 FOR UPDATE");
    const [rows] = await conn.query("SELECT * FROM users WHERE user_id = ? FOR UPDATE", [id]);
    const previous = rows[0];
    if (!previous) { await conn.rollback(); return res.status(404).json({ error: "ไม่พบพนักงานนี้" }); }
    const data = staffValues(req.body, previous);
    if (req.user.user_id === id && (!data.active || data.role !== "admin")) { await conn.rollback(); return res.status(409).json({ error: "ไม่สามารถปิดบัญชีหรือลดสิทธิ์ของตัวเองได้" }); }
    if (previous.role === "admin" && previous.is_active && (!data.active || data.role !== "admin") && admins.length <= 1) { await conn.rollback(); return res.status(409).json({ error: "ต้องมีเจ้าของร้านที่เปิดใช้งานอย่างน้อยหนึ่งบัญชี" }); }
    const hash = data.password ? await bcrypt.hash(data.password, 10) : previous.password_hash;
    await conn.query("UPDATE users SET display_name = ?, role = ?, phone = ?, position = ?, is_active = ?, password_hash = ? WHERE user_id = ?", [data.displayName, data.role, data.phone || null, data.position, data.active, hash, id]);
    await conn.commit();
    res.json({ id, username: previous.username, displayName: data.displayName, role: data.role, phone: data.phone, position: data.position, active: data.active });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err); res.status(err.code ? 500 : 400).json({ error: err.code ? "แก้ไขพนักงานไม่สำเร็จ" : err.message });
  } finally { conn?.release(); }
});

app.delete("/api/staff/:id", async (req, res) => {
  let conn;
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "รหัสพนักงานไม่ถูกต้อง" });
    if (req.user.user_id === id) return res.status(409).json({ error: "ไม่สามารถลบบัญชีที่กำลังใช้งานได้" });
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [admins] = await conn.query("SELECT user_id FROM users WHERE role = 'admin' AND is_active = 1 FOR UPDATE");
    const [rows] = await conn.query("SELECT * FROM users WHERE user_id = ? FOR UPDATE", [id]);
    const previous = rows[0];
    if (!previous) { await conn.rollback(); return res.status(404).json({ error: "ไม่พบผู้ใช้นี้" }); }
    if (previous.role === "admin" && previous.is_active && admins.length <= 1) {
      await conn.rollback();
      return res.status(409).json({ error: "ต้องมีผู้ดูแลร้านที่เปิดใช้งานอย่างน้อยหนึ่งบัญชี" });
    }
    await conn.query("DELETE FROM users WHERE user_id = ?", [id]);
    await conn.commit();
    res.json({ id, deleted: true });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err); res.status(500).json({ error: "ลบผู้ใช้ไม่สำเร็จ" });
  } finally { conn?.release(); }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) return res.status(400).json({ error: "กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน" });
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username.trim()]);
    const user = rows[0];
    if (!user || !user.is_active || !await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกปิดใช้งาน" });
    if (!canAccess(user, "authenticated")) return res.status(403).json({ error: "บัญชีนี้ยังไม่ได้กำหนดตำแหน่งงาน กรุณาติดต่อเจ้าของร้าน" });
    res.json(issueSession(user));
  } catch (err) { console.error(err); res.status(500).json({ error: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่" }); }
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err instanceof SyntaxError ? 400 : 500).json({ error: err instanceof SyntaxError ? "ข้อมูลที่ส่งไม่ถูกต้อง" : "ระบบไม่พร้อมใช้งาน กรุณาลองใหม่" });
});

export { app };
export async function startServer() {
  await ensureOptionTables();
  await ensureTableSettings();
  await ensureOperationalColumns();
  await migrateLegacyMenuOptions();
  return app.listen(PORT, () => console.log(`ร้านชาแมกไม้ — backend API ทำงานที่ http://localhost:${PORT}`));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().catch((err) => { console.error("เริ่มระบบหลังบ้านไม่สำเร็จ:", err); process.exitCode = 1; });
}
