<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ร้านชาแมกไม้ — ระบบครัว</title>
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
  .app-body.dark{background:var(--navy-900);}
  .app-body.dark .ticket{background:#1F2937;border-color:#374151;}
  .app-body.dark .ticket .thead{border-bottom-color:#374151;color:#F3F4F6;}
  .app-body.dark .ticket .item-row{color:#E5E7EB;}
  .app-body.dark .ticket .item-row .note{color:#9CA3AF;}
  .app-body.dark .muted{color:#9CA3AF;}

  .ticket{background:var(--paper);border:1px solid var(--line);border-radius:12px;position:relative;padding:14px 14px 14px 16px;box-shadow:0 4px 10px -6px rgba(17,24,39,0.15);border-left:4px solid var(--amber);}
  .ticket.st-cooking{border-left-color:var(--clay);}
  .ticket.st-done{border-left-color:var(--jade);}
  .ticket .thead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--line);}
  .ticket .thead .tnum{font-family:'Space Mono',monospace;font-size:12px;color:var(--ink-soft);}
  .ticket .thead .ttable{font-weight:700;font-size:15px;}
  .ticket .item-row{display:flex;justify-content:space-between;font-size:14px;padding:4px 0;}
  .ticket .item-row .note{color:var(--ink-soft);font-size:12.5px;}

  .badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:20px;}
  .badge-queue{background:#F3E7D2;color:#8A5A16;}
  .badge-cooking{background:#FBE4D9;color:var(--clay);}
  .badge-done{background:var(--jade-bg);color:var(--jade);}

  .btn{border:none;border-radius:10px;padding:10px 16px;font-weight:700;font-size:13.5px;transition:transform .08s ease;}
  .btn:active{transform:scale(0.97);}
  .btn-primary{background:var(--amber);color:#fff;}
  .btn-primary:hover{background:var(--amber-dark);}
  .btn-jade{background:var(--jade);color:#fff;}
  .btn-block{width:100%;}
  .btn-sm{padding:7px 12px;font-size:12.5px;border-radius:8px;}

  .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:var(--brown-900);color:#fff;padding:12px 22px;border-radius:30px;font-size:13.5px;font-weight:600;box-shadow:0 10px 25px -10px rgba(0,0,0,0.4);z-index:200;}
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

let state = { toast: null };

function showToast(msg){ state.toast = msg; render(); setTimeout(()=>{ state.toast=null; render(); }, 1800); }

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

function renderKitchen(){
  const active = orders.filter(o=>o.status!=='done').concat(orders.filter(o=>o.status==='done').slice(-4).reverse());
  const sorted = active.sort((a,b)=> (a.status==='done')-(b.status==='done') || a.id-b.id);
  return appWindow('Kitchen Display System (ครัว)', `
    <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(210px,1fr));gap:14px;">
      ${sorted.length? sorted.map(o=>kitchenTicket(o)).join('') : `<div class="muted" style="font-size:13px;padding:10px 0;">ไม่มีออเดอร์เข้ามาในขณะนี้</div>`}
    </div>
  `, true, [{icon:'🔥',label:'ครัว',active:false},{icon:'🍳',label:'ออเดอร์',active:true},{icon:'📋',label:'ประวัติ',active:false}]);
}
function kitchenTicket(o){
  const labels = {queue:['รอคิว','badge-queue'], cooking:['กำลังทำ','badge-cooking'], done:['เสร็จแล้ว','badge-done']};
  return `
  <div class="ticket st-${o.status}">
    <div class="thead">
      <span class="ttable">โต๊ะ ${o.table}</span>
      <span class="tnum">${o.time}</span>
    </div>
    <div class="badge ${labels[o.status][1]}" style="margin-bottom:8px;">${labels[o.status][0]} · ${o.dispId}</div>
    ${o.items.map(it=>`<div class="item-row"><span>${it.name} ${it.note?`<span class="note">(${it.note})</span>`:''}</span><span>×${it.qty}</span></div>`).join('')}
    ${o.status==='queue' ? `<button class="btn btn-primary btn-block btn-sm" style="margin-top:10px;" onclick="kitchenAdvance(${o.id})">รับออเดอร์</button>` : ''}
    ${o.status==='cooking' ? `<button class="btn btn-jade btn-block btn-sm" style="margin-top:10px;" onclick="kitchenAdvance(${o.id})">เสร็จสิ้น</button>` : ''}
  </div>`;
}
function kitchenAdvance(id){
  const o = orders.find(x=>x.id===id);
  if(o.status==='queue'){ o.status='cooking'; showToast(`รับออเดอร์ ${o.dispId} แล้ว`); }
  else if(o.status==='cooking'){ o.status='done'; showToast(`ออเดอร์ ${o.dispId} เสร็จแล้ว 🍳`); }
  render();
}

function render(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="stage"><div class="stage-inner">${renderKitchen()}</div></div>
    ${state.toast? `<div class="toast">${state.toast}</div>` : ''}
  `;
}
render();
</script>
</body>
</html>