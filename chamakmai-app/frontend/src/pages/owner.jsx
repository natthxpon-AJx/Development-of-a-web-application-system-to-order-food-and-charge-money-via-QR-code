import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchMenu,
  fetchCategories,
  createCategory,
  deleteCategory,
  updateCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  fetchOptionGroups,
  uploadMenuImage,
  setMenuItemAvailability,
  fetchPayments,
  fetchPaymentQr,
  savePaymentQr,
  fetchStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getCurrentUser,
  logoutUser,
} from "../services/api";
import OptionTemplateEditor from "../components/owner/OptionTemplateEditor";

// หน้าเจ้าของร้านรวมรายงาน ยอดขาย จัดการเมนู QR รับชำระเงิน และบัญชีพนักงาน
const styles = `
  :root{
    --brown-900:#3B2A1B; --brown-800:#5B4530; --brown-700:#6E5237;
    --cream-100:#F3F4F6; --cream-050:#FFFFFF; --paper:#FFFFFF;
    --amber:#D97706; --amber-dark:#B45F04;
    --jade:#16A34A; --jade-bg:#DCFCE7;
    --clay:#DC2626; --clay-bg:#FEE2E2;
    --ink:#111827; --ink-soft:#6B7280; --line:#E5E7EB;
    --gold:#D97706; --navy-900:#111827; --navy-800:#1F2937; --navy-700:#374151;
    font-family:'Sarabun', sans-serif;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--cream-100);color:var(--ink);}
  body{-webkit-font-smoothing:antialiased;}
  h1,h2,h3,.display{font-family:'Sarabun', sans-serif;font-weight:700;}
  .mono{font-family:'Space Mono', monospace;}
  button{font-family:inherit;cursor:pointer;}

  #app{height:100vh;height:100dvh;display:flex;flex-direction:column;background:var(--cream-100);color-scheme:light;overflow:hidden;}
  .stage{flex:1;padding:0;display:flex;justify-content:center;}
  .stage-inner{width:100%;max-width:100%;}

  /* ===== Desktop app titlebar ===== */
  .app-window{background:transparent;border-radius:0;overflow:hidden;display:flex;flex-direction:column;height:100%;min-height:0;border:none;}
  .app-titlebar{background:var(--navy-800);color:#F3F4F6;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
  .app-titlebar .tleft{display:flex;align-items:center;gap:10px;font-weight:600;font-size:14.5px;}
  .app-titlebar .dot{width:9px;height:9px;border-radius:50%;background:var(--amber);}
  .app-titlebar .online{font-size:11px;background:var(--jade);color:#fff;padding:3px 9px;border-radius:20px;font-weight:600;display:flex;align-items:center;gap:5px;}
  .app-titlebar .online::before{content:'';width:6px;height:6px;border-radius:50%;background:#fff;}
  .app-flex{display:flex;flex:1;min-height:0;overflow:hidden;}
  .app-sidebar{width:84px;flex-shrink:0;background:var(--navy-900);display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px 8px;}
  .app-sidebar button{width:100%;min-height:56px;border-radius:11px;border:none;background:transparent;color:#D1D5DB;font-size:17px;display:flex;flex-direction:column;gap:5px;align-items:center;justify-content:center;padding:8px 4px;}
  .sidebar-label{font-size:11px;line-height:1.4;}
  .app-sidebar button.active{background:var(--amber);color:#fff;}
  .app-sidebar button.logout{margin-top:auto;}
  .app-body-wrap{flex:1;min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain;}
  .app-body{padding:20px 22px 26px;}

  .subnav{display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap;}
  .subnav button{border:1px solid var(--line);background:var(--cream-050);color:var(--brown-800);padding:8px 16px;border-radius:10px;font-size:13.5px;font-weight:600;}
  .subnav button.active{background:var(--navy-800);color:#fff;border-color:var(--navy-800);}

  .card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px;}
  .btn{border:none;border-radius:10px;padding:10px 16px;font-weight:700;font-size:13.5px;transition:transform .08s ease;}
  .btn:active{transform:scale(0.97);}
  .btn-primary{background:var(--amber);color:#fff;}
  .btn-primary:hover{background:var(--amber-dark);}
  .btn-danger{background:var(--clay);color:#fff;}
  .btn-danger:hover{background:#b91c1c;}
  .btn:disabled{opacity:.5;cursor:not-allowed;}

  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
  .kpi{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px;}
  .kpi .kv{font-size:26px;font-weight:700;color:var(--navy-900);}
  .kpi .kl{font-size:12.5px;color:var(--ink-soft);margin-top:4px;}
  .period-toggle{display:flex;gap:4px;background:var(--cream-100);padding:4px;border-radius:10px;}
  .period-toggle button{border:none;background:transparent;padding:6px 14px;border-radius:8px;font-size:12.5px;font-weight:700;color:var(--brown-800);}
  .period-toggle button.active{background:var(--paper);box-shadow:0 1px 3px rgba(0,0,0,0.1);}

  .bar-row{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
  .bar-row .bl{width:90px;font-size:12.5px;color:var(--ink-soft);flex-shrink:0;}
  .bar-track{flex:1;background:var(--cream-100);border-radius:6px;height:10px;overflow:hidden;}
  .bar-fill{height:100%;background:linear-gradient(90deg,var(--amber),var(--gold));border-radius:6px;}
  .bar-row .bv{width:26px;text-align:right;font-size:12px;font-weight:700;color:var(--brown-800);}

  table.data{width:100%;border-collapse:collapse;font-size:13.5px;}
  table.data th{text-align:left;font-size:11.5px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.4px;padding:8px 10px;border-bottom:1px solid var(--line);} 
  table.data th.center{ text-align:center; }
  table.data td{padding:11px 10px;border-bottom:1px solid var(--line);vertical-align:middle;} 
  table.data td.center{ text-align:center; } 
  table.data td.left{ text-align:left; }
  table.data tr:last-child td{border-bottom:none;}
  .toggle{width:38px;height:22px;border-radius:20px;background:var(--line);position:relative;border:none;flex-shrink:0;}
  .toggle.on{background:var(--jade);}
  .toggle .knob{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.15s;}
  .toggle.on .knob{left:18px;}
  .role-chip{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;}
  .role-chip.admin{background:#FBE4D9;color:var(--clay);}
  .role-chip.staff{background:var(--jade-bg);color:var(--jade);}

  .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
  .menu-form-grid{grid-template-columns:1.2fr 1fr 1fr 1fr;align-items:end;}
  .form-grid.menu-form-category-image{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start;}
  .menu-form-category-image .field{min-width:0;}
  .menu-form-category-image input[type="file"]{width:100%;min-width:0;max-width:100%;font-size:12px;}
  .menu-image-preview{width:64px;height:64px;object-fit:cover;border-radius:8px;margin-top:6px;}
  .owner-columns{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
  .form-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px;justify-content:flex-end;}
  .menu-add-actions{justify-content:center;}
  .menu-add-actions .btn{flex:0 0 auto;}
  .owner-form{border:0;padding:0;margin:0;min-width:0;}
  .owner-form:disabled{opacity:.72;}
  .table-scroll{overflow-x:auto;max-width:100%;}
  .table-scroll table{min-width:610px;}
  .load-error{padding:12px 14px;margin-bottom:14px;border:1px solid #FECACA;border-radius:10px;background:#FEF2F2;color:#991B1B;font-size:13px;}
  .app-titlebar .online.offline{background:var(--clay);}
  .app-titlebar .online.checking{background:#6B7280;}
  .owner-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;}
  .owner-toolbar input{flex:1;min-width:180px;border:1px solid var(--line);border-radius:9px;padding:10px 12px;font:inherit;}
  .owner-title-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;}
  .owner-title-actions .btn{padding:3px 9px;background:#374151;color:#fff;font-size:11px;border-radius:20px;}
  .staff-status{font-size:12px;color:var(--jade);}
  .staff-status.inactive{color:var(--ink-soft);}
  .field label{display:block;font-size:12px;font-weight:700;color:var(--ink-soft);margin-bottom:5px;}
  .field input,.field select{width:100%;border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-family:inherit;font-size:13.5px;background:var(--cream-050);color:var(--ink);}
  .owner-category-input{width:min(100%,350px) !important;}

  .divider{border:none;border-top:1px solid var(--line);margin:16px 0;}
  .muted{color:var(--ink-soft);}
  .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:var(--brown-900);color:#fff;padding:12px 22px;border-radius:30px;font-size:13.5px;font-weight:600;box-shadow:0 10px 25px -10px rgba(0,0,0,0.4);z-index:200;}
  .sales-modal-close{border:0;background:var(--cream-100);color:var(--ink);width:34px;height:34px;border-radius:50%;font-size:20px;line-height:1;}
  .menu-edit-modal-backdrop{position:fixed;inset:0;background:rgba(17,24,39,0.48);display:flex;align-items:center;justify-content:center;padding:20px;z-index:150;}
  .menu-edit-modal{width:min(900px,100%);max-height:90vh;overflow:auto;background:var(--paper);border-radius:16px;padding:22px;box-shadow:0 24px 60px -24px rgba(17,24,39,0.65);}
  .menu-edit-modal-header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px;}
  .sales-chart{width:100%;height:auto;display:block;background:#FFFCF8;border:1px solid var(--line);border-radius:12px;}
  .sales-chart-label{font-size:11px;fill:var(--ink-soft);}
  .sales-chart-value{font-size:11px;fill:var(--brown-800);font-weight:700;}
  .sales-chart-line{fill:none;stroke:var(--amber);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}
  .sales-chart-dot{fill:var(--paper);stroke:var(--amber);stroke-width:3;}

  @media (max-width:900px){
    .kpi-grid{grid-template-columns:repeat(2,1fr);}
    .form-grid{grid-template-columns:1fr;}
    .menu-form-grid{grid-template-columns:1fr 1fr;}
    .owner-columns{grid-template-columns:1fr;}
  }
  @media (max-width:600px){
    .app-titlebar{padding:10px 12px;gap:10px;flex-wrap:wrap;}
    .app-titlebar .tleft{font-size:13px;}
    .app-flex{flex-direction:column;}
    .app-sidebar{width:100%;flex-shrink:0;flex-direction:row;gap:5px;padding:8px;}
    .app-sidebar button{flex:1;min-height:52px;}
    .app-sidebar button.logout{flex:0 0 auto;margin:0 0 0 auto;}
    .app-body{padding:16px 12px 24px;}
    .menu-form-grid{grid-template-columns:1fr;}
    .kpi{padding:12px;}
    .kpi .kv{font-size:22px;}
    .menu-edit-modal-backdrop{padding:10px;}
    .menu-edit-modal{padding:16px;max-height:92dvh;}
    .subnav input{min-width:0!important;width:100%;}
    .subnav>div{flex-wrap:wrap;}
    .form-actions .btn{flex:1;}
    .menu-add-actions .btn{flex:0 0 auto;}
    .form-grid.menu-form-category-image{grid-template-columns:1fr;}
    .btn,.subnav button,.toggle{min-height:44px;}
    .toggle{width:48px;height:28px;min-height:28px;}
    .toggle .knob{width:24px;height:24px;}
    .toggle.on .knob{left:22px;}
  }
`;

// ตัวช่วยจัดรูปแบบเงิน วันเวลา และจัดกลุ่มยอดรับชำระสำหรับแดชบอร์ด
function money(n) {
  return "฿" + n.toLocaleString("th-TH", { minimumFractionDigits: n % 1 ? 2 : 0 });
}

const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const weekDayOrder = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function getPaymentDate(payment) {
  const raw = payment.paidAt || payment.paid_at || payment.createdAt || payment.created_at;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function groupPaymentBills(rows) {
  const bills = new Map();
  rows.forEach((row, index) => {
    const key = row.paymentId ? `payment-${row.paymentId}` : `order-${row.id ?? index}`;
    const amount = Number(row.amount ?? row.total ?? 0);
    const items = (row.items || []).filter((item) => item.status !== "cancelled" && !item.cancelled);
    const existing = bills.get(key);
    if (existing) {
      existing.amount += Number.isFinite(amount) ? amount : 0;
      existing.orderNumbers.push(row.orderNumber ?? row.id);
      existing.items.push(...items);
    } else {
      bills.set(key, { ...row, id: key, amount: Number.isFinite(amount) ? amount : 0, orderNumbers: [row.orderNumber ?? row.id], items });
    }
  });
  return [...bills.values()].sort((a, b) => (getPaymentDate(b)?.getTime() || 0) - (getPaymentDate(a)?.getTime() || 0));
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfWeek(date) {
  const result = startOfDay(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfMonth(date) {
  const result = new Date(date.getFullYear(), date.getMonth(), 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function getSalesChartData(payments, range) {
  const now = new Date();
  let buckets = [];
  let bucketKey;
  let label;

  if (range === "daily") {
    const first = addDays(startOfDay(now), -6);
    buckets = Array.from({ length: 7 }, (_, index) => addDays(first, index));
    bucketKey = (date) => startOfDay(date).getTime();
    label = (date) => date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  } else if (range === "weekly") {
    const first = addDays(startOfWeek(now), -49);
    buckets = Array.from({ length: 8 }, (_, index) => addDays(first, index * 7));
    bucketKey = (date) => startOfWeek(date).getTime();
    label = (date) => `ส.${date.toLocaleDateString("th-TH", { day: "numeric", month: "short" })}`;
  } else {
    const count = range === "annual" ? 12 : 6;
    const first = range === "annual" ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), now.getMonth() - count + 1, 1);
    buckets = Array.from({ length: count }, (_, index) => new Date(first.getFullYear(), first.getMonth() + index, 1));
    bucketKey = (date) => startOfMonth(date).getTime();
    label = (date) => range === "annual"
      ? date.toLocaleDateString("th-TH", { month: "short" })
      : date.toLocaleDateString("th-TH", { month: "short", year: "2-digit" });
  }

  const totals = new Map(buckets.map((date) => [bucketKey(date), 0]));
  payments.forEach((payment) => {
    const date = getPaymentDate(payment);
    if (!date) return;
    const key = bucketKey(date);
    if (totals.has(key)) totals.set(key, totals.get(key) + Number(payment.amount || 0));
  });

  return buckets.map((date) => ({ date, label: label(date), value: totals.get(bucketKey(date)) || 0 }));
}

export default function Owner({ canManageStaff = true }) {
  // สถานะหน้าปัจจุบันและข้อมูลที่แต่ละส่วนของหน้าร้านเจ้าของต้องใช้
  const [ownerState, setOwnerState] = useState({ tab: "dashboard", menuCat: "" });
  const [dashboardPeriod, setDashboardPeriod] = useState("daily");
  const [salesChartRange, setSalesChartRange] = useState("daily");

  // เมนู
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryManageMode, setCategoryManageMode] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newItem, setNewItem] = useState({ sku: "", name: "", price: "", category: "", type: "drink", active: true });
  const [optionGroups, setOptionGroups] = useState([]);
  const [newOptionGroupIds, setNewOptionGroupIds] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState("");
  const [paymentQrFile, setPaymentQrFile] = useState(null);
  const [paymentQrPreview, setPaymentQrPreview] = useState("");
  const [paymentQrLoading, setPaymentQrLoading] = useState(false);
  const [paymentQrSaving, setPaymentQrSaving] = useState(false);
  const paymentQrInputRef = useRef(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItem, setEditingItem] = useState({ sku: "", name: "", price: "", category: "", type: "drink", active: true });
  const [editingOptionGroupIds, setEditingOptionGroupIds] = useState([]);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");

  // การชำระเงิน (สำหรับแดชบอร์ด)
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // พนักงาน
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffSearch, setStaffSearch] = useState("");
  const [editingStaff, setEditingStaff] = useState(null);
  const currentUser = getCurrentUser();
  const [newStaff, setNewStaff] = useState({
    username: "",
    password: "",
    displayName: "",
    phone: "",
    position: "แคชเชียร์",
    role: "staff",
  });

  const [toast, setToast] = useState(null);
  const [actionError, setActionError] = useState(null);
  const toastTimer = useRef(null);
  const mutationLocks = useRef(new Set());
  const loadLocks = useRef(new Set());
  const [busyActions, setBusyActions] = useState({});
  const [optionsBusy, setOptionsBusy] = useState(false);
  const [loadErrors, setLoadErrors] = useState({});
  const [lastSuccessfulLoadedAt, setLastSuccessfulLoadedAt] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // ป้องกันคำขอซ้ำ พร้อมเก็บสถานะโหลด/ข้อผิดพลาดแยกตามส่วนของหน้าจอ
  function beginAction(key) {
    if (mutationLocks.current.has(key)) return false;
    setActionError(null);
    mutationLocks.current.add(key);
    setBusyActions((previous) => ({ ...previous, [key]: true }));
    return true;
  }

  function finishAction(key) {
    mutationLocks.current.delete(key);
    setBusyActions((previous) => ({ ...previous, [key]: false }));
  }

  function markLoaded(key) {
    setLoadErrors((previous) => ({ ...previous, [key]: null }));
    setLastSuccessfulLoadedAt((previous) => ({ ...previous, [key]: new Date() }));
  }

  function markLoadError(key, message, silent) {
    setLoadErrors((previous) => ({ ...previous, [key]: message }));
    if (!silent) showToast(message);
  }

  useEffect(() => {
    document.title = "ร้านชาแมกไม้ — ระบบเจ้าของร้าน";
    if (!document.getElementById("cm-google-fonts")) {
      const link = document.createElement("link");
      link.id = "cm-google-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@500;600;700&family=Sarabun:wght@400;500;600;700&family=Space+Mono&display=swap";
      document.head.appendChild(link);
    }
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // แจ้งผลการทำรายการให้ผู้ใช้เห็นบนหน้าเจ้าของร้าน
  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  }

  function showActionError(message) {
    setActionError(message);
    showToast(message);
  }

  // ขอรายการเมนูและหมวดหมู่จาก Backend แล้วใช้ผลลัพธ์อัปเดตข้อมูลในแท็บจัดการเมนู
  const loadMenu = async (silent = false) => {
    if (loadLocks.current.has("menu")) return;
    loadLocks.current.add("menu");
    if (!silent) setMenuLoading(true);
    try {
      const [menuRows, categoryRows] = await Promise.all([fetchMenu(), fetchCategories()]);
      setMenu(menuRows);
      const cats = categoryRows.filter((c) => c !== "ทั้งหมด");
      setCategories(cats);
      setOwnerState((prev) => ({ ...prev, menuCat: cats.includes(prev.menuCat) ? prev.menuCat : cats[0] || "" }));
      markLoaded("menu");
    } catch (err) {
      markLoadError("menu", "โหลดเมนูไม่สำเร็จ: " + err.message, silent);
    } finally {
      loadLocks.current.delete("menu");
      setMenuLoading(false);
    }
  };

  // โหลดกลุ่มตัวเลือกจาก Backend เพื่อใช้ผูกกับเมนูอาหารและเครื่องดื่ม
  const loadOptionGroups = async (silent = false) => {
    if (loadLocks.current.has("options")) return;
    loadLocks.current.add("options");
    try {
      setOptionGroups(await fetchOptionGroups());
      markLoaded("options");
    } catch (err) {
      markLoadError("options", "โหลดกลุ่มตัวเลือกไม่สำเร็จ: " + err.message, silent);
    } finally {
      loadLocks.current.delete("options");
    }
  };

  // ดึงประวัติการชำระเงินทุกโต๊ะจาก Backend ให้แดชบอร์ดคำนวณยอดขายและสถิติ
  const loadPayments = async (silent = false) => {
    if (loadLocks.current.has("dashboard")) return;
    loadLocks.current.add("dashboard");
    if (!silent) setPaymentsLoading(true);
    try {
      const rows = await fetchPayments(); // ไม่ใส่ table = ทุกโต๊ะ
      setPayments(groupPaymentBills(rows));
      markLoaded("dashboard");
    } catch (err) {
      markLoadError("dashboard", "โหลดข้อมูลยอดขายไม่สำเร็จ: " + err.message, silent);
    } finally {
      loadLocks.current.delete("dashboard");
      setPaymentsLoading(false);
    }
  };

  // โหลดรายชื่อและสถานะบัญชีพนักงานจาก Backend สำหรับตารางจัดการผู้ใช้
  const loadStaff = async (silent = false) => {
    if (loadLocks.current.has("staff")) return;
    loadLocks.current.add("staff");
    if (!silent) setStaffLoading(true);
    try {
      const rows = await fetchStaff();
      setStaff(rows);
      markLoaded("staff");
    } catch (err) {
      markLoadError("staff", "โหลดรายชื่อพนักงานไม่สำเร็จ: " + err.message, silent);
    } finally {
      loadLocks.current.delete("staff");
      setStaffLoading(false);
    }
  };

  // อ่าน URL รูป QR รับชำระเงินที่บันทึกใน Backend เพื่อแสดงและแก้ไขการตั้งค่า
  const loadPaymentQr = async (silent = false) => {
    if (loadLocks.current.has("payment-qr")) return;
    loadLocks.current.add("payment-qr");
    if (!silent) setPaymentQrLoading(true);
    try {
      const setting = await fetchPaymentQr();
      setPaymentQrUrl(setting.imageUrl || "");
      markLoaded("payment-qr");
    } catch (err) {
      markLoadError("payment-qr", "โหลด QR รับชำระเงินไม่สำเร็จ: " + err.message, silent);
    } finally {
      loadLocks.current.delete("payment-qr");
      setPaymentQrLoading(false);
    }
  };

  // โหลดข้อมูลตั้งต้นจาก Backend เมื่อเปิดหน้าระบบเจ้าของร้าน
  useEffect(() => {
    loadMenu();
    loadOptionGroups();
    loadPayments();
    loadStaff();
  }, []);

  // ขอข้อมูลล่าสุดจาก Backend เฉพาะแท็บที่เปิดอยู่ทุก 15 วินาที และพักเมื่อแท็บเบราว์เซอร์ไม่แสดง
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden || mutationLocks.current.size) return;
      if (ownerState.tab === "dashboard") loadPayments(true);
      if (ownerState.tab === "staff") loadStaff(true);
      if (ownerState.tab === "menu") loadMenu(true);
      if (ownerState.tab === "payment-qr") loadPaymentQr(true);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [ownerState.tab]);

  useEffect(() => () => {
    if (paymentQrPreview) URL.revokeObjectURL(paymentQrPreview);
  }, [paymentQrPreview]);

  // ขอข้อมูลล่าสุดจาก Backend เฉพาะแท็บที่เปิดอยู่เมื่อผู้ใช้กดรีเฟรช
  async function refreshCurrentTab() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (ownerState.tab === "menu") await Promise.all([loadMenu(true), loadOptionGroups(true)]);
      if (ownerState.tab === "dashboard") await loadPayments(true);
      if (ownerState.tab === "staff") await loadStaff(true);
      if (ownerState.tab === "payment-qr") await loadPaymentQr(true);
    } finally {
      setRefreshing(false);
    }
  }

  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

    const scopedPayments = payments.filter((p) => {
      const date = getPaymentDate(p);
      if (!date) return false;
      if (dashboardPeriod === "daily") return isSameDay(date, today);
      if (dashboardPeriod === "annual") return date >= yearStart && date < yearEnd;
      return date >= weekStart && date < weekEnd;
    });

    const total = scopedPayments.reduce((sum, p) => sum + p.amount, 0);
    const qr = scopedPayments.filter((p) => p.method === "qr_code").reduce((sum, p) => sum + p.amount, 0);
    const cash = scopedPayments.filter((p) => p.method === "cash").reduce((sum, p) => sum + p.amount, 0);
    const bills = scopedPayments.length;
    const itemTally = {};
    const dayTally = Object.fromEntries(weekDayOrder.map((day) => [day, 0]));
    const monthTally = Object.fromEntries(monthNames.map((month) => [month, 0]));

    scopedPayments.forEach((p) => {
      (p.items || []).forEach((it) => {
        itemTally[it.name] = (itemTally[it.name] || 0) + Number(it.qty || 0);
      });
    });

    payments.forEach((p) => {
      const date = getPaymentDate(p);
      if (!date) return;
      if (date >= yearStart && date < yearEnd) {
        const monthName = monthNames[date.getMonth()];
        monthTally[monthName] = (monthTally[monthName] || 0) + 1;
      }
      if (date < weekStart || date >= weekEnd) return;
      const dayName = dayNames[date.getDay()];
      dayTally[dayName] = (dayTally[dayName] || 0) + 1;
    });

    return {
      total,
      qr,
      cash,
      bills,
      itemTally,
      dayTally,
      monthTally,
      orders: scopedPayments,
    };
  }, [payments, dashboardPeriod]);

  // สลับแท็บหลักและโหลดข้อมูลของส่วนที่เปิด
  function ownerSetTab(tab) {
    setActionError(null);
    setOwnerState((prev) => ({ ...prev, tab }));
    if (tab === "menu") { loadMenu(true); loadOptionGroups(true); }
    if (tab === "dashboard") loadPayments();
    if (tab === "staff") loadStaff();
    if (tab === "payment-qr") loadPaymentQr();
  }

  // จัดการรูป QR รับชำระเงินที่จะแสดงในหน้าแคชเชียร์
  function ownerSelectPaymentQr(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      showActionError("เลือกไฟล์ PNG, JPG หรือ WebP ขนาดไม่เกิน 5 MB");
      return;
    }
    setPaymentQrFile(file);
    setPaymentQrPreview(URL.createObjectURL(file));
  }

  async function ownerSavePaymentQr() {
    if (!paymentQrFile || mutationLocks.current.has("payment-qr")) return;
    mutationLocks.current.add("payment-qr");
    setPaymentQrSaving(true);
    try {
      // อัปโหลดไฟล์ก่อน แล้วบันทึก URL ที่ Backend ส่งกลับเป็น QR สำหรับการชำระเงิน
      const uploaded = await uploadMenuImage(paymentQrFile);
      const setting = await savePaymentQr(uploaded.imageUrl);
      setPaymentQrUrl(setting.imageUrl || "");
      setPaymentQrFile(null);
      setPaymentQrPreview("");
      markLoaded("payment-qr");
      showToast("บันทึก QR รับชำระเงินแล้ว");
    } catch (err) {
      showActionError("บันทึก QR ไม่สำเร็จ: " + err.message);
    } finally {
      mutationLocks.current.delete("payment-qr");
      setPaymentQrSaving(false);
    }
  }

  async function ownerRemovePaymentQr() {
    if (mutationLocks.current.has("payment-qr")) return;
    mutationLocks.current.add("payment-qr");
    setPaymentQrSaving(true);
    try {
      // ส่งค่าว่างไป Backend เพื่อเอารูป QR รับชำระเงินที่บันทึกไว้ออก
      await savePaymentQr(null);
      setPaymentQrUrl("");
      setPaymentQrFile(null);
      setPaymentQrPreview("");
      markLoaded("payment-qr");
      showToast("ลบ QR รับชำระเงินแล้ว");
    } catch (err) {
      showActionError("ลบ QR ไม่สำเร็จ: " + err.message);
    } finally {
      mutationLocks.current.delete("payment-qr");
      setPaymentQrSaving(false);
    }
  }

  // จัดการหมวดหมู่ รายการเมนู รูปภาพ ราคา และตัวเลือกเสริม
  function ownerSetMenuCat(menuCat) {
    setOwnerState((prev) => ({ ...prev, menuCat }));
  }

  async function ownerAddCategory() {
    if (mutationLocks.current.has("category")) return;
    const trimmed = categoryDraft.trim();

    if (!trimmed) {
      showToast("กรุณากรอกชื่อหมวดหมู่");
      return;
    }
    if (categories.some((cat) => cat.toLowerCase() === trimmed.toLowerCase())) {
      showToast("หมวดหมู่นี้มีอยู่แล้ว");
      return;
    }

    if (!beginAction("category")) return;
    try {
      // สร้างหมวดหมู่ใน Backend และใช้ชื่อที่ตอบกลับมาอัปเดตตัวเลือกบนหน้า
      const created = await createCategory(trimmed);
      const newName = created?.name || trimmed;
      setCategories((prev) => [...prev, newName]);
      setOwnerState((prev) => ({ ...prev, menuCat: newName }));
      setNewItem((prev) => ({ ...prev, category: newName }));
      setCategoryDraft("");
      setIsAddingCategory(false);
      showToast(`เพิ่มหมวดหมู่ "${newName}" แล้ว`);
    } catch (err) {
      showActionError("เพิ่มหมวดหมู่ไม่สำเร็จ: " + err.message);
    } finally {
      finishAction("category");
    }
  }

  function toggleCategorySelection(category) {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]));
  }

  async function ownerDeleteSelectedCategories() {
    if (mutationLocks.current.has("category")) return;
    if (selectedCategories.length !== 1) {
      showToast("กรุณาเลือกหมวดหมู่ที่ต้องการลบ 1 หมวด");
      return;
    }
    const categoryText = selectedCategories.join(", ");
    if (!window.confirm(`ยืนยันการลบหมวดหมู่ ${categoryText} หรือไม่?`)) return;
    if (!beginAction("category")) return;
    const deleted = [];
    const failed = [];
    for (const category of selectedCategories) {
      try {
        // ลบแต่ละหมวดจาก Backend; เก็บผลสำเร็จและข้อผิดพลาดแยกกันก่อนอัปเดตหน้าจอ
        await deleteCategory(category);
        deleted.push(category);
      } catch (err) {
        failed.push(`${category}: ${err.message || "ลบไม่สำเร็จ"}`);
      }
    }
    if (deleted.length) {
      setCategories((prev) => prev.filter((item) => !deleted.includes(item)));
      setOwnerState((prev) => ({ ...prev, menuCat: deleted.includes(prev.menuCat) ? "" : prev.menuCat }));
      setNewItem((prev) => ({ ...prev, category: deleted.includes(prev.category) ? "" : prev.category }));
    }
    setSelectedCategories([]);
    setCategoryManageMode(false);
    if (failed.length) showActionError(failed.join(" | "));
    else showToast(`ลบหมวดหมู่ ${deleted.join(", ")} แล้ว`);
    finishAction("category");
  }

  function startCategoryManageMode() {
    setSelectedCategories([]);
    setCategoryManageMode(true);
  }

  function cancelCategoryManageMode() {
    setSelectedCategories([]);
    setCategoryManageMode(false);
  }

  function beginCategoryEdit() {
    if (selectedCategories.length !== 1) {
      showToast("กรุณาเลือกหมวดหมู่ที่ต้องการแก้ไข 1 หมวด");
      return;
    }
    setEditingCategory({ oldName: selectedCategories[0], newName: selectedCategories[0] });
    setSelectedCategories([]);
    setCategoryManageMode(false);
  }

  async function ownerSaveCategoryEdit() {
    if (mutationLocks.current.has("category")) return;
    const oldName = editingCategory?.oldName;
    const newName = editingCategory?.newName?.trim();
    if (!oldName || !newName) {
      showToast("กรุณากรอกชื่อหมวดหมู่ใหม่");
      return;
    }
    if (categories.some((category) => category !== oldName && category.toLowerCase() === newName.toLowerCase())) {
      showToast("หมวดหมู่นี้มีอยู่แล้ว");
      return;
    }
    if (!beginAction("category")) return;
    try {
      // เปลี่ยนชื่อหมวดหมู่ใน Backend ก่อนปรับชื่อที่อ้างอิงอยู่ในสถานะหน้า
      await updateCategory(oldName, newName);
      setCategories((prev) => prev.map((category) => (category === oldName ? newName : category)));
      setSelectedCategories((prev) => prev.map((category) => (category === oldName ? newName : category)));
      setOwnerState((prev) => ({ ...prev, menuCat: prev.menuCat === oldName ? newName : prev.menuCat }));
      setNewItem((prev) => ({ ...prev, category: prev.category === oldName ? newName : prev.category }));
      setMenu((prev) => prev.map((item) => item.category === oldName ? { ...item, category: newName } : item));
      setEditingCategory(null);
      showToast(`แก้ไขหมวดหมู่เป็น "${newName}" แล้ว`);
    } catch (err) {
      showActionError(err.message || "แก้ไขหมวดหมู่ไม่สำเร็จ");
    } finally {
      finishAction("category");
    }
  }

  async function ownerToggleItem(item) {
    if (!beginAction("menu")) return;
    try {
      // บันทึกสถานะพร้อมขาย/หยุดขายใน Backend แล้วสะท้อนผลในรายการเมนู
      await setMenuItemAvailability(item.id, !item.active);
      setMenu((prev) => prev.map((m) => (m.id === item.id ? { ...m, active: !m.active } : m)));
    } catch (err) {
      showActionError("อัปเดตสถานะเมนูไม่สำเร็จ: " + err.message);
    } finally {
      finishAction("menu");
    }
  }

  function resetMenuForm(force = false) {
    if ((mutationLocks.current.has("menu") || optionsBusy) && force !== true) return;
    setNewItem({ sku: "", name: "", price: "", category: "", type: "drink", active: true });
    setNewOptionGroupIds([]);
    setSelectedImage(null);
    setImagePreview("");
    setEditingItemId(null);
    setEditingItem({ sku: "", name: "", price: "", category: "", type: "drink", active: true });
    setEditingOptionGroupIds([]);
    setEditImageFile(null);
    setEditImagePreview("");
  }

  function startEditItem(item) {
    setEditingItemId(item.id);
    setEditingItem({
      sku: item.sku || "",
      name: item.name || "",
      price: String(item.price ?? ""),
      category: item.category || "",
      type: item.type || "drink",
      active: item.active !== false,
    });
    setEditingOptionGroupIds((item.optionGroups || []).map((group) => group.id));
    setEditImagePreview(item.image || "");
    setEditImageFile(null);
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function ownerAddItem() {
    if (mutationLocks.current.has("menu") || optionsBusy) return;
    const price = parseFloat(newItem.price);
    if (!newItem.name.trim() || !Number.isFinite(price) || price < 0 || newItem.price === "") {
      showToast("กรุณากรอกชื่อเมนูและราคาตั้งแต่ 0 บาทขึ้นไป");
      return;
    }

    const category = newItem.category.trim() || ownerState.menuCat;
    if (!category || !categories.includes(category)) { showToast("กรุณาเลือกหมวดหมู่ที่มีอยู่ก่อนเพิ่มเมนู"); return; }
    if (!beginAction("menu")) return;
    try {
      let imageUrl = null;
      if (selectedImage) {
        setUploadingImage(true);
        // ส่งไฟล์รูปไป Backend เพื่อรับ URL ก่อนนำ URL ไปบันทึกพร้อมข้อมูลเมนู
        const uploadResult = await uploadMenuImage(selectedImage);
        imageUrl = uploadResult.imageUrl;
      }

      // สร้างเมนูพร้อมราคา หมวดหมู่ สถานะ รูป และกลุ่มตัวเลือกที่เลือกไว้
      await createMenuItem({
        sku: newItem.sku.trim() || null,
        name: newItem.name.trim(),
        type: newItem.type,
        category,
        price,
        isAvailable: newItem.active,
        imageUrl,
        optionGroupIds: newOptionGroupIds,
      });
      showToast(`เพิ่มเมนู "${newItem.name.trim()}" แล้ว`);
      resetMenuForm(true);
      await loadMenu(true);
    } catch (err) {
      showActionError("เพิ่มเมนูไม่สำเร็จ: " + err.message);
    } finally {
      setUploadingImage(false);
      finishAction("menu");
    }
  }

  function handleEditImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setEditImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function ownerUpdateItem() {
    if (mutationLocks.current.has("menu") || optionsBusy) return;
    const price = parseFloat(editingItem.price);
    if (!editingItem.name.trim() || !Number.isFinite(price) || price < 0 || editingItem.price === "") {
      showToast("กรุณากรอกชื่อเมนูและราคาตั้งแต่ 0 บาทขึ้นไป");
      return;
    }
    if (!categories.includes(editingItem.category)) { showToast("กรุณาเลือกหมวดหมู่ที่มีอยู่"); return; }
    if (!beginAction("menu")) return;
    try {
      let imageUrl = editImagePreview || null;
      if (editImageFile) {
        setUploadingImage(true);
        // เมื่อเลือกรูปใหม่ ให้อัปโหลดและใช้ URL ใหม่; หากไม่เลือกให้คง URL เดิม
        const uploadResult = await uploadMenuImage(editImageFile);
        imageUrl = uploadResult.imageUrl;
      }

      // ส่งข้อมูลที่แก้ไขไป Backend และใช้ข้อมูลตอบกลับแทนรายการเดิมในหน้า
      const updated = await updateMenuItem(editingItemId, {
        sku: editingItem.sku.trim() || null,
        name: editingItem.name.trim(),
        type: editingItem.type,
        category: editingItem.category.trim() || null,
        price,
        isAvailable: editingItem.active,
        imageUrl,
        optionGroupIds: editingOptionGroupIds,
      });

      setMenu((prev) => prev.map((m) => (m.id === editingItemId ? { ...m, ...updated, image: updated.image } : m)));
      showToast(`อัปเดตเมนู "${editingItem.name.trim()}" แล้ว`);
      resetMenuForm(true);
      await loadMenu(true);
    } catch (err) {
      showActionError("อัปเดตเมนูไม่สำเร็จ: " + err.message);
    } finally {
      setUploadingImage(false);
      finishAction("menu");
    }
  }

  async function ownerDeleteItem(item) {
    if (mutationLocks.current.has("menu")) return;
    if (!window.confirm(`ลบเมนู "${item.name}" หรือไม่?`)) return;
    if (!beginAction("menu")) return;
    try {
      // ลบเมนูใน Backend ก่อนนำรายการนั้นออกจากหน้าจอ
      await deleteMenuItem(item.id);
      setMenu((prev) => prev.filter((m) => m.id !== item.id));
      showToast(`ลบเมนู "${item.name}" แล้ว`);
      if (editingItemId === item.id) resetMenuForm(true);
    } catch (err) {
      showActionError("ลบเมนูไม่สำเร็จ: " + err.message);
    } finally {
      finishAction("menu");
    }
  }

  // จัดการเพิ่ม แก้ไข และลบบัญชีพนักงานตามสิทธิ์เจ้าของร้าน
  async function ownerAddStaff() {
    if (mutationLocks.current.has("staff")) return;
    if (!newStaff.username.trim() || !newStaff.password.trim() || !newStaff.displayName.trim()) {
      showToast("กรุณากรอก username, รหัสผ่าน และชื่อพนักงานให้ครบถ้วน");
      return;
    }
    if (newStaff.password.length < 8 || newStaff.password.length > 72) {
      showToast("รหัสผ่านต้องยาว 8 ถึง 72 ตัวอักษร");
      return;
    }
    if (!beginAction("staff")) return;
    try {
      // ส่งข้อมูลบัญชีใหม่ไป Backend ให้สร้างพนักงานตามบทบาทและข้อมูลติดต่อที่ระบุ
      await createStaff({
        username: newStaff.username.trim(),
        password: newStaff.password,
        displayName: newStaff.displayName.trim(),
        role: newStaff.role,
        phone: newStaff.phone.trim() || null,
        position: newStaff.position,
      });
      showToast(`เพิ่มพนักงาน "${newStaff.displayName.trim()}" แล้ว`);
      setNewStaff({ username: "", password: "", displayName: "", phone: "", position: "แคชเชียร์", role: "staff" });
      await loadStaff(true);
    } catch (err) {
      showActionError("เพิ่มพนักงานไม่สำเร็จ: " + err.message);
    } finally {
      finishAction("staff");
    }
  }

  function startEditStaff(person) {
    if (mutationLocks.current.has("staff")) return;
    setEditingStaff({ ...person, password: "", active: person.active !== false });
  }

  function isLastActiveAdmin(person) {
    return person.role === "admin" && person.active !== false && staff.filter((user) => user.role === "admin" && user.active !== false).length <= 1;
  }

  async function ownerUpdateStaff() {
    if (!editingStaff || mutationLocks.current.has("staff")) return;
    if (!editingStaff.displayName.trim()) { showToast("กรุณากรอกชื่อพนักงาน"); return; }
    const original = staff.find((person) => person.id === editingStaff.id);
    const self = String(editingStaff.id) === String(currentUser?.id);
    if (self && (!editingStaff.active || editingStaff.role !== original?.role)) { showToast("ไม่สามารถปิดบัญชีหรือเปลี่ยนสิทธิ์ของตัวเองได้"); return; }
    if (original && isLastActiveAdmin(original) && (!editingStaff.active || editingStaff.role !== "admin")) { showToast("ต้องมีผู้ดูแลร้านที่เปิดใช้งานอย่างน้อย 1 คน"); return; }
    if (editingStaff.password && !editingStaff.password.trim()) { showToast("รหัสผ่านใหม่ต้องไม่เป็นช่องว่าง"); return; }
    if (editingStaff.password && (editingStaff.password.length < 8 || editingStaff.password.length > 72)) { showToast("รหัสผ่านใหม่ต้องยาว 8 ถึง 72 ตัวอักษร"); return; }
    if (!beginAction("staff")) return;
    try {
      // บันทึกข้อมูลบัญชีและสิทธิ์ที่แก้ไข; ส่งรหัสผ่านเฉพาะเมื่อกรอกรหัสใหม่
      await updateStaff(editingStaff.id, {
        displayName: editingStaff.displayName.trim(),
        phone: editingStaff.phone?.trim() || null,
        position: editingStaff.position,
        role: editingStaff.role,
        active: editingStaff.active,
        ...(editingStaff.password ? { password: editingStaff.password } : {}),
      });
      setEditingStaff(null);
      showToast("บันทึกข้อมูลพนักงานแล้ว");
      await loadStaff(true);
    } catch (error) {
      showActionError(error.message || "บันทึกข้อมูลพนักงานไม่สำเร็จ");
    } finally {
      finishAction("staff");
    }
  }

  async function ownerDeleteStaff(person) {
    if (mutationLocks.current.has("staff")) return;
    if (String(person.id) === String(currentUser?.id)) {
      showToast("ไม่สามารถลบบัญชีที่กำลังใช้งานได้");
      return;
    }
    if (isLastActiveAdmin(person)) {
      showToast("ต้องมีผู้ดูแลร้านที่เปิดใช้งานอย่างน้อย 1 คน");
      return;
    }
    if (!window.confirm(`ยืนยันลบบัญชีของ ${person.displayName} (${person.username}) หรือไม่?`)) return;
    if (!beginAction("staff")) return;
    try {
      // ลบบัญชีใน Backend แล้วโหลดรายชื่อใหม่เพื่อให้ตารางตรงกับข้อมูลจริง
      await deleteStaff(person.id);
      showToast(`ลบบัญชี "${person.displayName}" แล้ว`);
      await loadStaff(true);
    } catch (error) {
      showActionError("ลบผู้ใช้ไม่สำเร็จ: " + error.message);
    } finally {
      finishAction("staff");
    }
  }

  const currentTabError = loadErrors[ownerState.tab] || (ownerState.tab === "menu" ? loadErrors.options : null);
  const lastLoaded = lastSuccessfulLoadedAt[ownerState.tab];
  const isInitialLoading = ownerState.tab === "menu" ? menuLoading : ownerState.tab === "staff" ? staffLoading : ownerState.tab === "payment-qr" ? paymentQrLoading : paymentsLoading;
  const connectionClass = currentTabError ? "offline" : isInitialLoading || refreshing || !lastLoaded ? "checking" : "";
  const connectionLabel = currentTabError ? "เชื่อมต่อไม่สำเร็จ" : connectionClass ? "กำลังโหลดข้อมูล" : "เชื่อมต่อแล้ว";

  // โครงหน้าระบบเจ้าของร้าน: แถบหัว เมนูหลัก และพื้นที่แสดงแท็บ
  function appWindow(title, body, dark, sidebarIcons) {
    return (
      <div className="app-window">
        <div className="app-titlebar">
          <div className="tleft">
            <span className="dot"></span>CM · {title}
          </div>
          <div className="owner-title-actions">
            <span className={`online ${connectionClass}`} role="status">{connectionLabel}</span>
            <button type="button" className="btn" onClick={refreshCurrentTab} disabled={refreshing || isInitialLoading || Object.values(busyActions).some(Boolean) || optionsBusy}>
              {refreshing ? "กำลังอัปเดต…" : "อัปเดตข้อมูล"}
            </button>
          </div>
        </div>
        <div className="app-flex">
          <div className="app-sidebar">
            {sidebarIcons.map((i) => (
              <button key={i.label} className={`${i.active ? "active " : ""}${i.label === "ออกจากระบบ" ? "logout" : ""}`} type="button" title={i.label || ""} onClick={i.onclick}>
                <span aria-hidden="true">{i.icon}</span><span className="sidebar-label">{i.label}</span>
              </button>
            ))}
          </div>
          <div className="app-body-wrap">
            <div className={`app-body ${dark ? "dark" : ""}`}>
              {currentTabError ? <div className="load-error" role="alert">{currentTabError}{lastLoaded ? " แสดงข้อมูลที่โหลดสำเร็จล่าสุด กรุณาลองอัปเดตอีกครั้ง" : " กรุณาลองอัปเดตอีกครั้ง"}</div> : null}
              {actionError && !editingItemId && !editingStaff ? <div className="load-error" role="alert">{actionError}</div> : null}
              {body}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxItem = Math.max(1, ...Object.values(stats.itemTally));
  const maxDay = Math.max(1, ...Object.values(stats.dayTally));
  const maxMonth = Math.max(1, ...Object.values(stats.monthTally));
  const periodLabel = dashboardPeriod === "daily" ? "รายวัน" : dashboardPeriod === "annual" ? `รายปี ${new Date().getFullYear() + 543}` : "รายสัปดาห์";

  // กราฟสรุปยอดขายตามช่วงเวลาและยอดรวมแต่ละช่วง
  function salesSummaryChart() {
    const chartData = getSalesChartData(payments, salesChartRange);
    const chartWidth = 820;
    const chartHeight = 330;
    const padding = { top: 28, right: 28, bottom: 48, left: 72 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;
    const maxValue = Math.max(1, ...chartData.map((point) => point.value));
    const total = chartData.reduce((sum, point) => sum + point.value, 0);
    const points = chartData.map((point, index) => ({
      ...point,
      x: padding.left + (chartData.length === 1 ? innerWidth / 2 : (index / (chartData.length - 1)) * innerWidth),
      y: padding.top + innerHeight - (point.value / maxValue) * innerHeight,
    }));
    const linePath = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
    const yTicks = [0, 0.5, 1].map((ratio) => ({
      y: padding.top + innerHeight - ratio * innerHeight,
      value: maxValue * ratio,
    }));
    const rangeTitle = {
      daily: "รายวันย้อนหลัง 7 วัน",
      weekly: "รายสัปดาห์ย้อนหลัง 8 สัปดาห์",
      monthly: "รายเดือนย้อนหลัง 6 เดือน",
      annual: `รายเดือนของปี ${new Date().getFullYear() + 543}`,
    }[salesChartRange];

    return (
      <section className="card" aria-label="สรุปยอดขายแบบกราฟ" style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>สรุปยอดขาย</div>
            <div className="muted" style={{ fontSize: 13 }}>{rangeTitle}</div>
          </div>
          <div className="period-toggle" style={{ width: "fit-content", flexWrap: "wrap" }}>
            {[['daily', 'รายวัน'], ['weekly', 'รายสัปดาห์'], ['monthly', 'รายเดือน'], ['annual', 'รายปี']].map(([value, text]) => (
              <button key={value} type="button" className={salesChartRange === value ? "active" : ""} onClick={() => setSalesChartRange(value)}>
                {text}
              </button>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 12, marginBottom: 14 }}>
          <div className="muted" style={{ fontSize: 12 }}>ยอดขายรวมช่วงที่เลือก</div>
          <div style={{ fontSize: 25, fontWeight: 700, color: "var(--amber-dark)", marginTop: 3 }}>{money(total)}</div>
        </div>
        <svg className="sales-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={`กราฟยอดขาย${rangeTitle}`}>
          {yTicks.map((tick) => (
            <g key={tick.y}>
              <line x1={padding.left} x2={chartWidth - padding.right} y1={tick.y} y2={tick.y} stroke="var(--line)" strokeDasharray="4 5" />
              <text className="sales-chart-label" x={padding.left - 10} y={tick.y + 4} textAnchor="end">{money(tick.value)}</text>
            </g>
          ))}
          <path className="sales-chart-line" d={linePath} />
          {points.map((point) => (
            <g key={point.date.toISOString()}>
              <circle className="sales-chart-dot" cx={point.x} cy={point.y} r="5" />
              <text className="sales-chart-value" x={point.x} y={point.y - 11} textAnchor="middle">{money(point.value)}</text>
              <text className="sales-chart-label" x={point.x} y={chartHeight - 18} textAnchor="middle">{point.label}</text>
            </g>
          ))}
        </svg>
      </section>
    );
  }

  // แดชบอร์ดแสดงยอดขาย สถิติการชำระ และรายการขายตามตัวกรองเวลา
  function dashboardBody() {
    if (paymentsLoading) {
      return <div className="muted" style={{ fontSize: 13 }}>กำลังโหลดข้อมูลยอดขาย...</div>;
    }
    if (!lastSuccessfulLoadedAt.dashboard && loadErrors.dashboard) {
      return <div className="muted" style={{ fontSize: 13 }}>ยังไม่สามารถแสดงยอดขายได้ กรุณากดอัปเดตข้อมูลเมื่อเชื่อมต่อระบบได้</div>;
    }
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              สรุปยอดขาย{periodLabel}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              {lastSuccessfulLoadedAt.dashboard ? `ข้อมูลอัปเดตล่าสุด: ${lastSuccessfulLoadedAt.dashboard.toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} น.` : "ยังไม่ได้รับข้อมูลยอดขาย"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div className="period-toggle">
            <button type="button" className={dashboardPeriod === "daily" ? "active" : ""} onClick={() => setDashboardPeriod("daily")}>
              รายวัน
            </button>
            <button type="button" className={dashboardPeriod === "weekly" ? "active" : ""} onClick={() => setDashboardPeriod("weekly")}>
              รายสัปดาห์
            </button>
            <button type="button" className={dashboardPeriod === "annual" ? "active" : ""} onClick={() => setDashboardPeriod("annual")}>
              รายปี
            </button>
          </div>
          </div>
        </div>
        <div className="kpi-grid" style={{ marginTop: 16 }}>
          <div className="kpi">
            <div className="kv">{money(stats.total)}</div>
            <div className="kl">ยอดขายรวม</div>
          </div>
          <div className="kpi">
            <div className="kv">{stats.bills}</div>
            <div className="kl">จำนวนบิล</div>
          </div>
          <div className="kpi">
            <div className="kv">{money(stats.qr)}</div>
            <div className="kl">ยอดโอน (QR)</div>
          </div>
          <div className="kpi">
            <div className="kv">{money(stats.cash)}</div>
            <div className="kl">ยอดเงินสด</div>
          </div>
        </div>
        {salesSummaryChart()}
        <div className="owner-columns" style={{ marginTop: 18 }}>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>รายการยอดนิยม</div>
            {Object.keys(stats.itemTally).length ? (
              Object.entries(stats.itemTally).map(([name, qty]) => (
                <div key={name} className="bar-row">
                  <div className="bl">{name}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(qty / maxItem) * 100}%` }} />
                  </div>
                  <div className="bv">{qty}</div>
                </div>
              ))
            ) : (
              <div className="muted" style={{ fontSize: 13 }}>ยังไม่มีข้อมูลการขาย</div>
            )}
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>{dashboardPeriod === "annual" ? "จำนวนบิลแยกตามเดือน" : "จำนวนบิลแยกตามวันในสัปดาห์"}</div>
            {Object.entries(dashboardPeriod === "annual" ? stats.monthTally : stats.dayTally).map(([label, value]) => (
              <div key={label} className="bar-row">
                <div className="bl">{label}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(value / (dashboardPeriod === "annual" ? maxMonth : maxDay)) * 100}%` }} />
                </div>
                <div className="bv">{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>รายละเอียดออเดอร์{periodLabel}</div>
            <div className="muted" style={{ fontSize: 12 }}>{stats.orders.length} บิล</div>
          </div>
          <div className="table-scroll"><table className="data">
            <thead>
              <tr>
                <th>เวลา</th>
                <th>เลขออเดอร์</th>
                <th>โต๊ะ</th>
                <th>รายการ</th>
                <th>ช่องทาง</th>
                <th style={{ textAlign: "right" }}>ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {stats.orders.map((order, index) => (
                <tr key={order.id || `${order.table}-${order.time}-${index}`}>
                  <td className="mono">{getPaymentDate(order)?.toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) || order.time || "-"}</td>
                  <td>{order.orderNumbers.map((number) => `#${number}`).join(", ")}</td>
                  <td>{order.table}</td>
                  <td>
                    {(order.items || []).length
                      ? order.items.map((it) => `${it.name} x${it.qty}`).join(", ")
                      : "-"}
                  </td>
                  <td>{order.method === "qr_code" ? "QR" : order.method === "cash" ? "เงินสด" : "-"}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{money(order.amount)}</td>
                </tr>
              ))}
              {!stats.orders.length ? (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: "center", padding: 20 }}>
                    ยังไม่มีออเดอร์ที่ชำระเงินแล้วในช่วงนี้
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table></div>
        </div>
      </>
    );
  }

  // หน้าจัดการเมนูและหมวดหมู่ รวมแบบฟอร์มเพิ่ม/แก้ไขและความพร้อมขาย
  function menuBody() {
    if (menuLoading) {
      return <div className="muted" style={{ fontSize: 13 }}>กำลังโหลดเมนู...</div>;
    }
    const itemsInCat = menu.filter((it) => it.category === ownerState.menuCat);
    return (
      <>
        <fieldset className="owner-form" disabled={busyActions.category || busyActions.menu || optionsBusy}>
        <div className="subnav" style={{ justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", flex: 1 }}>
            {categories.map((cat) => (
              <div key={cat} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                {categoryManageMode ? (
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => setSelectedCategories([cat])}
                    aria-label={`เลือกหมวด ${cat}`}
                  />
                ) : null}
                <button type="button" className={ownerState.menuCat === cat ? "active" : ""} onClick={() => ownerSetMenuCat(cat)}>
                  {cat}
                </button>
              </div>
            ))}
            {isAddingCategory ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  aria-label="ชื่อหมวดหมู่ใหม่"
                  value={categoryDraft}
                  onChange={(e) => setCategoryDraft(e.target.value)}
                  placeholder="ชื่อหมวดหมู่ใหม่"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") ownerAddCategory();
                  }}
                  style={{ minWidth: 180, border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 10px" }}
                />
                <button type="button" className="btn btn-primary" onClick={ownerAddCategory} style={{ padding: "8px 12px" }}>
                  {busyActions.category ? "กำลังบันทึก…" : "บันทึก"}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setCategoryDraft("");
                  }}
                  style={{ padding: "8px 12px" }}
                >
                  ยกเลิก
                </button>
              </div>
            ) : null}
          </div>
          {!isAddingCategory ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {categoryManageMode ? (
                <>
                  <button type="button" className="btn" onClick={beginCategoryEdit} style={{ padding: "8px 12px" }}>
                    แก้ไขที่เลือก
                  </button>
                  <button type="button" className="btn btn-danger" onClick={ownerDeleteSelectedCategories} style={{ padding: "8px 12px" }}>
                    ลบที่เลือก
                  </button>
                  <button type="button" className="btn" onClick={cancelCategoryManageMode} style={{ padding: "8px 12px" }}>
                    ยกเลิก
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={startCategoryManageMode}
                    style={{ padding: "8px 12px" }}
                  >
                    จัดการหมวด
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setIsAddingCategory(true);
                      setCategoryDraft("");
                    }}
                    style={{
                      padding: "8px 12px",
                      background: "#D97706",
                      color: "#fff",
                      border: "1px solid #B45F04",
                      boxShadow: "0 2px 8px rgba(217, 119, 6, 0.25)",
                      fontWeight: 800,
                    }}
                  >
                    + เพิ่มหมวด
                  </button>
                </>
              )}
            </div>
          ) : null}
          {editingCategory ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexBasis: "100%", marginTop: 8 }}>
              <input
                aria-label="แก้ไขชื่อหมวดหมู่"
                value={editingCategory.newName}
                onChange={(event) => setEditingCategory((prev) => ({ ...prev, newName: event.target.value }))}
                onKeyDown={(event) => { if (event.key === "Enter") ownerSaveCategoryEdit(); }}
                autoFocus
                style={{ minWidth: 220, border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px" }}
              />
              <button type="button" className="btn btn-primary" onClick={ownerSaveCategoryEdit} style={{ padding: "8px 12px" }}>{busyActions.category ? "กำลังบันทึก…" : "บันทึกชื่อ"}</button>
              <button type="button" className="btn" onClick={() => setEditingCategory(null)} style={{ padding: "8px 12px" }}>ยกเลิก</button>
            </div>
          ) : null}
        </div></fieldset>
        <div className="card">
          <div className="table-scroll"><table className="data">
            <thead>
              <tr>
                <th className="center">รูป</th>
                <th className="left">ชื่อเมนู</th>
                <th className="left">SKU</th>
                <th className="left">ราคา</th>
                <th className="center">เปิด/ปิด</th>
                <th className="center">สถานะ</th>
                <th className="center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {itemsInCat.map((it) => (
                <tr key={it.id}>
                  <td className="center">
                    {it.image ? (
                      <img src={it.image} alt={it.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>📷</div>
                    )}
                  </td>
                  <td className="left" style={{ fontWeight: 600 }}>{it.name}</td>
                  <td className="left mono muted">{it.sku || "-"}</td>
                  <td className="left">{money(it.price)}</td>
                  <td className="center">
                    <button type="button" className={`toggle ${it.active ? "on" : ""}`} onClick={() => ownerToggleItem(it)} disabled={busyActions.menu} aria-label={`${it.active ? "ปิดขาย" : "เปิดขาย"} ${it.name}`} aria-pressed={Boolean(it.active)}>
                      <span className="knob" />
                    </button>
                  </td>
                  <td className="center muted" style={{ fontSize: 12 }}>{it.active ? "เปิดขาย" : "ปิดขาย"}</td>
                  <td className="center">
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button type="button" className="btn" onClick={() => startEditItem(it)} disabled={busyActions.menu || optionsBusy}>
                        แก้ไข
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => ownerDeleteItem(it)} disabled={busyActions.menu || optionsBusy}>
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!itemsInCat.length ? (
                <tr>
                  <td colSpan={7} className="muted" style={{ textAlign: "center", padding: 20 }}>
                    ยังไม่มีเมนูในหมวดนี้
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table></div>
        </div>
        <hr className="divider" />
        {!editingItemId ? (
          <fieldset className="owner-form" disabled={busyActions.menu}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>เพิ่มเมนูใหม่</div>
            <div className="form-grid menu-form-grid">
              <div className="field">
                <label>ชื่อเมนู</label>
                <input aria-label="ชื่อเมนูใหม่" value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} placeholder="เช่น ชาดำเย็น" />
              </div>
              <div className="field">
                <label>SKU</label>
                <input aria-label="SKU เมนูใหม่" value={newItem.sku} onChange={(e) => setNewItem((p) => ({ ...p, sku: e.target.value }))} placeholder="เช่น TEA003" />
              </div>
              <div className="field">
                <label>ราคา (฿)</label>
                <input aria-label="ราคาเมนูใหม่ (บาท)" type="number" min="0" step="0.01" value={newItem.price} onChange={(e) => setNewItem((p) => ({ ...p, price: e.target.value }))} placeholder="30" />
              </div>
              <div className="field">
                <label>สถานะ</label>
                <select aria-label="สถานะเมนูใหม่" value={newItem.active ? "available" : "unavailable"} onChange={(e) => setNewItem((p) => ({ ...p, active: e.target.value === "available" }))}>
                  <option value="available">พร้อมขาย</option>
                  <option value="unavailable">หมดชั่วคราว</option>
                </select>
              </div>
            </div>
            <div className="form-grid menu-form-category-image">
              <div className="field">
                <label>หมวดหมู่</label>
                <select aria-label="หมวดหมู่เมนูใหม่" value={newItem.category || ownerState.menuCat} onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}>
                  {!categories.length ? <option value="">เพิ่มหมวดหมู่ก่อน</option> : null}
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <div className="field">
                <label>รูปภาพเมนู</label>
                <input aria-label="รูปภาพเมนูใหม่" type="file" accept="image/*" onChange={handleImageSelect} />
                {imagePreview ? <img className="menu-image-preview" src={imagePreview} alt="ตัวอย่างรูปเมนู" /> : null}
              </div>
            </div>
            <OptionTemplateEditor
              optionGroups={optionGroups}
              selectedIds={newOptionGroupIds}
              onSelectedIdsChange={setNewOptionGroupIds}
              onGroupsChange={setOptionGroups}
              onError={showToast}
              disabled={busyActions.menu}
              onBusyChange={setOptionsBusy}
            />
            <div className="form-actions menu-add-actions">
              <button type="button" className="btn btn-primary" onClick={ownerAddItem} disabled={busyActions.menu || optionsBusy || !categories.length}>
                {uploadingImage ? "กำลังอัปโหลดรูป…" : busyActions.menu ? "กำลังบันทึก…" : "เพิ่มเมนูใหม่"}
              </button>
            </div>
          </fieldset>
        ) : (
          <div className="menu-edit-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) resetMenuForm(); }}>
            <div className="menu-edit-modal" role="dialog" aria-modal="true" aria-label="แก้ไขเมนูที่เลือก">
              <div className="menu-edit-modal-header">
                <div style={{ fontWeight: 700, fontSize: 19 }}>แก้ไขเมนูที่เลือก</div>
                <button type="button" className="sales-modal-close" onClick={resetMenuForm} disabled={busyActions.menu || optionsBusy} aria-label="ปิด">×</button>
              </div>
            <fieldset className="owner-form" disabled={busyActions.menu}>
            {actionError ? <div className="load-error" role="alert">{actionError}</div> : null}
            <div className="form-grid menu-form-grid">
              <div className="field">
                <label>ชื่อเมนู</label>
                <input aria-label="แก้ไขชื่อเมนู" value={editingItem.name} onChange={(e) => setEditingItem((p) => ({ ...p, name: e.target.value }))} placeholder="เช่น ชาดำเย็น" />
              </div>
              <div className="field">
                <label>SKU</label>
                <input aria-label="แก้ไข SKU เมนู" value={editingItem.sku} onChange={(e) => setEditingItem((p) => ({ ...p, sku: e.target.value }))} placeholder="เช่น TEA003" />
              </div>
              <div className="field">
                <label>ราคา (฿)</label>
                <input aria-label="แก้ไขราคาเมนู (บาท)" type="number" min="0" step="0.01" value={editingItem.price} onChange={(e) => setEditingItem((p) => ({ ...p, price: e.target.value }))} placeholder="30" />
              </div>
              <div className="field">
                <label>สถานะ</label>
                <select aria-label="แก้ไขสถานะเมนู" value={editingItem.active ? "available" : "unavailable"} onChange={(e) => setEditingItem((p) => ({ ...p, active: e.target.value === "available" }))}>
                  <option value="available">พร้อมขาย</option>
                  <option value="unavailable">หมดชั่วคราว</option>
                </select>
              </div>
            </div>
            <div className="form-grid menu-form-category-image">
              <div className="field">
                <label>หมวดหมู่</label>
                <select aria-label="แก้ไขหมวดหมู่เมนู" value={editingItem.category} onChange={(e) => setEditingItem((p) => ({ ...p, category: e.target.value }))}>
                  <option value="" disabled>เลือกหมวดหมู่</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <div className="field">
                <label>รูปภาพเมนู</label>
                <input aria-label="แก้ไขรูปภาพเมนู" type="file" accept="image/*" onChange={handleEditImageSelect} />
                {editImagePreview ? <img className="menu-image-preview" src={editImagePreview} alt="ตัวอย่างรูปเมนู" /> : null}
              </div>
            </div>
            <OptionTemplateEditor
              optionGroups={optionGroups}
              selectedIds={editingOptionGroupIds}
              onSelectedIdsChange={setEditingOptionGroupIds}
              onGroupsChange={setOptionGroups}
              onError={showToast}
              disabled={busyActions.menu}
              onBusyChange={setOptionsBusy}
            />
            <div className="form-actions">
              <button type="button" className="btn" onClick={resetMenuForm} disabled={busyActions.menu || optionsBusy}>ยกเลิก</button>
              <button type="button" className="btn btn-primary" onClick={ownerUpdateItem} disabled={busyActions.menu || optionsBusy}>
                {uploadingImage ? "กำลังอัปโหลดรูป…" : busyActions.menu ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}
              </button>
            </div>
            </fieldset>
            </div>
          </div>
        )}
      </>
    );
  }

  // หน้าตั้งค่ารูป QR ที่แคชเชียร์ใช้แสดงให้ลูกค้าสแกนจ่าย
  function paymentQrBody() {
    const previewUrl = paymentQrPreview || paymentQrUrl;
    return (
      <>
        <div className="owner-toolbar" style={{ justifyContent: "center", textAlign: "center" }}>
          <div><h2 style={{ margin: 0 }}>QR รับชำระเงิน</h2><span className="muted" style={{ fontSize: 13 }}>รูปนี้จะแสดงบนหน้าชำระเงินของแคชเชียร์</span></div>
        </div>
        <div className="card" style={{ maxWidth: 720, width: "100%", margin: "0 auto" }}>
          <div style={{ width: "min(240px, 100%)", aspectRatio: "1 / 1", display: "grid", placeItems: "center", margin: "0 auto 18px", background: "#F9FAFB", border: "1px dashed var(--line)", borderRadius: 10 }}>
            {paymentQrLoading && !paymentQrUrl ? <span className="muted">กำลังโหลด QR...</span> : previewUrl ? <img src={previewUrl} alt="ตัวอย่าง QR รับชำระเงิน" style={{ display: "block", width: "92%", height: "92%", objectFit: "contain", background: "#fff", border: "1px solid var(--line)", borderRadius: 8 }} /> : <span className="muted" style={{ textAlign: "center" }}>ยังไม่ได้ตั้งค่ารูป QR</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <input ref={paymentQrInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={ownerSelectPaymentQr} style={{ display: "none" }} />
            <button type="button" className="btn" onClick={() => paymentQrInputRef.current?.click()} disabled={paymentQrSaving}>
              เลือกรูป QR
            </button>
            {paymentQrFile ? <span className="muted" style={{ fontSize: 12 }}>{paymentQrFile.name}</span> : null}
            <span style={{ flex: 1 }} />
            <button type="button" className="btn btn-primary" onClick={ownerSavePaymentQr} disabled={!paymentQrFile || paymentQrSaving}>
              {paymentQrSaving ? "กำลังบันทึก..." : "บันทึก QR"}
            </button>
            <button type="button" className="btn btn-danger" onClick={ownerRemovePaymentQr} disabled={!paymentQrUrl && !paymentQrFile || paymentQrSaving}>
              ลบ QR
            </button>
          </div>
        </div>
      </>
    );
  }

  // หน้าจัดการรายชื่อพนักงาน สิทธิ์ สถานะบัญชี และแบบฟอร์มข้อมูล
  function staffBody() {
    if (staffLoading) {
      return <div className="muted" style={{ fontSize: 13 }}>กำลังโหลดรายชื่อพนักงาน...</div>;
    }
    const query = staffSearch.trim().toLocaleLowerCase("th-TH");
    const visibleStaff = staff.filter((person) => [person.username, person.displayName, person.phone, person.position].some((value) => String(value || "").toLocaleLowerCase("th-TH").includes(query)));
    const editingSelf = String(editingStaff?.id) === String(currentUser?.id);
    const lastAdmin = editingStaff && isLastActiveAdmin(staff.find((person) => person.id === editingStaff.id) || editingStaff);
    // แสดงตารางพนักงานและแบบฟอร์มเพิ่ม/แก้ไขบัญชีตามสิทธิ์ของผู้ใช้
    return (
      <>
        <div className="owner-toolbar">
          <input type="search" value={staffSearch} onChange={(event) => setStaffSearch(event.target.value)} placeholder="ค้นหาชื่อ ชื่อบัญชี เบอร์โทร หรือตำแหน่ง" aria-label="ค้นหาพนักงาน" />
          <span className="muted" style={{ fontSize: 13 }}>{visibleStaff.length} จาก {staff.length} คน</span>
        </div>
        <div className="card">
          <div className="table-scroll"><table className="data">
            <thead>
              <tr>
                <th>Username</th>
                <th>ชื่อพนักงาน</th>
                <th>เบอร์โทรศัพท์</th>
                <th>ตำแหน่ง</th>
                <th>ระดับสิทธิ์</th>
                <th>สถานะ</th>
                {canManageStaff ? <th>จัดการ</th> : null}
              </tr>
            </thead>
            <tbody>
              {visibleStaff.map((s) => (
                <tr key={s.id}>
                  <td className="mono">{s.username}</td>
                  <td style={{ fontWeight: 600 }}>{s.displayName}</td>
                  <td>{s.phone || "-"}</td>
                  <td>{s.position || "-"}</td>
                  <td>
                    <span className={`role-chip ${s.role}`}>{s.role === "admin" ? "ผู้ดูแลร้าน" : "พนักงาน"}</span>
                  </td>
                  <td><span className={`staff-status ${s.active === false ? "inactive" : ""}`}>{s.active === false ? "ปิดใช้งาน" : "เปิดใช้งาน"}</span></td>
                  {canManageStaff ? <td><div style={{ display: "flex", gap: 8 }}><button type="button" className="btn" onClick={() => startEditStaff(s)} disabled={busyActions.staff}>แก้ไข</button><button type="button" className="btn btn-danger" onClick={() => ownerDeleteStaff(s)} disabled={busyActions.staff || String(s.id) === String(currentUser?.id) || isLastActiveAdmin(s)} title={String(s.id) === String(currentUser?.id) ? "ไม่สามารถลบบัญชีที่กำลังใช้งานได้" : isLastActiveAdmin(s) ? "ต้องมีผู้ดูแลร้านที่เปิดใช้งานอย่างน้อย 1 คน" : "ลบบัญชีผู้ใช้"}>ลบ</button></div></td> : null}
                </tr>
              ))}
              {!visibleStaff.length ? <tr><td colSpan={canManageStaff ? 7 : 6} className="muted" style={{ textAlign: "center", padding: 20 }}>{query ? "ไม่พบพนักงานที่ตรงกับการค้นหา" : "ยังไม่มีข้อมูลพนักงาน"}</td></tr> : null}
            </tbody>
          </table></div>
        </div>
        {canManageStaff ? <>
        <hr className="divider" />
        <fieldset className="owner-form" disabled={busyActions.staff}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>เพิ่มพนักงานใหม่</div>
        <div className="form-grid">
          <div className="field">
            <label>Username (เข้าสู่ระบบ)</label>
            <input aria-label="ชื่อผู้ใช้งานพนักงานใหม่" autoComplete="off" value={newStaff.username} onChange={(e) => setNewStaff((p) => ({ ...p, username: e.target.value }))} placeholder="เช่น staff03" />
          </div>
          <div className="field">
            <label>รหัสผ่าน</label>
            <input aria-label="รหัสผ่านพนักงานใหม่" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={newStaff.password} onChange={(e) => setNewStaff((p) => ({ ...p, password: e.target.value }))} placeholder="รหัสผ่าน 8 ถึง 72 ตัวอักษร" aria-describedby="new-staff-password-hint" />
            <div id="new-staff-password-hint" className="muted" style={{ fontSize: 12, marginTop: 5 }}>ใช้รหัสผ่านยาว 8 ถึง 72 ตัวอักษร</div>
          </div>
          <div className="field">
            <label>ชื่อพนักงาน</label>
            <input aria-label="ชื่อพนักงานใหม่" value={newStaff.displayName} onChange={(e) => setNewStaff((p) => ({ ...p, displayName: e.target.value }))} placeholder="ชื่อ นามสกุล" />
          </div>
          <div className="field">
            <label>เบอร์โทรศัพท์</label>
            <input aria-label="เบอร์โทรศัพท์พนักงานใหม่" type="tel" value={newStaff.phone} onChange={(e) => setNewStaff((p) => ({ ...p, phone: e.target.value }))} placeholder="0XX-XXX-XXXX" />
          </div>
          <div className="field">
            <label>ตำแหน่ง</label>
            <select aria-label="ตำแหน่งพนักงานใหม่" value={newStaff.position} onChange={(e) => setNewStaff((p) => ({ ...p, position: e.target.value, role: e.target.value === "เจ้าของร้าน" ? p.role : "staff" }))}>
              <option>แคชเชียร์</option>
              <option>ครัว</option>
              <option>เจ้าของร้าน</option>
            </select>
          </div>
          <div className="field">
            <label>ระดับสิทธิ์</label>
            <select aria-label="ระดับสิทธิ์พนักงานใหม่" value={newStaff.role} disabled={newStaff.position !== "เจ้าของร้าน"} onChange={(e) => setNewStaff((p) => ({ ...p, role: e.target.value }))}>
              <option value="staff">พนักงาน</option>
              <option value="admin">ผู้ดูแลร้าน</option>
            </select>
          </div>
        </div>
        <button type="button" className="btn btn-primary" style={{ display: "block", margin: "16px auto 0" }} onClick={ownerAddStaff} disabled={busyActions.staff}>
          {busyActions.staff ? "กำลังบันทึก…" : "เพิ่มพนักงานใหม่"}
        </button>
        </fieldset>
        {editingStaff ? (
          <div className="menu-edit-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget && !busyActions.staff) setEditingStaff(null); }}>
            <div className="menu-edit-modal" role="dialog" aria-modal="true" aria-label="แก้ไขข้อมูลพนักงาน">
              <div className="menu-edit-modal-header">
                <div><div style={{ fontWeight: 700, fontSize: 19 }}>แก้ไขพนักงาน</div><div className="muted" style={{ fontSize: 13 }}>{editingStaff.username}</div></div>
                <button type="button" className="sales-modal-close" onClick={() => setEditingStaff(null)} disabled={busyActions.staff} aria-label="ปิด">×</button>
              </div>
              <fieldset className="owner-form" disabled={busyActions.staff}>
                {actionError ? <div className="load-error" role="alert">{actionError}</div> : null}
                <div className="form-grid">
                  <div className="field"><label>ชื่อพนักงาน</label><input aria-label="แก้ไขชื่อพนักงาน" value={editingStaff.displayName} onChange={(event) => setEditingStaff((previous) => ({ ...previous, displayName: event.target.value }))} /></div>
                  <div className="field"><label>เบอร์โทรศัพท์</label><input aria-label="แก้ไขเบอร์โทรศัพท์พนักงาน" type="tel" value={editingStaff.phone || ""} onChange={(event) => setEditingStaff((previous) => ({ ...previous, phone: event.target.value }))} /></div>
                  <div className="field"><label>ตำแหน่ง</label><select aria-label="แก้ไขตำแหน่งพนักงาน" value={editingStaff.position || "แคชเชียร์"} disabled={editingSelf || lastAdmin} onChange={(event) => setEditingStaff((previous) => ({ ...previous, position: event.target.value, role: event.target.value === "เจ้าของร้าน" ? previous.role : "staff" }))}><option>แคชเชียร์</option><option>ครัว</option><option>เจ้าของร้าน</option></select></div>
                  <div className="field"><label>ระดับสิทธิ์</label><select aria-label="แก้ไขระดับสิทธิ์พนักงาน" value={editingStaff.role} disabled={editingSelf || lastAdmin || editingStaff.position !== "เจ้าของร้าน"} onChange={(event) => setEditingStaff((previous) => ({ ...previous, role: event.target.value }))}><option value="staff">พนักงาน</option><option value="admin">ผู้ดูแลร้าน</option></select></div>
                  <div className="field"><label>รหัสผ่านใหม่ (เว้นว่างเพื่อใช้รหัสเดิม)</label><input aria-label="รหัสผ่านใหม่ของพนักงาน" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={editingStaff.password} onChange={(event) => setEditingStaff((previous) => ({ ...previous, password: event.target.value }))} placeholder="รหัสผ่านใหม่ 8 ถึง 72 ตัวอักษร" aria-describedby="edit-staff-password-hint" /><div id="edit-staff-password-hint" className="muted" style={{ fontSize: 12, marginTop: 5 }}>หากเปลี่ยนรหัสผ่าน ให้กรอก 8 ถึง 72 ตัวอักษร</div></div>
                  <div className="field"><label>สถานะบัญชี</label><select aria-label="แก้ไขสถานะบัญชีพนักงาน" value={editingStaff.active ? "active" : "inactive"} disabled={editingSelf || lastAdmin} onChange={(event) => setEditingStaff((previous) => ({ ...previous, active: event.target.value === "active" }))}><option value="active">เปิดใช้งาน</option><option value="inactive">ปิดใช้งาน</option></select></div>
                </div>
                {editingSelf || lastAdmin ? <p className="muted" style={{ fontSize: 13 }}>{editingSelf ? "บัญชีที่กำลังใช้งานต้องคงสถานะและสิทธิ์เดิม" : "ต้องมีผู้ดูแลร้านที่เปิดใช้งานอย่างน้อย 1 คน"}</p> : null}
                <div className="form-actions">
                  <button type="button" className="btn" onClick={() => setEditingStaff(null)}>ยกเลิก</button>
                  <button type="button" className="btn btn-primary" onClick={ownerUpdateStaff} disabled={busyActions.staff}>{busyActions.staff ? "กำลังบันทึก…" : "บันทึกข้อมูลพนักงาน"}</button>
                </div>
              </fieldset>
            </div>
          </div>
        ) : null}
        </> : null}
      </>
    );
  }

  // แสดงแท็บที่เลือกภายในหน้าหลักเจ้าของร้าน
  return (
    <div id="app">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {appWindow(
        "Owner (เจ้าของร้าน)",
        ownerState.tab === "dashboard" ? dashboardBody() : ownerState.tab === "menu" ? menuBody() : ownerState.tab === "staff" ? staffBody() : paymentQrBody(),
        false,
        [
          { icon: "📊", label: "สรุปยอดขาย", active: ownerState.tab === "dashboard", onclick: () => ownerSetTab("dashboard") },
          { icon: "📖", label: "จัดการเมนู", active: ownerState.tab === "menu", onclick: () => ownerSetTab("menu") },
          { icon: "👥", label: "จัดการพนักงาน", active: ownerState.tab === "staff", onclick: () => ownerSetTab("staff") },
          { icon: "▦", label: "QR ชำระเงิน", active: ownerState.tab === "payment-qr", onclick: () => ownerSetTab("payment-qr") },
          // เรียก API ออกจากระบบและล้าง session ผ่าน service กลาง
          { icon: "↪", label: "ออกจากระบบ", onclick: logoutUser },
        ]
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
