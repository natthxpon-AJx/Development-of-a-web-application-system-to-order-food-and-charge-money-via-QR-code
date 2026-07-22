import React from "react";

export default function CustomerMenuTab({
  customer,
  filteredItems,
  money,
  catEmoji,
  menu,
  onSearch,
  onSetCat,
  onOpenItem,
}) {
  return (
    <>
      <div className="search-box">
        <span>🔍</span>
        <input
          type="text"
          onChange={(e) => onSearch(e.target.value)}
          value={customer.search}
          placeholder="ค้นหาเมนู..."
          style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontFamily: "inherit", fontSize: 13.5 }}
        />
      </div>
      <div className="cat-scroll">
        {Object.keys(menu).map((cat) => (
          <button
            key={cat}
            type="button"
            className={cat === customer.category ? "active" : ""}
            onClick={() => onSetCat(cat)}
          >
            {catEmoji[cat] || ""} {cat}
          </button>
        ))}
      </div>
      <div>
        {filteredItems.length ? (
          filteredItems.map((it) => (
            <div key={it.id} className={`menu-item ${!it.active ? "soldout" : ""}`}>
              <div className="mi-left">
                <div className="mi-thumb">{catEmoji[customer.category] || "🍽️"}</div>
                <div>
                  <div className="mi-name">{it.name}</div>
                  <div className="mi-price">{money(it.price)}</div>
                  {!it.active ? (
                    <div style={{ fontSize: 11, color: "var(--clay)", fontWeight: 700, marginTop: 2 }}>
                      หมดชั่วคราว
                    </div>
                  ) : null}
                </div>
              </div>
              <button type="button" className="add-mini" disabled={!it.active} onClick={() => onOpenItem(it.id)}>
                +
              </button>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="glyph">🍽️</div>ไม่พบเมนูที่ค้นหา
          </div>
        )}
      </div>
    </>
  );
}
