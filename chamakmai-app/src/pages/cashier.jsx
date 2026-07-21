<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ร้านชาแมกไม้ — ระบบคิดเงิน</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@500;600;700&family=Sarabun:wght@400;500;600;700&family=Space+Mono&display=swap" rel="stylesheet">
<style>
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

  #app{min-height:100vh;display:flex;flex-direction:column;}
  .stage{flex:1;padding:0;display:flex;justify-content:center;}
  .stage-inner{width:100%;max-width:100%;}

  /* ===== Desktop app titlebar ===== */
  .app-window{background:var(--paper);border-radius:0;overflow:hidden;display:flex;flex-direction:column;min-height:100vh;border:none;}
  .app-titlebar{background:var(--navy-800);color:#F3F4F6;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;}
  .app-titlebar .tleft{display:flex;align-items:center;gap:10px;font-weight:600;font-size:14.5px;}
  .app-titlebar .dot{width:9px;height:9px;border-radius:50%;background:var(--amber);}
  .app-titlebar .online{font-size:11px;background:var(--jade);color:#fff;padding:3px 9px;border-radius:20px;font-weight:600;display:flex;align-items:center;gap:5px;}
  .app-titlebar .online::before{content:'';width:6px;height:6px;border-radius:50%;background:#fff;}
  .app-flex{display:flex;flex:1;}
  .app-sidebar{width:58px;flex-shrink:0;background:var(--navy-900);display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px 0;}
  .app-sidebar button{width:38px;height:38px;border-radius:11px;border:none;background:transparent;color:#9CA3AF;font-size:17px;display:flex;align-items:center;justify-content:center;}
  .app-sidebar button.active{background:var(--amber);color:#fff;}
  .app-body-wrap{flex:1;min-width:0;}
  .app-body{padding:20px 22px 26px;}

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
  .table-tile{border-radius:14px;padding:16px 12px;text-align:center;border:1px solid var(--line);background:var(--cream-050);}
  .table-tile .tt-num{font-weight:700;font-size:20px;}
  .table-tile .tt-status{font-size:11.5px;margin-top:6px;font-weight:700;}
  .table-tile.empty{color:var(--ink-soft);}
  .table-tile.active{background:var(--amber);border-color:var(--amber);color:#fff;cursor:pointer;}
  .table-tile.active .tt-status{color:#fff;}
  .table-tile.selected{outline:3px solid var(--amber);outline-offset:2px;}

  .kp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
  .kp-grid button{padding:14px 0;border-radius:10px;border:1px solid var(--line);background:var(--cream-050);font-weight:700;font-size:16px;}

  .qr-box{
    width:100%;aspect-ratio:1/1;max-width:210px;margin:14px auto;background:
    repeating-linear-gradient(0deg,#1a1a1a 0 8px, #fff 8px 16px),
    repeating-linear-gradient(90deg,#1a1a1a 0 8px, #fff 8px 16px);
    background-blend-mode:multiply;border:8px solid #fff;border-radius:8px;box-shadow:0 0 0 1px var(--line);
  }
  .empty-state{text-align:center;padding:50px 16px;color:var(--ink-soft);}
  .empty-state .glyph{font-size:34px;margin-bottom:10px;}
  .muted{color:var(--ink-soft);}

  .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:var(--brown-900);color:#fff;padding:12px 22px;border-radius:30px;font-size:13.5px;font-weight:600;box-shadow:0 10px 25px -10px rgba(0,0,0,0.4);z-index:200;}

  @media (max-width:900px){
    .table-grid{grid-template-columns:repeat(2,1fr);}
  }
</style>
</head>
<body>
<div id="app"></div>

<script>
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

let state = {
  toast: null,
  cashier: { selected: null, cash:'', mode:null },
};

function showToast(msg){ state.toast = msg; render(); setTimeout(()=>{ state.toast=null; render(); }, 1800); }
function money(n){ return '฿' + n.toLocaleString('th-TH', {minimumFractionDigits: n%1? 2:0}); }
function tableBill(table){
  const unpaid = orders.filter(o=>o.table===table && !o.paid);
  const items = [];
  unpaid.forEach(o=> o.items.forEach(it=> items.push(it)));
  const total = items.reduce((s,it)=> s + it.price*it.qty, 0);
  return {orders:unpaid, items, total};
}
function allTables(){ return [1,2,3,4,5,6,7,8]; }

function appWindow(title, body, dark, sidebarIcons){
  const icons = sidebarIcons || [{icon:'🏠',active:false}];
  return `
  <div class="app-window">
    <div class="app-titlebar">
      <div class="tleft"><span class="dot"></span>CM · ${title}</div>
      <div class="online">Online</div>
    </div>
    <div class="app-flex">
      <div class="app-sidebar">
        ${icons.map(i=>`<button class="${i.active?'active':''}" ${i.onclick?`onclick="${i.onclick}"`:''} title="${i.label||''}">${i.icon}</button>`).join('')}
      </div>
      <div class="app-body-wrap"><div class="app-body ${dark?'dark':''}">${body}</div></div>
    </div>
  </div>`;
}

function renderCashier(){
  const cs = state.cashier;
  const bill = cs.selected ? tableBill(cs.selected) : {items:[],total:0};
  return appWindow('Cashier / Point of Sale (แคชเชียร์)', `
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:22px;">
      <div>
        <div style="font-weight:700;margin-bottom:12px;">โต๊ะ</div>
        <div class="table-grid">
          ${allTables().map(t=>{
            const b = tableBill(t);
            const has = b.total>0;
            const sel = cs.selected===t;
            return `<div class="table-tile ${has?'active':'empty'} ${sel?'selected':''}" onclick="${has?`cashierSelect(${t})`:''}">
              <div class="tt-num">${t}</div>
              <div class="tt-status">${has? money(b.total) : 'ว่าง'}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div>
        <div class="card">
          ${cs.selected && bill.total>0 ? cashierBillPanel(cs, bill) : `<div class="empty-state" style="padding:30px 10px;"><div class="glyph">🧾</div>เลือกโต๊ะที่มีบิลเพื่อคิดเงิน</div>`}
        </div>
      </div>
    </div>
  `, false, [{icon:'🏠',label:'หน้าหลัก',active:false},{icon:'💳',label:'แคชเชียร์',active:true},{icon:'🧾',label:'ประวัติ',active:false}]);
}
function cashierBillPanel(cs, bill){
  if(cs.mode==='cash') return cashierCashView(cs, bill);
  if(cs.mode==='qr') return cashierQrView(cs, bill);
  return `
    <div style="font-weight:700;font-size:15px;margin-bottom:10px;">บิลโต๊ะ ${cs.selected}</div>
    ${bill.items.map(it=>`<div style="display:flex;justify-content:space-between;font-size:13.5px;padding:5px 0;border-bottom:1px solid var(--line);"><span>${it.name} ${it.note?`<span class="muted">(${it.note})</span>`:''} ×${it.qty}</span><span>${money(it.price*it.qty)}</span></div>`).join('')}
    <div style="display:flex;justify-content:space-between;font-weight:700;font-size:16px;margin-top:12px;">
      <span>ยอดสุทธิ</span><span>${money(bill.total)}</span>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px;">
      <button class="btn btn-dark" style="flex:1;" onclick="cashierMode('cash')">เงินสด</button>
      <button class="btn btn-primary" style="flex:1;" onclick="cashierMode('qr')">แสกนจ่าย</button>
    </div>
  `;
}

function cashierCashView(cs, bill){
  const received = parseInt(cs.cash||'0');
  const change = Math.max(0, received - bill.total);
  return `
    <div style="font-weight:700;font-size:15px;margin-bottom:4px;">รับเงินสด — โต๊ะ ${cs.selected}</div>
    <div class="muted" style="font-size:12.5px;margin-bottom:10px;">ยอดสุทธิ ${money(bill.total)}</div>
    <div style="text-align:center;font-family:'Space Mono',monospace;font-size:28px;font-weight:700;margin:10px 0;">฿${cs.cash||'0'}</div>
    <div class="kp-grid">
      ${[1,2,3,4,5,6,7,8,9].map(n=>`<button onclick="cashierKey('${n}')">${n}</button>`).join('')}
      <button onclick="cashierKeyClear()">ล้าง</button>
      <button onclick="cashierKey('0')">0</button>
      <button onclick="cashierExact(${bill.total})">พอดี</button>
    </div>
    <div style="display:flex;gap:8px;margin:10px 0;">
      ${[100,500,1000].map(v=>`<button class="btn btn-ghost btn-sm" style="flex:1;" onclick="cashierAdd(${v})">+${v}</button>`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:14px;">
      <span class="muted">เงินทอน</span><span style="font-weight:700;">${money(change)}</span>
    </div>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-ghost" style="flex:1;" onclick="cashierMode(null)">ย้อนกลับ</button>
      <button class="btn btn-jade" style="flex:1;" ${received<bill.total?'disabled':''} onclick="cashierComplete('cash', ${bill.total})">รับเงิน / เสร็จสิ้น</button>
    </div>
  `;
}
function cashierQrView(cs, bill){
  return `
    <div style="font-weight:700;font-size:15px;margin-bottom:4px;">สแกนจ่าย — โต๊ะ ${cs.selected}</div>
    <div class="muted" style="font-size:12.5px;">พร้อมเพย์ · ร้านชาแมกไม้</div>
    <div class="qr-box"></div>
    <div style="text-align:center;font-family:'Space Mono',monospace;font-size:22px;font-weight:700;">${money(bill.total)}</div>
    <div style="display:flex;gap:10px;margin-top:16px;">
      <button class="btn btn-ghost" style="flex:1;" onclick="cashierMode(null)">ย้อนกลับ</button>
      <button class="btn btn-jade" style="flex:1;" onclick="cashierComplete('qr', ${bill.total})">ชำระเงินสำเร็จ</button>
    </div>
  `;
}
function cashierSelect(t){ state.cashier.selected=t; state.cashier.mode=null; state.cashier.cash=''; render(); }
function cashierMode(m){ state.cashier.mode=m; state.cashier.cash=''; render(); }
function cashierKey(d){ state.cashier.cash=(state.cashier.cash||'')+d; render(); }
function cashierKeyClear(){ state.cashier.cash=''; render(); }
function cashierAdd(v){ state.cashier.cash=String(parseInt(state.cashier.cash||'0')+v); render(); }
function cashierExact(total){ state.cashier.cash=String(total); render(); }
function cashierComplete(method, total){
  const t = state.cashier.selected;
  const bill = tableBill(t);
  payments.push({table:t, amount: total, method, time:new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}), items: bill.items});
  bill.orders.forEach(o=> o.paid = true);
  state.cashier.selected=null; state.cashier.mode=null; state.cashier.cash='';
  showToast(`รับชำระเงินโต๊ะ ${t} เรียบร้อย ✓`);
}

function render(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="stage"><div class="stage-inner">${renderCashier()}</div></div>
    ${state.toast? `<div class="toast">${state.toast}</div>` : ''}
  `;
}
render();
</script>
</body>
</html>