import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import CustomerHeader from "../components/customer/CustomerHeader";
import CustomerMenuTab from "../components/customer/CustomerMenuTab";
import CustomerCartTab from "../components/customer/CustomerCartTab";
import CustomerStatusTab from "../components/customer/CustomerStatusTab";
import CustomerHistoryTab from "../components/customer/CustomerHistoryTab";
import CustomerTabbar from "../components/customer/CustomerTabbar";
import CustomerDetailModal from "../components/customer/CustomerDetailModal";
import { fetchMenu, fetchCategories, fetchOrders, fetchPayments, createOrder } from "../services/api";

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
  .stage{flex:1;padding:28px 22px 60px;display:flex;justify-content:center;}
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
  .phone-screen{height:720px;display:flex;flex-direction:column;background:var(--cream-050);}
  .phone-header{background:var(--brown-700);color:#fff;padding:16px 18px 14px;}
  .phone-header .row1{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}
  .phone-header .left-group{display:flex;flex-direction:column;gap:6px;}
  .phone-header .shopname{font-weight:700;font-size:16px;}
  .phone-header .table-chip{display:inline-flex;align-self:flex-start;background:rgba(255,255,255,0.16);padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;}
  .phone-header .header-actions{display:flex;align-items:center;gap:6px;}
  .phone-header .header-action{border:none;background:rgba(255,255,255,0.16);color:#fff;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;}
  .phone-header .header-action.active{background:var(--amber);color:#fff;}
  .phone-content{flex:1;overflow-y:auto;padding:14px 14px 90px;}
  .phone-tabbar{position:absolute;bottom:0;left:0;right:0;background:var(--paper);border-top:1px solid var(--line);display:flex;padding:8px 10px 12px;gap:6px;}
  .phone-tabbar button{flex:1;background:transparent;border:none;padding:8px 4px;border-radius:10px;font-size:11.5px;font-weight:700;color:var(--ink-soft);display:flex;flex-direction:column;align-items:center;gap:3px;}
  .phone-tabbar button.active{color:var(--amber-dark);background:#FBEEDB;}
  .phone-tabbar .ico{font-size:17px;}

  .search-box{display:flex;align-items:center;gap:8px;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:9px 12px;margin-bottom:12px;color:var(--ink-soft);font-size:13.5px;}
  .cat-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:6px;}
  .cat-scroll button{white-space:nowrap;border:1px solid var(--line);background:var(--paper);padding:7px 14px;border-radius:20px;font-size:13px;font-weight:600;color:var(--brown-800);}
  .cat-scroll button.active{background:var(--amber);color:#fff;border-color:var(--amber);}

  .menu-item{display:flex;justify-content:space-between;align-items:center;gap:10px;background:var(--yellow-card);border:1px solid #F4E9A8;border-radius:12px;padding:9px 12px;margin-bottom:9px;}
  .menu-item.soldout{opacity:.45;}
  .menu-item .mi-left{display:flex;align-items:center;gap:10px;}
  .menu-item .mi-thumb{width:38px;height:38px;border-radius:10px;background:var(--orange-100);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;}
  .menu-item .mi-name{font-weight:700;font-size:14px;}
  .menu-item .mi-sku{font-size:10.5px;color:var(--ink-soft);font-family:'Space Mono',monospace;margin-top:1px;}
  .menu-item .mi-price{color:var(--amber-dark);font-weight:700;font-size:13.5px;margin-top:2px;}
  .menu-item .add-mini{background:var(--amber);color:#fff;border:none;width:28px;height:28px;border-radius:50%;font-size:16px;font-weight:700;flex-shrink:0;}

  .pill-group{display:flex;flex-wrap:wrap;gap:8px;}
  .pill{border:1px solid var(--line);background:var(--paper);padding:8px 13px;border-radius:20px;font-size:13px;font-weight:600;color:var(--brown-800);}
  .pill.active{background:var(--amber);border-color:var(--amber);color:#fff;}

  .qty-stepper{display:flex;align-items:center;gap:10px;background:var(--cream-100);border-radius:10px;padding:4px 8px;}
  .qty-stepper button{background:var(--paper);border:1px solid var(--line);width:28px;height:28px;border-radius:8px;font-weight:700;color:var(--ink);}

  .cart-row{display:flex;justify-content:space-between;gap:10px;border-bottom:1px dashed var(--line);padding:10px 0;}
  .cart-row .cn{font-weight:700;font-size:14px;}
  .cart-row .cs{font-size:12px;color:var(--ink-soft);}
  .cart-row .cp{font-weight:700;font-size:13.5px;white-space:nowrap;}

  .empty-state{text-align:center;padding:50px 16px;color:var(--ink-soft);}
  .empty-state .glyph{font-size:34px;margin-bottom:10px;}

  .status-block{border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:14px;background:var(--paper);}
  .status-block .sh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}

  .divider{border:none;border-top:1px solid var(--line);margin:16px 0;}
  .muted{color:var(--ink-soft);}
  .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:var(--brown-900);color:#fff;padding:12px 22px;border-radius:30px;font-size:13.5px;font-weight:600;box-shadow:0 10px 25px -10px rgba(0,0,0,0.4);z-index:200;}

  @media (max-width:900px){
    .phone{width:100%;border-radius:0;border-width:0;}
    .stage{padding:0;}
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

// แปลงเลขโต๊ะ (5) ให้เป็นรหัสโต๊ะตามสคีมา (T05) ที่ตาราง tables/orders ใช้
function tableCode(tableNumber) {
  return "T" + String(tableNumber).padStart(2, "0");
}

export default function Customer() {
  // อ่านเลขโต๊ะจาก URL เช่น /customer/5 -> tableNumber = "5"
  // (ลูกค้าเข้าหน้านี้ผ่านการสแกน QR code ที่ติดไว้บนโต๊ะ ซึ่งแต่ละโต๊ะจะมี URL ไม่ซ้ำกัน)
  const { tableNumber } = useParams();
  const parsedTable = parseInt(tableNumber, 10);
  const validTable = Number.isInteger(parsedTable) && parsedTable > 0;

  const [menuData, setMenuData] = useState([]);
  const [categoryData, setCategoryData] = useState(["ทั้งหมด"]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [customer, setCustomer] = useState({
    table: validTable ? parsedTable : null,
    tab: "menu",
    category: "ทั้งหมด",
    search: "",
    cart: [],
    detailItem: null,
    opts: {},
  });
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // ---------------------------------------------------------------------
  // ตั้งค่าหน้า + โหลดฟอนต์ (เหมือนเดิม)
  // ---------------------------------------------------------------------
  useEffect(() => {
    document.title = "ร้านชาแมกไม้ — ลูกค้า";
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

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }

  // ---------------------------------------------------------------------
  // โหลดเมนู + หมวดหมู่จากหลังบ้าน (ครั้งเดียวตอนเปิดหน้า)
  // ---------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    async function loadMenu() {
      setMenuLoading(true);
      setMenuError(null);
      try {
        const [menu, categories] = await Promise.all([fetchMenu(), fetchCategories()]);
        if (cancelled) return;
        setMenuData(menu);
        setCategoryData(categories);
      } catch (err) {
        if (cancelled) return;
        setMenuError(err.message || "โหลดเมนูไม่สำเร็จ");
        showToast("โหลดเมนูจากหลังบ้านไม่สำเร็จ ลองใหม่อีกครั้ง");
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    }
    loadMenu();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------------------------------------------------
  // โพลลิ่งออเดอร์ + ประวัติการชำระเงินของโต๊ะนี้ จากหลังบ้าน (ใช้รหัสโต๊ะ เช่น T05)
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!validTable) return; // ไม่มีเลขโต๊ะที่ถูกต้องใน URL ก็ไม่ต้องโพลลิ่งอะไร
    let cancelled = false;
    const code = tableCode(customer.table);

    async function loadTableData() {
      try {
        const [tableOrders, tablePayments] = await Promise.all([fetchOrders(code), fetchPayments(code)]);
        if (cancelled) return;
        setOrders(tableOrders);
        setPayments(tablePayments);
      } catch (err) {
        // เงียบไว้ระหว่างโพลลิ่ง ไม่รบกวนผู้ใช้ทุกรอบที่พลาด
        console.error("โหลดข้อมูลออเดอร์/การชำระเงินไม่สำเร็จ:", err);
      }
    }

    loadTableData();
    const intervalId = window.setInterval(loadTableData, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [customer.table, validTable]);

  function findMenuItem(id) {
    return menuData.find((item) => String(item.id) === String(id)) || null;
  }

  const filteredItems = useMemo(() => {
    const query = customer.search.toLowerCase();
    return menuData.filter((it) => {
      const matchesCategory = customer.category === "ทั้งหมด" || it.category === customer.category;
      const matchesSearch = it.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [menuData, customer.category, customer.search]);

  const cartTotal = useMemo(
    () => customer.cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [customer.cart]
  );
  const myOrders = useMemo(() => [...orders].sort((a, b) => b.id - a.id), [orders]);
  const paidForTable = payments;
  const detailItem = customer.detailItem ? findMenuItem(customer.detailItem) : null;

  function setCustomerPatch(patch) {
    setCustomer((prev) => ({ ...prev, ...patch }));
  }
  function setCustomerOpts(patch) {
    setCustomer((prev) => ({ ...prev, opts: { ...prev.opts, ...patch } }));
  }

  function custSetTab(tab) {
    setCustomerPatch({ tab });
  }
  function custSetCat(category) {
    setCustomerPatch({ category, search: "" });
  }
  function custSearch(value) {
    setCustomerPatch({ search: value });
  }

  // เปิดรายละเอียดเมนู — ตั้งค่าเริ่มต้นของแต่ละตัวเลือกจาก options_config แบบ dynamic
  // (เช่น {"sweetness":["0%","50%","100%"]} -> opts.sweetness = "0%")
  function custOpenItem(id) {
    const item = findMenuItem(id);
    if (!item) return;
    const opts = { qty: 1 };
    Object.entries(item.options || {}).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length) opts[key] = values[0];
    });
    setCustomer((prev) => ({ ...prev, detailItem: id, opts }));
  }
  function custCloseItem() {
    setCustomerPatch({ detailItem: null });
  }
  function custSetOpt(key, value) {
    setCustomerOpts({ [key]: value });
  }
  function custQty(delta) {
    setCustomerOpts({ qty: Math.max(1, (customer.opts.qty || 1) + delta) });
  }

  function custAddToCart() {
    if (!detailItem) return;

    const optionKeys = Object.keys(detailItem.options || {});
    const selectedOptions = {};
    optionKeys.forEach((key) => {
      if (customer.opts[key]) selectedOptions[key] = customer.opts[key];
    });

    const newItem = {
      menuId: detailItem.id,
      sku: detailItem.sku,
      name: detailItem.name,
      price: detailItem.price,
      qty: customer.opts.qty || 1,
      options: selectedOptions,
      note: Object.values(selectedOptions).join(" · "),
    };

    setCustomer((prev) => ({
      ...prev,
      cart: [...prev.cart, newItem],
      detailItem: null,
      opts: {},
    }));

    showToast(`เพิ่ม "${detailItem.name}" ลงตะกร้าแล้ว`);
  }

  function custRemoveCart(index) {
    setCustomer((prev) => ({ ...prev, cart: prev.cart.filter((_, i) => i !== index) }));
  }

  // ส่งออเดอร์ไปบันทึกที่หลังบ้านจริง ๆ (insert เข้า orders + order_items)
  async function custConfirmOrder() {
    if (!customer.cart.length || submitting) return;
    setSubmitting(true);
    try {
      const items = customer.cart.map((it) => ({
        menuId: it.menuId,
        sku: it.sku,
        name: it.name,
        price: it.price,
        qty: it.qty,
        options: it.options,
      }));
      const newOrder = await createOrder(tableCode(customer.table), items);
      setOrders((prev) => [newOrder, ...prev]);
      setCustomer((prev) => ({ ...prev, cart: [], tab: "status" }));
      showToast("ส่งออเดอร์เข้าครัวแล้ว 🎉");
    } catch (err) {
      showToast("ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      console.error("createOrder failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  function renderTabContent() {
    if (menuLoading) {
      return (
        <div className="empty-state">
          <div className="glyph">⏳</div>กำลังโหลดเมนูจากหลังบ้าน...
        </div>
      );
    }
    if (menuError) {
      return (
        <div className="empty-state">
          <div className="glyph">⚠️</div>
          โหลดเมนูไม่สำเร็จ: {menuError}
        </div>
      );
    }
    if (customer.tab === "menu") {
      return (
        <CustomerMenuTab
          customer={customer}
          filteredItems={filteredItems}
          money={money}
          catEmoji={CATEGORY_EMOJI}
          categories={categoryData}
          onSearch={custSearch}
          onSetCat={custSetCat}
          onOpenItem={custOpenItem}
        />
      );
    }
    if (customer.tab === "cart") {
      return (
        <CustomerCartTab
          customer={customer}
          cartTotal={cartTotal}
          money={money}
          onSetTab={custSetTab}
          onRemoveCart={custRemoveCart}
          onConfirmOrder={custConfirmOrder}
        />
      );
    }
    if (customer.tab === "status") {
      return <CustomerStatusTab myOrders={myOrders} money={money} />;
    }
    if (customer.tab === "history") {
      return <CustomerHistoryTab paidForTable={paidForTable} money={money} />;
    }
    return null;
  }

  // ไม่มีเลขโต๊ะที่ถูกต้องใน URL (เช่น เข้าหน้า /customer เฉยๆ โดยไม่ได้สแกน QR code)
  if (!validTable) {
    return (
      <div id="app">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="stage">
          <div className="stage-inner">
            <div className="phone-wrap">
              <div className="phone">
                <div className="phone-screen">
                  <div className="empty-state" style={{ paddingTop: 90 }}>
                    <div className="glyph">📷</div>
                    กรุณาสแกน QR Code ที่วางอยู่บนโต๊ะของคุณ
                    <br />
                    เพื่อเข้าสู่เมนูของร้าน
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="app">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="stage">
        <div className="stage-inner">
          <div className="phone-wrap">
            <div className="phone">
              <div className="phone-screen">
                <CustomerHeader tab={customer.tab} table={customer.table} cartCount={customer.cart.length} onSetTab={custSetTab} />
                <div className="phone-content">{renderTabContent()}</div>
                <CustomerTabbar tab={customer.tab} onSetTab={custSetTab} />
              </div>
              <CustomerDetailModal
                detailItem={detailItem}
                customer={customer}
                money={money}
                onClose={custCloseItem}
                onSetOpt={custSetOpt}
                onQty={custQty}
                onAddToCart={custAddToCart}
              />
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}