import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import pool from "../db.js";
import { issueSession } from "../auth.js";

// ชุดทดสอบ API จำลองฐานข้อมูลไว้ในหน่วยความจำ เพื่อไม่แก้ข้อมูลร้านจริง
// Every database entry point is replaced before loading the app. Unknown SQL
// fails the test instead of falling back to MySQL, so these tests cannot touch
// the restaurant's database or run startup migrations.
const originalQuery = pool.query;
const originalGetConnection = pool.getConnection;
let state;
let beforeAdminLock;
const clone = (value) => structuredClone(value);
const timestamp = "2026-10-02T07:00:00.000Z";
const currentMonthKey = (() => {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year").value}${parts.find((part) => part.type === "month").value}`;
})();

function fixture() {
  const users = [
    { user_id: 1, username: "owner", display_name: "Owner", role: "admin", position: "เจ้าของร้าน", is_active: 1, password_hash: "owner-hash" },
    { user_id: 2, username: "cashier", display_name: "Cashier", role: "staff", position: "แคชเชียร์", is_active: 1, password_hash: "cashier-hash" },
    { user_id: 3, username: "kitchen", display_name: "Kitchen", role: "staff", position: "ครัว", is_active: 1, password_hash: "kitchen-hash" },
  ];
  const order = (id, status, total, paid = 0, table = "T01") => ({ order_id: id, order_month: currentMonthKey, monthly_number: id, table_number: table, status, total_price: total, is_paid: paid, created_at: timestamp });
  const item = (id, orderId, price, status = "waiting", name = "ชาไทย") => ({ order_item_id: id, order_id: orderId, menu_id: 1, item_name: name, price_at_order: price, quantity: 1, item_status: status, selected_options: [] });
  return {
    users, orders: [order(1, "waiting", 40.25), order(2, "cooking", 50.5), order(3, "served", 20), order(4, "cancelled", 999), order(5, "completed", 15, 1, "T02")],
    items: [item(11, 1, 40.25), item(21, 2, 50.5), item(31, 3, 20, "done"), item(41, 4, 999, "cancelled"), item(51, 5, 15, "received")],
    tables: { T01: { status: "occupied", current_order_id: 3 }, T02: { status: "available", current_order_id: null } },
    menus: [{ menu_id: 1, name: "ชาไทย", price: 40.25, is_available: 1 }],
    tableCount: 8, settings: { payment_qr_url: "", [`order_number_${currentMonthKey}`]: "5" }, queries: [], unexpected: [], nextOrderId: 6, nextItemId: 60,
  };
}

async function fakeQuery(sql, values = []) {
  const query = sql.replace(/\s+/g, " ").trim();
  state.queries.push({ sql: query, values: clone(values) });
  const rows = (value) => [clone(value), []];
  const updated = (count = 1) => [{ affectedRows: count }, []];
  if (query === "SELECT 1") return rows([{ value: 1 }]);
  if (query.startsWith("INSERT IGNORE INTO store_settings (setting_key, setting_value)")) {
    state.settings[values[0]] ??= String(values[1]);
    return updated();
  }
  if (query.startsWith("SELECT setting_value FROM store_settings WHERE setting_key = ?")) {
    const value = state.settings[values[0]];
    return rows(value === undefined ? [] : [{ setting_value: value }]);
  }
  if (query.startsWith("SELECT setting_value FROM store_settings")) return rows([{ setting_value: String(state.tableCount) }]);
  if (query.startsWith("SELECT") && query.includes("FROM users")) {
    if (query.includes("role = 'admin'") && beforeAdminLock) { const action = beforeAdminLock; beforeAdminLock = null; action(); }
    let users = state.users;
    if (query.includes("user_id = ?")) users = users.filter((user) => user.user_id === Number(values[0]));
    if (query.includes("username = ?")) users = users.filter((user) => user.username === values[0]);
    if (query.includes("role = 'admin'")) users = users.filter((user) => user.role === "admin");
    if (query.includes("is_active = 1")) users = users.filter((user) => !!user.is_active);
    return rows(users);
  }
  if (query.startsWith("UPDATE users SET display_name")) {
    const [display_name, role, phone, position, is_active, password_hash, id] = values;
    const user = state.users.find((entry) => entry.user_id === Number(id));
    if (user) Object.assign(user, { display_name, role, phone, position, is_active, password_hash });
    return updated(user ? 1 : 0);
  }
  if (query.startsWith("INSERT INTO users")) {
    const [username, password_hash, display_name, role, phone, position, is_active] = values;
    const user_id = Math.max(0, ...state.users.map((user) => user.user_id)) + 1;
    state.users.push({ user_id, username, password_hash, display_name, role, phone, position, is_active });
    return [{ insertId: user_id, affectedRows: 1 }, []];
  }
  if (query.startsWith("DELETE FROM users WHERE user_id = ?")) {
    const index = state.users.findIndex((user) => user.user_id === Number(values[0]));
    if (index < 0) return updated(0);
    state.users.splice(index, 1);
    return updated();
  }
  if (query.startsWith("SELECT") && query.includes("FROM menu_items")) return rows(state.menus.filter((menu) => menu.menu_id === Number(values[0])));
  if (query.startsWith("SELECT") && (query.includes("FROM menu_option_groups") || query.includes("FROM option_items"))) return rows([]);
  if (query.startsWith("SELECT") && query.includes("FROM order_items oi") && query.includes("JOIN orders o")) {
    const item = state.items.find((entry) => entry.order_item_id === Number(values[0]));
    const order = item && state.orders.find((entry) => entry.order_id === item.order_id);
    return rows(item && order ? [{ ...item, table_number: order.table_number, order_status: order.status, is_paid: order.is_paid }] : []);
  }
  if (query.startsWith("SELECT") && query.includes("FROM order_items")) {
    let items = state.items;
    if (query.includes("order_item_id = ?")) items = items.filter((item) => item.order_item_id === Number(values[0]));
    else if (query.includes("order_id IN")) items = items.filter((item) => values.map(Number).includes(item.order_id));
    else if (query.includes("order_id = ?")) items = items.filter((item) => item.order_id === Number(values[0]));
    if (query.includes("item_status <> 'cancelled'")) items = items.filter((item) => item.item_status !== "cancelled");
    if (query.includes("item_status NOT IN")) items = items.filter((item) => !["done", "received", "cancelled", "served", "completed"].includes(item.item_status));
    if (query.includes("COUNT(*)")) return rows([{ count: items.length, total: items.reduce((total, item) => total + item.price_at_order * item.quantity, 0) }]);
    return rows(query.includes("LIMIT 1") ? items.slice(0, 1) : items);
  }
  if (query.startsWith("SELECT") && query.includes("FROM orders")) {
    let orders = state.orders;
    if (query.includes("table_number = ?")) orders = orders.filter((order) => order.table_number === values[0]);
    if (query.includes("order_id = ?")) orders = orders.filter((order) => order.order_id === Number(values[0]));
    if (query.includes("request_key = ?")) orders = orders.filter((order) => order.request_key === values[0]);
    if (query.includes("CAST(SUBSTRING(table_number, 2) AS UNSIGNED) > ?")) orders = orders.filter((order) => Number(order.table_number.slice(1)) > Number(values[0]));
    if (query.includes("status <> 'cancelled'")) orders = orders.filter((order) => order.status !== "cancelled");
    if (query.includes("(is_paid = 0 OR status IN")) orders = orders.filter((order) => !order.is_paid || ["waiting", "cooking"].includes(order.status));
    else if (query.includes("is_paid = 0")) orders = orders.filter((order) => !order.is_paid);
    else if (query.includes("is_paid = 1")) orders = orders.filter((order) => !!order.is_paid);
    orders = [...orders].sort((a, b) => b.order_id - a.order_id);
    return rows(query.includes("LIMIT 1") ? orders.slice(0, 1) : orders);
  }
  if (query.startsWith("SELECT table_id FROM `tables`")) return rows(state.tables[values[0]] ? [{ table_id: values[0] }] : []);
  if (query.startsWith("INSERT INTO store_settings (setting_key, setting_value)")) { state.settings[values[0]] = String(values[1]); return updated(); }
  if (query.startsWith("UPDATE store_settings SET setting_value = ? WHERE setting_key = ?")) { state.settings[values[1]] = String(values[0]); return updated(); }
  if (query.startsWith("UPDATE store_settings SET setting_value")) { state.tableCount = Number(values[0]); return updated(); }
  if (query.startsWith("INSERT IGNORE INTO `tables`")) {
    state.tables[values[0]] ||= { status: "available", current_order_id: null };
    return updated();
  }
  if (query.startsWith("INSERT INTO orders")) {
    const [table_number, total_price, order_month, monthly_number, created_at, request_key, request_hash] = values;
    const order_id = state.nextOrderId++;
    state.orders.push({ order_id, table_number, total_price, order_month, monthly_number, request_key, request_hash, status: "waiting", is_paid: 0, created_at });
    return [{ insertId: order_id, affectedRows: 1 }, []];
  }
  if (query.startsWith("INSERT INTO order_items")) {
    const [order_id, menu_id, item_name, price_at_order, quantity, selected_options] = values;
    const order_item_id = state.nextItemId++;
    state.items.push({ order_item_id, order_id, menu_id, item_name, price_at_order, quantity, selected_options, item_status: "waiting" });
    return [{ insertId: order_item_id, affectedRows: 1 }, []];
  }
  if (query.startsWith("UPDATE orders SET is_paid = 1")) {
    const [payment_method, paid_at, payment_id, ...ids] = values;
    const orders = state.orders.filter((order) => ids.map(Number).includes(order.order_id));
    orders.forEach((order) => Object.assign(order, { is_paid: 1, payment_method, paid_at, payment_id, status: order.status === "served" ? "completed" : order.status }));
    return updated(orders.length);
  }
  if (query.startsWith("UPDATE orders SET status = ?")) {
    const order = state.orders.find((entry) => entry.order_id === Number(values[1]));
    if (order) order.status = values[0];
    return updated(order ? 1 : 0);
  }
  if (query.startsWith("UPDATE orders SET total_price")) {
    const id = query.includes("CASE WHEN") ? values[2] : query.includes("total_price = 0") ? values[0] : values[1];
    const order = state.orders.find((entry) => entry.order_id === Number(id));
    if (order) { order.total_price = query.includes("total_price = 0") ? 0 : values[0]; if (query.includes("CASE WHEN") && !values[1]) order.status = "cancelled"; }
    return updated(order ? 1 : 0);
  }
  if (query.startsWith("UPDATE order_items SET item_status = ?")) {
    const item = state.items.find((entry) => entry.order_item_id === Number(values[1]));
    if (item) item.item_status = values[0];
    return updated(item ? 1 : 0);
  }
  if (query.startsWith("UPDATE order_items SET item_status = 'cancelled'")) {
    state.items.filter((item) => item.order_id === Number(values[0])).forEach((item) => { item.item_status = "cancelled"; });
    return updated();
  }
  if (query.startsWith("UPDATE `tables`")) {
    if (query.includes("status = ?")) state.tables[values[2]] = { status: values[0], current_order_id: values[1] };
    else state.tables[values[1]] = { status: "occupied", current_order_id: values[0] };
    return updated();
  }
  state.unexpected.push(query);
  throw new Error(`Unexpected SQL in isolated test database: ${query}`);
}

pool.query = fakeQuery;
pool.getConnection = async () => {
  let snapshot;
  return {
    query: fakeQuery,
    async beginTransaction() { snapshot = clone(state); },
    async commit() { snapshot = null; },
    async rollback() { if (snapshot) { const queries = state.queries; const unexpected = state.unexpected; state = snapshot; state.queries = queries; state.unexpected = unexpected; snapshot = null; } },
    release() {},
  };
};
const { app } = await import("../server.js");
let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});
beforeEach(() => { state = fixture(); beforeAdminLock = null; });
after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  pool.query = originalQuery;
  pool.getConnection = originalGetConnection;
  await pool.end();
});

async function call(path, { method = "GET", body, user, token } = {}) {
  const response = await fetch(baseUrl + path, { method, headers: { "Content-Type": "application/json", ...(user || token ? { Authorization: `Bearer ${token || issueSession(state.users.find((entry) => entry.username === user)).token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  assert.deepEqual(state.unexpected, [], "all database operations must remain inside the fake database");
  return { status: response.status, data };
}

// ทดสอบการเข้าสู่ระบบ สิทธิ์ของแต่ละตำแหน่ง และการจัดการบัญชีพนักงาน
describe("staff access", () => {
  it("protects staff reads and writes while keeping table-scoped customer reads public", async () => {
    for (const path of ["/orders", "/payments", "/staff", "/auth/me"]) assert.equal((await call(path)).status, 401);
    assert.equal((await call("/payments", { method: "POST", body: { table: "T01", method: "cash" } })).status, 401);
    const customerOrders = await call("/orders?table=T01");
    assert.equal(customerOrders.status, 200);
    assert.ok(customerOrders.data.every((order) => order.table === "T01"));
    assert.equal((await call("/payments?table=T02")).status, 200);
  });
  it("checks current roles on the server for kitchen and cashier", async () => {
    assert.equal((await call("/orders", { user: "kitchen" })).status, 200);
    assert.equal((await call("/payments", { user: "kitchen" })).status, 403);
    assert.equal((await call("/orders/1/status", { method: "PATCH", user: "cashier", body: { status: "cooking" } })).status, 403);
    assert.equal((await call("/staff", { user: "cashier" })).status, 403);
    assert.equal((await call("/auth/me", { user: "owner" })).data.role, "admin");
  });
  it("allows owner-position staff owner tools and directory reads, but not staff mutations or staff-wide orders", async () => {
    state.users.push({ user_id: 4, username: "owner-viewer", display_name: "Owner Viewer", role: "staff", position: "เจ้าของร้าน", is_active: 1, password_hash: "viewer-hash" });
    const list = await call("/staff", { user: "owner-viewer" });
    assert.equal(list.status, 200);
    assert.equal(list.data.length, 4);
    assert.equal((await call("/auth/me", { user: "owner-viewer" })).status, 200);
    assert.equal((await call("/payments", { user: "owner-viewer" })).status, 200);
    assert.equal((await call("/categories", { method: "POST", user: "owner-viewer", body: {} })).status, 400);
    assert.equal((await call("/categories", { method: "POST", user: "cashier", body: {} })).status, 403);
    const payload = { username: "new-staff", displayName: "New Staff", role: "staff", position: "ครัว", password: "Password123!", active: true };
    assert.equal((await call("/staff", { method: "POST", user: "owner-viewer", body: payload })).status, 403);
    assert.equal((await call("/staff/2", { method: "PATCH", user: "owner-viewer", body: { displayName: "Changed" } })).status, 403);
    assert.equal((await call("/orders", { user: "owner-viewer" })).status, 403);
    assert.equal(state.users[1].display_name, "Cashier");
  });
  it("accepts owner as a staff position", async () => {
    const response = await call("/staff", { method: "POST", user: "owner", body: { username: "owner-viewer", displayName: "Owner Viewer", role: "staff", position: "เจ้าของร้าน", password: "Password123!", active: true } });
    assert.equal(response.status, 201);
    assert.equal(response.data.role, "staff");
    assert.equal(response.data.position, "เจ้าของร้าน");
    const invalidRole = await call("/staff", { method: "POST", user: "owner", body: { username: "bad-admin", displayName: "Bad Admin", role: "admin", position: "ครัว", password: "Password123!", active: true } });
    assert.equal(invalidRole.status, 400);
  });
  it("rejects tampered, expired, disabled, and password-invalidated sessions", async () => {
    const user = state.users[1];
    const session = issueSession(user);
    const [payload, signature] = session.token.split(".");
    const changed = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), sub: 1 })).toString("base64url");
    assert.equal((await call("/auth/me", { token: `${changed}.${signature}` })).status, 401);
    assert.equal((await call("/auth/me", { token: issueSession(user, Date.now() - 9 * 3600000).token })).status, 401);
    user.is_active = 0;
    assert.equal((await call("/auth/me", { token: session.token })).status, 401);
    user.is_active = 1;
    user.password_hash = "new-password-hash";
    assert.equal((await call("/auth/me", { token: session.token })).status, 401);
  });
  it("denies employee create and update requests before they can mutate users", async () => {
    const existing = clone(state.users);
    const payload = { username: "new-staff", displayName: "New Staff", role: "staff", position: "ครัว", password: "Password123!", active: true };
    for (const user of ["cashier", "kitchen"]) {
      assert.equal((await call("/staff", { method: "POST", user, body: payload })).status, 403);
      assert.equal((await call("/staff/1", { method: "PATCH", user, body: { active: false } })).status, 403);
      assert.equal((await call("/staff/1", { method: "DELETE", user })).status, 403);
    }
    assert.deepEqual(state.users, existing);
  });
  it("prevents the owner from deactivating or demoting their own account", async () => {
    const existing = clone(state.users[0]);
    for (const body of [{ active: false }, { role: "staff", position: "ครัว" }]) {
      const response = await call("/staff/1", { method: "PATCH", user: "owner", body });
      assert.equal(response.status, 409);
      assert.match(response.data.error, /ตัวเอง/);
      assert.deepEqual(state.users[0], existing);
    }
  });
  it("lets an admin delete another user but prevents deleting their own account", async () => {
    assert.equal((await call("/staff/2", { method: "DELETE", user: "owner" })).status, 200);
    assert.equal(state.users.some((user) => user.user_id === 2), false);
    const selfDelete = await call("/staff/1", { method: "DELETE", user: "owner" });
    assert.equal(selfDelete.status, 409);
    assert.equal(state.users.some((user) => user.user_id === 1), true);
  });
  it("keeps the final active owner when another admin is disabled after passing authentication", async () => {
    // Simulate a concurrent revocation between middleware authorization and the
    // locked admin read. The actor no longer counts as a surviving active owner.
    for (const body of [{ active: false }, { role: "staff", position: "แคชเชียร์" }]) {
      state = fixture();
      state.users.push({ ...state.users[0], user_id: 4, username: "second-owner", password_hash: "second-owner-hash" });
      const token = issueSession(state.users[3]).token;
      beforeAdminLock = () => { state.users[3].is_active = 0; };
      const response = await call("/staff/1", { method: "PATCH", token, body });
      assert.equal(response.status, 409);
      assert.match(response.data.error, /อย่างน้อยหนึ่ง/);
      assert.equal(state.users[0].role, "admin");
      assert.equal(state.users[0].is_active, 1);
    }
  });
  it("invalidates existing sessions through a real password update and accepts the new password", async () => {
    const previousUser = state.users[1];
    const oldSession = issueSession(previousUser);
    const previousHash = previousUser.password_hash;
    const response = await call("/staff/2", { method: "PATCH", user: "owner", body: { password: "UpdatedPassword123!", displayName: "Updated Cashier" } });
    assert.equal(response.status, 200);
    const updatedUser = state.users.find((user) => user.user_id === 2);
    assert.notEqual(updatedUser.password_hash, previousHash);
    assert.notEqual(updatedUser.password_hash, "UpdatedPassword123!");
    assert.equal(updatedUser.display_name, "Updated Cashier");
    assert.ok(!("password" in response.data) && !("password_hash" in response.data));
    assert.equal((await call("/auth/me", { token: oldSession.token })).status, 401);
    assert.equal((await call("/login", { method: "POST", body: { username: "cashier", password: "WrongPassword123!" } })).status, 401);
    const login = await call("/login", { method: "POST", body: { username: "cashier", password: "UpdatedPassword123!" } });
    assert.equal(login.status, 200);
    const authenticated = await call("/auth/me", { token: login.data.token });
    assert.equal(authenticated.status, 200);
    assert.equal(authenticated.data.displayName, "Updated Cashier");
    assert.ok(!("password_hash" in authenticated.data));
  });
});

// ทดสอบการตั้งค่า QR ที่เจ้าของร้านบันทึกและแคชเชียร์อ่านไปแสดงตอนรับเงิน
describe("payment QR settings", () => {
  it("allows owners to update and clear the QR while cashiers can only read it", async () => {
    assert.equal((await call("/store-settings/payment-qr")).status, 401);
    assert.deepEqual((await call("/store-settings/payment-qr", { user: "cashier" })).data, { imageUrl: null });
    assert.equal((await call("/store-settings/payment-qr", { user: "kitchen" })).status, 403);
    assert.equal((await call("/store-settings/payment-qr", { method: "PUT", user: "cashier", body: { imageUrl: "https://res.cloudinary.com/demo/qr.png" } })).status, 403);

    const saved = await call("/store-settings/payment-qr", { method: "PUT", user: "owner", body: { imageUrl: "https://res.cloudinary.com/demo/qr.png" } });
    assert.equal(saved.status, 200);
    assert.deepEqual((await call("/store-settings/payment-qr", { user: "cashier" })).data, saved.data);

    const removed = await call("/store-settings/payment-qr", { method: "PUT", user: "owner", body: { imageUrl: null } });
    assert.deepEqual(removed.data, { imageUrl: null });
    assert.deepEqual((await call("/store-settings/payment-qr", { user: "cashier" })).data, { imageUrl: null });
  });

  it("rejects non-HTTPS QR image URLs", async () => {
    const response = await call("/store-settings/payment-qr", { method: "PUT", user: "owner", body: { imageUrl: "http://example.com/qr.png" } });
    assert.equal(response.status, 400);
    assert.equal(state.settings.payment_qr_url, "");
  });
});

// ทดสอบคิดยอด ยืนยันบิล และทำงานต่อของครัวหลังรับชำระเงินสด
describe("cash payments", () => {
  const body = () => ({ table: "T01", method: "cash", orderIds: [1, 2, 3], expectedAmount: 110.75 });
  it("pays only uncancelled orders, preserves active kitchen work, and records one bill identity", async () => {
    const response = await call("/payments", { method: "POST", user: "cashier", body: body() });
    assert.equal(response.status, 201);
    assert.equal(response.data.amount, 110.75);
    assert.deepEqual([...response.data.orderIds].sort(), [1, 2, 3]);
    assert.match(response.data.paymentId, /^[a-f0-9-]{36}$/);
    assert.ok(Number.isFinite(new Date(response.data.paidAt).getTime()));
    assert.deepEqual(state.orders.slice(0, 4).map((order) => [order.is_paid, order.status]), [[1, "waiting"], [1, "cooking"], [1, "completed"], [0, "cancelled"]]);
    assert.equal(state.tables.T01.status, "occupied", "paid meals still in the kitchen must keep the table occupied");
    const payments = await call("/payments", { user: "cashier" });
    const billRows = payments.data.filter((payment) => payment.paymentId === response.data.paymentId);
    assert.equal(billRows.length, 3);
    assert.equal(billRows.reduce((sum, payment) => sum + payment.amount, 0), 110.75);
    assert.ok(billRows.every((payment) => payment.paidAt === response.data.paidAt));
    assert.ok(payments.data.every((payment) => payment.items.every((item) => item.status !== "cancelled")));
    assert.equal((await call("/payments", { method: "POST", user: "cashier", body: body() })).status, 409);
  });
  it("rejects stale totals or changed order snapshots without marking anything paid", async () => {
    for (const change of [{ expectedAmount: 110 }, { orderIds: [1, 2] }, { orderIds: [1, 2, 3, 4] }]) {
      const response = await call("/payments", { method: "POST", user: "cashier", body: { ...body(), ...change } });
      assert.equal(response.status, 409);
      assert.deepEqual(state.orders.slice(0, 4).map((order) => order.is_paid), [0, 0, 0, 0]);
    }
  });
  it("allows a paid waiting order to finish through the kitchen and rejects paid cancellation", async () => {
    await call("/payments", { method: "POST", user: "cashier", body: body() });
    assert.equal((await call("/order-items/11/status", { method: "PATCH", user: "kitchen", body: { status: "cancelled" } })).status, 409);
    assert.equal((await call("/orders/1/status", { method: "PATCH", user: "kitchen", body: { status: "cancelled" } })).status, 409);
    assert.equal((await call("/orders/1/status", { method: "PATCH", user: "kitchen", body: { status: "cooking" } })).status, 200);
    assert.equal((await call("/orders/1/status", { method: "PATCH", user: "kitchen", body: { status: "served" } })).status, 409, "cannot finish pending meals");
    assert.equal((await call("/order-items/11/status", { method: "PATCH", user: "kitchen", body: { status: "done" } })).status, 200);
    const finished = await call("/orders/1/status", { method: "PATCH", user: "kitchen", body: { status: "served" } });
    assert.equal(finished.status, 200);
    assert.equal(finished.data.status, "completed");
    assert.equal(finished.data.paid, true);
  });
  it("keeps paid tables open until waiting and cooking meals finish", async () => {
    state.orders[0].table_number = "T08";
    state.orders[0].is_paid = 1;
    state.orders[1].table_number = "T08";
    state.orders[1].is_paid = 1;
    state.tables.T08 = { status: "occupied", current_order_id: 2 };
    const shrink = () => call("/tables/count", { method: "PATCH", user: "cashier", body: { count: 7 } });
    assert.equal((await shrink()).status, 409, "waiting and cooking meals remain active after payment");
    assert.equal(state.tableCount, 8);
    state.orders[0].status = "completed";
    assert.equal((await shrink()).status, 409, "a paid cooking order still prevents removing the table");
    assert.equal(state.tableCount, 8);
    state.orders[1].status = "completed";
    const result = await shrink();
    assert.equal(result.status, 200);
    assert.equal(result.data.count, 7);
    assert.equal(state.tableCount, 7);
  });
});

// ทดสอบรับอาหารและตรวจความถูกต้องของคำสั่งซื้อจากหน้าลูกค้า
describe("food receipt and order validation", () => {
  it("acquires operational locks in parent-first order across order, item, and payment actions", async () => {
    const locks = () => state.queries.filter(({ sql }) => /FOR UPDATE$/.test(sql)).map(({ sql }) => /\bFROM\s+`?(\w+)/.exec(sql)?.[1]);
    const created = await call("/orders", { method: "POST", body: { table: "T01", items: [{ menuId: 1, price: 40.25, qty: 1, options: [] }] } });
    assert.equal(created.status, 201);
    assert.equal(created.data.orderNumber, 6);
    assert.deepEqual(locks().slice(0, 2), ["store_settings", "tables"], "new orders lock the table-count setting before the table");
    state.queries = [];
    assert.equal((await call("/orders/1/status", { method: "PATCH", user: "kitchen", body: { status: "cooking" } })).status, 200);
    assert.deepEqual(locks(), ["tables", "orders"]);
    state.queries = [];
    assert.equal((await call("/order-items/11/status", { method: "PATCH", user: "kitchen", body: { status: "done" } })).status, 200);
    assert.deepEqual(locks(), ["tables", "orders", "order_items"]);
    state.queries = [];
    assert.equal((await call("/payments", { method: "POST", user: "cashier", body: { table: "T01", method: "cash", orderIds: [1, 2, 3, created.data.id], expectedAmount: 151 } })).status, 201);
    assert.deepEqual(locks(), ["tables", "orders"]);
  });
  it("only lets the matching customer table receive ready food and keeps received food intact", async () => {
    assert.equal((await call("/order-items/31/status", { method: "PATCH", body: { status: "received", table: "T02" } })).status, 403);
    assert.equal(state.items.find((item) => item.order_item_id === 31).item_status, "done");
    assert.equal((await call("/order-items/11/status", { method: "PATCH", body: { status: "received", table: "T01" } })).status, 409);
    assert.equal((await call("/order-items/31/status", { method: "PATCH", body: { status: "received", table: "T01" } })).status, 200);
    assert.equal((await call("/order-items/31/status", { method: "PATCH", body: { status: "received", table: "T01" } })).status, 200, "receiving twice is harmless");
    assert.equal((await call("/order-items/31/status", { method: "PATCH", user: "kitchen", body: { status: "done" } })).status, 409);
    assert.equal(state.items.find((item) => item.order_item_id === 31).item_status, "received");
  });
  it("recalculates an unpaid bill when a waiting menu is cancelled", async () => {
    const result = await call("/order-items/11/status", { method: "PATCH", user: "kitchen", body: { status: "cancelled" } });
    assert.equal(result.status, 200);
    assert.equal(state.orders[0].total_price, 0);
    assert.equal(state.orders[0].status, "cancelled");
  });
  it("rejects unavailable menus and stale prices without persisting an order", async (t) => {
    t.mock.method(console, "error", () => {}); // Expected validation rejections are asserted below.
    const orderCount = state.orders.length;
    const item = { menuId: 1, name: "Client label", price: 40.25, qty: 1, options: [] };
    state.menus[0].is_available = 0;
    const unavailable = await call("/orders", { method: "POST", body: { table: "T01", items: [item] } });
    assert.equal(unavailable.status, 400);
    assert.match(unavailable.data.error, /หมด/);
    state.menus[0].is_available = 1;
    const stale = await call("/orders", { method: "POST", body: { table: "T01", items: [{ ...item, price: 39 }] } });
    assert.equal(stale.status, 400);
    assert.match(stale.data.error, /ราคา/);
    assert.equal(state.orders.length, orderCount);
  });
  it("returns the same persisted order on retry and refuses request-key reuse with different contents", async () => {
    const body = { table: "T01", requestId: "test-retry-123", items: [{ menuId: 1, name: "Client label", price: 40.25, qty: 2, options: [] }] };
    const first = await call("/orders", { method: "POST", body });
    assert.equal(first.status, 201);
    assert.equal(first.data.total, 80.5);
    assert.equal(first.data.items[0].name, "ชาไทย", "use the trusted menu name");
    const count = state.orders.length;
    const retry = await call("/orders", { method: "POST", body });
    assert.equal(retry.status, 200);
    assert.equal(retry.data.id, first.data.id);
    assert.equal(state.orders.length, count);
    const changed = await call("/orders", { method: "POST", body: { ...body, items: [{ ...body.items[0], qty: 3 }] } });
    assert.equal(changed.status, 409);
    assert.equal(state.orders.length, count);
  });
  it("starts the monthly order sequence at one independently of the previous month", async () => {
    state.orders = [];
    state.items = [];
    const previousMonth = `${Number(currentMonthKey.slice(0, 4)) - (currentMonthKey.endsWith("01") ? 1 : 0)}${currentMonthKey.endsWith("01") ? "12" : String(Number(currentMonthKey.slice(4)) - 1).padStart(2, "0")}`;
    state.settings[`order_number_${previousMonth}`] = "99";
    delete state.settings[`order_number_${currentMonthKey}`];
    const created = await call("/orders", { method: "POST", body: { table: "T01", items: [{ menuId: 1, price: 40.25, qty: 1, options: [] }] } });
    assert.equal(created.status, 201);
    assert.equal(created.data.orderNumber, 1);
    assert.equal(state.settings[`order_number_${currentMonthKey}`], "1");
  });
});
