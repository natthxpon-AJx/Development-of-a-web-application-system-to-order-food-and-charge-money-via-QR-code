
import React, { useEffect, useMemo, useRef, useState } from "react";

const styles = `
  :root{
    --brown-900:#3B2A1B; --brown-800:#5B4530; --brown-700:#6E5237;
    --cream-100:#F3F4F6; --cream-050:#FFFFFF; --paper:#FFFFFF;
    --amber:#D97706; --amber-dark:#B45F04;
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
  .stage{flex:1;padding:0;display:flex;justify-content:center;}
  .stage-inner{width:100%;max-width:100%;}

  /* ===== Desktop app titlebar ===== */
  .app-window{background:transparent;border-radius:0;overflow:hidden;display:flex;flex-direction:column;min-height:100vh;border:none;}
  .app-titlebar{background:var(--navy-800);color:#F3F4F6;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;}
  .app-titlebar .tleft{display:flex;align-items:center;gap:10px;font-weight:600;font-size:14.5px;}
  .app-titlebar .dot{width:9px;height:9px;border-radius:50%;background:var(--amber);}
  .app-titlebar .online{font-size:11px;background:var(--jade);color:#fff;padding:3px 9px;border-radius:20px;font-weight:600;display:flex;align-items:center;gap:5px;}
  .app-titlebar .online::before{content:'';width:6px;height:6px;border-radius:50%;background:#fff;}
  .app-flex{display:flex;flex:1;}
  .app-sidebar{width:58px;flex-shrink:0;background:var(--navy-900);display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px 0;}
  .app-sidebar button{width:38px;height:38px;border-radius:11px;border:none;background:transparent;color:#9CA3AF;font-size:17px;display:flex;align-items:center;justify-content:center;}
  .app-sidebar button.active{background:var(--amber);color:#fff;}
  .app-body-wrap{flex:1;min-width:0;background:#eef2f6;}
  .app-body{padding:20px 22px 26px;min-height:calc(100vh - 56px);background:transparent;}
  .app-body.dark{background:#eef2f6;}
  .app-body.dark .ticket{background:var(--paper);border-color:var(--line);}
  .app-body.dark .ticket .thead{border-bottom-color:var(--line);color:var(--ink);}
  .app-body.dark .ticket .item-row{color:var(--ink);}
  .app-body.dark .ticket .item-row .note{color:var(--ink-soft);}
  .app-body.dark .muted{color:var(--ink-soft);}

  .ticket{background:var(--paper);border:1px solid var(--line);border-radius:12px;position:relative;padding:14px 14px 14px 16px;box-shadow:0 4px 10px -6px rgba(17,24,39,0.15);border-left:4px solid var(--amber);}
  .ticket.st-cooking{border-left-color:var(--clay);}
  .ticket.st-done{border-left-color:var(--jade);}
  .ticket.table-5-card{border:3px solid var(--amber-dark);border-radius:0;box-shadow:inset 0 0 0 1px rgba(217,119,6,0.12);padding:18px 18px 18px 20px;margin:-1px;min-height:calc(100vh - 90px);display:flex;flex-direction:column;justify-content:flex-start;gap:10px;position:relative;overflow:hidden;}
  .ticket.table-5-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--amber);}
  .ticket.table-5-card.st-cooking::before{background:var(--clay);}
  .ticket.table-5-card.st-done::before{background:var(--jade);}
  .ticket.table-5-card .thead{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;padding-bottom:12px;border-bottom:2px solid var(--amber-dark);}
  .ticket.table-5-card .thead .tnum{font-family:'Space Mono',monospace;font-size:14px;color:var(--ink-soft);}
  .ticket.table-5-card .thead .ttable{font-weight:800;font-size:20px;color:var(--brown-900);}
  .ticket.table-5-card .badge-wrap{display:flex;justify-content:center;align-items:center;}
  .ticket.table-5-card .badge{font-size:13px;padding:6px 12px;align-self:center;display:inline-flex;justify-content:center;}
  .ticket.table-5-card .item-list{display:flex;flex-direction:column;gap:6px;flex:1;}
  .ticket.table-5-card .action-row{display:flex;justify-content:center;align-items:center;flex:1;min-height:72px;}
  .ticket.table-5-card .action-row .btn{width:72%;max-width:180px;margin:0;}
  .ticket.table-5-card .item-row{display:flex;justify-content:space-between;align-items:flex-start;font-size:16px;padding:8px 0;line-height:1.45;border-bottom:1px dashed var(--line);}
  .ticket.table-5-card .item-row:last-child{border-bottom:none;}
  .ticket.table-5-card .item-row .note{color:var(--ink-soft);font-size:14px;display:block;margin-top:2px;}

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
`;

const initialOrders = [
  {id:1, dispId:'#0001', table:5, time:'18:20', status:'done', paid:false,
    items:[
      {name:'ชาเขียวมัจฉะ', note:'หวานปกติ', price:40, qty:1},
      {name:'ไส้กรอกแดง', note:'ซอสมะเขือเทศ', price:35, qty:1},
    ]},
];

function money(n){ return '฿' + n.toLocaleString('th-TH', {minimumFractionDigits: n%1? 2:0}); }

export default function Kitchen(){
  const [orders, setOrders] = useState(initialOrders);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    document.title = 'ร้านชาแมกไม้ — ระบบครัว';
    if (!document.getElementById('cm-google-fonts')){
      const link = document.createElement('link');
      link.id = 'cm-google-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@500;600;700&family=Sarabun:wght@400;500;600;700&family=Space+Mono&display=swap';
      document.head.appendChild(link);
    }
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  const sortedOrders = useMemo(() => {
    const active = orders.filter(o => o.status !== 'done').concat(orders.filter(o => o.status === 'done').slice(-4).reverse());
    return [...active].sort((a,b) => (a.status === 'done') - (b.status === 'done') || a.id - b.id);
  }, [orders]);

  function showToast(msg){
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }

  function kitchenAdvance(id){
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      if (o.status === 'queue') return {...o, status:'cooking'};
      if (o.status === 'cooking') return {...o, status:'done'};
      return o;
    }));
    const order = orders.find(o => o.id === id);
    if (order){
      if (order.status === 'queue') showToast(`รับออเดอร์ ${order.dispId} แล้ว`);
      else if (order.status === 'cooking') showToast(`ออเดอร์ ${order.dispId} เสร็จแล้ว 🍳`);
    }
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

  const labels = {queue:['รอคิว','badge-queue'], cooking:['กำลังทำ','badge-cooking'], done:['เสร็จแล้ว','badge-done']};

  return (
    <div id="app">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {appWindow(
        'Kitchen Display System (ครัว)',
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(210px,1fr))',gap:14}}>
          {sortedOrders.length ? sortedOrders.map(o => (
            <div key={o.id} className={`ticket st-${o.status} ${o.table === 5 ? 'table-5-card' : ''}`}>
              <div className="thead">
                <span className="ttable">โต๊ะ {o.table}</span>
                <span className="tnum">{o.time}</span>
              </div>
              <div className="badge-wrap">
                <div className={`badge ${labels[o.status][1]}`} style={{marginBottom:8}}>{labels[o.status][0]} · {o.dispId}</div>
              </div>
              <div className={`item-list ${o.table === 5 ? 'item-list-compact' : ''}`}>
                {o.items.map((it, idx) => (
                  <div key={idx} className="item-row"><span>{it.name} {it.note ? <span className="note">({it.note})</span> : null}</span><span>×{it.qty}</span></div>
                ))}
              </div>
              {o.status === 'queue' ? <button type="button" className="btn btn-primary btn-block btn-sm" style={{marginTop:10}} onClick={() => kitchenAdvance(o.id)}>รับออเดอร์</button> : null}
              {o.status === 'cooking' ? (
                <div className="action-row">
                  <button type="button" className="btn btn-jade btn-block btn-sm" onClick={() => kitchenAdvance(o.id)}>เสร็จสิ้น</button>
                </div>
              ) : null}
            </div>
          )) : <div className="muted" style={{fontSize:13,padding:'10px 0'}}>ไม่มีออเดอร์เข้ามาในขณะนี้</div>}
        </div>,
        true,
        [
          {icon:'🔥', label:'ครัว', active:false},
          {icon:'🍳', label:'ออเดอร์', active:true},
          {icon:'📋', label:'ประวัติ', active:false},
        ]
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
