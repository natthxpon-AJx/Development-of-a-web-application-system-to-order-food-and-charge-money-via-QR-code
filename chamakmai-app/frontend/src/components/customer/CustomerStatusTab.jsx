import React from "react";

const STATUS_LABELS = {
  waiting: ["รอคิว", "badge-queue"],
  cooking: ["กำลังทำ", "badge-cooking"],
  served: ["เสร็จแล้ว", "badge-done"],
  completed: ["ชำระเงินแล้ว", "badge-done"],
  cancelled: ["ยกเลิกแล้ว", "badge-cooking"],
};

export default function CustomerStatusTab({ myOrders, money }) {
  if (!myOrders.length) {
    return (
      <div className="empty-state">
        <div className="glyph">🧾</div>ยังไม่มีออเดอร์ที่กำลังดำเนินการ
      </div>
    );
  }

  return (
    <>
      {myOrders.map((o) => {
        const [label, badgeClass] = STATUS_LABELS[o.status] || ["-", "badge-queue"];
        return (
          <div key={o.id} className="status-block">
            <div className="sh">
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                ออเดอร์ #{o.id} · {o.time}
              </div>
              <span className={`badge ${badgeClass}`}>{label}</span>
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
        );
      })}
    </>
  );
}