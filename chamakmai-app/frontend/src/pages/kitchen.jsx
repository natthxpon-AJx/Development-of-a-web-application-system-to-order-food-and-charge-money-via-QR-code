import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchOrders, getCurrentUser, logoutUser, updateOrderStatus, updateOrderItemStatus } from "../services/api";

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

  #app{min-height:100vh;height:100vh;display:flex;flex-direction:column;background:var(--cream-100);color-scheme:light;}
  .stage{flex:1;padding:0;display:flex;justify-content:center;}
  .stage-inner{width:100%;max-width:100%;}

  /* ===== Desktop app titlebar ===== */
  .app-window{background:transparent;border-radius:0;overflow:hidden;display:flex;flex-direction:column;height:100vh;max-height:100vh;border:none;}
  .app-titlebar{background:var(--navy-800);color:#F3F4F6;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
  .app-titlebar .tleft{display:flex;align-items:center;gap:10px;font-weight:600;font-size:14.5px;}
  .app-titlebar .dot{width:9px;height:9px;border-radius:50%;background:var(--amber);}
  .app-titlebar .online{font-size:11px;background:var(--jade);color:#fff;padding:3px 9px;border-radius:20px;font-weight:600;display:flex;align-items:center;gap:5px;}
  .app-titlebar .online::before{content:'';width:6px;height:6px;border-radius:50%;background:#fff;}
  .app-flex{display:flex;flex:1;min-height:0;}
  .app-sidebar{width:58px;flex-shrink:0;background:var(--navy-900);display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px 0;}
  .app-sidebar button{width:38px;height:38px;border-radius:11px;border:none;background:transparent;color:#9CA3AF;font-size:17px;display:flex;align-items:center;justify-content:center;}
  .app-sidebar button.active{background:var(--amber);color:#fff;}
  .app-sidebar button.logout{margin-top:auto;}
  .app-body-wrap{flex:1;min-width:0;background:#eef2f6;display:flex;flex-direction:column;min-height:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior-y:contain;}
  .app-body{padding:20px 22px 0;background:transparent;display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;}
  .app-body.dark{background:#eef2f6;}
  .app-body.dark .ticket{background:var(--paper);border-color:var(--line);}
  .app-body.dark .ticket .thead{border-bottom-color:var(--line);color:var(--ink);}
  .app-body.dark .ticket .item-row{color:var(--ink);}
  .app-body.dark .ticket .item-row .item-note{color:var(--ink-soft);}
  .app-body.dark .muted{color:var(--ink-soft);}

.ticket{background:var(--paper);border:1px solid var(--line);border-radius:12px;position:relative;padding:14px 14px 14px 16px;box-shadow:0 4px 10px -6px rgba(17,24,39,0.15);border-left:4px solid var(--amber);display:flex;flex-direction:column;justify-content:flex-start;max-height:calc(100vh - 160px);height:auto;align-self:stretch;overflow:hidden;flex-shrink:0;font-size:13px;line-height:1.4;color:var(--ink);}
  .ticket.st-cooking{border-left-color:var(--clay);} 
  .ticket.st-served{border-left-color:var(--jade);} 
  .ticket-header{display:flex;flex-direction:column;gap:8px;flex-shrink:0;}
  .thead{display:flex;justify-content:space-between;align-items:baseline;gap:8px;}
  .ttable{font-size:15px;font-weight:700;line-height:1.3;color:var(--ink);}
  .tnum{font-size:12px;font-weight:600;line-height:1.3;color:var(--ink-soft);}
  .ticket-footer{display:flex;flex-shrink:0;padding-top:10px;margin-top:auto;}
  .board-grid{display:flex;flex-wrap:nowrap;gap:14px;align-items:stretch;flex:1;min-height:0;padding-bottom:8px;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;}
  .board-grid > .ticket{flex:0 0 240px;min-width:240px;max-width:240px;}
  .item-list{display:flex;flex-direction:column;gap:2px;flex:1 1 auto;min-height:0;margin-top:8px;overflow-y:auto;padding-right:4px;overscroll-behavior:contain;}
  .item-list::-webkit-scrollbar{width:6px;}
  .item-list::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:999px;}
  .item-row{display:flex;justify-content:space-between;align-items:center;gap:10px;min-height:40px;padding:8px 0;border-bottom:1px solid var(--line);}
  .item-row:last-child{border-bottom:none;}
  .item-info{flex:1;min-width:0;text-align:left;}
  .item-name{font-size:13.5px;font-weight:600;line-height:1.4;color:var(--ink);word-break:break-word;}
  .item-note{font-size:11.5px;font-weight:500;line-height:1.3;color:var(--ink-soft);margin-top:2px;}
  .item-actions{flex-shrink:0;display:flex;align-items:center;gap:8px;}
  .item-qty{font-size:12.5px;font-weight:700;line-height:1;color:var(--ink-soft);white-space:nowrap;}
  .ticket .btn{margin-top:0;width:100%;flex-shrink:0;}

  .badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:20px;}
  .badge-queue{background:#F3E7D2;color:#8A5A16;}
  .badge-cooking{background:#FBE4D9;color:var(--clay);}
  .badge-done{background:var(--jade-bg);color:var(--jade);}

  .btn{border:none;border-radius:10px;padding:10px 16px;font-weight:700;font-size:13.5px;transition:transform .08s ease;}
  .btn:active{transform:scale(0.97);}
  .btn-primary{background:var(--amber);color:#fff;}
  .btn-primary:hover{background:var(--amber-dark);}
  .btn-jade{background:var(--jade);color:#fff;}
  .btn-gray{background:#9CA3AF;color:#fff;}
  .btn-block{width:100%;}
  .btn-sm{padding:7px 12px;font-size:12.5px;border-radius:8px;}
  .btn:disabled{opacity:.5;cursor:not-allowed;}

  .item-row.is-done{opacity:.55;}
  .item-row.is-done .item-name,
  .item-row.is-done .item-note{text-decoration:line-through;}
  .item-row.is-cancelled{opacity:.6;}
  .item-row.is-cancelled .item-name,.item-row.is-cancelled .item-note{text-decoration:line-through;}
  .item-done-btn{flex-shrink:0;min-width:76px;text-align:center;border:1px solid var(--jade);background:transparent;color:var(--jade);font-size:11.5px;font-weight:700;line-height:1;padding:6px 10px;border-radius:8px;}
  .item-done-btn:disabled{opacity:.5;cursor:not-allowed;}
  .item-done-badge{flex-shrink:0;min-width:76px;text-align:center;font-size:11.5px;font-weight:700;line-height:1;color:var(--jade);white-space:nowrap;}
  .item-cancel-btn{flex-shrink:0;border:1px solid var(--clay);background:transparent;color:var(--clay);font-size:11.5px;font-weight:700;line-height:1;padding:6px 10px;border-radius:8px;}
  .pickup-badge{display:inline-flex;align-self:flex-start;margin-top:5px;font-size:11px;font-weight:700;line-height:1;padding:4px 8px;border-radius:999px;}
  .pickup-pending{background:var(--clay-bg);color:var(--clay);}
  .pickup-received{background:var(--jade-bg);color:var(--jade);}

  .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:var(--brown-900);color:#fff;padding:12px 22px;border-radius:30px;font-size:13.5px;font-weight:600;box-shadow:0 10px 25px -10px rgba(0,0,0,0.4);z-index:200;}
  #app{height:100dvh;min-height:100dvh;}
  .app-window{height:100dvh;max-height:100dvh;}
  .app-titlebar .online.offline{background:#B45309;}
  .titlebar-actions{display:flex;align-items:center;gap:12px;}
  .staff-name{font-size:12px;color:#D1D5DB;}
  .app-sidebar{width:84px;}
  .app-sidebar button{width:68px;min-height:54px;height:auto;flex-direction:column;gap:3px;font-size:19px;padding:6px;}
  .sidebar-label{font-size:10px;font-weight:600;}
  .board-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;flex-shrink:0;}
  .board-toolbar h2{font-size:18px;margin:0 0 5px;}
  .board-filters{display:flex;gap:8px;flex-wrap:wrap;}
  .board-filters select{min-height:40px;border:1px solid var(--line);border-radius:8px;padding:6px 10px;background:#fff;color:var(--ink);font-family:inherit;max-width:100%;}
  .connection-alert{padding:10px 12px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-radius:10px;background:#FEF3C7;color:#92400E;font-size:13px;flex-shrink:0;}
  .board-grid{display:flex;flex-wrap:nowrap;align-items:stretch;gap:14px;overflow-x:auto;overflow-y:hidden;flex:1;min-height:0;padding-bottom:8px;scrollbar-width:thin;-webkit-overflow-scrolling:touch;}
  .board-grid > .ticket{flex:0 0 300px;min-width:300px;max-width:300px;width:300px;height:100%;max-height:none;overflow:hidden;}
  .item-list{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding-right:4px;}
  .item-actions{flex-wrap:wrap;justify-content:flex-end;max-width:112px;gap:5px;}
  .item-done-btn,.item-cancel-btn{min-height:38px;}
  .ticket-footer .btn{min-height:42px;}
  .ticket.st-completed{border-left-color:var(--jade);}
  .ticket.st-cancelled{border-left-color:#9CA3AF;}
  .ticket-time{font-size:12px;font-weight:600;color:var(--ink-soft);}
  .ticket-time.long-wait{color:#B91C1C;}
  .paid-badge{font-size:11px;color:var(--jade);font-weight:700;}
  .toast{max-width:calc(100vw - 24px);width:max-content;text-align:center;}
  button:focus-visible,select:focus-visible{outline:3px solid #FBBF24;outline-offset:3px;}
  @media(max-width:700px){
    .app-titlebar{padding:10px 12px;gap:10px;flex-wrap:wrap;}
    .app-titlebar .tleft{font-size:13px;}
    .staff-name{display:none;}
    .app-flex{flex-direction:column;overflow:hidden;}
    .app-sidebar{width:100%;padding:7px 10px;flex-direction:row;gap:8px;}
    .app-sidebar button{width:auto;min-width:76px;min-height:44px;flex-direction:row;gap:6px;}
    .app-sidebar button.logout{margin:0 0 0 auto;}
    .sidebar-label{font-size:12px;}
    .app-body{padding:14px 14px 0;}
    .board-grid > .ticket{flex-basis:280px;min-width:280px;max-width:280px;width:280px;height:100%;max-height:none;}
    .board-filters{width:100%;}
    .board-filters select{flex:1;min-width:0;}
    .connection-alert{align-items:flex-start;}
  }
`;

// ต้องตรงกับ ENUM orders.status ในฐานข้อมูล — ครัวรับผิดชอบแค่ waiting -> cooking -> served
const LABELS = {
  waiting: ["รอคิว", "badge-queue"],
  cooking: ["กำลังทำ", "badge-cooking"],
  served: ["เสร็จสิ้น", "badge-done"],
  completed: ["เสร็จสิ้น", "badge-done"],
  cancelled: ["ยกเลิก", "badge-queue"],
};

const POLL_INTERVAL_MS = 4000;

function aggregateItems(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = [item.name, item.note || "", item.price, item.status || "waiting"].join("|");
    const existing = map.get(key);
    if (existing) {
      existing.qty += item.qty;
      existing.ids.push(item.id);
      existing.statuses.push(item.status);
    } else {
      map.set(key, {
        ...item,
        ids: [item.id],
        statuses: [item.status],
      });
    }
  });
  return Array.from(map.values()).map((item) => ({
    ...item,
    status: item.statuses.every((status) => status === "cancelled")
      ? "cancelled"
      : item.statuses.every((status) => ["done", "received", "served", "completed"].includes(status))
        ? "done"
        : "waiting",
    pickupStatus: item.statuses.every((status) => ["received", "served", "completed"].includes(status)) ? "received" : "pending",
  }));
}

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [itemBusyId, setItemBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState("active");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [retryKey, setRetryKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const toastTimer = useRef(null);
  const actionLock = useRef(false);
  const dataEpoch = useRef(0);
  const currentUser = getCurrentUser();

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
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  // โพลลิ่งออเดอร์ของทุกโต๊ะจากหลังบ้าน
  useEffect(() => {
    let cancelled = false;
    let pending = false;
    async function load() {
      if (pending || actionLock.current) return;
      pending = true;
      const epoch = dataEpoch.current;
      setRefreshing(true);
      try {
        const data = await fetchOrders(); // ไม่ใส่ table = ทุกโต๊ะ
        if (cancelled || epoch !== dataEpoch.current) return;
        setOrders(data);
        setLoadError(null);
      } catch (err) {
        if (cancelled || epoch !== dataEpoch.current) return;
        setLoadError(err.message || "โหลดออเดอร์ไม่สำเร็จ");
      } finally {
        pending = false;
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    load();
    const intervalId = window.setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [retryKey]);

  const activeOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === "waiting" || o.status === "cooking")
      .sort((a, b) => a.id - b.id);
  }, [orders]);

  const historyOrders = useMemo(() => {
    return orders.filter((o) => ["served", "completed", "cancelled"].includes(o.status)).sort((a, b) => b.id - a.id);
  }, [orders]);

  const actionBusy = Boolean(busyId || itemBusyId);

  async function refreshAfterAction() {
    try {
      setOrders(await fetchOrders());
      setLoadError(null);
    } catch {
      setLoadError("บันทึกการเปลี่ยนแปลงแล้ว แต่ยังโหลดสถานะล่าสุดไม่ได้");
    }
  }

  async function kitchenAdvance(order) {
    const nextStatus = order.status === "waiting" ? "cooking" : order.status === "cooking" ? "served" : null;
    if (!nextStatus || actionLock.current || loadError) return;
    const displayNumber = order.orderNumber ?? order.id;
    actionLock.current = true;
    dataEpoch.current += 1;
    setBusyId(order.id);
    try {
      const updated = await updateOrderStatus(order.id, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
      showToast(
        nextStatus === "cooking" ? `รับออเดอร์ #${displayNumber} แล้ว` : `ออเดอร์ #${displayNumber} เสร็จสิ้น 🍳`
      );
      await refreshAfterAction();
    } catch (err) {
      showToast(err.message || "อัปเดตสถานะไม่สำเร็จ ลองใหม่อีกครั้ง");
      setRetryKey((key) => key + 1);
    } finally {
      dataEpoch.current += 1;
      actionLock.current = false;
      setBusyId(null);
    }
  }

  async function updateItems(order, itemIds, status, busyKey, successMessage, completeOrder = false) {
    if (actionLock.current || loadError || !itemIds.length) return;
    const displayNumber = order.orderNumber ?? order.id;
    actionLock.current = true;
    dataEpoch.current += 1;
    setItemBusyId(busyKey);
    try {
      const results = [];
      for (const id of itemIds) {
        try {
          await updateOrderItemStatus(id, status);
          results.push({ status: "fulfilled" });
        } catch (reason) {
          results.push({ status: "rejected", reason });
        }
      }
      const savedIds = itemIds.filter((_, index) => results[index].status === "fulfilled");
      setOrders((previous) => previous.map((currentOrder) => {
        if (currentOrder.id !== order.id) return currentOrder;
        const items = currentOrder.items.map((item) => savedIds.includes(item.id) ? { ...item, status } : item);
        return { ...currentOrder, items, status: status === "cancelled" && items.every((item) => item.status === "cancelled") ? "cancelled" : currentOrder.status };
      }));
      const failed = results.find((result) => result.status === "rejected");
      let orderCompleted = false;
      let orderCompletionError = null;
      if (completeOrder && !failed) {
        try {
          const updated = await updateOrderStatus(order.id, "served");
          setOrders((previous) => previous.map((currentOrder) => currentOrder.id === order.id ? { ...currentOrder, ...updated } : currentOrder));
          orderCompleted = true;
        } catch (error) {
          orderCompletionError = error;
        }
      }
      showToast(failed
        ? savedIds.length ? `บันทึกแล้ว ${savedIds.length} รายการ อีก ${itemIds.length - savedIds.length} รายการยังไม่สำเร็จ` : failed.reason.message || "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"
        : orderCompleted ? `ทำรายการทั้งหมดเสร็จและปิดออเดอร์ #${displayNumber} แล้ว ✓`
          : orderCompletionError ? `ทำอาหารครบแล้ว แต่ปิดออเดอร์ไม่สำเร็จ: ${orderCompletionError.message}`
            : successMessage);
      await refreshAfterAction();
    } finally {
      dataEpoch.current += 1;
      actionLock.current = false;
      setItemBusyId(null);
    }
  }

  function kitchenItemDone(order, item) {
    if (order.status !== "cooking" || item.status !== "waiting") return;
    const ids = item.ids || [item.id];
    const finishedStatuses = ["done", "received", "served", "completed", "cancelled"];
    const completesOrder = order.items.every((current) => ids.includes(current.id) || finishedStatuses.includes(current.status));
    return updateItems(order, ids, "done", ids.join(","), `${item.name} เสร็จสิ้น ✓`, completesOrder);
  }

  function kitchenItemCancel(order, item) {
    if (order.paid || order.status !== "waiting" || item.status !== "waiting") return;
    const ids = item.ids || [item.id];
    return updateItems(order, ids, "cancelled", ids.join(","), `${item.name} ถูกยกเลิกแล้ว`);
  }

  function kitchenAllItemsDone(order) {
    if (order.status !== "cooking") return;
    const ids = order.items.filter((item) => !["done", "received", "served", "completed", "cancelled"].includes(item.status)).map((item) => item.id);
    if (!ids.length) return kitchenAdvance(order);
    return updateItems(order, ids, "done", `all-${order.id}`, `เมนูทั้งหมดของออเดอร์ #${order.orderNumber ?? order.id} เสร็จสิ้น ✓`, true);
  }

  function appWindow(title, body, dark, sidebarIcons) {
    return (
      <div className="app-window">
        <div className="app-titlebar">
          <div className="tleft">
            <span className="dot"></span>CM · {title}
          </div>
          <div className="titlebar-actions"><span className="staff-name">{currentUser?.displayName || currentUser?.username}</span><div className={`online ${loadError ? "offline" : ""}`} aria-live="polite">{loading ? "กำลังเชื่อมต่อ" : loadError ? "เชื่อมต่อขัดข้อง" : "เชื่อมต่อแล้ว"}</div></div>
        </div>
        <div className="app-flex">
          <div className="app-sidebar">
            {sidebarIcons.map((i) => (
              <button
                key={i.label}
                className={`${i.active ? "active " : ""}${i.label === "ออกจากระบบ" ? "logout" : ""}`}
                type="button"
                title={i.label || ""}
                aria-label={i.label}
                disabled={actionBusy}
                onClick={i.onClick}
              >
                <span>{i.icon}</span><span className="sidebar-label">{i.label}</span>
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
    const ordersToRender = (view === "history" ? historyOrders : activeOrders).filter((order) => (tableFilter === "all" || order.table === tableFilter) && (view === "history" || statusFilter === "all" || order.status === statusFilter));
    const tables = Array.from(new Set(orders.map((order) => order.table))).sort();

    return (
      <>
      {loadError ? <div className="connection-alert" role="status"><span>{loadError}<br />รายการที่แสดงอาจยังไม่เป็นข้อมูลล่าสุด</span><button type="button" className="btn btn-primary btn-sm" disabled={refreshing || actionBusy} onClick={() => setRetryKey((key) => key + 1)}>{refreshing ? "กำลังลอง..." : "ลองใหม่"}</button></div> : null}
      <div className="board-toolbar">
        <div><h2>{view === "history" ? "ประวัติออเดอร์" : "คิวอาหาร"}</h2><span className="muted" style={{ fontSize: 12 }}>รอคิว {activeOrders.filter((order) => order.status === "waiting").length} · กำลังทำ {activeOrders.filter((order) => order.status === "cooking").length} · แสดง {ordersToRender.length} ออเดอร์</span></div>
        <div className="board-filters">
          {view === "active" ? <select aria-label="กรองสถานะออเดอร์" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">ทุกสถานะ</option><option value="waiting">รอคิว</option><option value="cooking">กำลังทำ</option></select> : null}
          <select aria-label="กรองโต๊ะ" value={tableFilter} onChange={(event) => setTableFilter(event.target.value)}><option value="all">ทุกโต๊ะ</option>{tables.map((table) => <option key={table} value={table}>โต๊ะ {table}</option>)}</select>
        </div>
      </div>
      {!ordersToRender.length ? <div className="muted" style={{ fontSize: 13, padding: "20px 0", textAlign: "center" }}>{loadError && !orders.length ? "ยังโหลดรายการไม่ได้ กดลองใหม่" : view === "history" ? "ยังไม่มีประวัติตามตัวกรองนี้" : activeOrders.length ? "ไม่มีออเดอร์ตามตัวกรองนี้" : "ยังไม่มีออเดอร์ในคิว"}</div> : null}
      <div className="board-grid">
        {ordersToRender.map((o) => {
          const [label, badgeClass] = LABELS[o.status] || ["-", "badge-queue"];
          const groupedItems = aggregateItems(o.items);
          const createdAt = new Date(o.createdAt).getTime();
          const waitMinutes = Number.isNaN(createdAt) ? null : Math.max(0, Math.floor((now - createdAt) / 60000));
          return (
            <div key={o.id} className={`ticket st-${o.status}`}>
              <div className="ticket-header">
                <div className="thead">
                  <span className="ttable">โต๊ะ {o.table}</span>
                  <span className="tnum">{o.time}</span>
                </div>
                {view === "active" && waitMinutes !== null ? <div className={`ticket-time ${waitMinutes >= 15 ? "long-wait" : ""}`}>สั่งมาแล้ว {waitMinutes} นาที</div> : null}
                {view === "history" && o.createdAt ? <div className="ticket-time">{new Date(o.createdAt).toLocaleDateString("th-TH")}</div> : null}
                {o.paid ? <div className="paid-badge">✓ ชำระเงินแล้ว</div> : null}
                <div className="badge-wrap">
                  <div className={`badge ${badgeClass}`} style={{ marginBottom: 0 }}>
                    {label} · #{o.orderNumber ?? o.id}
                  </div>
                </div>
              </div>
              <div className="item-list">
                {groupedItems.map((it) => {
                  const isDone = it.status === "done";
                  const isCancelled = it.status === "cancelled";
                  const itemBusyKey = (it.ids || [it.id]).join(",");
                  return (
                    <div key={`${it.name}-${it.note || ""}-${it.price}-${it.status}-${it.pickupStatus}`} className={`item-row ${isDone ? "is-done" : ""} ${isCancelled ? "is-cancelled" : ""}`}>
                      <div className="item-info">
                        <div className="item-name">{it.name}</div>
                        {it.note ? <div className="item-note">{it.note}</div> : null}
                        {isDone ? (
                          <div className={`pickup-badge ${it.pickupStatus === "received" ? "pickup-received" : "pickup-pending"}`}>
                            {it.pickupStatus === "received" ? "รับอาหารเสร็จสิ้น" : "ยังไม่รับอาหาร"}
                          </div>
                        ) : null}
                        {isCancelled ? <div className="pickup-badge" style={{ background: "var(--clay-bg)", color: "var(--clay)" }}>ยกเลิกแล้ว</div> : null}
                      </div>
                      <div className="item-actions">
                        <span className="item-qty">×{it.qty}</span>
                        {view === "active" && o.status === "cooking" && !isCancelled ? (
                          isDone ? (
                            <span className="item-done-badge">✓ เสร็จสิ้น</span>
                          ) : (
                            <button type="button" className="item-done-btn" disabled={actionBusy || Boolean(loadError)} onClick={() => kitchenItemDone(o, it)}>{itemBusyId === itemBusyKey ? "กำลังบันทึก..." : "เสร็จสิ้น"}</button>
                          )
                        ) : null}
                        {view === "active" && o.status === "waiting" && !o.paid && !isCancelled && !isDone ? (
                          <button type="button" className="item-cancel-btn" disabled={actionBusy || Boolean(loadError)} onClick={() => kitchenItemCancel(o, it)}>{itemBusyId === itemBusyKey ? "กำลังบันทึก..." : "ยกเลิก"}</button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="ticket-footer">
                {view === "active" && o.status === "waiting" ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-block btn-sm"
                    disabled={actionBusy || Boolean(loadError)}
                    onClick={() => kitchenAdvance(o)}
                  >
                    {busyId === o.id ? "กำลังบันทึก..." : "รับออเดอร์"}
                  </button>
                ) : null}
                {view === "active" && o.status === "cooking" ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-block btn-sm"
                    disabled={actionBusy || Boolean(loadError)}
                    onClick={() => kitchenAllItemsDone(o)}
                  >
                    {itemBusyId === `all-${o.id}` ? "กำลังอัปเดต..." : busyId === o.id ? "กำลังบันทึก..." : "เสร็จสิ้นทั้งหมด"}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      </>
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
          { icon: "🍳", label: "ออเดอร์", active: view === "active", onClick: () => setView("active") },
          { icon: "📋", label: "ประวัติ", active: view === "history", onClick: () => setView("history") },
          { icon: "↪", label: "ออกจากระบบ", onClick: logoutUser },
        ]
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
