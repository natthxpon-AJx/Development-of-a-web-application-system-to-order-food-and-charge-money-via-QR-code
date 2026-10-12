import React from "react";

// รวมรายการซ้ำที่มีชื่อ ตัวเลือก ราคา และสถานะตรงกันสำหรับแสดงประวัติ
function groupItems(items) {
  const map = new Map();
  items.forEach((it) => {
    const key = `${it.name}||${it.note || ""}||${it.price}||${it.status}`;
    const existing = map.get(key);
    if (existing) {
      existing.qty += it.qty;
    } else {
      map.set(key, {
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

// แสดงรายละเอียดออเดอร์ย้อนหลังของโต๊ะ รวมยอดและรายการที่ยกเลิก
export default function CustomerHistoryTab({
  historyOrders,
  money,
}) {
  if (!historyOrders.length) {
    return (
      <div className="empty-state">
        <div className="glyph">📜</div>ยังไม่มีประวัติการสั่งซื้อของโต๊ะนี้
      </div>
    );
  }

  return (
    <>
      {historyOrders.map((order) => {
        const items = groupItems(order.items || []);
        return (
          <div key={order.id} className="status-block">
            <div className="sh">
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                ออเดอร์ #{order.orderNumber ?? order.id} · {order.time}
              </div>
              <span
                className={`badge ${
                  order.status === "cancelled"
                    ? "badge-cooking"
                    : order.paid
                      ? "badge-done"
                      : "badge-queue"
                }`}
              >
                {order.status === "cancelled" ? "ยกเลิกแล้ว" : order.paid ? "ชำระแล้ว" : "รอชำระ"}
              </span>
            </div>
            {items.map((it, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: 13,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "6px 0",
                  color: it.status === "cancelled" ? "var(--ink-soft)" : undefined,
                }}
              >
                <span>
                  {it.name} {it.note ? `(${it.note})` : ""} ×{it.qty}
                  {it.status === "cancelled" ? (
                    <span style={{ display: "block", color: "var(--clay)", fontSize: 11.5 }}>
                      ยกเลิก · ไม่นับในยอดที่ต้องชำระ
                    </span>
                  ) : null}
                </span>
                <span
                  style={{
                    whiteSpace: "nowrap",
                    textDecoration: it.status === "cancelled" ? "line-through" : undefined,
                  }}
                >
                  {money(it.price * it.qty)}
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: 6,
                fontWeight: 700,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{order.paid ? "ยอดที่ชำระ" : "ยอดที่ต้องชำระ"}</span>
              <span>{money(order.total)}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}
