import React, { useEffect, useMemo, useRef, useState } from "react";
import CustomerHeader from "../components/customer/CustomerHeader";
import CustomerMenuTab from "../components/customer/CustomerMenuTab";
import CustomerCartTab from "../components/customer/CustomerCartTab";
import CustomerStatusTab from "../components/customer/CustomerStatusTab";
import CustomerHistoryTab from "../components/customer/CustomerHistoryTab";
import CustomerTabbar from "../components/customer/CustomerTabbar";
import CustomerDetailModal from "../components/customer/CustomerDetailModal";
import menuData from "../data/menuData";
import categoryData from "../data/categoryData";

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

  #app{min-height:100vh;display:flex;flex-direction:column;background:var(--cream-100);}
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
  .menu-item .mi-price{color:var(--amber-dark);font-weight:700;font-size:13.5px;margin-top:2px;}
  .menu-item .add-mini{background:var(--amber);color:#fff;border:none;width:28px;height:28px;border-radius:50%;font-size:16px;font-weight:700;flex-shrink:0;}

  .pill-group{display:flex;flex-wrap:wrap;gap:8px;}
  .pill{border:1px solid var(--line);background:var(--paper);padding:8px 13px;border-radius:20px;font-size:13px;font-weight:600;color:var(--brown-800);}
  .pill.active{background:var(--amber);border-color:var(--amber);color:#fff;}

  .qty-stepper{display:flex;align-items:center;gap:10px;background:var(--cream-100);border-radius:10px;padding:4px 8px;}
  .qty-stepper button{background:var(--paper);border:1px solid var(--line);width:28px;height:28px;border-radius:8px;font-weight:700;}

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

const CATEGORY_EMOJI = {
  ทั้งหมด: "🍽️",
  Tea: "🥤",
  Coffee: "☕",
  Milk: "🥛",
  "Italian Soda": "🧋",
};

const initialOrders = [
  {id:1, dispId:'#0001', table:5, time:'18:20', status:'done', paid:false,
    items:[
      {name:'ชาเขียวมัจฉะ', note:'หวานปกติ', price:40, qty:1},
      {name:'ไส้กรอกแดง', note:'ซอสมะเขือเทศ', price:35, qty:1},
    ]},
];

const initialPayments = [
  {table:2, amount:80, method:'qr', time:'18:05', items:[{name:'มาม่าต้มยำน้ำข้น',qty:1,price:50},{name:'ไมโล',qty:1,price:30}]},
  {table:5, amount:160, method:'cash', time:'18:30', items:[{name:'ชาไทย',qty:1,price:35},{name:'นมน้ำตาล',qty:1,price:25},{name:'ข้าวไข่เจียวไก่สับ',qty:1,price:25},{name:'ชาเขียวมัจฉะ',qty:1,price:40},{name:'ไส้กรอกแดง',qty:1,price:35}]},
];

function money(n){ return '฿' + n.toLocaleString('th-TH', {minimumFractionDigits: n%1? 2:0}); }
function findMenuItem(id){
  return menuData.find((item) => String(item.id) === String(id)) || null;
}

export default function Customer(){
  const [orders, setOrders] = useState(initialOrders);
  const [payments, setPayments] = useState(initialPayments);
  const [customer, setCustomer] = useState({
    table:5,
    tab:'menu',
    category: categoryData[0] || 'ทั้งหมด',
    search:'',
    cart:[],
    detailItem:null,
    opts:{},
  });
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    document.title = 'ร้านชาแมกไม้ — ลูกค้า';
    if (!document.getElementById('cm-google-fonts')){
      const link = document.createElement('link');
      link.id = 'cm-google-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@500;600;700&family=Sarabun:wght@400;500;600;700&family=Space+Mono&display=swap';
      document.head.appendChild(link);
    }
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  const filteredItems = useMemo(() => {
    const query = customer.search.toLowerCase();
    return menuData.filter((it) => {
      const matchesCategory = customer.category === 'ทั้งหมด' || it.category === customer.category;
      const matchesSearch = it.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [customer.category, customer.search]);

  const cartTotal = useMemo(() => customer.cart.reduce((sum, item) => sum + item.price * item.qty, 0), [customer.cart]);
  const myOrders = useMemo(() => orders.filter(o => o.table === customer.table).sort((a,b) => b.id - a.id), [orders, customer.table]);
  const paidForTable = useMemo(() => payments.filter(p => p.table === customer.table), [payments, customer.table]);
  const detailItem = customer.detailItem ? findMenuItem(customer.detailItem) : null;
  const detailPrice = useMemo(() => {
    if (!detailItem) return 0;
    return detailItem.price * (customer.opts.qty || 1);
  }, [detailItem, customer.opts.qty]);

  function setCustomerPatch(patch){ setCustomer(prev => ({...prev, ...patch})); }
  function setCustomerOpts(patch){ setCustomer(prev => ({...prev, opts:{...prev.opts, ...patch}})); }

  function showToast(msg){
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }

  function custSetTab(tab){ setCustomerPatch({tab}); }
  function custSetCat(category){ setCustomerPatch({category, search:''}); }
  function custSearch(value){ setCustomerPatch({search:value}); }
  function custOpenItem(id){
    const item = findMenuItem(id);
    if (!item) return;
    const opts = {qty:1};
    if(item.sweet) opts.sweet='หวานปกติ';
    if(item.spicy) opts.spicy='เผ็ดปกติ';
    if(item.sauce) opts.sauce='ซอสมะเขือเทศ';
    setCustomer(prev => ({...prev, detailItem:id, opts}));
  }
  function custCloseItem(){ setCustomerPatch({detailItem:null}); }
  function custSetOpt(key, value){ setCustomerOpts({[key]: value}); }
  function custQty(delta){ setCustomerOpts({qty: Math.max(1, (customer.opts.qty || 1) + delta)}); }

  function custAddToCart() {
  if (!detailItem) return;

  const noteParts = [
    customer.opts.sweet,
    customer.opts.spicy,
    customer.opts.sauce,
  ].filter(Boolean);

  const newItem = {
    sku: detailItem.sku,          // เพิ่ม SKU
    id: detailItem.id,            // เพิ่ม id
    name: detailItem.name,
    price: detailItem.price,
    qty: customer.opts.qty || 1,
    note: noteParts.join(" · "),
  };

  setCustomer((prev) => ({
    ...prev,
    cart: [...prev.cart, newItem],
    detailItem: null,
    opts: {},
  }));

  showToast(`เพิ่ม "${detailItem.name}" ลงตะกร้าแล้ว`);
}

  function custRemoveCart(index){
    setCustomer(prev => ({...prev, cart: prev.cart.filter((_, i) => i !== index)}));
  }

  const orderSeq = useRef(2);
  function custConfirmOrder(){
    if (!customer.cart.length) return;
    orderSeq.current += 1;
    const nextId = orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    const nextOrder = {
      id: nextId,
      dispId: '#' + String(orderSeq.current).padStart(4, '0'),
      table: customer.table,
      time: new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}),
      status:'queue',
      paid:false,
      items: customer.cart.map(it => ({name:it.name, note:it.note, price:it.price, qty:it.qty})),
    };
    setOrders(prev => [...prev, nextOrder]);
    setCustomer(prev => ({...prev, cart: [], tab:'status'}));
    showToast('ส่งออเดอร์เข้าครัวแล้ว 🎉');
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
                <div className="phone-content">
                  {customer.tab === 'menu' ? (
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
                  ) : null}
                  {customer.tab === 'cart' ? (
                    <CustomerCartTab
                      customer={customer}
                      cartTotal={cartTotal}
                      money={money}
                      onSetTab={custSetTab}
                      onRemoveCart={custRemoveCart}
                      onConfirmOrder={custConfirmOrder}
                    />
                  ) : null}
                  {customer.tab === 'status' ? <CustomerStatusTab myOrders={myOrders} money={money} /> : null}
                  {customer.tab === 'history' ? <CustomerHistoryTab paidForTable={paidForTable} money={money} /> : null}
                </div>
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
