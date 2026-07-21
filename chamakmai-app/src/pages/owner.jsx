import React, { useEffect, useMemo, useRef, useState } from "react";

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
  .app-body-wrap{flex:1;min-width:0;}
  .app-body{padding:20px 22px 26px;}

  .subnav{display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap;}
  .subnav button{border:1px solid var(--line);background:var(--cream-050);color:var(--brown-800);padding:8px 16px;border-radius:10px;font-size:13.5px;font-weight:600;}
  .subnav button.active{background:var(--navy-800);color:#fff;border-color:var(--navy-800);}

  .card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px;}
  .btn{border:none;border-radius:10px;padding:10px 16px;font-weight:700;font-size:13.5px;transition:transform .08s ease;}
  .btn:active{transform:scale(0.97);}
  .btn-primary{background:var(--amber);color:#fff;}
  .btn-primary:hover{background:var(--amber-dark);}

  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
  .kpi{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px;}
  .kpi .kv{font-size:26px;font-weight:700;color:var(--navy-900);}
  .kpi .kl{font-size:12.5px;color:var(--ink-soft);margin-top:4px;}
  .period-toggle{display:flex;gap:4px;background:var(--cream-100);padding:4px;border-radius:10px;}
  .period-toggle button{border:none;background:transparent;padding:6px 14px;border-radius:8px;font-size:12.5px;font-weight:700;color:var(--brown-800);}
  .period-toggle button.active{background:var(--paper);box-shadow:0 1px 3px rgba(0,0,0,0.1);}

  .bar-row{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
  .bar-row .bl{width:70px;font-size:12.5px;color:var(--ink-soft);flex-shrink:0;}
  .bar-track{flex:1;background:var(--cream-100);border-radius:6px;height:10px;overflow:hidden;}
  .bar-fill{height:100%;background:linear-gradient(90deg,var(--amber),var(--gold));border-radius:6px;}
  .bar-row .bv{width:26px;text-align:right;font-size:12px;font-weight:700;color:var(--brown-800);}

  table.data{width:100%;border-collapse:collapse;font-size:13.5px;}
  table.data th{text-align:left;font-size:11.5px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.4px;padding:8px 10px;border-bottom:1px solid var(--line);}
  table.data td{padding:11px 10px;border-bottom:1px solid var(--line);}
  table.data tr:last-child td{border-bottom:none;}
  .toggle{width:38px;height:22px;border-radius:20px;background:var(--line);position:relative;border:none;flex-shrink:0;}
  .toggle.on{background:var(--jade);}
  .toggle .knob{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.15s;}
  .toggle.on .knob{left:18px;}
  .role-chip{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;}
  .role-chip.admin{background:#FBE4D9;color:var(--clay);}
  .role-chip.staff{background:var(--jade-bg);color:var(--jade);}

  .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
  .field label{display:block;font-size:12px;font-weight:700;color:var(--ink-soft);margin-bottom:5px;}
  .field input,.field select{width:100%;border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-family:inherit;font-size:13.5px;background:var(--cream-050);}

  .divider{border:none;border-top:1px solid var(--line);margin:16px 0;}
  .muted{color:var(--ink-soft);}
  .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:var(--brown-900);color:#fff;padding:12px 22px;border-radius:30px;font-size:13.5px;font-weight:600;box-shadow:0 10px 25px -10px rgba(0,0,0,0.4);z-index:200;}

  @media (max-width:900px){
    .kpi-grid{grid-template-columns:repeat(2,1fr);}
    .form-grid{grid-template-columns:1fr;}
  }
`;

const initialMenu = {
  "เครื่องดื่ม":[{id:'d1',name:'ชาไทย',price:30,sweet:true,active:true},{id:'d2',name:'ชาเขียว',price:30,sweet:true,active:true},{id:'d3',name:'ชาเขียวมัจฉะ',price:40,sweet:true,active:true},{id:'d4',name:'ไมโล',price:30,sweet:true,active:true},{id:'d5',name:'โอวัลติน',price:30,sweet:true,active:true},{id:'d6',name:'นมชมพู',price:30,sweet:true,active:true}],
  "ของทานเล่น":[{id:'s1',name:'กรอบโปะ',price:30,sauce:true,active:true},{id:'s2',name:'เฟรนช์ฟราย',price:35,sauce:true,active:true},{id:'s3',name:'ไส้กรอกแดง',price:35,sauce:true,active:true},{id:'s4',name:'ไส้กรอกไก่',price:40,sauce:true,active:true},{id:'s5',name:'ไส้กรอกอีสาน',price:40,sauce:true,active:true},{id:'s6',name:'นักเก็ต',price:40,sauce:true,active:true}],
  "ขนมปัง":[{id:'b1',name:'นมน้ำตาล',price:25,active:true},{id:'b2',name:'นมไมโล',price:25,active:true},{id:'b3',name:'นูเทลลา',price:35,active:true},{id:'b4',name:'พริกเผาไก่หยอง',price:35,active:true},{id:'b5',name:'พิซซ่าปูอัดชีส',price:40,active:true},{id:'b6',name:'เนยกระเทียมชีส',price:40,active:true}],
  "อาหาร":[{id:'f1',name:'ข้าวไข่เจียวไก่สับ',price:35,sauce:true,active:true},{id:'f2',name:'ข้าวไข่เจียวมาม่า',price:35,active:true},{id:'f3',name:'ข้าวไก่ทอดเทอริยากิ',price:50,active:true},{id:'f4',name:'มาม่าต้มยำน้ำข้น',price:50,spicy:true,active:true},{id:'f5',name:'มาม่าเส้นหมี่น้ำใส',price:35,active:true},{id:'f6',name:'ควกต้มโคล้ง',price:50,active:true},{id:'f7',name:'โซดาต้มยำ',price:50,spicy:true,active:true},{id:'f8',name:'มาม่าเผ็ด',price:65,spicy:true,active:true},{id:'f9',name:'ข้าวเปล่า',price:10,active:true}],
  "ผลไม้":[{id:'p1',name:'มะม่วงทรงเครื่อง',price:35,active:true}],
};

const initialStaff = [
  {id:'01',name:'ใจดี ดีใจ',phone:'081-234-5678',role:'เจ้าของร้าน',level:'admin'},
  {id:'02',name:'สุพพัญญู',phone:'091-234-5678',role:'แคชเชียร์',level:'staff'},
  {id:'03',name:'ณัฐพล',phone:'061-234-5678',role:'ครัว',level:'staff'},
];

const initialPayments = [
  {table:2, amount:80, method:'qr', time:'18:05', items:[{name:'มาม่าต้มยำน้ำข้น',qty:1,price:50},{name:'ไมโล',qty:1,price:30}]},
  {table:5, amount:160, method:'cash', time:'18:30', items:[{name:'ชาไทย',qty:1,price:35},{name:'นมน้ำตาล',qty:1,price:25},{name:'ข้าวไข่เจียวไก่สับ',qty:1,price:25},{name:'ชาเขียวมัจฉะ',qty:1,price:40},{name:'ไส้กรอกแดง',qty:1,price:35}]},
];

const weeklyOrders = {'จันทร์':0,'อังคาร':7,'พุธ':0,'พฤหัสบดี':0,'ศุกร์':0,'เสาร์':0,'อาทิตย์':0};

function money(n){ return '฿' + n.toLocaleString('th-TH', {minimumFractionDigits: n%1? 2:0}); }

export default function Owner(){
  const [menu, setMenu] = useState(initialMenu);
  const [staff, setStaff] = useState(initialStaff);
  const [ownerState, setOwnerState] = useState({tab:'dashboard', period:'today', menuCat:'เครื่องดื่ม'});
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('แคชเชียร์');
  const [newStaffLevel, setNewStaffLevel] = useState('staff');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    document.title = 'ร้านชาแมกไม้ — ระบบเจ้าของร้าน';
    if (!document.getElementById('cm-google-fonts')){
      const link = document.createElement('link');
      link.id = 'cm-google-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@500;600;700&family=Sarabun:wght@400;500;600;700&family=Space+Mono&display=swap';
      document.head.appendChild(link);
    }
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  function showToast(msg){
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }

  const stats = useMemo(() => {
    const total = initialPayments.reduce((sum, p) => sum + p.amount, 0);
    const qr = initialPayments.filter(p => p.method === 'qr').reduce((sum,p) => sum + p.amount, 0);
    const cash = initialPayments.filter(p => p.method === 'cash').reduce((sum,p) => sum + p.amount, 0);
    const bills = initialPayments.length;
    const itemTally = {};
    initialPayments.forEach(p => p.items.forEach(it => { itemTally[it.name] = (itemTally[it.name] || 0) + it.qty; }));
    const mult = ownerState.period === 'today' ? 1 : ownerState.period === 'week' ? 1.6 : 4.2;
    return {
      total: Math.round(total * mult),
      qr: Math.round(qr * mult),
      cash: Math.round(cash * mult),
      bills: Math.round(bills * mult),
      itemTally,
    };
  }, [ownerState.period]);

  function findMenuItem(id){
    for(const category in menu){
      const item = menu[category].find(x=>x.id===id);
      if(item) return {...item, category};
    }
    return null;
  }

  function ownerSetTab(tab){ setOwnerState(prev => ({...prev, tab})); }
  function ownerSetPeriod(period){ setOwnerState(prev => ({...prev, period})); }
  function ownerSetMenuCat(menuCat){ setOwnerState(prev => ({...prev, menuCat})); }

  function ownerToggleItem(id){
    const item = findMenuItem(id);
    if (!item) return;
    setMenu(prev => ({
      ...prev,
      [item.category]: prev[item.category].map(entry => entry.id === id ? {...entry, active: !entry.active} : entry),
    }));
  }

  function ownerAddItem(){
    const price = parseInt(newItemPrice, 10);
    if (!newItemName.trim() || !price){ showToast('กรุณากรอกชื่อเมนูและราคาให้ครบถ้วน'); return; }
    const cat = ownerState.menuCat;
    const id = cat[0] + Date.now();
    setMenu(prev => ({
      ...prev,
      [cat]: [...prev[cat], {id, name:newItemName.trim(), price, active:true}],
    }));
    setNewItemName('');
    setNewItemPrice('');
    showToast(`เพิ่มเมนู "${newItemName.trim()}" แล้ว`);
  }

  function ownerAddStaff(){
    if (!newStaffName.trim() || !newStaffPhone.trim()){ showToast('กรุณากรอกชื่อและเบอร์โทรศัพท์'); return; }
    const id = String(staff.length + 1).padStart(2,'0');
    setStaff(prev => ([...prev, {id, name:newStaffName.trim(), phone:newStaffPhone.trim(), role:newStaffRole, level:newStaffLevel}]));
    setNewStaffName('');
    setNewStaffPhone('');
    setNewStaffRole('แคชเชียร์');
    setNewStaffLevel('staff');
    showToast(`เพิ่มพนักงาน "${newStaffName.trim()}" แล้ว`);
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
              <button key={i.label} className={i.active ? 'active' : ''} type="button" title={i.label || ''} onClick={i.onclick}>{i.icon}</button>
            ))}
          </div>
          <div className="app-body-wrap"><div className={`app-body ${dark ? 'dark' : ''}`}>{body}</div></div>
        </div>
      </div>
    );
  }

  const periodText = {today:'วันนี้', week:'สัปดาห์นี้', month:'เดือนนี้'}[ownerState.period];
  const maxItem = Math.max(1, ...Object.values(stats.itemTally));
  const maxDay = Math.max(1, ...Object.values(weeklyOrders));

  function dashboardBody(){
    return (
      <>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
          <div>
            <div style={{fontWeight:700,fontSize:15}}>สรุปยอดขายประจำ{periodText === 'วันนี้' ? 'วัน' : periodText === 'สัปดาห์นี้' ? 'สัปดาห์' : 'เดือน'}</div>
            <div className="muted" style={{fontSize:12}}>ข้อมูลอัปเดตล่าสุด: วันนี้ {new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})} น.</div>
          </div>
          <div className="period-toggle">
            {['today','week','month'].map(value => (
              <button key={value} type="button" className={ownerState.period===value ? 'active' : ''} onClick={() => ownerSetPeriod(value)}>{value==='today' ? 'วันนี้' : value==='week' ? 'สัปดาห์นี้' : 'เดือนนี้'}</button>
            ))}
          </div>
        </div>
        <div className="kpi-grid" style={{marginTop:16}}>
          <div className="kpi"><div className="kv">{money(stats.total)}</div><div className="kl">ยอดขายรวม{periodText}</div></div>
          <div className="kpi"><div className="kv">{stats.bills}</div><div className="kl">จำนวนบิล</div></div>
          <div className="kpi"><div className="kv">{money(stats.qr)}</div><div className="kl">ยอดโอน (QR)</div></div>
          <div className="kpi"><div className="kv">{money(stats.cash)}</div><div className="kl">ยอดเงินสด</div></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
          <div className="card">
            <div style={{fontWeight:700,marginBottom:12}}>รายการยอดนิยม</div>
            {Object.keys(stats.itemTally).length ? Object.entries(stats.itemTally).map(([name, qty]) => (
              <div key={name} className="bar-row">
                <div className="bl">{name}</div>
                <div className="bar-track"><div className="bar-fill" style={{width:`${(qty / maxItem) * 100}%`}} /></div>
                <div className="bv">{qty}</div>
              </div>
            )) : <div className="muted" style={{fontSize:13}}>ยังไม่มีข้อมูลการขาย</div>}
          </div>
          <div className="card">
            <div style={{fontWeight:700,marginBottom:12}}>จำนวนออเดอร์แยกตามวันในสัปดาห์</div>
            {Object.entries(weeklyOrders).map(([day, value]) => (
              <div key={day} className="bar-row">
                <div className="bl">{day}</div>
                <div className="bar-track"><div className="bar-fill" style={{width:`${(value / maxDay) * 100}%`}} /></div>
                <div className="bv">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  function menuBody(){
    return (
      <>
        <div className="subnav">
          {Object.keys(menu).map(cat => (
            <button key={cat} type="button" className={ownerState.menuCat===cat ? 'active' : ''} onClick={() => ownerSetMenuCat(cat)}>{cat}</button>
          ))}
        </div>
        <div className="card">
          <table className="data">
            <thead><tr><th>ชื่อเมนู</th><th>ราคา</th><th>สถานะ</th><th></th></tr></thead>
            <tbody>
              {menu[ownerState.menuCat].map(it => (
                <tr key={it.id}>
                  <td style={{fontWeight:600}}>{it.name}</td>
                  <td>{money(it.price)}</td>
                  <td><button type="button" className={`toggle ${it.active ? 'on' : ''}`} onClick={() => ownerToggleItem(it.id)}><span className="knob" /></button></td>
                  <td className="muted" style={{fontSize:12}}>{it.active ? 'เปิดขาย' : 'ปิดขาย'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <hr className="divider" />
        <div style={{fontWeight:700,marginBottom:10}}>เพิ่มเมนูใหม่</div>
        <div className="form-grid" style={{gridTemplateColumns:'2fr 1fr 1fr auto',alignItems:'end'}}>
          <div className="field"><label>ชื่อเมนู</label><input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="เช่น ชาดำเย็น" /></div>
          <div className="field"><label>ราคา (฿)</label><input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="30" /></div>
          <div className="field"><label>หมวดหมู่</label><div style={{padding:'9px 0',fontSize:13.5,fontWeight:600}}>{ownerState.menuCat}</div></div>
          <button type="button" className="btn btn-primary" onClick={ownerAddItem}>เพิ่มเมนูใหม่</button>
        </div>
      </>
    );
  }

  function staffBody(){
    return (
      <>
        <div className="card">
          <table className="data">
            <thead><tr><th>รหัส</th><th>ชื่อพนักงาน</th><th>เบอร์โทรศัพท์</th><th>ตำแหน่ง</th><th>ระดับสิทธิ์</th></tr></thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td className="mono">{s.id}</td>
                  <td style={{fontWeight:600}}>{s.name}</td>
                  <td>{s.phone}</td>
                  <td>{s.role}</td>
                  <td><span className={`role-chip ${s.level}`}>{s.level === 'admin' ? 'Admin' : 'Staff'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <hr className="divider" />
        <div style={{fontWeight:700,marginBottom:10}}>เพิ่มพนักงานใหม่</div>
        <div className="form-grid">
          <div className="field"><label>ชื่อพนักงาน</label><input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="ชื่อ นามสกุล" /></div>
          <div className="field"><label>เบอร์โทรศัพท์</label><input value={newStaffPhone} onChange={e => setNewStaffPhone(e.target.value)} placeholder="0XX-XXX-XXXX" /></div>
          <div className="field"><label>ตำแหน่ง</label><select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)}><option>แคชเชียร์</option><option>ครัว</option><option>เจ้าของร้าน</option></select></div>
          <div className="field"><label>ระดับสิทธิ์</label><select value={newStaffLevel} onChange={e => setNewStaffLevel(e.target.value)}><option value="staff">Staff</option><option value="admin">Admin</option></select></div>
        </div>
        <button type="button" className="btn btn-primary" onClick={ownerAddStaff}>เพิ่มพนักงานใหม่</button>
      </>
    );
  }

  return (
    <div id="app">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {appWindow(
        'Owner (เจ้าของร้าน)',
        ownerState.tab === 'dashboard' ? dashboardBody() : ownerState.tab === 'menu' ? menuBody() : staffBody(),
        false,
        [
          {icon:'📊', label:'สรุปยอดขาย', active: ownerState.tab === 'dashboard', onclick: () => ownerSetTab('dashboard')},
          {icon:'📖', label:'จัดการเมนู', active: ownerState.tab === 'menu', onclick: () => ownerSetTab('menu')},
          {icon:'👥', label:'จัดการพนักงาน', active: ownerState.tab === 'staff', onclick: () => ownerSetTab('staff')},
        ]
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
