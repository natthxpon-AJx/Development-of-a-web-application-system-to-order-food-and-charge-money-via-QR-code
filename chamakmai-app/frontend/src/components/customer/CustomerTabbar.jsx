import React from "react";

export default function CustomerTabbar({ tab, onSetTab, cartCount = 0, readyCount = 0, showHistory = false }) {
  const tabs = [
    ["menu", "🍜", "เมนู"],
    ["status", "🧾", `สถานะ${readyCount ? ` (${readyCount})` : ""}`],
  ];

  return (
    <nav className="phone-tabbar" aria-label="เมนูลูกค้า">
      {tabs.map(([key, icon, label]) => {
        return (
          <button
            key={key}
            type="button"
            aria-current={tab === key ? "page" : undefined}
            className={tab === key ? "active" : ""}
            onClick={() => onSetTab(key)}
            style={{ transition: "opacity 220ms ease, max-width 220ms ease, width 220ms ease, transform 220ms ease, padding 220ms ease, margin 220ms ease" }}
          >
            <span className="ico">{icon}</span>
            {label}
          </button>
        );
      })}
    </nav>
  );
}
