import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import pool from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const ORDER_STATUSES = ["waiting", "cooking", "served", "completed", "cancelled"];

function nowThai() {
  return new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function timeThai(dt) {
  return new Date(dt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
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
  return Object.values(obj).filter(Boolean).join(" · ");
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
      name: it.item_name,
      note: formatOptionsNote(it.selected_options),
      price: Number(it.price_at_order),
      qty: it.quantity,
    });
  });
  return map;
}

function formatOrderRow(o, items) {
  return {
    id: o.order_id,
    table: o.table_number,
    time: timeThai(o.created_at),
    status: o.status,
    paid: !!o.is_paid,
    total: Number(o.total_price),
    items: items || [],
  };
}

// ---------------------------------------------------------------------------
// เมนู (menu_items) — รวม sku
// ---------------------------------------------------------------------------
app.get("/api/menu", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM menu_items ORDER BY menu_id ASC");
    const menu = rows.map((r) => ({
      id: r.menu_id,
      sku: r.sku,
      name: r.name,
      type: r.type,
      category: r.category,
      price: Number(r.price),
      image: r.image_url,
      active: !!r.is_available,
      options: parseJsonColumn(r.options_config) || {},
    }));
    res.json(menu);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "โหลดเมนูจากฐานข้อมูลไม่สำเร็จ" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT category FROM menu_items WHERE category IS NOT NULL"
    );
    res.json(["ทั้งหมด", ...rows.map((r) => r.category)]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "โหลดหมวดหมู่ไม่สำเร็จ" });
  }
});

// ---------------------------------------------------------------------------
// ออเดอร์ (orders + order_items)
// ---------------------------------------------------------------------------
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
  const conn = await pool.getConnection();
  try {
    const { table, items } = req.body || {};
    if (!table || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "ต้องระบุ table และ items อย่างน้อย 1 รายการ" });
    }
    const totalPrice = items.reduce((sum, it) => sum + Number(it.price) * Number(it.qty), 0);

    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      "INSERT INTO orders (table_number, total_price, status, is_paid) VALUES (?, ?, 'waiting', 0)",
      [table, totalPrice]
    );
    const orderId = orderResult.insertId;

    for (const it of items) {
      await conn.query(
        `INSERT INTO order_items
          (order_id, menu_id, item_name, price_at_order, quantity, selected_options, item_status)
         VALUES (?, ?, ?, ?, ?, ?, 'waiting')`,
        [
          orderId,
          it.menuId || null,
          it.name,
          it.price,
          it.qty,
          it.options && Object.keys(it.options).length ? JSON.stringify(it.options) : null,
        ]
      );
    }

    // เปิด/อัปเดตสถานะโต๊ะให้เป็น occupied และผูกกับออเดอร์ล่าสุดที่ยังไม่จ่ายเงิน
    await conn.query(
      `INSERT INTO \`tables\` (table_id, status, current_order_id, last_active)
       VALUES (?, 'occupied', ?, NOW())
       ON DUPLICATE KEY UPDATE status = 'occupied', current_order_id = VALUES(current_order_id), last_active = VALUES(last_active)`,
      [table, orderId]
    );

    await conn.commit();

    res.status(201).json({
      id: orderId,
      table,
      time: nowThai(),
      status: "waiting",
      paid: false,
      total: totalPrice,
      items: items.map((it) => ({
        name: it.name,
        note: it.options ? Object.values(it.options).filter(Boolean).join(" · ") : "",
        price: it.price,
        qty: it.qty,
      })),
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "สร้างออเดอร์ไม่สำเร็จ" });
  } finally {
    conn.release();
  }
});

// PATCH /api/orders/:id/status  body: { status }
// ใช้สำหรับหน้าครัว (kitchen.jsx) ในอนาคต — status ต้องอยู่ใน ENUM ของตาราง orders
app.patch("/api/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status ต้องเป็นหนึ่งใน: ${ORDER_STATUSES.join(", ")}` });
    }
    const [result] = await pool.query("UPDATE orders SET status = ? WHERE order_id = ?", [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "ไม่พบออเดอร์นี้" });
    const [rows] = await pool.query("SELECT * FROM orders WHERE order_id = ?", [id]);
    const itemsMap = await fetchOrderItemsMap(pool, [Number(id)]);
    res.json(formatOrderRow(rows[0], itemsMap[id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "อัปเดตสถานะออเดอร์ไม่สำเร็จ" });
  }
});

// ---------------------------------------------------------------------------
// การชำระเงิน — สคีมานี้ไม่มีตาราง payments แยก แต่ใช้คอลัมน์
// payment_method / is_paid ในตาราง orders เอง ("ประวัติ" คือออเดอร์ที่ is_paid=1)
// ---------------------------------------------------------------------------
// GET /api/payments?table=T05  -> ออเดอร์ที่จ่ายแล้วของโต๊ะนั้น
app.get("/api/payments", async (req, res) => {
  try {
    const { table } = req.query;
    const [orderRows] = table
      ? await pool.query("SELECT * FROM orders WHERE table_number = ? AND is_paid = 1 ORDER BY order_id DESC", [table])
      : await pool.query("SELECT * FROM orders WHERE is_paid = 1 ORDER BY order_id DESC");
    if (!orderRows.length) return res.json([]);
    const itemsMap = await fetchOrderItemsMap(pool, orderRows.map((o) => o.order_id));
    res.json(
      orderRows.map((o) => ({
        table: o.table_number,
        amount: Number(o.total_price),
        method: o.payment_method,
        time: timeThai(o.created_at),
        items: (itemsMap[o.order_id] || []).map((it) => ({ name: it.name, qty: it.qty, price: it.price })),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "โหลดประวัติการชำระเงินไม่สำเร็จ" });
  }
});

// POST /api/payments  body: { table, method }
// ใช้สำหรับหน้าแคชเชียร์ (cashier.jsx) ในอนาคต — ปิดบิลออเดอร์ "ทั้งหมดที่ยังไม่จ่าย" ของโต๊ะนั้นในครั้งเดียว
// (เหมือนวิธีคิดเงินแบบเดิมที่คิดทั้งบิลของโต๊ะ ไม่ใช่ทีละออเดอร์)
app.post("/api/payments", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { table, method } = req.body || {};
    if (!table || !method) {
      return res.status(400).json({ error: "ต้องระบุ table และ method" });
    }

    await conn.beginTransaction();
    const [unpaid] = await conn.query(
      "SELECT * FROM orders WHERE table_number = ? AND is_paid = 0 FOR UPDATE",
      [table]
    );
    if (!unpaid.length) {
      await conn.rollback();
      return res.status(400).json({ error: "โต๊ะนี้ไม่มีบิลค้างชำระ" });
    }
    const amount = unpaid.reduce((sum, o) => sum + Number(o.total_price), 0);

    await conn.query(
      "UPDATE orders SET is_paid = 1, payment_method = ?, status = 'completed' WHERE table_number = ? AND is_paid = 0",
      [method, table]
    );
    await conn.query(
      "UPDATE `tables` SET status = 'available', current_order_id = NULL WHERE table_id = ?",
      [table]
    );
    await conn.commit();

    res.status(201).json({ table, amount, method, time: nowThai() });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "บันทึกการชำระเงินไม่สำเร็จ" });
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------------------
// จัดการเมนู (สำหรับหน้าเจ้าของร้าน — owner.jsx)
// ---------------------------------------------------------------------------
// POST /api/menu  body: { sku, name, type, category, price, imageUrl, optionsConfig }
app.post("/api/menu", async (req, res) => {
  try {
    const { sku, name, type, category, price, imageUrl, optionsConfig } = req.body || {};
    if (!name || !type || !price) {
      return res.status(400).json({ error: "ต้องระบุ name, type และ price" });
    }
    if (!["food", "drink"].includes(type)) {
      return res.status(400).json({ error: "type ต้องเป็น food หรือ drink" });
    }
    const [result] = await pool.query(
      `INSERT INTO menu_items (sku, name, type, category, price, image_url, is_available, options_config)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [sku || null, name, type, category || null, price, imageUrl || null, optionsConfig ? JSON.stringify(optionsConfig) : null]
    );
    res.status(201).json({
      id: result.insertId,
      sku: sku || null,
      name,
      type,
      category: category || null,
      price: Number(price),
      image: imageUrl || null,
      active: true,
      options: optionsConfig || {},
    });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "SKU นี้มีอยู่แล้วในระบบ" });
    }
    res.status(500).json({ error: "เพิ่มเมนูใหม่ไม่สำเร็จ" });
  }
});

// PATCH /api/menu/:id  body: { isAvailable }  — เปิด/ปิดการขาย
app.patch("/api/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body || {};
    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({ error: "ต้องระบุ isAvailable เป็น true/false" });
    }
    const [result] = await pool.query("UPDATE menu_items SET is_available = ? WHERE menu_id = ?", [
      isAvailable ? 1 : 0,
      id,
    ]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "ไม่พบเมนูนี้" });
    res.json({ id: Number(id), active: isAvailable });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "อัปเดตสถานะเมนูไม่สำเร็จ" });
  }
});

// ---------------------------------------------------------------------------
// จัดการผู้ใช้งาน / พนักงาน (users) — สำหรับหน้าเจ้าของร้าน
// phone, position เป็นคอลัมน์ส่วนขยาย (ไม่ได้อยู่ใน Database Design เดิม) เพื่อรองรับ
// ฟอร์ม "จัดการพนักงาน" ที่มีอยู่แล้วในโปรเจกต์ — ไม่ส่ง password_hash กลับไปฝั่ง client เด็ดขาด
// ---------------------------------------------------------------------------
app.get("/api/staff", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT user_id, username, display_name, role, phone, position FROM users ORDER BY user_id ASC"
    );
    res.json(
      rows.map((u) => ({
        id: u.user_id,
        username: u.username,
        displayName: u.display_name,
        role: u.role,
        phone: u.phone,
        position: u.position,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "โหลดรายชื่อพนักงานไม่สำเร็จ" });
  }
});

// POST /api/staff  body: { username, password, displayName, role, phone, position }
app.post("/api/staff", async (req, res) => {
  try {
    const { username, password, displayName, role, phone, position } = req.body || {};
    if (!username || !password || !displayName) {
      return res.status(400).json({ error: "ต้องระบุ username, password และ displayName" });
    }
    if (!["admin", "staff"].includes(role)) {
      return res.status(400).json({ error: "role ต้องเป็น admin หรือ staff" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (username, password_hash, display_name, role, phone, position) VALUES (?, ?, ?, ?, ?, ?)",
      [username, passwordHash, displayName, role, phone || null, position || null]
    );
    res.status(201).json({ id: result.insertId, username, displayName, role, phone: phone || null, position: position || null });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "username นี้มีอยู่แล้วในระบบ" });
    }
    res.status(500).json({ error: "เพิ่มพนักงานใหม่ไม่สำเร็จ" });
  }
});

// ---------------------------------------------------------------------------
// เข้าสู่ระบบ — เทียบ username/password กับตาราง users จริง
// ---------------------------------------------------------------------------
// POST /api/login  body: { username, password }
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "กรุณากรอก username และ password" });
    }
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" });
    }
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" });
    }
    res.json({
      id: user.user_id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      position: user.position,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" });
  }
});

app.listen(PORT, () => {
  console.log(`ร้านชาแมกไม้ — backend API (MySQL/XAMPP) ทำงานที่ http://localhost:${PORT}`);
});