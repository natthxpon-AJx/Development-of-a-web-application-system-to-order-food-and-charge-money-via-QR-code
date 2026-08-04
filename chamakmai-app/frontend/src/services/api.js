// ตัวช่วยเรียก REST API ของหลังบ้าน
// เปลี่ยน URL ได้ผ่าน env variable VITE_API_URL (เช่นตอน deploy จริง)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore, ใช้ statusText ตามเดิม
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---------------------------------------------------------------------------
// เมนู
// ---------------------------------------------------------------------------
export function fetchMenu() {
  return request("/menu");
}

export function fetchCategories() {
  return request("/categories");
}

// payload: { sku, name, type, category, price, imageUrl, optionsConfig }
export function createMenuItem(payload) {
  return request("/menu", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function setMenuItemAvailability(id, isAvailable) {
  return request(`/menu/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ isAvailable }),
  });
}

// ---------------------------------------------------------------------------
// ออเดอร์ — ไม่ใส่ table จะได้ออเดอร์ของทุกโต๊ะ (ใช้โดย Kitchen / Cashier)
// ---------------------------------------------------------------------------
export function fetchOrders(table) {
  const query = table ? `?table=${encodeURIComponent(table)}` : "";
  return request(`/orders${query}`);
}

export function createOrder(table, items) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify({ table, items }),
  });
}

export function updateOrderStatus(orderId, status) {
  return request(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ---------------------------------------------------------------------------
// การชำระเงิน — ไม่ใส่ table จะได้ประวัติของทุกโต๊ะ (ใช้โดย Owner dashboard)
// ---------------------------------------------------------------------------
export function fetchPayments(table) {
  const query = table ? `?table=${encodeURIComponent(table)}` : "";
  return request(`/payments${query}`);
}

// ปิดบิลออเดอร์ที่ค้างอยู่ทั้งหมดของโต๊ะนั้นในครั้งเดียว (ใช้โดย Cashier)
export function payTable(table, method) {
  return request("/payments", {
    method: "POST",
    body: JSON.stringify({ table, method }),
  });
}

// ---------------------------------------------------------------------------
// พนักงาน
// ---------------------------------------------------------------------------
export function fetchStaff() {
  return request("/staff");
}

// payload: { username, password, displayName, role, phone, position }
export function createStaff(payload) {
  return request("/staff", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// เข้าสู่ระบบ
// ---------------------------------------------------------------------------
export function loginUser(username, password) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}