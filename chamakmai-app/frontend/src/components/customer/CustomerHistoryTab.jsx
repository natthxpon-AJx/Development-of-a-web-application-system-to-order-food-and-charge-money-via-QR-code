import React from "react";

export default function CustomerHistoryTab({ paidForTable, money }) {
  if (!paidForTable.length) {
    return (
      <div className="empty-state">
        <div className="glyph">📜</div>ยังไม่มีประวัติการสั่งซื้อ
      </div>
    );
  }

  return (
    <>
      {paidForTable.map((p, index) => (
        <div key={index} className="status-block">
          <div className="sh">
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>บิลโต๊ะ {p.table} · {p.time}</div>
            <span className="badge badge-done">{p.method === "qr" ? "จ่ายผ่าน QR" : "เงินสด"}</span>
          </div>
          {p.items.map((it, idx) => (
            <div key={idx} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span>
                {it.name} ×{it.qty}
              </span>
              <span>{money(it.price * it.qty)}</span>
            </div>
          ))}
          <div style={{ marginTop: 6, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
            <span>ยอดรวม</span>
            <span>{money(p.amount)}</span>
          </div>
        </div>
      ))}
    </>
  );
}
