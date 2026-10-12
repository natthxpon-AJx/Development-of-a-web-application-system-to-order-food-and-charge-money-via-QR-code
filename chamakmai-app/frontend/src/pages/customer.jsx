import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import CustomerHeader from "../components/customer/CustomerHeader";
import CustomerMenuTab from "../components/customer/CustomerMenuTab";
import CustomerCartTab from "../components/customer/CustomerCartTab";
import CustomerStatusTab from "../components/customer/CustomerStatusTab";
import CustomerTabbar from "../components/customer/CustomerTabbar";
import CustomerDetailModal from "../components/customer/CustomerDetailModal";
import CustomerModalFrame from "../components/customer/CustomerModalFrame";
import { fetchMenu, fetchCategories, fetchOrders, fetchTableCount, createOrder, updateOrderItemStatus } from "../services/api";

// หน้าลูกค้าแสดงเมนู ตะกร้า และสถานะอาหารของโต๊ะที่ระบุใน URL
const styles = `
  :root{
    --brown-900:#3B2A1B; --brown-800:#5B4530; --brown-700:#6E5237;
    --cream-100:#F3F4F6; --cream-050:#FFFFFF; --paper:#FFFFFF;
    --amber:#D97706; --amber-dark:#B45F04; --amber-bg:#FEF3C7;
    --yellow-card:#FEF9C3; --orange-100:#FDE7CC;
    --jade:#16A34A; --jade-bg:#DCFCE7; --jade-soft:#BBF7D0;
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
  ::selection{background:var(--gold);color:#fff;}

  #app{min-height:100vh;display:flex;flex-direction:column;background:var(--cream-100);color-scheme:light;}
  .stage{flex:1;padding:28px 22px;display:flex;justify-content:center;}
  .stage-inner{width:100%;max-width:1180px;}

  /* ===== Custom styles for Customer ===== */
  .badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:20px;}
  .badge-queue{background:#F3E7D2;color:#8A5A16;}
  .badge-cooking{background:#FBE4D9;color:var(--clay);}
  .badge-done{background:var(--jade-bg);color:var(--jade);}

  .btn{border:none;border-radius:10px;padding:10px 16px;font-weight:700;font-size:13.5px;transition:transform .08s ease;}
  .btn:active{transform:scale(0.97);}
  .btn-primary{background:var(--amber);color:#fff;}
  .btn-primary:hover{background:var(--amber-dark);}
  .btn-ghost{background:transparent;border:1px solid var(--line);color:var(--navy-800);}
  .btn-block{width:100%;}
  .btn:disabled{opacity:.4;cursor:not-allowed;}

  .phone-wrap{display:flex;justify-content:center;}
  .phone{width:380px;background:var(--paper);border-radius:34px;border:8px solid var(--navy-900);box-shadow:0 20px 45px -18px rgba(17,24,39,0.45);overflow:hidden;position:relative;}
  .phone-screen{height:min(800px,calc(100dvh - 64px));min-height:420px;display:flex;flex-direction:column;background:var(--cream-050);}
  .phone-header{background:var(--brown-700);color:#fff;padding:16px 18px 14px;}
  .phone-header .row1{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}
  .phone-header .left-group{display:flex;flex-direction:column;gap:6px;}
  .phone-header .shopname{font-weight:700;font-size:13px;}
  .phone-header .table-chip{display:inline-flex;align-self:flex-start;background:rgba(255,255,255,0.16);padding:4px 7px;border-radius:20px;font-size:10px;font-weight:700;}
  .phone-header .header-actions{display:flex;align-items:center;gap:5px;flex-direction:row;}
  .phone-header .header-action{border:none;background:rgba(255,255,255,0.16);color:#fff;padding:6px 8px;border-radius:999px;font-size:10px;font-weight:700;display:flex;align-items:center;gap:4px;white-space:nowrap;}
  .phone-header .header-action.active{background:var(--amber);color:#fff;}
  .phone-content{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:14px;}
  .phone-tabbar{flex-shrink:0;background:var(--paper);border-top:1px solid var(--line);display:flex;padding:3px 7px max(11px,env(safe-area-inset-bottom));gap:4px;}
  .phone-tabbar button{flex:1;background:transparent;border:none;padding:0 2px;border-radius:8px;font-size:11px;font-weight:700;color:var(--ink-soft);display:flex;flex-direction:column;align-items:center;gap:2px;max-width:100%;}
  .phone-tabbar button.active{color:var(--amber-dark);background:#FBEEDB;}
  .phone-tabbar .ico{font-size:15px;}

  .search-box{display:flex;align-items:center;gap:8px;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:9px 12px;margin-bottom:12px;color:var(--ink-soft);font-size:13.5px;}
  .cat-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:6px;}
  .cat-scroll button{white-space:nowrap;border:1px solid var(--line);background:var(--paper);padding:7px 14px;border-radius:20px;font-size:13px;font-weight:600;color:var(--brown-800);}
  .cat-scroll button.active{background:var(--amber);color:#fff;border-color:var(--amber);}

  .menu-item{display:flex;justify-content:space-between;align-items:center;gap:10px;background:var(--yellow-card);border:1px solid #F4E9A8;border-radius:12px;padding:9px 12px;margin-bottom:9px;}
  .menu-item.soldout{opacity:.45;}
  .menu-item .mi-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0;}
  .menu-item .mi-thumb{width:60px;height:60px;position:relative;overflow:hidden;border-radius:10px;background:var(--orange-100);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px;}
  .menu-item .mi-thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
  .menu-item .mi-name{font-weight:700;font-size:14px;}
  .menu-item .mi-sku{font-size:10.5px;color:var(--ink-soft);font-family:'Space Mono',monospace;margin-top:1px;}
  .menu-item .mi-price{color:var(--amber-dark);font-weight:700;font-size:13.5px;}
  .menu-item .mi-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;}
  .menu-item .add-mini{background:var(--amber);color:#fff;border:none;width:38px;height:38px;min-height:38px;padding:0;border-radius:50%;font-size:19px;line-height:1;font-weight:700;flex-shrink:0;}

  .pill-group{display:flex;flex-wrap:wrap;gap:8px;}
  .pill{border:1px solid var(--line);background:var(--paper);padding:8px 13px;border-radius:20px;font-size:13px;font-weight:600;color:var(--brown-800);}
  .pill.active{background:var(--amber);border-color:var(--amber);color:#fff;}

  .qty-stepper{display:flex;align-items:center;gap:10px;background:var(--cream-100);border-radius:10px;padding:4px 8px;}
  .qty-stepper button{background:var(--paper);border:1px solid var(--line);width:44px;height:44px;border-radius:8px;font-weight:700;color:var(--ink);}
  .qty-stepper span{min-width:18px;text-align:center;font-weight:700;}

  .cart-row{display:flex;justify-content:space-between;gap:10px;border-bottom:1px dashed var(--line);padding:10px 0;}
  .cart-row .cn{font-weight:700;font-size:14px;}
  .cart-row .cs{font-size:12px;color:var(--ink-soft);}
  .cart-row .cp{font-weight:700;font-size:13.5px;white-space:nowrap;}

  .empty-state{text-align:center;padding:50px 16px;color:var(--ink-soft);}
  .empty-state .glyph{font-size:34px;margin-bottom:10px;}

  .status-block{border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:14px;background:var(--paper);}
  .status-block .sh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
  .customer-modal-backdrop{position:absolute;inset:0;background:rgba(17,24,39,0.42);z-index:80;display:flex;align-items:center;justify-content:center;padding:18px;}
  .customer-modal-backdrop.sheet{align-items:flex-end;padding:0;}
  .ready-popup{width:100%;max-width:360px;max-height:100%;overflow-y:auto;background:var(--paper);border-radius:18px;padding:18px;border:1px solid var(--line);box-shadow:0 22px 50px -20px rgba(17,24,39,0.65);}
  .customer-detail-sheet{background:var(--paper);width:100%;border-radius:20px 20px 0 0;padding:20px 18px max(22px,env(safe-area-inset-bottom));max-height:92%;overflow-y:auto;}
  .ready-popup .ready-icon{width:46px;height:46px;border-radius:50%;background:var(--jade-bg);color:var(--jade);display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:12px;}
  .ready-popup h3{margin:0 0 6px;font-size:18px;color:var(--ink);}
  .ready-popup p{margin:0;color:var(--ink-soft);font-size:13px;line-height:1.45;}
  .ready-popup .ready-items{display:flex;flex-direction:column;gap:8px;margin:14px 0;}
  .ready-popup .ready-item{margin:0;background:var(--cream-100);border-radius:12px;padding:11px 12px;font-size:13.5px;font-weight:700;color:var(--ink);display:flex;align-items:center;justify-content:space-between;gap:8px;}
  .ready-popup .ready-item button{flex-shrink:0;min-height:44px;border:1px solid var(--amber);background:transparent;color:var(--amber-dark);border-radius:8px;padding:8px;font-size:12px;font-weight:700;}

  .divider{border:none;border-top:1px solid var(--line);margin:16px 0;}
  .muted{color:var(--ink-soft);}
  .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:var(--brown-900);color:#fff;padding:12px 22px;border-radius:30px;font-size:13.5px;font-weight:600;box-shadow:0 10px 25px -10px rgba(0,0,0,0.4);z-index:200;}
  .phone button{min-height:44px;}
  .phone .phone-tabbar button{position:relative;min-height:35px;}
  .phone .phone-tabbar button::before{content:"";position:absolute;inset:-6px 0;}
  .phone button:disabled{cursor:not-allowed;opacity:.5;}
  .phone button:focus-visible,.phone input:focus-visible{outline:3px solid var(--amber);outline-offset:3px;}
  .phone-header{flex-shrink:0;}
  .phone-header .row1{align-items:center;}
  .phone-header .header-actions{flex-direction:row;align-items:center;justify-content:flex-end;}
  .phone-header .header-action{justify-content:center;}
  .detail-title-row,.quantity-row{display:flex;justify-content:space-between;align-items:center;gap:12px;}
  .detail-title-row h2{font-size:19px;margin:0 0 6px;}
  .icon-button{width:44px;flex-shrink:0;border:0;background:var(--cream-100);border-radius:50%;font-size:18px;}
  .option-group{border:0;padding:0;margin:0 0 18px;min-width:0;}
  .option-group legend{font-size:13.5px;font-weight:700;margin-bottom:8px;}
  .option-group legend span{font-size:11.5px;font-weight:500;}
  .option-choice{min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--line);border-radius:9px;padding:10px;margin:7px 0;cursor:pointer;font-size:13px;}
  .option-choice span{display:flex;align-items:center;gap:8px;}
  .option-choice input{width:18px;height:18px;accent-color:var(--amber);}
  .option-choice strong{color:var(--amber-dark);white-space:nowrap;}
  .option-choice.selected{border-color:var(--amber);background:var(--amber-bg);}
  .option-choice.disabled{opacity:.55;cursor:not-allowed;}
  .option-feedback,.cart-help{font-size:12px;line-height:1.6;}
  .option-feedback{color:var(--amber-dark);margin:6px 0 0;}
  .text-button{border:0;background:transparent;color:var(--amber-dark);font-weight:700;padding:8px;font-size:12px;}
  .text-button.danger,.cart-issue{color:var(--clay);}
  .cart-description{min-width:0;flex:1;}
  .cart-price{display:flex;flex-direction:column;align-items:flex-end;gap:6px;}
  .cart-controls{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin-top:8px;}
  .cart-controls .qty-stepper{gap:5px;padding:3px 6px;border-radius:9px;}
  .cart-controls .qty-stepper button{position:relative;width:15px;height:15px;min-height:15px;padding:0;border-radius:5px;font-size:12px;line-height:1;}
  .cart-controls .qty-stepper button::before{content:"";position:absolute;inset:-14px;}
  .cart-controls .qty-stepper span{min-width:16px;font-size:13px;}
  .cart-issue{font-size:12px;margin-top:6px;}
  .cart-total{margin-top:16px;display:flex;justify-content:space-between;font-weight:700;font-size:15px;}
  .feedback-banner{font-size:12px;line-height:1.6;border-radius:10px;background:var(--cream-100);padding:10px 12px;margin:0 0 12px;}
  .feedback-banner.error{background:var(--clay-bg);color:var(--clay);}
  .feedback-banner.ready{background:var(--jade-bg);color:#166534;}
  .data-freshness{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;color:var(--ink-soft);margin-bottom:8px;}
  .status-block .sh{flex-wrap:wrap;gap:8px;}

  @media (max-width:900px){
    .phone{width:100%;border-radius:0;border-width:0;}
    .stage{padding:0;}
    .phone-screen{height:100dvh;min-height:0;}
    .phone-header{padding-top:max(12px,env(safe-area-inset-top));}
    .toast{max-width:calc(100% - 28px);width:max-content;bottom:calc(84px + env(safe-area-inset-bottom));border-radius:14px;text-align:center;}
  }
`;

// อีโมจิตามหมวดหมู่ (ปรับตามหมวดจริงในฐานข้อมูล — ถ้าไม่เจอจะ fallback เป็น 🍽️)
const CATEGORY_EMOJI = {
  ทั้งหมด: "🍽️",
  Tea: "🥤",
  Coffee: "☕",
  Milk: "🥛",
  "Italian Soda": "🧋",
  Roti: "🫓",
  Snack: "🍟",
};

// ดึงข้อมูลออเดอร์/ประวัติการชำระเงินใหม่จากหลังบ้านทุก ๆ กี่วินาที (โพลลิ่งแบบง่าย)
const POLL_INTERVAL_MS = 4000;

function money(n) {
  return "฿" + n.toLocaleString("th-TH", { minimumFractionDigits: n % 1 ? 2 : 0 });
}

// ตัวช่วยเตรียมรหัสโต๊ะ ตะกร้าค้าง และตรวจสอบราคากับตัวเลือกก่อนส่งออเดอร์
// แปลงเลขโต๊ะ (5) ให้เป็นรหัสโต๊ะตามสคีมา (T05) ที่ตาราง tables/orders ใช้
function tableCode(tableNumber) {
  return "T" + String(tableNumber).padStart(2, "0");
}

function draftKey(table) {
  return `cm-customer-cart-${tableCode(table)}-v1`;
}

function readDraft(table) {
  try {
    const stored = JSON.parse(localStorage.getItem(draftKey(table)) || "null");
    const cart = (Array.isArray(stored?.cart) ? stored.cart : []).filter((item) =>
      item && item.menuId != null && typeof item.name === "string" && Number.isFinite(item.price) && item.price >= 0 && Number.isInteger(item.qty) && item.qty > 0 && item.qty <= 99 && Array.isArray(item.options) && item.options.every((group) => group && Array.isArray(group.items) && group.items.every((option) => option && option.id != null))
    ).slice(0, 100);
    return { cart, requestId: cart.length && typeof stored?.requestId === "string" ? stored.requestId : null };
  } catch {
    return { cart: [], requestId: null };
  }
}

function cartIssue(menu, cartItem) {
  if (!menu) return "เมนูนี้ไม่มีในรายการแล้ว กรุณาลบออกจากตะกร้า";
  if (!(menu.active ?? menu.status !== "unavailable")) return "เมนูนี้หมดชั่วคราว กรุณาลบออกหรือรอเมนูพร้อม";
  const selectedGroups = cartItem.options || [];
  const groups = menu.optionGroups || [];
  for (const selected of selectedGroups) {
    const group = groups.find((optionGroup) => String(optionGroup.id) === String(selected.groupId));
    if (!group || selected.items.some((option) => !group.items.some((current) => String(current.id) === String(option.id)))) return "ตัวเลือกเมนูเปลี่ยนแล้ว กรุณากดแก้ตัวเลือก";
  }
  for (const group of groups) {
    const selected = selectedGroups.find((optionGroup) => String(optionGroup.groupId) === String(group.id))?.items || [];
    if ((group.required && !selected.length) || selected.length > Number(group.maxSelections || 1)) return "กรุณาตรวจสอบตัวเลือกที่จำเป็น";
  }
  return null;
}

function cartEntry(menu, opts, quantity) {
  const options = (menu.optionGroups || []).map((group) => ({
    groupId: group.id,
    groupName: group.name,
    items: group.items.filter((option) => (opts[`group_${group.id}`] || []).some((id) => String(id) === String(option.id))),
  })).filter((group) => group.items.length);
  return {
    menuId: menu.id,
    sku: menu.sku,
    name: menu.name,
    price: Number(menu.price) + options.flatMap((group) => group.items).reduce((sum, option) => sum + Number(option.priceDelta || 0), 0),
    qty: quantity,
    options,
    note: options.flatMap((group) => group.items.map((option) => option.name)).join(" · "),
  };
}

function optsForCartItem(menu, cartItem) {
  const opts = { qty: cartItem?.qty || 1 };
  (menu.optionGroups || []).forEach((group) => {
    opts[`group_${group.id}`] = (cartItem?.options || []).find((selected) => String(selected.groupId) === String(group.id))?.items
      .filter((option) => group.items.some((current) => String(current.id) === String(option.id))).map((option) => option.id) || [];
  });
  return opts;
}

export default function Customer() {
  // สถานะหลักของหน้า ได้แก่ โต๊ะ เมนู ตะกร้า ออเดอร์ และการส่งคำขอไปหลังบ้าน
  const { tableNumber } = useParams();
  const parsedTable = Number(tableNumber);
  const validTable = /^[1-9]\d*$/.test(tableNumber || "") && Number.isSafeInteger(parsedTable);
  const [tableAccess, setTableAccess] = useState(validTable ? "checking" : "invalid");
  const [tableError, setTableError] = useState(null);
  const [tableRetry, setTableRetry] = useState(0);
  const [menuData, setMenuData] = useState([]);
  const [categoryData, setCategoryData] = useState(["ทั้งหมด"]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState(null);
  const [menuRetry, setMenuRetry] = useState(0);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [ordersUpdatedAt, setOrdersUpdatedAt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const orderSubmittingRef = useRef(false);
  const submissionIdRef = useRef(validTable ? readDraft(parsedTable).requestId : null);
  const ordersRevisionRef = useRef(0);
  const ordersRefreshRef = useRef(null);
  const activeTableRef = useRef(parsedTable);
  activeTableRef.current = parsedTable;
  const contentRef = useRef(null);
  const [customer, setCustomer] = useState(() => ({
    table: validTable ? parsedTable : null,
    tab: "menu", category: "ทั้งหมด", search: "",
    cart: validTable ? readDraft(parsedTable).cart : [],
    detailItem: null, editCartIndex: null, opts: {},
  }));
  const [toast, setToast] = useState(null);
  const [readyItems, setReadyItems] = useState([]);
  const [confirmingReadyId, setConfirmingReadyId] = useState(null);
  const confirmingReadyRef = useRef(false);
  const toastTimer = useRef(null);

  // เปลี่ยนโต๊ะแล้วเริ่มตะกร้าและสถานะออเดอร์ใหม่ โดยโหลด draft ของโต๊ะนั้นกลับมา
  useEffect(() => {
    const draft = validTable ? readDraft(parsedTable) : { cart: [], requestId: null };
    submissionIdRef.current = draft.requestId;
    setCustomer({ table: validTable ? parsedTable : null, tab: "menu", category: "ทั้งหมด", search: "", cart: draft.cart, detailItem: null, editCartIndex: null, opts: {} });
    setOrders([]);
    setReadyItems([]);
    setOrdersUpdatedAt(null);
    setOrdersError(null);
    setOrdersLoading(true);
    setSubmitError(null);
  }, [parsedTable, validTable]);

  // บันทึกตะกร้าไว้ใน browser เพื่อไม่ให้หายเมื่อรีเฟรชหน้า
  useEffect(() => {
    if (!validTable || customer.table !== parsedTable) return;
    try {
      if (customer.cart.length) localStorage.setItem(draftKey(parsedTable), JSON.stringify({ cart: customer.cart, requestId: submissionIdRef.current }));
      else localStorage.removeItem(draftKey(parsedTable));
    } catch { /* Ordering remains usable when browser storage is unavailable. */ }
  }, [customer.cart, customer.table, parsedTable, validTable]);

  // ตรวจว่าเลขโต๊ะใน URL ยังอยู่ในช่วงโต๊ะที่ร้านเปิดใช้งานหรือไม่
  useEffect(() => {
    if (!validTable) return;
    let cancelled = false;
    setTableAccess("checking");
    setTableError(null);
    // ขอจำนวนโต๊ะจาก Backend เพื่อป้องกันการสั่งอาหารด้วยเลขโต๊ะที่ร้านไม่ได้เปิดใช้งาน
    fetchTableCount().then(({ count }) => {
      if (!cancelled) setTableAccess(parsedTable <= Number(count) ? "allowed" : "denied");
    }).catch((error) => {
      if (!cancelled) { setTableAccess("error"); setTableError(error.message || "ติดต่อร้านไม่สำเร็จ"); }
    });
    return () => { cancelled = true; };
  }, [parsedTable, validTable, tableRetry]);

  // ตั้งชื่อแท็บและโหลดฟอนต์ที่ใช้กับหน้าลูกค้า
  useEffect(() => {
    document.title = "ร้านชาแมกไม้ — ลูกค้า";
    if (!document.getElementById("cm-google-fonts")) {
      const link = document.createElement("link");
      link.id = "cm-google-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@500;600;700&family=Sarabun:wght@400;500;600;700&family=Space+Mono&display=swap";
      document.head.appendChild(link);
    }
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  function showToast(message, duration = 2200) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), duration);
  }

  // โหลดเมนูและหมวดหมู่ พร้อมรีเฟรชเมื่อกลับมาที่แท็บหรือหน้าต่าง
  useEffect(() => {
    let cancelled = false;
    let loading = false;
    async function loadMenu() {
      if (loading) return;
      loading = true;
      // โหลดเมนูและหมวดหมู่จาก Backend พร้อมกัน เพื่อแสดงรายการขายล่าสุดแก่ลูกค้า
      const [menuResult, categoryResult] = await Promise.allSettled([fetchMenu(), fetchCategories()]);
      if (!cancelled) {
        if (menuResult.status === "fulfilled") {
          setMenuData(menuResult.value);
          setMenuError(null);
          const names = categoryResult.status === "fulfilled" ? categoryResult.value : menuResult.value.map((item) => item.category).filter(Boolean);
          const categories = ["ทั้งหมด", ...new Set(names.filter((name) => name !== "ทั้งหมด"))];
          setCategoryData(categories);
          setCustomer((previous) => categories.includes(previous.category) ? previous : { ...previous, category: "ทั้งหมด" });
        } else setMenuError(menuResult.reason?.message || "โหลดเมนูไม่สำเร็จ");
        setMenuLoading(false);
      }
      loading = false;
    }
    loadMenu();
    const interval = window.setInterval(() => { if (!document.hidden) loadMenu(); }, 15000);
    const onFocus = () => { if (!document.hidden) loadMenu(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [menuRetry]);

  function notifyItemReady(item) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audio = new AudioContext();
        const tone = audio.createOscillator();
        const gain = audio.createGain();
        tone.connect(gain); gain.connect(audio.destination);
        tone.frequency.value = 880;
        gain.gain.setValueAtTime(0.15, audio.currentTime);
        tone.onended = () => audio.close();
        tone.start(); tone.stop(audio.currentTime + 0.25);
      }
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch { /* Browsers can require a user gesture for audio. */ }
    setReadyItems((previous) => previous.some((ready) => String(ready.id) === String(item.id)) ? previous : [...previous, item]);
  }

  // ติดตามสถานะอาหารของโต๊ะและแจ้งเตือนเมื่อรายการพร้อมรับ
  useEffect(() => {
    if (!validTable || tableAccess !== "allowed" || customer.table !== parsedTable) return;
    let cancelled = false;
    let loading = false;
    let firstLoad = true;
    const notified = new Set();
    async function loadOrders() {
      if (loading) return;
      loading = true;
      const revision = ordersRevisionRef.current;
      try {
        // ดึงออเดอร์ของโต๊ะนี้จาก Backend เพื่ออัปเดตสถานะและแจ้งเมื่ออาหารพร้อมรับ
        const fresh = await fetchOrders(tableCode(parsedTable));
        if (cancelled || revision !== ordersRevisionRef.current) return;
        fresh.forEach((order) => {
          if (order.status === "cancelled") return;
          (order.items || []).forEach((item) => {
            if (item.status !== "done" || item.id == null) return;
            const id = String(item.id);
            if (!firstLoad && !notified.has(id)) notifyItemReady(item);
            notified.add(id);
          });
        });
        firstLoad = false;
        setOrders(fresh);
        const pendingIds = new Set(fresh.flatMap((order) => order.items || []).filter((item) => item.status === "done").map((item) => String(item.id)));
        setReadyItems((previous) => previous.filter((item) => pendingIds.has(String(item.id))));
        setOrdersError(null);
        setOrdersUpdatedAt(new Date());
      } catch (error) {
        if (!cancelled) setOrdersError(error.message || "โหลดสถานะออเดอร์ไม่สำเร็จ");
      } finally {
        loading = false;
        if (!cancelled) setOrdersLoading(false);
      }
    }
    ordersRefreshRef.current = loadOrders;
    loadOrders();
    const interval = window.setInterval(() => { if (!document.hidden) loadOrders(); }, POLL_INTERVAL_MS);
    const onFocus = () => { if (!document.hidden) loadOrders(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelled = true; ordersRefreshRef.current = null; window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [parsedTable, customer.table, tableAccess, validTable]);

  function findMenuItem(id) { return menuData.find((item) => String(item.id) === String(id)) || null; }
  // คำนวณข้อมูลสำหรับแสดงผลเมนู ตะกร้า และสถานะที่กำลังดำเนินการ
  const filteredItems = useMemo(() => menuData.filter((item) =>
    (customer.category === "ทั้งหมด" || item.category === customer.category) && item.name.toLowerCase().includes(customer.search.trim().toLowerCase())
  ), [menuData, customer.category, customer.search]);
  const cartTotal = customer.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = customer.cart.reduce((sum, item) => sum + item.qty, 0);
  const cartIssues = customer.cart.map((item) => menuLoading || (!menuData.length && menuError) ? null : cartIssue(findMenuItem(item.menuId), item));
  const myOrders = useMemo(() => orders.filter((order) => {
    if (order.status === "cancelled" || order.paid) return false;
    return (order.items || []).some((item) => item.status !== "cancelled");
  }), [orders]);
  const readyCount = myOrders.reduce((sum, order) => sum + (order.items || []).filter((item) => item.status === "done").length, 0);
  const detailItem = customer.detailItem != null ? findMenuItem(customer.detailItem) : null;

  function setCustomerPatch(patch) { setCustomer((previous) => ({ ...previous, ...patch })); }
  function custSetTab(tab) {
    setCustomerPatch({ tab });
    contentRef.current?.scrollTo({ top: 0 });
  }
  function clearSubmissionIntent() { submissionIdRef.current = null; setSubmitError(null); }
  // จัดการการเลือกเมนู ตัวเลือก จำนวนสินค้า และรายการในตะกร้า
  function custOpenItem(id, editCartIndex = null) {
    if (orderSubmittingRef.current) return;
    const item = findMenuItem(id);
    if (!item || !(item.active ?? item.status !== "unavailable")) {
      showToast("เมนูนี้ไม่พร้อมให้บริการ กรุณาเลือกเมนูอื่น");
      return;
    }
    setCustomerPatch({ detailItem: id, editCartIndex, opts: optsForCartItem(item, editCartIndex != null ? customer.cart[editCartIndex] : null) });
  }
  function custCloseItem() { setCustomerPatch({ detailItem: null, editCartIndex: null, opts: {} }); }
  function custSetOpt(key, value) { setCustomer((previous) => ({ ...previous, opts: { ...previous.opts, [key]: value } })); }
  function custQty(delta) { custSetOpt("qty", Math.min(99, Math.max(1, (customer.opts.qty || 1) + delta))); }
  function custAddToCart() {
    if (!detailItem || orderSubmittingRef.current) return;
    const entry = cartEntry(detailItem, customer.opts, customer.opts.qty || 1);
    const issue = cartIssue(detailItem, entry);
    if (issue) { showToast(issue); return; }
    const isEditing = customer.editCartIndex != null;
    const sameEntry = (item) => String(item.menuId) === String(entry.menuId) && JSON.stringify(item.options) === JSON.stringify(entry.options) && item.price === entry.price;
    const existing = customer.cart.findIndex((item, index) => index !== customer.editCartIndex && sameEntry(item));
    if (existing >= 0 && customer.cart[existing].qty + entry.qty > 99) { showToast("รายการตัวเลือกเดียวกันเลือกได้สูงสุด 99 รายการ"); return; }
    clearSubmissionIntent();
    setCustomer((previous) => {
      const cart = previous.cart.filter((_, index) => index !== previous.editCartIndex);
      const mergeIndex = cart.findIndex(sameEntry);
      if (mergeIndex >= 0) cart[mergeIndex] = { ...cart[mergeIndex], qty: cart[mergeIndex].qty + entry.qty };
      else cart.push(entry);
      return { ...previous, cart, detailItem: null, editCartIndex: null, opts: {} };
    });
    showToast(isEditing ? `แก้ไข "${detailItem.name}" แล้ว` : `เพิ่ม "${detailItem.name}" ลงตะกร้าแล้ว`);
  }
  function custRemoveCart(index) {
    if (orderSubmittingRef.current) return;
    clearSubmissionIntent();
    setCustomer((previous) => ({ ...previous, cart: previous.cart.filter((_, position) => position !== index) }));
  }
  function custCartQty(index, delta) {
    if (orderSubmittingRef.current) return;
    clearSubmissionIntent();
    setCustomer((previous) => ({ ...previous, cart: previous.cart.map((item, position) => position === index ? { ...item, qty: Math.min(99, Math.max(1, item.qty + delta)) } : item) }));
  }

  // ให้ลูกค้ายืนยันรับอาหารที่ครัวทำเสร็จแล้ว
  async function confirmReadyItem(item) {
    if (confirmingReadyRef.current) return;
    const ids = [...new Set((item?.ids?.length ? item.ids : item?.id != null ? [item.id] : []).map(String))];
    if (!ids.length) { showToast("กำลังโหลดรายการอาหาร กรุณาลองอีกครั้ง"); return; }
    confirmingReadyRef.current = true;
    const receivingTable = customer.table;
    setConfirmingReadyId(ids.join(","));
    ordersRevisionRef.current += 1;
    try {
      const results = [];
      for (const id of ids) {
        try {
          // แจ้ง Backend ว่าลูกค้ารับรายการอาหารนี้แล้ว โดยส่งเลขโต๊ะประกอบการตรวจสอบ
          await updateOrderItemStatus(id, "received", tableCode(receivingTable));
          results.push({ status: "fulfilled" });
        } catch (reason) {
          results.push({ status: "rejected", reason });
        }
      }
      if (activeTableRef.current !== receivingTable) return;
      const succeeded = new Set(ids.filter((_, index) => results[index].status === "fulfilled"));
      setOrders((previous) => previous.map((order) => ({ ...order, items: (order.items || []).map((orderedItem) => succeeded.has(String(orderedItem.id)) ? { ...orderedItem, status: "received" } : orderedItem) })));
      setReadyItems((previous) => previous.filter((ready) => !succeeded.has(String(ready.id))));
      const failure = results.find((result) => result.status === "rejected");
      showToast(failure ? `${succeeded.size ? "ยืนยันบางรายการแล้ว · " : ""}${failure.reason?.message || "ยืนยันรับอาหารไม่สำเร็จ กรุณาลองใหม่"}` : `รับ "${item.name}" แล้ว`, failure ? 4000 : 2200);
    } finally {
      ordersRevisionRef.current += 1;
      confirmingReadyRef.current = false;
      setConfirmingReadyId(null);
      ordersRefreshRef.current?.();
    }
  }

  // ตรวจราคา/ตัวเลือกซ้ำจาก API ล่าสุด แล้วส่งออเดอร์เข้าครัว
  async function custConfirmOrder() {
    if (!customer.cart.length || orderSubmittingRef.current || tableAccess !== "allowed") return;
    orderSubmittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    const submittingTable = customer.table;
    try {
      // Keep the same intent on an uncertain retry: the server may already have saved it.
      if (!submissionIdRef.current) {
        // อ่านเมนูราคาล่าสุดจาก Backend ก่อนส่ง เพื่อไม่ยืนยันรายการที่ราคา/ตัวเลือกเปลี่ยนไปแล้ว
        const latestMenu = await fetchMenu();
        if (activeTableRef.current !== submittingTable) return;
        setMenuData(latestMenu); setMenuError(null);
        const latestCart = customer.cart.map((item) => {
          const menu = latestMenu.find((current) => String(current.id) === String(item.menuId));
          const issue = cartIssue(menu, item);
          if (issue) throw new Error(`${item.name}: ${issue}`);
          return cartEntry(menu, optsForCartItem(menu, item), item.qty);
        });
        if (JSON.stringify(latestCart) !== JSON.stringify(customer.cart)) {
          setCustomerPatch({ cart: latestCart });
          setSubmitError("ข้อมูลเมนูหรือราคาเปลี่ยนแล้ว กรุณาตรวจรายการและยอดรวม จากนั้นกดยืนยันอีกครั้ง");
          return;
        }
        submissionIdRef.current = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        try { localStorage.setItem(draftKey(customer.table), JSON.stringify({ cart: customer.cart, requestId: submissionIdRef.current })); } catch { /* Storage is optional. */ }
      }
      // ส่งรายการที่ยืนยันแล้วไป Backend เพื่อสร้างออเดอร์เข้าคิวครัว พร้อมรหัสกันการส่งซ้ำ
      const created = await createOrder(tableCode(customer.table), customer.cart.map(({ menuId, sku, name, price, qty, options }) => ({ menuId, sku, name, price, qty, options })), submissionIdRef.current);
      try { localStorage.removeItem(draftKey(submittingTable)); } catch { /* Storage is optional. */ }
      if (activeTableRef.current !== submittingTable) return;
      const confirmed = { ...created, items: (created.items || []).map((item) => ({ ...item, status: item.status || "waiting" })) };
      ordersRevisionRef.current += 1;
      setOrders((previous) => [confirmed, ...previous.filter((order) => String(order.id) !== String(confirmed.id))]);
      submissionIdRef.current = null;
      setCustomer((previous) => ({ ...previous, cart: [], tab: "status", detailItem: null, editCartIndex: null, opts: {} }));
      contentRef.current?.scrollTo({ top: 0 });
      showToast("ส่งออเดอร์เข้าครัวแล้ว 🎉");
      setOrdersUpdatedAt(new Date());
      setOrdersError(null);
      // A refresh failure must never reverse the successful submission or restore the cart.
      try {
        const revision = ordersRevisionRef.current;
        // โหลดสถานะหลังสร้างออเดอร์สำเร็จ; ความผิดพลาดตรงนี้ไม่ยกเลิกออเดอร์ที่บันทึกแล้ว
        const fresh = await fetchOrders(tableCode(customer.table));
        if (activeTableRef.current === submittingTable && revision === ordersRevisionRef.current) {
          setOrders(fresh); setOrdersUpdatedAt(new Date());
        }
      } catch (error) {
        if (activeTableRef.current === submittingTable) setOrdersError(error.message || "โหลดสถานะล่าสุดไม่ได้ ระบบจะลองอัปเดตอีกครั้ง");
      }
    } catch (error) {
      if (activeTableRef.current !== submittingTable) return;
      if (error.status >= 400 && error.status < 500) {
        submissionIdRef.current = null;
        try { localStorage.setItem(draftKey(submittingTable), JSON.stringify({ cart: customer.cart, requestId: null })); } catch { /* Storage is optional. */ }
      }
      setSubmitError(error.message || "ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setMenuRetry((previous) => previous + 1);
    } finally {
      orderSubmittingRef.current = false;
      setSubmitting(false);
    }
  }

  // เนื้อหาหลักของแต่ละแท็บ: เมนู ตะกร้า สถานะ และประวัติการสั่งซื้อ
  function renderTabContent() {
    if (customer.tab === "menu") return (
      <>
        {menuLoading && !menuData.length ? <div className="empty-state"><div className="glyph">⏳</div>กำลังโหลดเมนู...</div> : null}
        {menuError ? <div className="feedback-banner error" role="alert">{menuData.length ? "เมนูที่แสดงอาจยังไม่อัปเดต · " : "โหลดเมนูไม่สำเร็จ · "}{menuError}<div><button type="button" className="text-button" onClick={() => setMenuRetry((previous) => previous + 1)}>ลองโหลดเมนูใหม่</button></div></div> : null}
        {menuData.length || (!menuLoading && !menuError) ? <CustomerMenuTab customer={customer} filteredItems={filteredItems} money={money} catEmoji={CATEGORY_EMOJI} categories={categoryData} submitting={submitting} onSearch={(search) => setCustomerPatch({ search })} onSetCat={(category) => setCustomerPatch({ category, search: "" })} onOpenItem={custOpenItem} /> : null}
      </>
    );
    if (customer.tab === "cart") return <CustomerCartTab customer={customer} cartTotal={cartTotal} cartIssues={cartIssues} pendingRequest={Boolean(submissionIdRef.current)} submitError={submitError} money={money} submitting={submitting} onSetTab={custSetTab} onRemoveCart={custRemoveCart} onEditCart={(index) => custOpenItem(customer.cart[index].menuId, index)} onCartQty={custCartQty} onConfirmOrder={custConfirmOrder} />;
    // แสดงสถานะออเดอร์สด พร้อมปุ่มยืนยันรับอาหารเมื่อรายการพร้อม
    return (
      <>
        <div className="data-freshness"><span>{ordersUpdatedAt ? `อัปเดต ${ordersUpdatedAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ordersError ? "ยังโหลดข้อมูลออเดอร์ไม่ได้" : "กำลังโหลดข้อมูลออเดอร์"}</span><button type="button" className="text-button" onClick={() => ordersRefreshRef.current?.()}>อัปเดต</button></div>
        {ordersError ? <div className="feedback-banner error" role="alert">{orders.length ? "ข้อมูลที่แสดงอาจยังไม่อัปเดต · " : "โหลดออเดอร์ไม่สำเร็จ · "}{ordersError}<div><button type="button" className="text-button" onClick={() => ordersRefreshRef.current?.()}>ลองใหม่</button></div></div> : null}
        {ordersLoading && !orders.length ? <div className="empty-state"><div className="glyph">⏳</div>กำลังโหลดออเดอร์...</div> : ordersError && !orders.length ? null : (
          <CustomerStatusTab
            myOrders={myOrders}
            money={money}
            onConfirmReadyItem={confirmReadyItem}
            confirmingReadyId={confirmingReadyId}
          />
        )}
      </>
    );
  }

  const accessMessage = !validTable ? "กรุณาสแกน QR Code ที่วางอยู่บนโต๊ะของคุณ เพื่อเข้าสู่เมนูของร้าน" : tableAccess === "checking" ? "กำลังตรวจสอบโต๊ะ..." : tableAccess === "error" ? "ติดต่อร้านไม่สำเร็จ" : "โต๊ะนี้ยังไม่เปิดให้บริการ";
  // เปลือกหน้าจอมือถือ พร้อมแถบหัว แท็บเนื้อหา แถบนำทาง และแจ้งเตือนอาหารพร้อม
  return (
    <div id="app">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="stage"><div className="stage-inner"><div className="phone-wrap"><div className="phone">
        <div className="phone-screen">
          {!validTable || tableAccess !== "allowed" ? <div className="empty-state" style={{ paddingTop: 90 }}>
            <div className="glyph">{!validTable ? "📷" : tableAccess === "checking" ? "⏳" : tableAccess === "error" ? "⚠️" : "🚫"}</div>
            <div>{accessMessage}</div>
            {tableAccess === "error" ? <><p>{tableError}</p><button type="button" className="btn btn-primary" onClick={() => setTableRetry((previous) => previous + 1)}>ลองเชื่อมต่ออีกครั้ง</button></> : null}
            {validTable && tableAccess === "denied" ? <><p>กรุณาติดต่อพนักงานเพื่อขอหมายเลขโต๊ะที่ถูกต้อง</p><button type="button" className="btn btn-ghost" onClick={() => setTableRetry((previous) => previous + 1)}>ตรวจสอบโต๊ะอีกครั้ง</button></> : null}
          </div> : <>
            <CustomerHeader tab={customer.tab} table={customer.table} cartCount={cartCount} onSetTab={custSetTab} />
            <main className="phone-content" ref={contentRef}>
              {readyCount > 0 && customer.tab !== "status" ? <div className="feedback-banner ready">มีอาหารพร้อมรับ {readyCount} รายการ <button type="button" className="text-button" onClick={() => custSetTab("status")}>ดูสถานะ</button></div> : null}
              {renderTabContent()}
            </main>
            <CustomerTabbar tab={customer.tab} cartCount={cartCount} readyCount={readyCount} onSetTab={custSetTab} showHistory={false} />
            {readyItems.length && !detailItem ? <CustomerModalFrame titleId="customer-ready-title" onClose={() => setReadyItems([])}>
              <div className="detail-title-row"><div className="ready-icon">✓</div><button type="button" className="icon-button" aria-label="ปิดแจ้งเตือนอาหารพร้อม" onClick={() => setReadyItems([])}>✕</button></div>
              <h3 id="customer-ready-title">อาหารพร้อมรับ {readyItems.length > 1 ? `${readyItems.length} รายการ` : ""}</h3>
              <p>กรุณาไปรับอาหารที่เคาน์เตอร์ แล้วเลือกยืนยันรายการที่ได้รับจริง</p>
              <div className="ready-items">{readyItems.map((item) => <div className="ready-item" key={item.id}>
                <span>{item.name} {item.note ? `(${item.note})` : ""} ×{item.qty}</span>
                <button type="button" disabled={Boolean(confirmingReadyId)} onClick={() => confirmReadyItem(item)}>{(confirmingReadyId || "").split(",").includes(String(item.id)) ? "กำลังยืนยัน..." : "รับรายการนี้"}</button>
              </div>)}</div>
              <button type="button" className="btn btn-primary btn-block" disabled={Boolean(confirmingReadyId)} onClick={() => confirmReadyItem({ ids: readyItems.map((item) => item.id), name: "อาหารทั้งหมด" })}>{confirmingReadyId ? "กำลังยืนยัน..." : "รับอาหารทั้งหมดแล้ว"}</button>
              <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => setReadyItems([])}>ไว้ก่อน</button>
            </CustomerModalFrame> : null}
          </>}
        </div>
        {tableAccess === "allowed" ? <CustomerDetailModal detailItem={detailItem} customer={customer} money={money} onClose={custCloseItem} onSetOpt={custSetOpt} onQty={custQty} onAddToCart={custAddToCart} /> : null}
      </div></div></div></div>
      {toast ? <div className="toast" role="status" aria-live="polite">{toast}</div> : null}
    </div>
  );
}
