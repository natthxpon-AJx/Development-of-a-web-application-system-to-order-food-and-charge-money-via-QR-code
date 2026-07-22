import React from "react";

export default function CustomerStatusTab({ myOrders, money }) {
  if (!myOrders.length) {
    return (
      <div className="empty-state">
        <div className="glyph">🧾</div>ยังไม่มีออเดอร์ที่กำลังดำเนินการ
      </div>
    );
  }

  const labels = { queue: ["รอคิว", "badge-queue"], cooking: ["กำลังทำ", "badge-cooking"], done: ["เสร็จแล้ว", "badge-done"] };

  return (
    <>
      {myOrders.map((o) => (
        <div key={o.id} className="status-block">
          <div className="sh">
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>
              ออเดอร์ {o.dispId} · {o.time}
            </div>
            <span className={`badge ${labels[o.status][1]}`}>{labels[o.status][0]}</span>
          </div>
          {o.items.map((it, idx) => (
            <div key={idx} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span>
                {it.name} {it.note ? `(${it.note})` : ""} ×{it.qty}
              </span>
              <span>{money(it.price * it.qty)}</span>
            </div>
          ))}
          {o.paid ? (
            <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--jade)", fontWeight: 700 }}>
              ✓ ชำระเงินแล้ว
            </div>
          ) : (
            <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--ink-soft)" }}>
              หากต้องการเช็คบิล กรุณาไปที่เคาน์เตอร์แคชเชียร์
            </div>
          )}
        </div>
      ))}
    </>
  );
}
