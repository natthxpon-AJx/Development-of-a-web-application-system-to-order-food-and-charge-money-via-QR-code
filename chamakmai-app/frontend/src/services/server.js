import express from "express";
import cors from "cors";
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

app.listen(PORT, () => {
  console.log(`ร้านชาแมกไม้ — backend API (MySQL/XAMPP) ทำงานที่ http://localhost:${PORT}`);
});
