import React from "react";

export default function CustomerMenuTab({
  customer,
  filteredItems,
  money,
  catEmoji,
  categories,
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
          style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontFamily: "inherit", fontSize: 13.5, color: "var(--ink)" }}
        />
      </div>
      <div className="cat-scroll">
        {categories.map((cat) => (
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
          filteredItems.map((it) => {
            const isAvailable = it.active ?? it.status !== "unavailable";
            return (
              <div key={it.id} className={`menu-item ${!isAvailable ? "soldout" : ""}`}>
                <div className="mi-left">
                  <div className="mi-thumb">{catEmoji[it.category] || catEmoji[customer.category] || "🍽️"}</div>
                  <div>
                    <div className="mi-name">{it.name}</div>
                    {it.sku ? <div className="mi-sku">SKU: {it.sku}</div> : null}
                    <div className="mi-price">{money(it.price)}</div>
                    {!isAvailable ? (
                      <div style={{ fontSize: 11, color: "var(--clay)", fontWeight: 700, marginTop: 2 }}>
                        หมดชั่วคราว
                      </div>
                    ) : null}
                  </div>
                </div>
                <button type="button" className="add-mini" disabled={!isAvailable} onClick={() => onOpenItem(it.id)}>
                  +
                </button>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="glyph">🍽️</div>ไม่พบเมนูที่ค้นหา
          </div>
        )}
      </div>
    </>
  );
}