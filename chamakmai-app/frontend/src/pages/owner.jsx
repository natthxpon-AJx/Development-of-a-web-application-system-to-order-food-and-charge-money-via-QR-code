import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchMenu,
  fetchCategories,
  createMenuItem,
  setMenuItemAvailability,
  fetchPayments,
  fetchStaff,
  createStaff,
} from "../services/api";

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

  #app{min-height:100vh;display:flex;flex-direction:column;background:var(--cream-100);color-scheme:light;}
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
  .btn:disabled{opacity:.5;cursor:not-allowed;}

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
  .field input,.field select{width:100%;border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-family:inherit;font-size:13.5px;background:var(--cream-050);color:var(--ink);}

  .divider{border:none;border-top:1px solid var(--line);margin:16px 0;}
  .muted{color:var(--ink-soft);}
  .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:var(--brown-900);color:#fff;padding:12px 22px;border-radius:30px;font-size:13.5px;font-weight:600;box-shadow:0 10px 25px -10px rgba(0,0,0,0.4);z-index:200;}

  @media (max-width:900px){
    .kpi-grid{grid-template-columns:repeat(2,1fr);}
    .form-grid{grid-template-columns:1fr;}
  }
`;

function money(n) {
  return "฿" + n.toLocaleString("th-TH", { minimumFractionDigits: n % 1 ? 2 : 0 });
}

const weeklyOrders = { จันทร์: 0, อังคาร: 7, พุธ: 0, พฤหัสบดี: 0, ศุกร์: 0, เสาร์: 0, อาทิตย์: 0 };

export default function Owner() {
  const [ownerState, setOwnerState] = useState({ tab: "dashboard", menuCat: "" });

  // เมนู
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [newItem, setNewItem] = useState({ sku: "", name: "", price: "", category: "", type: "drink" });

  // การชำระเงิน (สำหรับแดชบอร์ด)
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // พนักงาน
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [newStaff, setNewStaff] = useState({
    username: "",
    password: "",
    displayName: "",
    phone: "",
    position: "แคชเชียร์",
    role: "staff",
  });

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    document.title = "ร้านชาแมกไม้ — ระบบเจ้าของร้าน";
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

  const loadMenu = async () => {
    setMenuLoading(true);
    try {
      const [menuRows, categoryRows] = await Promise.all([fetchMenu(), fetchCategories()]);
      setMenu(menuRows);
      const cats = categoryRows.filter((c) => c !== "ทั้งหมด");
      setCategories(cats);
      setOwnerState((prev) => ({ ...prev, menuCat: prev.menuCat || cats[0] || "" }));
    } catch (err) {
      showToast("โหลดเมนูไม่สำเร็จ: " + err.message);
    } finally {
      setMenuLoading(false);
    }
  };

  const loadPayments = async () => {
    setPaymentsLoading(true);
    try {
      const rows = await fetchPayments(); // ไม่ใส่ table = ทุกโต๊ะ
      setPayments(rows);
    } catch (err) {
      showToast("โหลดข้อมูลยอดขายไม่สำเร็จ: " + err.message);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadStaff = async () => {
    setStaffLoading(true);
    try {
      const rows = await fetchStaff();
      setStaff(rows);
    } catch (err) {
      showToast("โหลดรายชื่อพนักงานไม่สำเร็จ: " + err.message);
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
    loadPayments();
    loadStaff();
  }, []);

  const stats = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const qr = payments.filter((p) => p.method === "qr_code").reduce((sum, p) => sum + p.amount, 0);
    const cash = payments.filter((p) => p.method === "cash").reduce((sum, p) => sum + p.amount, 0);
    const bills = payments.length;
    const itemTally = {};
    payments.forEach((p) => (p.items || []).forEach((it) => { itemTally[it.name] = (itemTally[it.name] || 0) + it.qty; }));
    return {
      total,
      qr,
      cash,
      bills,
      itemTally,
    };
  }, [payments]);

  function ownerSetTab(tab) {
    setOwnerState((prev) => ({ ...prev, tab }));
    if (tab === "menu") loadMenu();
    if (tab === "dashboard") loadPayments();
    if (tab === "staff") loadStaff();
  }
  function ownerSetMenuCat(menuCat) {
    setOwnerState((prev) => ({ ...prev, menuCat }));
  }

  async function ownerToggleItem(item) {
    try {
      await setMenuItemAvailability(item.id, !item.active);
      setMenu((prev) => prev.map((m) => (m.id === item.id ? { ...m, active: !m.active } : m)));
    } catch (err) {
      showToast("อัปเดตสถานะเมนูไม่สำเร็จ: " + err.message);
    }
  }

  async function ownerAddItem() {
    const price = parseFloat(newItem.price);
    if (!newItem.name.trim() || !price) {
      showToast("กรุณากรอกชื่อเมนูและราคาให้ครบถ้วน");
      return;
    }
    const category = newItem.category.trim() || ownerState.menuCat;
    try {
      await createMenuItem({
        sku: newItem.sku.trim() || null,
        name: newItem.name.trim(),
        type: newItem.type,
        category,
        price,
        imageUrl: null,
        optionsConfig: null,
      });
      showToast(`เพิ่มเมนู "${newItem.name.trim()}" แล้ว`);
      setNewItem({ sku: "", name: "", price: "", category: "", type: "drink" });
      loadMenu();
    } catch (err) {
      showToast("เพิ่มเมนูไม่สำเร็จ: " + err.message);
    }
  }

  async function ownerAddStaff() {
    if (!newStaff.username.trim() || !newStaff.password.trim() || !newStaff.displayName.trim()) {
      showToast("กรุณากรอก username, รหัสผ่าน และชื่อพนักงานให้ครบถ้วน");
      return;
    }
    try {
      await createStaff({
        username: newStaff.username.trim(),
        password: newStaff.password,
        displayName: newStaff.displayName.trim(),
        role: newStaff.role,
        phone: newStaff.phone.trim() || null,
        position: newStaff.position,
      });
      showToast(`เพิ่มพนักงาน "${newStaff.displayName.trim()}" แล้ว`);
      setNewStaff({ username: "", password: "", displayName: "", phone: "", position: "แคชเชียร์", role: "staff" });
      loadStaff();
    } catch (err) {
      showToast("เพิ่มพนักงานไม่สำเร็จ: " + err.message);
    }
  }

  function appWindow(title, body, dark, sidebarIcons) {
    return (
      <div className="app-window">
        <div className="app-titlebar">
          <div className="tleft">
            <span className="dot"></span>CM · {title}
          </div>
          <div className="online">Online</div>
        </div>
        <div className="app-flex">
          <div className="app-sidebar">
            {sidebarIcons.map((i) => (
              <button key={i.label} className={i.active ? "active" : ""} type="button" title={i.label || ""} onClick={i.onclick}>
                {i.icon}
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

  const maxItem = Math.max(1, ...Object.values(stats.itemTally));
  const maxDay = Math.max(1, ...Object.values(weeklyOrders));

  function dashboardBody() {
    if (paymentsLoading) {
      return <div className="muted" style={{ fontSize: 13 }}>กำลังโหลดข้อมูลยอดขาย...</div>;
    }
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              สรุปยอดขายทั้งหมด
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              ข้อมูลอัปเดตล่าสุด: วันนี้ {new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
            </div>
          </div>
        </div>
        <div className="kpi-grid" style={{ marginTop: 16 }}>
          <div className="kpi">
            <div className="kv">{money(stats.total)}</div>
            <div className="kl">ยอดขายรวม</div>
          </div>
          <div className="kpi">
            <div className="kv">{stats.bills}</div>
            <div className="kl">จำนวนบิล</div>
          </div>
          <div className="kpi">
            <div className="kv">{money(stats.qr)}</div>
            <div className="kl">ยอดโอน (QR)</div>
          </div>
          <div className="kpi">
            <div className="kv">{money(stats.cash)}</div>
            <div className="kl">ยอดเงินสด</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>รายการยอดนิยม</div>
            {Object.keys(stats.itemTally).length ? (
              Object.entries(stats.itemTally).map(([name, qty]) => (
                <div key={name} className="bar-row">
                  <div className="bl">{name}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(qty / maxItem) * 100}%` }} />
                  </div>
                  <div className="bv">{qty}</div>
                </div>
              ))
            ) : (
              <div className="muted" style={{ fontSize: 13 }}>ยังไม่มีข้อมูลการขาย</div>
            )}
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>จำนวนออเดอร์แยกตามวันในสัปดาห์</div>
            {Object.entries(weeklyOrders).map(([day, value]) => (
              <div key={day} className="bar-row">
                <div className="bl">{day}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(value / maxDay) * 100}%` }} />
                </div>
                <div className="bv">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  function menuBody() {
    if (menuLoading) {
      return <div className="muted" style={{ fontSize: 13 }}>กำลังโหลดเมนู...</div>;
    }
    const itemsInCat = menu.filter((it) => it.category === ownerState.menuCat);
    return (
      <>
        <div className="subnav">
          {categories.map((cat) => (
            <button key={cat} type="button" className={ownerState.menuCat === cat ? "active" : ""} onClick={() => ownerSetMenuCat(cat)}>
              {cat}
            </button>
          ))}
        </div>
        <div className="card">
          <table className="data">
            <thead>
              <tr>
                <th>ชื่อเมนู</th>
                <th>SKU</th>
                <th>ราคา</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {itemsInCat.map((it) => (
                <tr key={it.id}>
                  <td style={{ fontWeight: 600 }}>{it.name}</td>
                  <td className="mono muted">{it.sku || "-"}</td>
                  <td>{money(it.price)}</td>
                  <td>
                    <button type="button" className={`toggle ${it.active ? "on" : ""}`} onClick={() => ownerToggleItem(it)}>
                      <span className="knob" />
                    </button>
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>{it.active ? "เปิดขาย" : "ปิดขาย"}</td>
                </tr>
              ))}
              {!itemsInCat.length ? (
                <tr>
                  <td colSpan={5} className="muted" style={{ textAlign: "center", padding: 20 }}>
                    ยังไม่มีเมนูในหมวดนี้
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <hr className="divider" />
        <div style={{ fontWeight: 700, marginBottom: 10 }}>เพิ่มเมนูใหม่</div>
        <div className="form-grid" style={{ gridTemplateColumns: "1.2fr 1fr 1fr 1fr", alignItems: "end" }}>
          <div className="field">
            <label>ชื่อเมนู</label>
            <input value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} placeholder="เช่น ชาดำเย็น" />
          </div>
          <div className="field">
            <label>SKU</label>
            <input value={newItem.sku} onChange={(e) => setNewItem((p) => ({ ...p, sku: e.target.value }))} placeholder="เช่น TEA003" />
          </div>
          <div className="field">
            <label>ราคา (฿)</label>
            <input type="number" value={newItem.price} onChange={(e) => setNewItem((p) => ({ ...p, price: e.target.value }))} placeholder="30" />
          </div>
          <div className="field">
            <label>ประเภท</label>
            <select value={newItem.type} onChange={(e) => setNewItem((p) => ({ ...p, type: e.target.value }))}>
              <option value="drink">เครื่องดื่ม (drink)</option>
              <option value="food">อาหาร (food)</option>
            </select>
          </div>
        </div>
        <div className="form-grid" style={{ gridTemplateColumns: "1fr auto", alignItems: "end" }}>
          <div className="field">
            <label>หมวดหมู่ (เว้นว่าง = ใช้หมวดที่เลือกอยู่: {ownerState.menuCat})</label>
            <input value={newItem.category} onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))} placeholder={ownerState.menuCat} />
          </div>
          <button type="button" className="btn btn-primary" onClick={ownerAddItem}>
            เพิ่มเมนูใหม่
          </button>
        </div>
      </>
    );
  }

  function staffBody() {
    if (staffLoading) {
      return <div className="muted" style={{ fontSize: 13 }}>กำลังโหลดรายชื่อพนักงาน...</div>;
    }
    return (
      <>
        <div className="card">
          <table className="data">
            <thead>
              <tr>
                <th>Username</th>
                <th>ชื่อพนักงาน</th>
                <th>เบอร์โทรศัพท์</th>
                <th>ตำแหน่ง</th>
                <th>ระดับสิทธิ์</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="mono">{s.username}</td>
                  <td style={{ fontWeight: 600 }}>{s.displayName}</td>
                  <td>{s.phone || "-"}</td>
                  <td>{s.position || "-"}</td>
                  <td>
                    <span className={`role-chip ${s.role}`}>{s.role === "admin" ? "Admin" : "Staff"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <hr className="divider" />
        <div style={{ fontWeight: 700, marginBottom: 10 }}>เพิ่มพนักงานใหม่</div>
        <div className="form-grid">
          <div className="field">
            <label>Username (เข้าสู่ระบบ)</label>
            <input value={newStaff.username} onChange={(e) => setNewStaff((p) => ({ ...p, username: e.target.value }))} placeholder="เช่น staff03" />
          </div>
          <div className="field">
            <label>รหัสผ่าน</label>
            <input type="password" value={newStaff.password} onChange={(e) => setNewStaff((p) => ({ ...p, password: e.target.value }))} placeholder="ตั้งรหัสผ่าน" />
          </div>
          <div className="field">
            <label>ชื่อพนักงาน</label>
            <input value={newStaff.displayName} onChange={(e) => setNewStaff((p) => ({ ...p, displayName: e.target.value }))} placeholder="ชื่อ นามสกุล" />
          </div>
          <div className="field">
            <label>เบอร์โทรศัพท์</label>
            <input value={newStaff.phone} onChange={(e) => setNewStaff((p) => ({ ...p, phone: e.target.value }))} placeholder="0XX-XXX-XXXX" />
          </div>
          <div className="field">
            <label>ตำแหน่ง</label>
            <select value={newStaff.position} onChange={(e) => setNewStaff((p) => ({ ...p, position: e.target.value }))}>
              <option>แคชเชียร์</option>
              <option>ครัว</option>
              <option>เจ้าของร้าน</option>
            </select>
          </div>
          <div className="field">
            <label>ระดับสิทธิ์</label>
            <select value={newStaff.role} onChange={(e) => setNewStaff((p) => ({ ...p, role: e.target.value }))}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={ownerAddStaff}>
          เพิ่มพนักงานใหม่
        </button>
      </>
    );
  }

  return (
    <div id="app">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {appWindow(
        "Owner (เจ้าของร้าน)",
        ownerState.tab === "dashboard" ? dashboardBody() : ownerState.tab === "menu" ? menuBody() : staffBody(),
        false,
        [
          { icon: "📊", label: "สรุปยอดขาย", active: ownerState.tab === "dashboard", onclick: () => ownerSetTab("dashboard") },
          { icon: "📖", label: "จัดการเมนู", active: ownerState.tab === "menu", onclick: () => ownerSetTab("menu") },
          { icon: "👥", label: "จัดการพนักงาน", active: ownerState.tab === "staff", onclick: () => ownerSetTab("staff") },
        ]
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}