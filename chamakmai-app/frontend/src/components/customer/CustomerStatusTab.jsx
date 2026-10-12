import React from "react";

const STATUS_LABELS = {
  waiting: ["รอคิว", "badge-queue"],
  cooking: ["กำลังทำ", "badge-cooking"],
  served: ["เสร็จสิ้น", "badge-done"],
  completed: ["ชำระเงินแล้ว", "badge-done"],
  cancelled: ["ยกเลิกแล้ว", "badge-cooking"],
  done: ["พร้อมรับ", "badge-done"],
};

// รวมเมนูซ้ำในออเดอร์เดียวกัน เพื่อแสดงจำนวนรวมและยืนยันรับอาหารเป็นกลุ่ม
function groupOrderItems(items) {
  const map = new Map();
  items.forEach((it) => {
    const key = `${it.name}||${it.note || ""}||${it.price}||${it.status}`;
    const existing = map.get(key);
    if (existing) {
      existing.qty += it.qty;
      if (it.id != null) existing.ids.push(it.id);
    } else {
      map.set(key, {
        ids: it.id != null ? [it.id] : [],
        name: it.name,
        note: it.note,
        price: it.price,
        qty: it.qty,
        status: it.status,
      });
    }
  });
  return Array.from(map.values());
}

// รายการออเดอร์ที่กำลังดำเนินการ พร้อมสถานะอาหารและปุ่มยืนยันรับอาหาร
export default function CustomerStatusTab({
  myOrders,
  money,
  onConfirmReadyItem,
  confirmingReadyId,
}) {
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
        const groupedItems = groupOrderItems(o.items || []);
        return (
          <div key={o.id} className="status-block">
            <div className="sh">
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                ออเดอร์ #{o.orderNumber ?? o.id} · {o.time}
              </div>
              <span className={`badge ${badgeClass}`}>{label}</span>
            </div>
            {groupedItems.map((it, idx) => (
              <div
                key={it.ids.join(",") || idx}
                style={{
                  fontSize: 13,
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 10,
                  padding: "9px 0",
                  minHeight: 76,
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ lineHeight: 1.45, minHeight: 22 }}>
                    {it.name} {it.note ? `(${it.note})` : ""} x{it.qty}
                  </div>
                  <div
                    style={{
                      minHeight: 34,
                      display: "flex",
                      alignItems: "flex-end",
                      paddingTop: 5,
                    }}
                  >
                    {it.status === "cancelled" ? (
                      <div
                        style={{ fontSize: 11.5, color: "var(--clay)", fontWeight: 700 }}
                      >
                        ยกเลิกแล้ว
                      </div>
                    ) : null}
                    {it.status === "done" ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: "7px 10px", fontSize: 12 }}
                        disabled={Boolean(confirmingReadyId)}
                        onClick={() => onConfirmReadyItem(it)}
                      >
                        {it.ids.some((id) => (confirmingReadyId || "").split(",").includes(String(id)))
                          ? "กำลังยืนยัน..."
                          : "รับอาหารแล้ว"}
                      </button>
                    ) : null}
                    {it.status === "received" ? (
                      <div
                        style={{ fontSize: 11.5, color: "var(--jade)", fontWeight: 700 }}
                      >
                        ✓ รับอาหารแล้ว
                      </div>
                    ) : null}
                  </div>
                </div>
                <span
                  style={{
                    whiteSpace: "nowrap",
                    paddingTop: 2,
                    color: it.status === "cancelled" ? "var(--ink-soft)" : undefined,
                    textDecoration: it.status === "cancelled" ? "line-through" : undefined,
                  }}
                >
                  {money(it.price * it.qty)}
                </span>
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
