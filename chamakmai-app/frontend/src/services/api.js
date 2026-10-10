// ตัวช่วยเรียก REST API ของหลังบ้าน
// เปลี่ยน URL ได้ผ่าน env variable VITE_API_URL (เช่นตอน deploy จริง)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const SESSION_KEY = "cm-staff-session";

function getSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return session?.token && session.expiresAt > Date.now() ? session : null;
  } catch { return null; }
}

export function getCurrentUser() { return getSession(); }

export function logoutUser() {
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("cm-auth-change"));
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("cm-auth-change"));
}

export async function fetchCurrentUser() {
  const user = await request("/auth/me");
  const session = getSession();
  if (session) saveSession({ ...session, ...user });
  return user;
}

export function checkConnection() { return request("/health"); }

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const token = getSession()?.token;
  try {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    signal: options.signal || controller.signal,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore, ใช้ statusText ตามเดิม
    }
    const error = new Error(message);
    error.status = res.status;
    if (res.status === 401 && sessionStorage.getItem(SESSION_KEY) && path !== "/login") logoutUser();
    throw error;
  }
  if (res.status === 204) return null;
  return await res.json();
  } catch (error) {
    if (error.name === "AbortError" || error instanceof TypeError) {
      const connectionError = new Error(error.name === "AbortError" ? "ระบบตอบกลับช้า กรุณาลองใหม่" : "เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบเครือข่ายแล้วลองใหม่");
      connectionError.isNetworkError = true;
      throw connectionError;
    }
    throw error;
  } finally { clearTimeout(timer); }
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

export function createCategory(name) {
  return request("/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function deleteCategory(name) {
  return request(`/categories/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}

export function updateCategory(name, newName) {
  return request(`/categories/${encodeURIComponent(name)}`, {
    method: "PATCH",
    body: JSON.stringify({ name: newName }),
  });
}

// payload: { sku, name, type, category, price, imageUrl, isAvailable, optionGroupIds }
export function createMenuItem(payload) {
  return request("/menu", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMenuItem(id, payload) {
  return request(`/menu/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteMenuItem(id) {
  return request(`/menu/${id}`, {
    method: "DELETE",
  });
}

export function fetchOptionGroups() {
  return request("/option-groups");
}

export function createOptionGroup(payload) {
  return request("/option-groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOptionGroup(id, payload) {
  return request(`/option-groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteOptionGroup(id) {
  return request(`/option-groups/${id}`, {
    method: "DELETE",
  });
}

export async function uploadMenuImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  return request("/menu/upload", {
    method: "POST",
    body: formData,
  });

}

export function fetchPaymentQr() {
  return request("/store-settings/payment-qr");
}

export function savePaymentQr(imageUrl) {
  return request("/store-settings/payment-qr", {
    method: "PUT",
    body: JSON.stringify({ imageUrl }),
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

export function fetchTableCount() {
  return request("/tables");
}

export function updateTableCount(count) {
  return request("/tables/count", {
    method: "PATCH",
    body: JSON.stringify({ count }),
  });
}

export function createOrder(table, items, requestId) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify({ table, items, requestId }),
  });
}

export function updateOrderStatus(orderId, status) {
  return request(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// อัปเดตสถานะรายเมนูภายในออเดอร์ (แยกจากสถานะออเดอร์โดยรวม) — status: "waiting" | "done"
export function updateOrderItemStatus(orderItemId, status, table) {
  return request(`/order-items/${orderItemId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, table }),
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
export function payTable(table, method, details = {}) {
  return request("/payments", {
    method: "POST",
    body: JSON.stringify({ table, method, ...details }),
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

export function updateStaff(id, payload) {
  return request(`/staff/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteStaff(id) {
  return request(`/staff/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// เข้าสู่ระบบ
// ---------------------------------------------------------------------------
export async function loginUser(username, password) {
  const session = await request("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  saveSession(session);
  return session;
}
