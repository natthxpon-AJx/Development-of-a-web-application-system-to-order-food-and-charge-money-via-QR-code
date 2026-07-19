<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ร้านชาแมกไม้ — ลูกค้า</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@500;600;700&family=Sarabun:wght@400;500;600;700&family=Space+Mono&display=swap" rel="stylesheet">
<style>
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
  .phone{
    width:380px;background:var(--paper);border-radius:34px;border:8px solid var(--navy-900);
    box-shadow:0 20px 45px -18px rgba(17,24,39,0.45);overflow:hidden;position:relative;
  }
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
  .phone-tabbar{
    position:absolute;bottom:0;left:0;right:0;background:var(--paper);border-top:1px solid var(--line);
    display:flex;padding:8px 10px 12px;gap:6px;
  }
  .phone-tabbar button{
    flex:1;background:transparent;border:none;padding:8px 4px;border-radius:10px;font-size:11.5px;font-weight:700;color:var(--ink-soft);
    display:flex;flex-direction:column;align-items:center;gap:3px;
  }
  .phone-tabbar button.active{color:var(--amber-dark);background:#FBEEDB;}
  .phone-tabbar .ico{font-size:17px;}

  .search-box{
    display:flex;align-items:center;gap:8px;background:var(--paper);border:1px solid var(--line);border-radius:12px;
    padding:9px 12px;margin-bottom:12px;color:var(--ink-soft);font-size:13.5px;
  }
  .cat-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:6px;}
  .cat-scroll button{
    white-space:nowrap;border:1px solid var(--line);background:var(--paper);padding:7px 14px;border-radius:20px;font-size:13px;font-weight:600;color:var(--brown-800);
  }
  .cat-scroll button.active{background:var(--amber);color:#fff;border-color:var(--amber);}

  .menu-item{
    display:flex;justify-content:space-between;align-items:center;gap:10px;background:var(--yellow-card);border:1px solid #F4E9A8;
    border-radius:12px;padding:9px 12px;margin-bottom:9px;
  }
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
  .toast{
    position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:var(--brown-900);color:#fff;
    padding:12px 22px;border-radius:30px;font-size:13.5px;font-weight:600;box-shadow:0 10px 25px -10px rgba(0,0,0,0.4);z-index:200;
  }

  @media (max-width:900px){
    .phone{width:100%;border-radius:0;border-width:0;}
    .stage{padding:0;}
  }
</style>
</head>
<body>
<div id="app"></div>

<script>
/* ============================= DATA ============================= */
let MENU = {
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

let orderSeq = 2;
let orders = [
  {id:1, dispId:'#0001', table:5, time:'18:20', status:'done', paid:false,
    items:[
      {name:'ชาเขียวมัจฉะ', note:'หวานปกติ', price:40, qty:1},
      {name:'ไส้กรอกแดง', note:'ซอสมะเขือเทศ', price:35, qty:1},
    ]},
];
let payments = [
  {table:2, amount:80, method:'qr', time:'18:05', items:[{name:'มาม่าต้มยำน้ำข้น',qty:1,price:50},{name:'ไมโล',qty:1,price:30}]},
  {table:5, amount:160, method:'cash', time:'18:30', items:[{name:'ชาไทย',qty:1,price:35},{name:'นมน้ำตาล',qty:1,price:25},{name:'ข้าวไข่เจียวไก่สับ',qty:1,price:25},{name:'ชาเขียวมัจฉะ',qty:1,price:40},{name:'ไส้กรอกแดง',qty:1,price:35}]},
];

/* ============================= STATE ============================= */
let state = {
  toast: null,
  customer: { table:5, tab:'menu', category:'เครื่องดื่ม', search:'', cart:[], detailItem:null, opts:{} },
};

function setState(patch){ state = {...state, ...patch}; render(); }
function showToast(msg){ state.toast = msg; render(); setTimeout(()=>{ state.toast=null; render(); }, 1800); }
function money(n){ return '฿' + n.toLocaleString('th-TH', {minimumFractionDigits: n%1? 2:0}); }

/* ============================= CUSTOMER LOGIC ============================= */
function custCartTotal(){ return state.customer.cart.reduce((s,c)=>s+c.price*c.qty,0); }

function renderCustomer(){
  const c = state.customer;
  return `
  <div class="phone-wrap">
    <div class="phone">
      <div class="phone-screen">
        ${custHeader()}
        <div class="phone-content">
          ${c.tab==='menu' ? custMenuTab() : ''}
          ${c.tab==='cart' ? custCartTab() : ''}
          ${c.tab==='status' ? custStatusTab() : ''}
          ${c.tab==='history' ? custHistoryTab() : ''}
        </div>
        ${custTabbar()}
      </div>
      ${c.detailItem ? custDetailSheet() : ''}
    </div>
  </div>`;
}

function custHeader(){
  const c = state.customer;
  const titles = {menu:'ร้านชาแมกไม้', cart:'ตะกร้าของฉัน', status:'สถานะออเดอร์', history:'ประวัติการสั่งซื้อ'};
  return `
  <div class="phone-header">
    <div class="row1">
      <div class="left-group">
        <div class="shopname">${titles[c.tab]}</div>
        <div class="table-chip">โต๊ะ ${c.table}</div>
      </div>
      <div class="header-actions">
        <button class="header-action ${c.tab==='cart'?'active':''}" onclick="custSetTab('cart')">🧺 ตะกร้า${c.cart.length?` (${c.cart.length})`:''}</button>
        <button class="header-action ${c.tab==='history'?'active':''}" onclick="custSetTab('history')">📜 ประวัติ</button>
      </div>
    </div>
  </div>`;
}

function custMenuTab(){
  const c = state.customer;
  const cats = Object.keys(MENU);
  const items = MENU[c.category].filter(it => it.name.includes(c.search));
  return `
  <div class="search-box">
    <span>🔍</span>
    <input oninput="custSearch(this.value)" value="${c.search}" placeholder="ค้นหาเมนู..." style="border:none;background:transparent;outline:none;flex:1;font-family:inherit;font-size:13.5px;">
  </div>
  <div class="cat-scroll">
    ${cats.map(cat=>`<button class="${cat===c.category?'active':''}" onclick="custSetCat('${cat}')">${CAT_EMOJI[cat]||''} ${cat}</button>`).join('')}
  </div>
  <div>
    ${items.length? items.map(it=>custMenuRow(it)).join('') : `<div class="empty-state"><div class="glyph">🍽️</div>ไม่พบเมนูที่ค้นหา</div>`}
  </div>`;
}

const CAT_EMOJI = {"เครื่องดื่ม":'🥤',"ของทานเล่น":'🍟',"ขนมปัง":'🍞',"อาหาร":'🍚',"ผลไม้":'🥭'};
function custMenuRow(it){
  const disabled = !it.active;
  const emoji = CAT_EMOJI[state.customer.category] || '🍽️';
  return `
  <div class="menu-item ${disabled?'soldout':''}">
    <div class="mi-left">
      <div class="mi-thumb">${emoji}</div>
      <div>
        <div class="mi-name">${it.name}</div>
        <div class="mi-price">${money(it.price)}</div>
        ${disabled?'<div style="font-size:11px;color:var(--clay);font-weight:700;margin-top:2px;">หมดชั่วคราว</div>':''}
      </div>
    </div>
    <button class="add-mini" ${disabled?'disabled':''} onclick="custOpenItem('${it.id}')">+</button>
  </div>`;
}

function custDetailSheet(){
  const c = state.customer;
  const it = findMenuItem(c.detailItem);
  if(!it) return '';
  const o = c.opts;
  return `
  <div style="position:absolute;inset:0;background:rgba(44,33,24,0.45);display:flex;align-items:flex-end;z-index:60;" onclick="if(event.target===this) custCloseItem()">
    <div style="background:var(--paper);width:100%;border-radius:20px 20px 0 0;padding:20px 18px 22px;max-height:88%;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
        <div>
          <div style="font-weight:700;font-size:19px;">${it.name}</div>
          <div class="mi-price" style="font-size:15px;margin-top:3px;">${money(it.price)}</div>
        </div>
        <button onclick="custCloseItem()" style="border:none;background:var(--cream-100);width:30px;height:30px;border-radius:50%;font-size:15px;">✕</button>
      </div>
      <hr class="divider">
      ${it.sweet? `
      <div style="margin-bottom:16px;">
        <div style="font-weight:700;font-size:13.5px;margin-bottom:8px;">ระดับความหวาน</div>
        <div class="pill-group">
          ${['หวานน้อย','หวานปกติ','หวานมาก'].map(v=>`<button class="pill ${o.sweet===v?'active':''}" onclick="custSetOpt('sweet','${v}')">${v}</button>`).join('')}
        </div>
      </div>`:''}
      ${it.spicy? `
      <div style="margin-bottom:16px;">
        <div style="font-weight:700;font-size:13.5px;margin-bottom:8px;">ระดับความเผ็ด</div>
        <div class="pill-group">
          ${['ไม่เผ็ด','เผ็ดน้อย','เผ็ดปกติ','เผ็ดมาก'].map(v=>`<button class="pill ${o.spicy===v?'active':''}" onclick="custSetOpt('spicy','${v}')">${v}</button>`).join('')}
        </div>
      </div>`:''}
      ${it.sauce? `
      <div style="margin-bottom:16px;">
        <div style="font-weight:700;font-size:13.5px;margin-bottom:8px;">เลือกซอส</div>
        <div class="pill-group">
          ${['ซอสมะเขือเทศ','ซอสพริก'].map(v=>`<button class="pill ${o.sauce===v?'active':''}" onclick="custSetOpt('sauce','${v}')">${v}</button>`).join('')}
        </div>
      </div>`:''}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
        <div style="font-weight:700;font-size:13.5px;">จำนวน</div>
        <div class="qty-stepper">
          <button onclick="custQty(-1)">−</button>
          <span style="min-width:16px;text-align:center;font-weight:700;">${o.qty||1}</span>
          <button onclick="custQty(1)">+</button>
        </div>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:18px;padding:13px;" onclick="custAddToCart()">
        เพิ่มลงตะกร้า · ${money(custDetailPrice())}
      </button>
    </div>
  </div>`;
}

function findMenuItem(id){ for(const k in MENU){ const f=MENU[k].find(x=>x.id===id); if(f) return {...f, category:k}; } return null; }

function custDetailPrice(){
  const it = findMenuItem(state.customer.detailItem);
  const qty = state.customer.opts.qty||1;
  return it ? it.price*qty : 0;
}

function custCartTab(){
  const c = state.customer;
  if(!c.cart.length){
    return `<div class="empty-state"><div class="glyph">🧺</div>ยังไม่มีสินค้าในตะกร้า<br><button class="btn btn-ghost" style="margin-top:14px;" onclick="custSetTab('menu')">ไปเลือกเมนู</button></div>`;
  }
  return `
  <div>
    ${c.cart.map((it,i)=>`
      <div class="cart-row">
        <div>
          <div class="cn">${it.name} ${it.qty>1?`×${it.qty}`:''}</div>
          <div class="cs">${it.note||''}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          <div class="cp">${money(it.price*it.qty)}</div>
          <button onclick="custRemoveCart(${i})" style="border:none;background:none;color:var(--clay);font-size:11.5px;font-weight:700;">ลบ</button>
        </div>
      </div>`).join('')}
  </div>
  <div style="margin-top:16px;display:flex;justify-content:space-between;font-weight:700;font-size:15px;">
    <span>ยอดรวม</span><span>${money(custCartTotal())}</span>
  </div>
  <button class="btn btn-primary btn-block" style="margin-top:14px;padding:13px;" onclick="custConfirmOrder()">ยืนยันรายการ</button>
  `;
}

function custStatusTab(){
  const c = state.customer;
  const myOrders = orders.filter(o=>o.table===c.table).sort((a,b)=>b.id-a.id);
  if(!myOrders.length) return `<div class="empty-state"><div class="glyph">🧾</div>ยังไม่มีออเดอร์ที่กำลังดำเนินการ</div>`;
  const labels = {queue:['รอคิว','badge-queue'], cooking:['กำลังทำ','badge-cooking'], done:['เสร็จแล้ว','badge-done']};
  return myOrders.map(o=>`
    <div class="status-block">
      <div class="sh">
        <div style="font-weight:700;font-size:13.5px;">ออเดอร์ ${o.dispId} · ${o.time}</div>
        <span class="badge ${labels[o.status][1]}">${labels[o.status][0]}</span>
      </div>
      ${o.items.map(it=>`<div style="font-size:13px;display:flex;justify-content:space-between;padding:3px 0;"><span>${it.name} ${it.note?`(${it.note})`:''} ×${it.qty}</span><span>${money(it.price*it.qty)}</span></div>`).join('')}
      ${o.paid? `<div style="margin-top:8px;font-size:11.5px;color:var(--jade);font-weight:700;">✓ ชำระเงินแล้ว</div>` : `<div style="margin-top:8px;font-size:11.5px;color:var(--ink-soft);">หากต้องการเช็คบิล กรุณาไปที่เคาน์เตอร์แคชเชียร์</div>`}
    </div>`).join('');
}

function custHistoryTab(){
  const c = state.customer;
  const paidForTable = payments.filter(p=>p.table===c.table);
  if(!paidForTable.length) return `<div class="empty-state"><div class="glyph">📜</div>ยังไม่มีประวัติการสั่งซื้อ</div>`;
  return paidForTable.map(p=>`
    <div class="status-block">
      <div class="sh"><div style="font-weight:700;font-size:13.5px;">บิลโต๊ะ ${p.table} · ${p.time}</div><span class="badge badge-done">${p.method==='qr'?'จ่ายผ่าน QR':'เงินสด'}</span></div>
      ${p.items.map(it=>`<div style="font-size:13px;display:flex;justify-content:space-between;padding:3px 0;"><span>${it.name} ×${it.qty}</span><span>${money(it.price*it.qty)}</span></div>`).join('')}
      <div style="margin-top:6px;font-weight:700;display:flex;justify-content:space-between;"><span>ยอดรวม</span><span>${money(p.amount)}</span></div>
    </div>`).join('');
}

function custTabbar(){
  const c = state.customer;
  const items = [['menu','🍜','เมนู'],['status','🧾','สถานะ']];
  return `<div class="phone-tabbar">
    ${items.map(([k,ico,label])=>`<button class="${c.tab===k?'active':''}" onclick="custSetTab('${k}')"><span class="ico">${ico}</span>${label}</button>`).join('')}
  </div>`;
}

function custSetTab(t){ state.customer.tab=t; render(); }
function custSetCat(cat){ state.customer.category=cat; render(); }
function custSearch(v){ state.customer.search=v; render(); }
function custOpenItem(id){
  const it = findMenuItem(id);
  const opts = {qty:1};
  if(it.sweet) opts.sweet='หวานปกติ';
  if(it.spicy) opts.spicy='เผ็ดปกติ';
  if(it.sauce) opts.sauce='ซอสมะเขือเทศ';
  state.customer.detailItem = id; state.customer.opts = opts; render();
}
function custCloseItem(){ state.customer.detailItem=null; render(); }
function custSetOpt(k,v){ state.customer.opts[k]=v; render(); }
function custQty(d){ const o=state.customer.opts; o.qty=Math.max(1,(o.qty||1)+d); render(); }
function custAddToCart(){
  const it = findMenuItem(state.customer.detailItem);
  const o = state.customer.opts;
  const noteParts = [o.sweet,o.spicy,o.sauce].filter(Boolean);
  state.customer.cart.push({name:it.name, price:it.price, qty:o.qty||1, note:noteParts.join(' · ')});
  state.customer.detailItem=null;
  showToast(`เพิ่ม "${it.name}" ลงตะกร้าแล้ว`);
}
function custRemoveCart(i){ state.customer.cart.splice(i,1); render(); }
function custConfirmOrder(){
  const c = state.customer;
  if(!c.cart.length) return;
  orderSeq++;
  const id = orders.length? Math.max(...orders.map(o=>o.id))+1 : 1;
  orders.push({
    id, dispId:'#'+String(orderSeq).padStart(4,'0'), table:c.table,
    time:new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}),
    status:'queue', paid:false,
    items: c.cart.map(it=>({name:it.name, note:it.note, price:it.price, qty:it.qty}))
  });
  c.cart = [];
  c.tab = 'status';
  showToast('ส่งออเดอร์เข้าครัวแล้ว 🎉');
}

/* ============================= ROOT RENDER ============================= */
function render(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="stage"><div class="stage-inner">${renderCustomer()}</div></div>
    ${state.toast? `<div class="toast">${state.toast}</div>` : ''}
  `;
}

render();
</script>
</body>
</html>