import React from "react";

// เนื้อหาแท็บตะกร้าลูกค้า: แก้จำนวน/ตัวเลือก ตรวจปัญหารายการ และส่งออเดอร์
export default function CustomerCartTab({
  customer,
  cartTotal,
  money,
  submitting,
  submitError,
  cartIssues,
  pendingRequest,
  onSetTab,
  onRemoveCart,
  onEditCart,
  onCartQty,
  onConfirmOrder,
}) {
  if (!customer.cart.length) {
    return (
      <div className="empty-state">
        <div className="glyph">🧺</div>ยังไม่มีสินค้าในตะกร้า
        <div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ marginTop: 14 }}
            onClick={() => onSetTab("menu")}
          >
            ไปเลือกเมนู
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="muted cart-help">รายการในตะกร้ายังไม่ได้ส่งเข้าครัว แก้ไขจำนวนและตัวเลือกได้ก่อนยืนยัน</p>
      {customer.cart.map((item, index) => (
        <div key={index} className="cart-row">
          <div className="cart-description">
            <div className="cn">{item.name}</div>
            {item.note ? <div className="cs">{item.note}</div> : null}
            <div className="cs">{money(item.price)} / รายการ</div>
            {cartIssues[index] ? (
              <div className="cart-issue">{cartIssues[index]}</div>
            ) : null}
            <div className="cart-controls">
              <div className="qty-stepper">
                <button
                  type="button"
                  disabled={submitting || item.qty <= 1}
                  aria-label={`ลดจำนวน ${item.name}`}
                  onClick={() => onCartQty(index, -1)}
                >
                  −
                </button>
                <span>{item.qty}</span>
                <button
                  type="button"
                  disabled={submitting || item.qty >= 99}
                  aria-label={`เพิ่มจำนวน ${item.name}`}
                  onClick={() => onCartQty(index, 1)}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                disabled={submitting}
                className="text-button"
                onClick={() => onEditCart(index)}
              >
                แก้ตัวเลือก
              </button>
            </div>
          </div>
          <div className="cart-price">
            <div className="cp">{money(item.price * item.qty)}</div>
            <button
              type="button"
              className="text-button danger"
              disabled={submitting}
              aria-label={`ลบ ${item.name}`}
              onClick={() => onRemoveCart(index)}
            >
              ลบ
            </button>
          </div>
        </div>
      ))}
      <div className="cart-total"><span>ยอดรวม</span><span>{money(cartTotal)}</span></div>
      {submitError ? <p className="feedback-banner error" role="alert">{submitError}</p> : null}
      <button
        type="button"
        className="btn btn-primary btn-block"
        style={{ marginTop: 14 }}
        onClick={onConfirmOrder}
        disabled={submitting || (!pendingRequest && cartIssues.some(Boolean))}
        aria-busy={submitting}
      >
        {submitting ? "กำลังส่งออเดอร์..." : "ยืนยันส่งออเดอร์"}
      </button>
    </>
  );
}
