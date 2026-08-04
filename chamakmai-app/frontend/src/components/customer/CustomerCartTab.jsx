import React from "react";

export default function CustomerCartTab({ customer, cartTotal, money, onSetTab, onRemoveCart, onConfirmOrder }) {
  if (!customer.cart.length) {
    return (
      <div className="empty-state">
        <div className="glyph">🧺</div>ยังไม่มีสินค้าในตะกร้า
        <button type="button" className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => onSetTab("menu")}>
          ไปเลือกเมนู
        </button>
      </div>
    );
  }

  return (
    <>
      <div>
        {customer.cart.map((it, index) => (
          <div key={index} className="cart-row">
            <div>
              <div className="cn">{it.name} {it.qty > 1 ? `×${it.qty}` : ""}</div>
              <div className="cs">{it.note || ""}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div className="cp">{money(it.price * it.qty)}</div>
              <button
                type="button"
                onClick={() => onRemoveCart(index)}
                style={{ border: "none", background: "none", color: "var(--clay)", fontSize: 11.5, fontWeight: 700 }}
              >
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}>
        <span>ยอดรวม</span>
        <span>{money(cartTotal)}</span>
      </div>
      <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 14, padding: 13 }} onClick={onConfirmOrder}>
        ยืนยันรายการ
      </button>
    </>
  );
}
