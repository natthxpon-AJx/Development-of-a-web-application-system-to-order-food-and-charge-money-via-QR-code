import React from "react";

export default function CustomerDetailModal({
  detailItem,
  customer,
  money,
  onClose,
  onSetOpt,
  onQty,
  onAddToCart,
}) {
  if (!detailItem) return null;

  return (
    <div
      style={{ position: "absolute", inset: 0, background: "rgba(44,33,24,0.45)", display: "flex", alignItems: "flex-end", zIndex: 60 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{ background: "var(--paper)", width: "100%", borderRadius: "20px 20px 0 0", padding: "20px 18px 22px", maxHeight: "88%", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 19 }}>{detailItem.name}</div>
            <div className="mi-price" style={{ fontSize: 15, marginTop: 3 }}>
              {money(detailItem.price)}
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ border: "none", background: "var(--cream-100)", width: 30, height: 30, borderRadius: "50%", fontSize: 15 }}>
            ✕
          </button>
        </div>
        <hr className="divider" />
        {detailItem.sweet ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>ระดับความหวาน</div>
            <div className="pill-group">
              {['หวานน้อย', 'หวานปกติ', 'หวานมาก'].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`pill ${customer.opts.sweet === value ? "active" : ""}`}
                  onClick={() => onSetOpt("sweet", value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {detailItem.spicy ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>ระดับความเผ็ด</div>
            <div className="pill-group">
              {['ไม่เผ็ด', 'เผ็ดน้อย', 'เผ็ดปกติ', 'เผ็ดมาก'].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`pill ${customer.opts.spicy === value ? "active" : ""}`}
                  onClick={() => onSetOpt("spicy", value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {detailItem.sauce ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>เลือกซอส</div>
            <div className="pill-group">
              {['ซอสมะเขือเทศ', 'ซอสพริก'].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`pill ${customer.opts.sauce === value ? "active" : ""}`}
                  onClick={() => onSetOpt("sauce", value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>จำนวน</div>
          <div className="qty-stepper">
            <button type="button" onClick={() => onQty(-1)}>
              −
            </button>
            <span style={{ minWidth: 16, textAlign: "center", fontWeight: 700 }}>{customer.opts.qty || 1}</span>
            <button type="button" onClick={() => onQty(1)}>
              +
            </button>
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 18, padding: 13 }} onClick={onAddToCart}>
          เพิ่มลงตะกร้า · {money(detailItem.price * (customer.opts.qty || 1))}
        </button>
      </div>
    </div>
  );
}
