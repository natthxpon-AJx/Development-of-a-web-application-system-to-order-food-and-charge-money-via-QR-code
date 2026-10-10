import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchOrders, fetchPayments, fetchPaymentQr, fetchTableCount, getCurrentUser, logoutUser, payTable, updateTableCount } from "../services/api";

const styles = `
  :root{
    --brown-900:#3B2A1B; --brown-800:#5B4530; --brown-700:#6E5237;
    --cream-100:#F3F4F6; --cream-050:#FFFFFF; --paper:#FFFFFF;
    --amber:#D97706; --amber-dark:#B45F04; --amber-bg:#FEF3C7;
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

  #app{height:100vh;display:flex;flex-direction:column;background:var(--cream-100);color-scheme:light;overflow:hidden;}
  .stage{flex:1;padding:0;display:flex;justify-content:center;}
  .stage-inner{width:100%;max-width:100%;}

  /* ===== Desktop app titlebar ===== */
  .app-window{background:transparent;border-radius:0;overflow:hidden;display:flex;flex-direction:column;height:100%;border:none;}
  .app-titlebar{background:var(--navy-800);color:#F3F4F6;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
  .app-titlebar .tleft{display:flex;align-items:center;gap:10px;font-weight:600;font-size:14.5px;}
  .app-titlebar .dot{width:9px;height:9px;border-radius:50%;background:var(--amber);}
  .app-titlebar .online{font-size:11px;background:var(--jade);color:#fff;padding:3px 9px;border-radius:20px;font-weight:600;display:flex;align-items:center;gap:5px;}
  .app-titlebar .online::before{content:'';width:6px;height:6px;border-radius:50%;background:#fff;}
  .app-flex{display:flex;flex:1;min-height:0;overflow:hidden;}
  .app-sidebar{width:58px;flex-shrink:0;background:var(--navy-900);display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px 0;}
  .app-sidebar button{width:38px;height:38px;border-radius:11px;border:none;background:transparent;color:#9CA3AF;font-size:17px;display:flex;align-items:center;justify-content:center;}
  .app-sidebar button.active{background:var(--amber);color:#fff;}
  .app-sidebar button.logout{margin-top:auto;}
  .app-body-wrap{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0;overflow:hidden;}
  .app-body{padding:20px 22px 26px;flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;}

  /* ===== Cashier bill sidebar (แปลงจาก h-full flex flex-col overflow-hidden ของ Tailwind) ===== */
  .cashier-layout{display:grid;grid-template-columns:1.4fr 1fr;gap:22px;flex:1;min-height:0;overflow:hidden;}
  .tables-col{overflow-y:auto;min-height:0;}
  .bill-sidebar{height:100%;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--line);border-radius:14px;background:var(--paper);}
  .bill-header{flex-shrink:0;padding:14px 16px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:10px;}
  .bill-items{flex:1;overflow-y:auto;min-height:0;padding:10px 16px;}
  .bill-order-groups{display:flex;flex-direction:column;gap:0;}
  .bill-order-group{padding:0 0 10px;}
  .bill-order-group + .bill-order-group{border-top:1px solid #CBD5E1;padding-top:10px;}
  .bill-order-group-header{display:flex;align-items:center;justify-content:flex-start;gap:8px;padding-bottom:3px;margin-bottom:2px;}
  .bill-order-group-time{font-size:11px;color:var(--ink-soft);font-family:"Space Mono",monospace;white-space:nowrap;}
  .bill-footer{flex-shrink:0;padding:12px 16px 16px;border-top:1px solid var(--line);}
  .item-count-badge{font-size:11.5px;font-weight:700;background:var(--amber-bg);color:var(--amber-dark);padding:3px 10px;border-radius:20px;white-space:nowrap;}

  .card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px;}
  .btn{border:none;border-radius:10px;padding:10px 16px;font-weight:700;font-size:13.5px;transition:transform .08s ease;}
  .btn:active{transform:scale(0.97);}
  .btn-primary{background:var(--amber);color:#fff;}
  .btn-primary:hover{background:var(--amber-dark);}
  .btn-dark{background:var(--navy-800);color:#fff;}
  .btn-ghost{background:transparent;border:1px solid var(--line);color:var(--navy-800);}
  .btn-jade{background:var(--jade);color:#fff;}
  .btn-sm{padding:7px 12px;font-size:12.5px;border-radius:8px;}
  .btn:disabled{opacity:.4;cursor:not-allowed;}

  .table-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
  .table-section-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;}
  .table-count-controls{display:flex;align-items:center;gap:6px;}
  .table-count-controls button{width:30px;height:30px;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--navy-800);font-size:18px;font-weight:700;line-height:1;}
  .table-count-controls button:hover{background:var(--cream-100);}
  .table-count-value{min-width:72px;text-align:center;font-size:12px;color:var(--ink-soft);}
  .table-tile{border-radius:14px;padding:16px 12px;text-align:center;border:1px solid var(--line);background:var(--cream-050);}
  .table-tile .tt-num{font-weight:700;font-size:20px;}
  .table-tile .tt-status{font-size:11.5px;margin-top:6px;font-weight:700;}
  .table-tile.empty{color:var(--ink-soft);}
  .table-tile.active{background:var(--amber);border-color:var(--amber);color:#fff;cursor:pointer;}
  .table-tile.active .tt-status{color:#fff;}
  .table-tile.selected{outline:3px solid var(--amber);outline-offset:2px;}

  .kp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
  .kp-grid button{padding:14px 0;border-radius:10px;border:1px solid var(--line);background:var(--cream-050);font-weight:700;font-size:16px;color:var(--ink);}
  .kp-grid button.key-action{background:var(--cream-100);color:var(--ink-soft);font-size:13px;}
  .cash-summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0;}
  .cash-summary-box{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--cream-050);}
  .cash-summary-box.highlight{background:var(--amber-bg);border-color:#F5D58A;}
  .cash-summary-label{font-size:11.5px;color:var(--ink-soft);}
  .cash-summary-value{font-size:18px;font-weight:700;margin-top:3px;}
  .cash-input-display{border:1px solid var(--line);border-radius:12px;background:var(--navy-900);color:#fff;text-align:right;padding:12px 16px;font-family:"Space Mono",monospace;font-size:28px;font-weight:700;letter-spacing:1px;}

  .qr-box{display:grid;place-items:center;width:100%;aspect-ratio:1/1;max-width:284px;margin:14px auto;background:#fff;border:8px solid #fff;border-radius:8px;box-shadow:0 0 0 1px var(--line);object-fit:contain;color:var(--ink-soft);font-size:13px;text-align:center;}
  .empty-state{text-align:center;padding:50px 16px;color:var(--ink-soft);}
  .empty-state .glyph{font-size:34px;margin-bottom:10px;}
  .muted{color:var(--ink-soft);}

  .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:var(--brown-900);color:#fff;padding:12px 22px;border-radius:30px;font-size:13.5px;font-weight:600;box-shadow:0 10px 25px -10px rgba(0,0,0,0.4);z-index:200;}

  @media (max-width:900px){
    .table-grid{grid-template-columns:repeat(2,1fr);}
  }
  #app{height:100dvh;}
  .app-titlebar .online.offline{background:#B45309;}
  .titlebar-actions{display:flex;align-items:center;gap:12px;}
  .staff-name{font-size:12px;color:#D1D5DB;}
  .app-sidebar{width:84px;}
  .app-sidebar button{width:68px;min-height:54px;height:auto;flex-direction:column;gap:3px;font-size:19px;padding:6px;}
  .sidebar-label{font-size:10px;font-weight:600;}
  .connection-alert{padding:10px 12px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-radius:10px;background:#FEF3C7;color:#92400E;font-size:13px;flex-shrink:0;}
  .table-count-controls button{width:40px;height:40px;}
  .table-tile{font-family:inherit;min-height:98px;width:100%;}
  .table-tile:disabled{cursor:default;}
  button:focus-visible,input:focus-visible{outline:3px solid #FBBF24;outline-offset:3px;}
  .cash-input-wrap{display:flex;align-items:center;gap:6px;background:var(--navy-900);border-radius:12px;padding-left:12px;color:#fff;}
  .cash-controls{border:0;margin:0;padding:0;min-width:0;}
  .cash-input-display{width:100%;min-width:0;margin-bottom:8px;}
  input.cash-input-display{margin:0;border:none;outline-offset:0;}
  .cashier-history{overflow:auto;min-height:0;}
  .history-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;}
  .history-toolbar h2{margin:0;font-size:18px;}
  .history-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;}
  .history-card-header{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px;}
  .history-card .btn{margin-top:10px;min-height:40px;}
  .cashier-receipt{display:none;}
  .toast{max-width:calc(100vw - 24px);width:max-content;text-align:center;}
  @media(max-width:700px){
    .app-titlebar{padding:10px 12px;gap:10px;flex-wrap:wrap;}
    .app-titlebar .tleft{font-size:13px;}
    .staff-name{display:none;}
    .app-flex{flex-direction:column;}
    .app-sidebar{width:100%;padding:7px 10px;flex-direction:row;gap:8px;}
    .app-sidebar button{width:auto;min-width:76px;min-height:44px;flex-direction:row;gap:6px;}
    .app-sidebar button.logout{margin:0 0 0 auto;}
    .sidebar-label{font-size:12px;}
    .app-body{padding:14px;overflow-y:auto;}
    .cashier-layout{grid-template-columns:1fr;overflow:visible;flex:none;gap:16px;}
    .tables-col{overflow:visible;}
    .bill-sidebar{height:auto;min-height:300px;overflow:visible;}
    .bill-items{flex:none;overflow:visible;}
    .table-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;}
    .table-tile{padding:12px 6px;min-height:80px;}
    .connection-alert{align-items:flex-start;}
    .history-list{grid-template-columns:1fr;}
    .cashier-history{overflow:visible;}
  }
  @media print{
    body{background:#fff;}
    #app{display:none!important;}
    .cashier-receipt{display:block;color:#000;max-width:76mm;margin:0 auto;font-family:'Sarabun',sans-serif;font-size:12px;}
    .cashier-receipt h2{text-align:center;font-size:18px;}
    .receipt-row{display:flex;justify-content:space-between;gap:12px;margin:5px 0;}
    .receipt-note{font-size:11px;color:#444;}
    .receipt-order + .receipt-order{border-top:1px dashed #777;margin-top:7px;padding-top:5px;}
    .receipt-order-header{display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;font-size:11px;color:#333;}
    .receipt-total{border-top:1px dashed #555;padding-top:8px;margin-top:8px;font-size:15px;font-weight:700;}
  }
`;

const qrStyles = `
  .table-qr-container{padding:10px;width:100%;overflow-y:auto;}
  .qr-controls-card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px 20px;margin-bottom:20px;}
  .qr-header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:16px;}
  .qr-settings-grid{display:grid;grid-template-columns:2fr 1fr;gap:12px;}
  .qr-input{width:100%;padding:8px 12px;border:1px solid var(--line);border-radius:8px;font-size:13.5px;outline:none;font-family:inherit;background:#fff;color:var(--ink);}
  .qr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px;}
  .qr-card{background:#fff;border:2px solid var(--brown-800);border-radius:16px;padding:20px 16px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.05);display:flex;flex-direction:column;align-items:center;page-break-inside:avoid;break-inside:avoid;}
  .restaurant-brand{font-size:14px;font-weight:700;color:var(--brown-800);letter-spacing:.5px;}
  .table-badge{font-size:26px;font-weight:800;color:var(--amber);margin-top:2px;}
  .table-code-sub{font-size:11px;color:var(--ink-soft);margin-bottom:12px;font-family:'Space Mono',monospace;}
  .qr-image-wrap{background:#fff;padding:10px;border-radius:12px;border:1px solid var(--line);display:inline-flex;justify-content:center;align-items:center;}
  .qr-img{width:160px;height:160px;object-fit:contain;}
  .qr-instruction{font-size:12.5px;font-weight:700;color:var(--navy-800);margin-top:12px;background:var(--amber-bg);padding:4px 10px;border-radius:20px;}
  .qr-url-text{font-size:9.5px;color:var(--ink-soft);margin-top:8px;word-break:break-all;max-width:100%;}
  @media(max-width:640px){.qr-settings-grid{grid-template-columns:1fr;}}
  @media print{
    @page{size:A4 portrait;margin:10mm;}
    #app.printing-qr{display:flex!important;}
    .no-print,#app .app-titlebar,#app .app-sidebar,.connection-alert{display:none!important;}
    body,#app,.app-window,.app-flex,.app-body-wrap,.app-body{background:#fff!important;padding:0!important;margin:0!important;overflow:visible!important;height:auto!important;min-height:0!important;}
    .app-window,.app-flex,.app-body-wrap,.app-body{display:block!important;}
    .table-qr-container{padding:0!important;overflow:visible!important;}
    .qr-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:start!important;gap:20px!important;padding:0!important;}
    .qr-card{height:auto!important;min-height:0!important;overflow:visible!important;border:2px solid #000!important;box-shadow:none!important;padding:24px 16px!important;page-break-inside:avoid!important;break-inside:avoid-page!important;}
    .table-badge{color:#000!important;}.qr-instruction{background:#f0f0f0!important;color:#000!important;}
  }
`;

const DEFAULT_TABLE_COUNT = 8;
const POLL_INTERVAL_MS = 4000;

function money(n) {
  const amount = Number(n) || 0;
  return "฿" + amount.toLocaleString("th-TH", { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

function cents(value) {
  return Math.round((Number(value) || 0) * 100);
}

function paymentBills(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = row.paymentId || `order-${row.id}`;
    if (!groups.has(key)) groups.set(key, { id: key, table: row.table, method: row.method, paidAt: row.paidAt || row.createdAt, time: row.time, amount: 0, orders: [], orderGroups: [], items: [] });
    const group = groups.get(key);
    const items = (row.items || []).filter((item) => item.status !== "cancelled");
    group.amount += Number(row.amount) || 0;
    group.orders.push(row.id);
    group.orderGroups.push({ id: row.id, orderNumber: row.orderNumber ?? row.id, createdAt: row.createdAt, time: row.time, items });
    group.items.push(...items);
  });
  return Array.from(groups.values())
    .map((group) => ({ ...group, orderGroups: group.orderGroups.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)) }))
    .sort((a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0));
}

function paymentDate(payment) {
  const date = new Date(payment.paidAt);
  return Number.isNaN(date.getTime()) ? payment.time || "ไม่ระบุเวลา" : date.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

// แปลงเลขโต๊ะ (5) เป็นรหัสโต๊ะตามสคีมา (T05)
function tableCode(tableNumber) {
  return "T" + String(tableNumber).padStart(2, "0");
}

function aggregateItems(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = [item.name, item.note || "", item.price].join("|");
    const existing = map.get(key);
    if (existing) {
      existing.qty += item.qty;
    } else {
      map.set(key, { ...item });
    }
  });
  return Array.from(map.values());
}

function orderTimeWithSeconds(order) {
  const date = order.createdAt ? new Date(order.createdAt) : null;
  if (date && !Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  return order.time || "-";
}

function TableQrManager({ tableCount = DEFAULT_TABLE_COUNT }) {
  const defaultOrigin = typeof window !== "undefined" ? window.location.origin : "https://your-restaurant.vercel.app";
  const [baseUrl, setBaseUrl] = useState(defaultOrigin);
  const [filterTable, setFilterTable] = useState("all");
  const tables = Array.from({ length: tableCount }, (_, index) => index + 1);
  const displayTables = filterTable === "all" ? tables : [Number(filterTable)];

  return (
    <div className="table-qr-container">
      <div className="qr-controls-card no-print">
        <div className="qr-header">
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>📱 จัดการคิวอาร์โค้ดประจำโต๊ะ</h2>
            <div className="muted" style={{ fontSize: 12.5 }}>สร้าง QR Code ให้ลูกค้าสแกนเข้าสั่งอาหารด้วยตนเอง</div>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>🖨️ พิมพ์การ์ด QR</button>
        </div>
        <div className="qr-settings-grid">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>URL โดเมนร้าน</label>
            <input className="qr-input" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://your-app.vercel.app" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>เลือกโต๊ะ</label>
            <select className="qr-input" value={filterTable} onChange={(event) => setFilterTable(event.target.value)}>
              <option value="all">ทุกโต๊ะ (1 - {tableCount})</option>
              {tables.map((table) => <option key={table} value={table}>เฉพาะโต๊ะ {table}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="qr-grid">
        {displayTables.map((tableNum) => {
          const code = tableCode(tableNum);
          // หน้าลูกค้าถูกประกาศไว้ที่ /customer/:tableNumber ใน App.jsx
          // จึงต้องส่งหมายเลขโต๊ะเป็น path parameter ไม่ใช่ query string
          const orderUrl = `${baseUrl.replace(/\/$/, "")}/customer/${tableNum}`;
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(orderUrl)}&margin=10`;
          return (
            <article key={tableNum} className="qr-card">
              <div className="restaurant-brand">ร้านชาแมกไม้</div>
              <div className="table-badge">โต๊ะ {tableNum}</div>
              <div className="table-code-sub">{code}</div>
              <div className="qr-image-wrap"><img src={qrImageUrl} alt={`QR Code โต๊ะ ${tableNum}`} className="qr-img" /></div>
              <div className="qr-instruction">📲 สแกนเพื่อดูเมนูและสั่งอาหาร</div>
              <div className="qr-url-text">{orderUrl}</div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// รวมบิลของโต๊ะจากออเดอร์ที่ยังไม่จ่ายทั้งหมด (ไม่นับออเดอร์ที่ยกเลิก)
function tableBill(code, orders) {
  const unpaid = orders.filter((o) => o.table === code && !o.paid && o.status !== "cancelled");
  const ordersWithItems = unpaid
    .map((order) => ({ ...order, items: order.items.filter((item) => item.status !== "cancelled") }))
    .filter((order) => order.items.length)
    .sort((a, b) => Number(a.id) - Number(b.id));
  const items = aggregateItems(ordersWithItems.flatMap((o) => o.items));
  const total = items.reduce((sum, item) => sum + cents(item.price) * Number(item.qty), 0) / 100;
  return { orders: ordersWithItems, items, total };
}

export default function Cashier() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [cash, setCash] = useState("");
  const [tableCount, setTableCount] = useState(DEFAULT_TABLE_COUNT);
  const [tableCountUpdating, setTableCountUpdating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState("");
  const [paymentQrLoading, setPaymentQrLoading] = useState(false);
  const [paymentQrError, setPaymentQrError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [historyError, setHistoryError] = useState(null);
  const [view, setView] = useState("cashier");
  const [retryKey, setRetryKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const actionLock = useRef(false);
  const dataEpoch = useRef(0);
  const currentUser = getCurrentUser();

  useEffect(() => {
    document.title = "ร้านชาแมกไม้ — ระบบคิดเงิน";
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

  useEffect(() => {
    if (mode !== "qr") return undefined;
    let cancelled = false;
    setPaymentQrLoading(true);
    setPaymentQrError(null);
    fetchPaymentQr()
      .then((setting) => {
        if (!cancelled) setPaymentQrUrl(setting.imageUrl || "");
      })
      .catch((error) => {
        if (!cancelled) setPaymentQrError(error.message || "โหลด QR ไม่สำเร็จ");
      })
      .finally(() => {
        if (!cancelled) setPaymentQrLoading(false);
      });
    return () => { cancelled = true; };
  }, [mode]);

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }

  // โพลลิ่งออเดอร์ของทุกโต๊ะจากหลังบ้าน
  useEffect(() => {
    let cancelled = false;
    let pending = false;
    async function load() {
      if (pending || actionLock.current) return;
      pending = true;
      const epoch = dataEpoch.current;
      setRefreshing(true);
      const [orderResult, tableResult, paymentResult] = await Promise.allSettled([fetchOrders(), fetchTableCount(), fetchPayments()]);
      pending = false;
      if (cancelled) return;
      setRefreshing(false);
      if (epoch !== dataEpoch.current) return;
      if (orderResult.status === "fulfilled") setOrders(orderResult.value);
      if (tableResult.status === "fulfilled") setTableCount(tableResult.value.count);
      const error = [orderResult, tableResult].find((result) => result.status === "rejected");
      setLoadError(error ? error.reason.message || "โหลดข้อมูลไม่สำเร็จ" : null);
      if (paymentResult.status === "fulfilled") {
        setPayments(paymentResult.value);
        setHistoryError(null);
      } else setHistoryError(paymentResult.reason.message || "โหลดประวัติไม่สำเร็จ");
      setLoading(false);
    }
    load();
    const intervalId = window.setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [retryKey]);

  const bill = useMemo(
    () => (selected !== null ? tableBill(tableCode(selected), orders) : { items: [], total: 0 }),
    [selected, orders]
  );
  const received = Number(cash || "0") || 0;
  const change = Math.max(0, cents(received) - cents(bill.total)) / 100;
  const historyBills = useMemo(() => paymentBills(payments), [payments]);

  function cashierSelect(t) {
    if (actionLock.current) return;
    if (tableBill(tableCode(t), orders).orders.length > 0) {
      setSelected(t);
      setMode(null);
      setCash("");
    }
  }
  function cashierMode(m) {
    setMode(m);
    setCash("");
  }
  function cashierKey(d) {
    if (paying) return;
    setCash((prev) => {
      const next = `${prev || ""}${d}`;
      return /^\d{0,7}(\.\d{0,2})?$/.test(next) ? next : prev;
    });
  }
  function cashierKeyClear() {
    if (paying) return;
    setCash("");
  }
  function cashierKeyDelete() {
    if (paying) return;
    setCash((prev) => String(prev || "").slice(0, -1));
  }
  function cashierAdd(v) {
    if (paying) return;
    setCash((prev) => String((cents(prev) + cents(v)) / 100));
  }
  function cashierExact(total) {
    if (paying) return;
    setCash(String(total));
  }

  async function cashierChangeTableCount(delta) {
    if (tableCountUpdating || actionLock.current || loadError) return;
    const nextCount = tableCount + delta;
    if (nextCount < 1) return;
    setTableCountUpdating(true);
    try {
      const result = await updateTableCount(nextCount);
      setTableCount(result.count);
    } catch (err) {
      showToast(err.message || "เปลี่ยนจำนวนโต๊ะไม่สำเร็จ");
    } finally {
      setTableCountUpdating(false);
    }
  }

  async function cashierComplete(method) {
    if (selected === null || actionLock.current) return;
    if (method === "cash" && (loadError || !bill.orders?.length || cents(received) < cents(bill.total))) return;
    const payingTable = selected;
    const submittedBill = bill;
    actionLock.current = true;
    dataEpoch.current += 1;
    setPaying(true);
    let result;
    try {
      result = await payTable(tableCode(payingTable), method, method === "cash" ? { orderIds: submittedBill.orders.map((order) => order.id), expectedAmount: submittedBill.total } : undefined);
    } catch (err) {
      showToast(err.message || "บันทึกการชำระเงินไม่สำเร็จ ลองใหม่อีกครั้ง");
      actionLock.current = false;
      setPaying(false);
      setRetryKey((key) => key + 1);
      return;
    }
    const paidIds = new Set((result.orderIds || submittedBill.orders.map((order) => order.id)).map(String));
    const paidAt = result.paidAt || new Date().toISOString();
    setOrders((previous) => previous.map((order) => paidIds.has(String(order.id)) ? { ...order, paid: true, paymentMethod: method } : order));
    setPayments((previous) => [...submittedBill.orders.filter((order) => paidIds.has(String(order.id))).map((order) => ({ ...order, amount: order.items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0), method, paidAt, paymentId: result.paymentId || `local-${paidAt}`, createdAt: order.createdAt })), ...previous]);
    setSelected(null);
    setMode(null);
    setCash("");
    showToast(`รับชำระเงินโต๊ะ ${payingTable} เรียบร้อย ✓`);
    const [orderResult, paymentResult] = await Promise.allSettled([fetchOrders(), fetchPayments()]);
    if (orderResult.status === "fulfilled") {
      setOrders(orderResult.value);
      setLoadError(null);
    } else setLoadError("รับเงินสำเร็จแล้ว แต่ยังโหลดรายการล่าสุดไม่ได้ กดลองใหม่เพื่ออัปเดต");
    if (paymentResult.status === "fulfilled") {
      setPayments(paymentResult.value);
      setHistoryError(null);
    } else setHistoryError("บันทึกการชำระเงินแล้ว แต่ยังโหลดประวัติล่าสุดไม่ได้");
    dataEpoch.current += 1;
    actionLock.current = false;
    setPaying(false);
  }

  function appWindow(title, body, dark, sidebarIcons) {
    return (
      <div className="app-window">
        <div className="app-titlebar">
          <div className="tleft">
            <span className="dot"></span>CM · {title}
          </div>
          <div className="titlebar-actions">
            <span className="staff-name">{currentUser?.displayName || currentUser?.username}</span>
            <div className={`online ${loadError || (view === "history" && historyError) ? "offline" : ""}`} aria-live="polite">{loading ? "กำลังเชื่อมต่อ" : loadError || (view === "history" && historyError) ? "เชื่อมต่อขัดข้อง" : "เชื่อมต่อแล้ว"}</div>
          </div>
        </div>
        <div className="app-flex">
          <div className="app-sidebar">
            {sidebarIcons.map((i) => (
              <button key={i.label} className={`${i.active ? "active " : ""}${i.label === "ออกจากระบบ" ? "logout" : ""}`} type="button" title={i.label || ""} aria-label={i.label} disabled={paying} onClick={i.onClick}>
                <span>{i.icon}</span><span className="sidebar-label">{i.label}</span>
              </button>
            ))}
          </div>
          <div className="app-body-wrap">
            <div className={`app-body ${dark ? "dark" : ""}`}>{body}</div>
          </div>
        </div>
      </div>
    );
  }

  function cashierBillPanel() {
    if (mode === "cash") return cashierCashView();
    if (mode === "qr") return cashierQrView();

    // สรุปจำนวนรายการเมนู (แต่ละบรรทัดสินค้า) และจำนวนชิ้นรวมทั้งหมดในบิลนี้ คำนวณสดจากข้อมูลจริง
    const itemCount = bill.items.length;
    const totalQty = bill.items.reduce((sum, it) => sum + it.qty, 0);

    return (
      <>
        <div className="bill-header">
          <div style={{ fontWeight: 700, fontSize: 15 }}>บิลโต๊ะ {selected}</div>
          <span className="item-count-badge">{itemCount} รายการ</span>
        </div>
        <div className="bill-items">
          <div className="bill-order-groups">
            {bill.orders.map((order) => (
              <section className="bill-order-group" key={order.id}>
                <div className="bill-order-group-header">
                  <span className="bill-order-group-time">{orderTimeWithSeconds(order)}</span>
                  <span className="muted" style={{ fontSize: 11 }}>ออเดอร์ #{order.orderNumber ?? order.id}</span>
                </div>
                {aggregateItems(order.items).map((it, itemIndex) => (
                  <div
                    key={`${order.id}-${it.name}-${it.note || ""}-${itemIndex}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      fontSize: 13.5,
                      padding: "5px 0",
                    }}
                  >
                    <span>
                      {it.name} {it.note ? <span className="muted">({it.note})</span> : null} ×{it.qty}
                    </span>
                    <span>{money(it.price * it.qty)}</span>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
        <div className="bill-footer">
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>
            <span>จำนวนรายการทั้งหมด</span>
            <span>
              {itemCount} รายการ ({totalQty} ชิ้น)
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
            <span>ยอดสุทธิ</span>
            <span>{money(bill.total)}</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-dark" style={{ flex: 1 }} onClick={() => cashierMode("cash")}>
              เงินสด
            </button>
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => cashierMode("qr")}>
              แสกนจ่าย
            </button>
          </div>
        </div>
      </>
    );
  }

  function cashierCashView() {
    const isEnoughCash = bill.orders.length > 0 && cents(received) >= cents(bill.total);
    return (
      <>
        <div className="bill-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>รับเงินสด — โต๊ะ {selected}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>กรอกจำนวนเงินที่ลูกค้าชำระ</div>
          </div>
          <span className="item-count-badge">เงินสด</span>
        </div>
        <div className="bill-items">
          <fieldset className="cash-controls" disabled={paying}>
          <div className="cash-summary">
            <div className="cash-summary-box highlight">
              <div className="cash-summary-label">ยอดที่ต้องชำระ</div>
              <div className="cash-summary-value">{money(bill.total)}</div>
            </div>
            <div className="cash-summary-box">
              <div className="cash-summary-label">เงินทอน</div>
              <div className="cash-summary-value" style={{ color: isEnoughCash ? "var(--jade)" : "var(--ink-soft)" }}>{money(change)}</div>
            </div>
          </div>
          <div className="cash-summary-label" style={{ margin: "12px 0 5px" }}>เงินที่รับมา</div>
          <div className="cash-input-wrap"><span aria-hidden="true">฿</span><input className="cash-input-display" aria-label="จำนวนเงินที่รับจากลูกค้า" inputMode="decimal" value={cash} placeholder="0" onChange={(event) => { if (/^\d{0,7}(\.\d{0,2})?$/.test(event.target.value)) setCash(event.target.value); }} /></div>
          <div className="kp-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button key={n} type="button" onClick={() => cashierKey(String(n))}>
                {n}
              </button>
            ))}
            <button type="button" className="key-action" onClick={cashierKeyClear}>
              ล้าง
            </button>
            <button type="button" onClick={() => cashierKey("0")}>
              0
            </button>
            <button type="button" className="key-action" onClick={cashierKeyDelete}>
              ลบ
            </button>
            <button type="button" className="key-action" onClick={() => cashierKey(".")} aria-label="จุดทศนิยม">.</button>
            <button type="button" className="key-action" onClick={() => cashierExact(bill.total)} style={{ gridColumn: "span 2" }}>
              พอดี
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
            {[100, 500, 1000].map((v) => (
              <button key={v} type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => cashierAdd(v)}>
                +{v}
              </button>
            ))}
          </div>
          </fieldset>
        </div>
        <div className="bill-footer">
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} disabled={paying} onClick={() => cashierMode(null)}>
              ย้อนกลับ
            </button>
            <button
              type="button"
              className="btn btn-jade"
              style={{ flex: 1 }}
              disabled={!isEnoughCash || paying || Boolean(loadError)}
              onClick={() => cashierComplete("cash")}
            >
              {paying ? "กำลังบันทึก..." : "ยืนยันรับเงินสด"}
            </button>
          </div>
        </div>
      </>
    );
  }

  function cashierQrView() {
    return (
      <>
        <div className="bill-header">
          <div style={{ fontWeight: 700, fontSize: 15 }}>สแกนจ่าย — โต๊ะ {selected}</div>
        </div>
        <div className="bill-items">
          <div className="muted" style={{ fontSize: 12.5 }}>
            สแกน QR เพื่อชำระเงิน
          </div>
          {paymentQrLoading ? <div className="qr-box" role="status">กำลังโหลด QR...</div> : paymentQrUrl ? <img className="qr-box" src={paymentQrUrl} alt="QR รับชำระเงินของร้าน" /> : <div className="qr-box" role="status">{paymentQrError ? "โหลด QR ไม่สำเร็จ กรุณาย้อนกลับแล้วลองใหม่" : "เจ้าของร้านยังไม่ได้ตั้งค่ารูป QR"}</div>}
          <div style={{ textAlign: "center", fontFamily: "Space Mono,monospace", fontSize: 22, fontWeight: 700 }}>
            {money(bill.total)}
          </div>
        </div>
        <div className="bill-footer">
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => cashierMode(null)}>
              ย้อนกลับ
            </button>
            <button type="button" className="btn btn-jade" style={{ flex: 1 }} disabled={paying || paymentQrLoading || !paymentQrUrl} onClick={() => cashierComplete("qr_code")}>
              {!paymentQrUrl ? "ยังไม่มี QR" : paying ? "กำลังบันทึก..." : "ชำระเงินสำเร็จ"}
            </button>
          </div>
        </div>
      </>
    );
  }

  const hasBill = selected !== null && bill.orders.length > 0;

  function renderTableTiles() {
    return Array.from({ length: tableCount }, (_, index) => index + 1).map((t) => {
      const b = tableBill(tableCode(t), orders);
      const has = b.orders.length > 0;
      const sel = selected === t;
      return (
        <button key={t} type="button" className={`table-tile ${has ? "active" : "empty"} ${sel ? "selected" : ""}`} disabled={!has || paying} aria-label={`โต๊ะ ${t} ${has ? `ยอด ${money(b.total)}` : "ว่าง"}`} aria-pressed={sel} onClick={() => has && cashierSelect(t)}>
          <div className="tt-num">{t}</div>
          <div className="tt-status">{has ? money(b.total) : "ว่าง"}</div>
        </button>
      );
    });
  }

  function printReceipt(payment) {
    setReceipt(payment);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.print()));
  }

  function cashierHistory() {
    return (
      <div className="cashier-history">
        <div className="history-toolbar"><h2>ประวัติการรับชำระเงิน</h2><span className="muted">{historyBills.length} บิล · {money(historyBills.reduce((sum, payment) => sum + payment.amount, 0))}</span></div>
        {!historyBills.length ? <div className="empty-state">{historyError ? "ยังโหลดประวัติไม่ได้ กดลองใหม่" : "ยังไม่มีบิลที่ชำระแล้ว"}</div> : (
          <div className="history-list">{historyBills.map((payment) => (
            <article className="card history-card" key={payment.id}>
              <div className="history-card-header"><strong>โต๊ะ {payment.table}</strong><strong>{money(payment.amount)}</strong></div>
              <div className="muted" style={{ fontSize: 12 }}>{paymentDate(payment)}</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>{payment.method === "cash" ? "เงินสด" : "สแกนจ่าย"} · ออเดอร์ {payment.orderGroups.map((order) => `#${order.orderNumber ?? order.id}`).join(", ")}</div>
              <div className="bill-order-groups">
                {payment.orderGroups.map((order) => (
                  <section className="bill-order-group" key={order.id}>
                    <div className="bill-order-group-header">
                      <span className="bill-order-group-time">{orderTimeWithSeconds(order)}</span>
                      <span className="muted" style={{ fontSize: 11 }}>ออเดอร์ #{order.orderNumber ?? order.id}</span>
                    </div>
                    {aggregateItems(order.items).map((item, index) => <div style={{ fontSize: 13, marginTop: 4 }} key={`${order.id}-${item.name}-${index}`}>{item.name} ×{item.qty}{item.note ? <span className="muted"> · {item.note}</span> : null}</div>)}
                  </section>
                ))}
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => printReceipt(payment)}>พิมพ์ใบเสร็จ</button>
            </article>
          ))}</div>
        )}
      </div>
    );
  }

  function cashierBody() {
    const error = view === "history" ? historyError : loadError;
    if (loading) return <div className="empty-state"><div className="glyph">⏳</div>กำลังโหลดข้อมูล...</div>;
    return (
      <>
        {view !== "qr" && error ? <div className="connection-alert" role="status"><span>{error}<br />รายการที่แสดงอาจยังไม่เป็นข้อมูลล่าสุด</span><button type="button" className="btn btn-ghost btn-sm" disabled={refreshing || paying} onClick={() => setRetryKey((key) => key + 1)}>{refreshing ? "กำลังลอง..." : "ลองใหม่"}</button></div> : null}
        {view === "qr" ? <TableQrManager tableCount={tableCount} /> : view === "history" ? cashierHistory() : (
          <div className="cashier-layout">
            <div className="tables-col">
              <div className="table-section-header">
                <div style={{ fontWeight: 700 }}>โต๊ะ</div>
                <div className="table-count-controls" aria-label="จัดการจำนวนโต๊ะ">
                  <button type="button" onClick={() => cashierChangeTableCount(-1)} disabled={tableCountUpdating || paying || tableCount <= 1 || Boolean(loadError)} title="ลดจำนวนโต๊ะ" aria-label="ลดจำนวนโต๊ะ">−</button>
                  <span className="table-count-value">{tableCountUpdating ? "กำลังบันทึก..." : `${tableCount} โต๊ะ`}</span>
                  <button type="button" onClick={() => cashierChangeTableCount(1)} disabled={tableCountUpdating || paying || Boolean(loadError)} title="เพิ่มจำนวนโต๊ะ" aria-label="เพิ่มจำนวนโต๊ะ">+</button>
                </div>
              </div>
              <div className="table-grid">{renderTableTiles()}</div>
            </div>
            <div className={hasBill ? "bill-sidebar" : "card empty-state"} style={!hasBill ? { padding: "30px 10px" } : undefined}>
              {hasBill ? cashierBillPanel() : <><div className="glyph">🧾</div>เลือกโต๊ะที่มีบิลเพื่อคิดเงิน</>}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
    <div id="app" className={view === "qr" ? "printing-qr" : ""}>
      <style dangerouslySetInnerHTML={{ __html: styles + qrStyles }} />
      {appWindow(
        "Cashier / Point of Sale (แคชเชียร์)",
        cashierBody(),
        false,
        [
          { icon: "💳", label: "แคชเชียร์", active: view === "cashier", onClick: () => setView("cashier") },
          { icon: "🧾", label: "ประวัติ", active: view === "history", onClick: () => setView("history") },
          { icon: "📱", label: "QR โต๊ะ", active: view === "qr", onClick: () => setView("qr") },
          { icon: "↪", label: "ออกจากระบบ", onClick: logoutUser },
        ]
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
    {receipt ? (
      <article className="cashier-receipt">
        <h2>ร้านชาแมกไม้</h2>
        <p>ใบเสร็จรับเงิน · โต๊ะ {receipt.table}</p>
        <p>{paymentDate(receipt)}</p>
        <div className="receipt-order-groups">
          {receipt.orderGroups.map((order) => (
            <section className="receipt-order" key={order.id}>
              <div className="receipt-order-header"><span>{orderTimeWithSeconds(order)}</span><span>ออเดอร์ #{order.orderNumber ?? order.id}</span></div>
              {aggregateItems(order.items).map((item, index) => (
                <div key={`${order.id}-${item.name}-${index}`}>
                  <div className="receipt-row"><span>{item.name} ×{item.qty}</span><span>{money(item.price * item.qty)}</span></div>
                  {item.note ? <div className="receipt-note">{item.note}</div> : null}
                </div>
              ))}
            </section>
          ))}
        </div>
        <div className="receipt-row receipt-total"><span>ยอดชำระ</span><span>{money(receipt.amount)}</span></div>
        <p>{receipt.method === "cash" ? "รับชำระด้วยเงินสด" : "รับชำระด้วยสแกนจ่าย"}</p>
        <p style={{ textAlign: "center" }}>ขอบคุณที่ใช้บริการ</p>
      </article>
    ) : null}
    </>
  );
}
