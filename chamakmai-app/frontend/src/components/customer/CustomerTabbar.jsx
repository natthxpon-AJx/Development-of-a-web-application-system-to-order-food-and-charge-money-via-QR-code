import React from "react";

export default function CustomerTabbar({ tab, onSetTab }) {
  const tabs = [["menu", "🍜", "เมนู"], ["status", "🧾", "สถานะ"]];

  return (
    <div className="phone-tabbar">
      {tabs.map(([key, icon, label]) => (
        <button key={key} type="button" className={tab === key ? "active" : ""} onClick={() => onSetTab(key)}>
          <span className="ico">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
