import React, { useEffect, useMemo, useRef, useState } from "react";

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

  #app{min-height:100vh;display:flex;flex-direction:column;}
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

const MENU = {
  "เครื่องดื่ม": [
    {id:'d1',name:'ชาไทย',price:30,sweet:true,active:true},
    {id:'d2',name:'ชาเขียว',price:30,sweet:true,active:true},
    {id:'d3',name:'ชาเขียวมัจฉะ',price:40,sweet:true,active:true},
    {id:'d4',name:'ไมโล',price:30,sweet:true,active:true},
    {id:'d5',name:'โอวัลติน',price:30,sweet:true,active:true},
    {id:'d6',name:'นมชมพู',price:30,sweet:true,active:true},
  ],
  "ของทานเล่น": [
    {id:'s1',name:'กรอบโปะ',price:30,sauce:true,active:true},
    {id:'s2',name:'เฟรนช์ฟราย',price:35,sauce:true,active:true},
    {id:'s3',name:'ไส้กรอกแดง',price:35,sauce:true,active:true},
    {id:'s4',name:'ไส้กรอกไก่',price:40,sauce:true,active:true},
    {id:'s5',name:'ไส้กรอกอีสาน',price:40,sauce:true,active:true},
    {id:'s6',name:'นักเก็ต',price:40,sauce:true,active:true},
  ],
  "ขนมปัง": [
    {id:'b1',name:'นมน้ำตาล',price:25,active:true},
    {id:'b2',name:'นมไมโล',price:25,active:true},
    {id:'b3',name:'นูเทลลา',price:35,active:true},
    {id:'b4',name:'พริกเผาไก่หยอง',price:35,active:true},
    {id:'b5',name:'พิซซ่าปูอัดชีส',price:40,active:true},
    {id:'b6',name:'เนยกระเทียมชีส',price:40,active:true},
  ],
  "อาหาร": [
    {id:'f1',name:'ข้าวไข่เจียวไก่สับ',price:35,sauce:true,active:true},
    {id:'f2',name:'ข้าวไข่เจียวมาม่า',price:35,active:true},
    {id:'f3',name:'ข้าวไก่ทอดเทอริยากิ',price:50,active:true},
    {id:'f4',name:'มาม่าต้มยำน้ำข้น',price:50,spicy:true,active:true},
    {id:'f5',name:'มาม่าเส้นหมี่น้ำใส',price:35,active:true},
    {id:'f6',name:'ควกต้มโคล้ง',price:50,active:true},
    {id:'f7',name:'โซดาต้มยำ',price:50,spicy:true,active:true},
    {id:'f8',name:'มาม่าเผ็ด',price:65,spicy:true,active:true},
    {id:'f9',name:'ข้าวเปล่า',price:10,active:true},
  ],
  "ผลไม้": [
    {id:'p1',name:'มะม่วงทรงเครื่อง',price:35,active:true},
  ]
};

const CAT_EMOJI = {"เครื่องดื่ม":"🥤","ของทานเล่น":"🍟","ขนมปัง":"🍞","อาหาร":"🍚","ผลไม้":"🥭"};

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
  for(const category in MENU){
    const item = MENU[category].find(x=>x.id===id);
    if(item) return {...item, category};
  }
  return null;
}

export default function Customer(){
  const [orders, setOrders] = useState(initialOrders);
  const [payments, setPayments] = useState(initialPayments);
  const [customer, setCustomer] = useState({
    table:5,
    tab:'menu',
    category:'เครื่องดื่ม',
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
    return MENU[customer.category].filter(it => it.name.includes(customer.search));
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

  function custAddToCart(){
    if (!detailItem) return;
    const noteParts = [customer.opts.sweet, customer.opts.spicy, customer.opts.sauce].filter(Boolean);
    const newItem = {
      name: detailItem.name,
      price: detailItem.price,
      qty: customer.opts.qty || 1,
      note: noteParts.join(' · '),
    };
    setCustomer(prev => ({...prev, cart:[...prev.cart, newItem], detailItem:null, opts:{}}));
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

  function appWindow(title, body, dark, sidebarIcons){
    return (
      <div className="app-window">
        <div className="app-titlebar">
          <div className="tleft"><span className="dot"></span>CM · {title}</div>
          <div className="online">Online</div>
        </div>
        <div className="app-flex">
          <div className="app-sidebar">
            {sidebarIcons.map(i => (
              <button key={i.label} className={i.active ? 'active' : ''} type="button" title={i.label || ''}>{i.icon}</button>
            ))}
          </div>
          <div className="app-body-wrap"><div className={`app-body ${dark ? 'dark' : ''}`}>{body}</div></div>
        </div>
      </div>
    );
  }

  function custHeader(){
    const titles = {menu:'ร้านชาแมกไม้', cart:'ตะกร้าของฉัน', status:'สถานะออเดอร์', history:'ประวัติการสั่งซื้อ'};
    return (
      <div className="phone-header">
        <div className="row1">
          <div className="left-group">
            <div className="shopname">{titles[customer.tab]}</div>
            <div className="table-chip">โต๊ะ {customer.table}</div>
          </div>
          <div className="header-actions">
            <button type="button" className={`header-action ${customer.tab==='cart' ? 'active' : ''}`} onClick={() => custSetTab('cart')}>🧺 ตะกร้า{customer.cart.length ? ` (${customer.cart.length})` : ''}</button>
            <button type="button" className={`header-action ${customer.tab==='history' ? 'active' : ''}`} onClick={() => custSetTab('history')}>📜 ประวัติ</button>
          </div>
        </div>
      </div>
    );
  }

  function custMenuTab(){
    return (
      <>
        <div className="search-box">
          <span>🔍</span>
          <input type="text" onChange={e => custSearch(e.target.value)} value={customer.search} placeholder="ค้นหาเมนู..." style={{border:'none',background:'transparent',outline:'none',flex:1,fontFamily:'inherit',fontSize:13.5}} />
        </div>
        <div className="cat-scroll">
          {Object.keys(MENU).map(cat => (
            <button key={cat} type="button" className={cat===customer.category ? 'active' : ''} onClick={() => custSetCat(cat)}>{CAT_EMOJI[cat] || ''} {cat}</button>
          ))}
        </div>
        <div>
          {filteredItems.length ? filteredItems.map(it => (
            <div key={it.id} className={`menu-item ${!it.active ? 'soldout' : ''}`}>
              <div className="mi-left">
                <div className="mi-thumb">{CAT_EMOJI[customer.category] || '🍽️'}</div>
                <div>
                  <div className="mi-name">{it.name}</div>
                  <div className="mi-price">{money(it.price)}</div>
                  {!it.active ? <div style={{fontSize:11,color:'var(--clay)',fontWeight:700,marginTop:2}}>หมดชั่วคราว</div> : null}
                </div>
              </div>
              <button type="button" className="add-mini" disabled={!it.active} onClick={() => custOpenItem(it.id)}>+</button>
            </div>
          )) : (
            <div className="empty-state"><div className="glyph">🍽️</div>ไม่พบเมนูที่ค้นหา</div>
          )}
        </div>
      </>
    );
  }

  function custCartTab(){
    if (!customer.cart.length){
      return (
        <div className="empty-state">
          <div className="glyph">🧺</div>ยังไม่มีสินค้าในตะกร้า
          <button type="button" className="btn btn-ghost" style={{marginTop:14}} onClick={() => custSetTab('menu')}>ไปเลือกเมนู</button>
        </div>
      );
    }
    return (
      <>
        <div>
          {customer.cart.map((it, index) => (
            <div key={index} className="cart-row">
              <div>
                <div className="cn">{it.name} {it.qty > 1 ? `×${it.qty}` : ''}</div>
                <div className="cs">{it.note || ''}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                <div className="cp">{money(it.price * it.qty)}</div>
                <button type="button" onClick={() => custRemoveCart(index)} style={{border:'none',background:'none',color:'var(--clay)',fontSize:11.5,fontWeight:700}}>ลบ</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:16,display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:15}}>
          <span>ยอดรวม</span><span>{money(cartTotal)}</span>
        </div>
        <button type="button" className="btn btn-primary btn-block" style={{marginTop:14,padding:13}} onClick={custConfirmOrder}>ยืนยันรายการ</button>
      </>
    );
  }

  function custStatusTab(){
    if (!myOrders.length){
      return (
        <div className="empty-state"><div className="glyph">🧾</div>ยังไม่มีออเดอร์ที่กำลังดำเนินการ</div>
      );
    }
    const labels = {queue:['รอคิว','badge-queue'], cooking:['กำลังทำ','badge-cooking'], done:['เสร็จแล้ว','badge-done']};
    return (
      <>
        {myOrders.map(o => (
          <div key={o.id} className="status-block">
            <div className="sh">
              <div style={{fontWeight:700,fontSize:13.5}}>ออเดอร์ {o.dispId} · {o.time}</div>
              <span className={`badge ${labels[o.status][1]}`}>{labels[o.status][0]}</span>
            </div>
            {o.items.map((it, idx) => (
              <div key={idx} style={{fontSize:13,display:'flex',justifyContent:'space-between',padding:'3px 0'}}>
                <span>{it.name} {it.note ? `(${it.note})` : ''} ×{it.qty}</span>
                <span>{money(it.price * it.qty)}</span>
              </div>
            ))}
            {o.paid ? (
              <div style={{marginTop:8,fontSize:11.5,color:'var(--jade)',fontWeight:700}}>✓ ชำระเงินแล้ว</div>
            ) : (
              <div style={{marginTop:8,fontSize:11.5,color:'var(--ink-soft)'}}>หากต้องการเช็คบิล กรุณาไปที่เคาน์เตอร์แคชเชียร์</div>
            )}
          </div>
        ))}
      </>
    );
  }

  function custHistoryTab(){
    if (!paidForTable.length){
      return (
        <div className="empty-state"><div className="glyph">📜</div>ยังไม่มีประวัติการสั่งซื้อ</div>
      );
    }
    return (
      <>
        {paidForTable.map((p, index) => (
          <div key={index} className="status-block">
            <div className="sh"><div style={{fontWeight:700,fontSize:13.5}}>บิลโต๊ะ {p.table} · {p.time}</div><span className="badge badge-done">{p.method === 'qr' ? 'จ่ายผ่าน QR' : 'เงินสด'}</span></div>
            {p.items.map((it, idx) => (
              <div key={idx} style={{fontSize:13,display:'flex',justifyContent:'space-between',padding:'3px 0'}}>
                <span>{it.name} ×{it.qty}</span><span>{money(it.price * it.qty)}</span>
              </div>
            ))}
            <div style={{marginTop:6,fontWeight:700,display:'flex',justifyContent:'space-between'}}><span>ยอดรวม</span><span>{money(p.amount)}</span></div>
          </div>
        ))}
      </>
    );
  }

  function custTabbar(){
    const tabs = [['menu','🍜','เมนู'],['status','🧾','สถานะ']];
    return (
      <div className="phone-tabbar">
        {tabs.map(([key, icon, label]) => (
          <button key={key} type="button" className={customer.tab===key ? 'active' : ''} onClick={() => custSetTab(key)}>
            <span className="ico">{icon}</span>{label}
          </button>
        ))}
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
                {custHeader()}
                <div className="phone-content">
                  {customer.tab === 'menu' ? custMenuTab() : null}
                  {customer.tab === 'cart' ? custCartTab() : null}
                  {customer.tab === 'status' ? custStatusTab() : null}
                  {customer.tab === 'history' ? custHistoryTab() : null}
                </div>
                {custTabbar()}
              </div>
              {customer.detailItem ? (
                <div style={{position:'absolute',inset:0,background:'rgba(44,33,24,0.45)',display:'flex',alignItems:'flex-end',zIndex:60}} onClick={e => { if (e.target === e.currentTarget) custCloseItem(); }}>
                  <div style={{background:'var(--paper)',width:'100%',borderRadius:'20px 20px 0 0',padding:'20px 18px 22px',maxHeight:'88%',overflowY:'auto'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:19}}>{detailItem.name}</div>
                        <div className="mi-price" style={{fontSize:15,marginTop:3}}>{money(detailItem.price)}</div>
                      </div>
                      <button type="button" onClick={custCloseItem} style={{border:'none',background:'var(--cream-100)',width:30,height:30,borderRadius:'50%',fontSize:15}}>✕</button>
                    </div>
                    <hr className="divider" />
                    {detailItem.sweet ? (
                      <div style={{marginBottom:16}}>
                        <div style={{fontWeight:700,fontSize:13.5,marginBottom:8}}>ระดับความหวาน</div>
                        <div className="pill-group">
                          {['หวานน้อย','หวานปกติ','หวานมาก'].map(value => (
                            <button key={value} type="button" className={`pill ${customer.opts.sweet===value ? 'active' : ''}`} onClick={() => custSetOpt('sweet', value)}>{value}</button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {detailItem.spicy ? (
                      <div style={{marginBottom:16}}>
                        <div style={{fontWeight:700,fontSize:13.5,marginBottom:8}}>ระดับความเผ็ด</div>
                        <div className="pill-group">
                          {['ไม่เผ็ด','เผ็ดน้อย','เผ็ดปกติ','เผ็ดมาก'].map(value => (
                            <button key={value} type="button" className={`pill ${customer.opts.spicy===value ? 'active' : ''}`} onClick={() => custSetOpt('spicy', value)}>{value}</button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {detailItem.sauce ? (
                      <div style={{marginBottom:16}}>
                        <div style={{fontWeight:700,fontSize:13.5,marginBottom:8}}>เลือกซอส</div>
                        <div className="pill-group">
                          {['ซอสมะเขือเทศ','ซอสพริก'].map(value => (
                            <button key={value} type="button" className={`pill ${customer.opts.sauce===value ? 'active' : ''}`} onClick={() => custSetOpt('sauce', value)}>{value}</button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}>
                      <div style={{fontWeight:700,fontSize:13.5}}>จำนวน</div>
                      <div className="qty-stepper">
                        <button type="button" onClick={() => custQty(-1)}>−</button>
                        <span style={{minWidth:16,textAlign:'center',fontWeight:700}}>{customer.opts.qty || 1}</span>
                        <button type="button" onClick={() => custQty(1)}>+</button>
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary btn-block" style={{marginTop:18,padding:13}} onClick={custAddToCart}>เพิ่มลงตะกร้า · {money(detailPrice)}</button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
