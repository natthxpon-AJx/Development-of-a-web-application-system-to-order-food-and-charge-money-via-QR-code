import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchOrders, payTable } from "../services/api";

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
  .kp-grid button{padding:14px 0;border-radius:10px;border:1px solid var(--line);background:var(--cream-050);font-weight:700;font-size:16px;color:var(--ink);}

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
`;

const allTables = [1, 2, 3, 4, 5, 6, 7, 8];
const POLL_INTERVAL_MS = 4000;

function money(n) {
  return "฿" + n.toLocaleString("th-TH", { minimumFractionDigits: n % 1 ? 2 : 0 });
}

// แปลงเลขโต๊ะ (5) เป็นรหัสโต๊ะตามสคีมา (T05)
function tableCode(tableNumber) {
  return "T" + String(tableNumber).padStart(2, "0");
}

// รวมบิลของโต๊ะจากออเดอร์ที่ยังไม่จ่ายทั้งหมด (ไม่นับออเดอร์ที่ยกเลิก)
function tableBill(code, orders) {
  const unpaid = orders.filter((o) => o.table === code && !o.paid && o.status !== "cancelled");
  const items = unpaid.flatMap((o) => o.items);
  const total = unpaid.reduce((sum, o) => sum + o.total, 0);
  return { orders: unpaid, items, total };
}

export default function Cashier() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [cash, setCash] = useState("");
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

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

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }

  // โพลลิ่งออเดอร์ของทุกโต๊ะจากหลังบ้าน
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchOrders(); // ไม่ใส่ table = ทุกโต๊ะ
        if (cancelled) return;
        setOrders(data);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err.message || "โหลดออเดอร์ไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const intervalId = window.setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const bill = useMemo(
    () => (selected !== null ? tableBill(tableCode(selected), orders) : { items: [], total: 0 }),
    [selected, orders]
  );
  const received = parseInt(cash || "0", 10) || 0;
  const change = Math.max(0, received - bill.total);

  function cashierSelect(t) {
    if (tableBill(tableCode(t), orders).total > 0) {
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
    setCash((prev) => `${prev || ""}${d}`);
  }
  function cashierKeyClear() {
    setCash("");
  }
  function cashierAdd(v) {
    setCash((prev) => String((parseInt(prev || "0", 10) || 0) + v));
  }
  function cashierExact(total) {
    setCash(String(total));
  }

  async function cashierComplete(method) {
    if (selected === null || paying) return;
    setPaying(true);
    try {
      await payTable(tableCode(selected), method);
      // ดึงข้อมูลออเดอร์ล่าสุดมาอัปเดต state ทันที (ไม่ต้องรอรอบโพลลิ่งถัดไป)
      const fresh = await fetchOrders();
      setOrders(fresh);
      showToast(`รับชำระเงินโต๊ะ ${selected} เรียบร้อย ✓`);
      setSelected(null);
      setMode(null);
      setCash("");
    } catch (err) {
      showToast("บันทึกการชำระเงินไม่สำเร็จ ลองใหม่อีกครั้ง");
      console.error(err);
    } finally {
      setPaying(false);
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
              <button key={i.label} className={i.active ? "active" : ""} type="button" title={i.label || ""}>
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

  function cashierBillPanel() {
    if (mode === "cash") return cashierCashView();
    if (mode === "qr") return cashierQrView();
    return (
      <>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>บิลโต๊ะ {selected}</div>
        {bill.items.map((it, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13.5,
              padding: "5px 0",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span>
              {it.name} {it.note ? <span className="muted">({it.note})</span> : null} ×{it.qty}
            </span>
            <span>{money(it.price * it.qty)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, marginTop: 12 }}>
          <span>ยอดสุทธิ</span>
          <span>{money(bill.total)}</span>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-dark" style={{ flex: 1 }} onClick={() => cashierMode("cash")}>
            เงินสด
          </button>
          <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => cashierMode("qr")}>
            แสกนจ่าย
          </button>
        </div>
      </>
    );
  }

  function cashierCashView() {
    return (
      <>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>รับเงินสด — โต๊ะ {selected}</div>
        <div className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>
          ยอดสุทธิ {money(bill.total)}
        </div>
        <div style={{ textAlign: "center", fontFamily: "Space Mono,monospace", fontSize: 28, fontWeight: 700, margin: "10px 0", color: "var(--ink)" }}>
          ฿{cash || "0"}
        </div>
        <div className="kp-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} type="button" onClick={() => cashierKey(String(n))}>
              {n}
            </button>
          ))}
          <button type="button" onClick={cashierKeyClear}>
            ล้าง
          </button>
          <button type="button" onClick={() => cashierKey("0")}>
            0
          </button>
          <button type="button" onClick={() => cashierExact(bill.total)}>
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
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 14 }}>
          <span className="muted">เงินทอน</span>
          <span style={{ fontWeight: 700 }}>{money(change)}</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => cashierMode(null)}>
            ย้อนกลับ
          </button>
          <button
            type="button"
            className="btn btn-jade"
            style={{ flex: 1 }}
            disabled={received < bill.total || paying}
            onClick={() => cashierComplete("cash")}
          >
            รับเงิน / เสร็จสิ้น
          </button>
        </div>
      </>
    );
  }

  function cashierQrView() {
    return (
      <>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>สแกนจ่าย — โต๊ะ {selected}</div>
        <div className="muted" style={{ fontSize: 12.5 }}>
          พร้อมเพย์ · ร้านชาแมกไม้
        </div>
        <div className="qr-box"></div>
        <div style={{ textAlign: "center", fontFamily: "Space Mono,monospace", fontSize: 22, fontWeight: 700 }}>
          {money(bill.total)}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => cashierMode(null)}>
            ย้อนกลับ
          </button>
          <button type="button" className="btn btn-jade" style={{ flex: 1 }} disabled={paying} onClick={() => cashierComplete("qr_code")}>
            ชำระเงินสำเร็จ
          </button>
        </div>
      </>
    );
  }

  const hasBill = selected !== null && bill.total > 0;

  function renderTableTiles() {
    return allTables.map((t) => {
      const b = tableBill(tableCode(t), orders);
      const has = b.total > 0;
      const sel = selected === t;
      return (
        <div key={t} className={`table-tile ${has ? "active" : "empty"} ${sel ? "selected" : ""}`} onClick={() => has && cashierSelect(t)}>
          <div className="tt-num">{t}</div>
          <div className="tt-status">{has ? money(b.total) : "ว่าง"}</div>
        </div>
      );
    });
  }

  return (
    <div id="app">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {appWindow(
        "Cashier / Point of Sale (แคชเชียร์)",
        loading ? (
          <div className="empty-state">
            <div className="glyph">⏳</div>กำลังโหลดข้อมูลจากหลังบ้าน...
          </div>
        ) : loadError ? (
          <div className="empty-state">
            <div className="glyph">⚠️</div>โหลดข้อมูลไม่สำเร็จ: {loadError}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 22 }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>โต๊ะ</div>
              <div className="table-grid">{renderTableTiles()}</div>
            </div>
            <div>
              <div className="card">
                {hasBill ? (
                  cashierBillPanel()
                ) : (
                  <div className="empty-state" style={{ padding: "30px 10px" }}>
                    <div className="glyph">🧾</div>เลือกโต๊ะที่มีบิลเพื่อคิดเงิน
                  </div>
                )}
              </div>
            </div>
          </div>
        ),
        false,
        [
          { icon: "🏠", label: "หน้าหลัก", active: false },
          { icon: "💳", label: "แคชเชียร์", active: true },
          { icon: "🧾", label: "ประวัติ", active: false },
        ]
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}