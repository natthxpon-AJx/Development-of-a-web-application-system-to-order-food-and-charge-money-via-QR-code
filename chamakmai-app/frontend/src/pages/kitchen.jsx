import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchOrders, updateOrderStatus } from "../services/api";

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
  .ticket.st-served{border-left-color:var(--jade);}

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
  .btn:disabled{opacity:.5;cursor:not-allowed;}

  .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:var(--brown-900);color:#fff;padding:12px 22px;border-radius:30px;font-size:13.5px;font-weight:600;box-shadow:0 10px 25px -10px rgba(0,0,0,0.4);z-index:200;}
`;

// ต้องตรงกับ ENUM orders.status ในฐานข้อมูล — ครัวรับผิดชอบแค่ waiting -> cooking -> served
const LABELS = {
  waiting: ["รอคิว", "badge-queue"],
  cooking: ["กำลังทำ", "badge-cooking"],
  served: ["เสร็จแล้ว", "badge-done"],
};

const POLL_INTERVAL_MS = 4000;

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    document.title = "ร้านชาแมกไม้ — ระบบครัว";
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

  const sortedOrders = useMemo(() => {
    const active = orders.filter((o) => o.status === "waiting" || o.status === "cooking");
    const recentServed = orders.filter((o) => o.status === "served").slice(0, 4);
    const combined = [...active, ...recentServed];
    return combined.sort((a, b) => (a.status === "served") - (b.status === "served") || a.id - b.id);
  }, [orders]);

  async function kitchenAdvance(order) {
    const nextStatus = order.status === "waiting" ? "cooking" : order.status === "cooking" ? "served" : null;
    if (!nextStatus || busyId) return;
    setBusyId(order.id);
    try {
      const updated = await updateOrderStatus(order.id, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)));
      showToast(
        nextStatus === "cooking" ? `รับออเดอร์ #${order.id} แล้ว` : `ออเดอร์ #${order.id} เสร็จแล้ว 🍳`
      );
    } catch (err) {
      showToast("อัปเดตสถานะไม่สำเร็จ ลองใหม่อีกครั้ง");
      console.error(err);
    } finally {
      setBusyId(null);
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

  function boardBody() {
    if (loading) {
      return <div className="muted" style={{ fontSize: 13, padding: "10px 0" }}>กำลังโหลดออเดอร์จากหลังบ้าน...</div>;
    }
    if (loadError) {
      return (
        <div className="muted" style={{ fontSize: 13, padding: "10px 0" }}>
          โหลดออเดอร์ไม่สำเร็จ: {loadError}
        </div>
      );
    }
    if (!sortedOrders.length) {
      return <div className="muted" style={{ fontSize: 13, padding: "10px 0" }}>ไม่มีออเดอร์เข้ามาในขณะนี้</div>;
    }
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))", gap: 14 }}>
        {sortedOrders.map((o) => {
          const [label, badgeClass] = LABELS[o.status] || ["-", "badge-queue"];
          return (
            <div key={o.id} className={`ticket st-${o.status}`}>
              <div className="thead">
                <span className="ttable">โต๊ะ {o.table}</span>
                <span className="tnum">{o.time}</span>
              </div>
              <div className="badge-wrap">
                <div className={`badge ${badgeClass}`} style={{ marginBottom: 8 }}>
                  {label} · #{o.id}
                </div>
              </div>
              <div className="item-list">
                {o.items.map((it, idx) => (
                  <div key={idx} className="item-row">
                    <span>
                      {it.name} {it.note ? <span className="note">({it.note})</span> : null}
                    </span>
                    <span>×{it.qty}</span>
                  </div>
                ))}
              </div>
              {o.status === "waiting" ? (
                <button
                  type="button"
                  className="btn btn-primary btn-block btn-sm"
                  style={{ marginTop: 10 }}
                  disabled={busyId === o.id}
                  onClick={() => kitchenAdvance(o)}
                >
                  รับออเดอร์
                </button>
              ) : null}
              {o.status === "cooking" ? (
                <button
                  type="button"
                  className="btn btn-jade btn-block btn-sm"
                  style={{ marginTop: 10 }}
                  disabled={busyId === o.id}
                  onClick={() => kitchenAdvance(o)}
                >
                  เสร็จสิ้น
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div id="app">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {appWindow(
        "Kitchen Display System (ครัว)",
        boardBody(),
        true,
        [
          { icon: "🔥", label: "ครัว", active: false },
          { icon: "🍳", label: "ออเดอร์", active: true },
          { icon: "📋", label: "ประวัติ", active: false },
        ]
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}