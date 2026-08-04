import React from "react";

// แปลชื่อคีย์ใน options_config เป็นภาษาไทยให้อ่านง่าย ถ้าไม่เจอในนี้จะโชว์คีย์ดิบแทน
const OPTION_LABELS = {
  sweetness: "ระดับความหวาน",
  spicy: "ระดับความเผ็ด",
  spiciness: "ระดับความเผ็ด",
  topping: "ท็อปปิ้ง",
  sauce: "เลือกซอส",
  size: "ขนาด",
};

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

  const optionGroups = Object.entries(detailItem.options || {});

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
            {detailItem.sku ? (
              <div className="mi-sku" style={{ marginTop: 2 }}>SKU: {detailItem.sku}</div>
            ) : null}
            <div className="mi-price" style={{ fontSize: 15, marginTop: 3 }}>
              {money(detailItem.price)}
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ border: "none", background: "var(--cream-100)", width: 30, height: 30, borderRadius: "50%", fontSize: 15 }}>
            ✕
          </button>
        </div>
        <hr className="divider" />

        {optionGroups.map(([key, values]) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>{OPTION_LABELS[key] || key}</div>
            <div className="pill-group">
              {(values || []).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`pill ${customer.opts[key] === value ? "active" : ""}`}
                  onClick={() => onSetOpt(key, value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}

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