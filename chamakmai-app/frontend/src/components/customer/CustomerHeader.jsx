import React from "react";

export default function CustomerHeader({ tab, table, cartCount, onSetTab }) {
  const titles = { menu: "ร้านชาแมกไม้", cart: "ตะกร้าของฉัน", status: "สถานะออเดอร์", history: "ประวัติการสั่งซื้อ" };

  return (
    <div className="phone-header">
      <div className="row1">
        <div className="left-group">
          <div className="shopname">{titles[tab]}</div>
          <div className="table-chip">โต๊ะ {table}</div>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className={`header-action ${tab === "cart" ? "active" : ""}`}
            onClick={() => onSetTab("cart")}
          >
            🧺 ตะกร้า{cartCount ? ` (${cartCount})` : ""}
          </button>
          <button
            type="button"
            className={`header-action ${tab === "history" ? "active" : ""}`}
            onClick={() => onSetTab("history")}
          >
            📜 ประวัติ
          </button>
        </div>
      </div>
    </div>
  );
}
