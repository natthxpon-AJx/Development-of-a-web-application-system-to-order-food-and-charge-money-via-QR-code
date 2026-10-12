import React from "react";
import CustomerModalFrame from "./CustomerModalFrame";

// หน้าต่างรายละเอียดเมนู: เลือกตัวเลือกเสริม ปรับจำนวน และยืนยันลงตะกร้า
export default function CustomerDetailModal({ detailItem, customer, money, onClose, onSetOpt, onQty, onAddToCart }) {
  if (!detailItem) return null;
  const groups = detailItem.optionGroups || [];
  const optionTotal = groups.reduce((sum, group) => {
    const selected = customer.opts[`group_${group.id}`] || [];
    return sum + group.items.filter((item) => selected.some((id) => String(id) === String(item.id))).reduce((total, item) => total + Number(item.priceDelta || 0), 0);
  }, 0);
  const canAdd = groups.every((group) => {
    const selected = customer.opts[`group_${group.id}`] || [];
    const valid = selected.filter((id) => group.items.some((item) => String(item.id) === String(id)));
    return (!group.required || valid.length > 0) && valid.length === selected.length && valid.length <= Number(group.maxSelections || 1);
  }) && (detailItem.active ?? detailItem.status !== "unavailable");

  function toggleOption(group, itemId) {
    const key = `group_${group.id}`;
    const selected = customer.opts[key] || [];
    const alreadySelected = selected.some((id) => String(id) === String(itemId));
    const max = Number(group.maxSelections || 1);
    if (alreadySelected) {
      if (max > 1 || !group.required) onSetOpt(key, selected.filter((id) => String(id) !== String(itemId)));
    } else if (max === 1) {
      onSetOpt(key, [itemId]);
    } else if (selected.length < max) {
      onSetOpt(key, [...selected, itemId]);
    }
  }

  return (
    <CustomerModalFrame titleId="customer-detail-title" onClose={onClose} sheet>
      <div className="detail-title-row">
        <div>
          <h2 id="customer-detail-title">{detailItem.name}</h2>
          <div className="mi-price">{money(Number(detailItem.price))}</div>
        </div>
        <button type="button" className="icon-button" aria-label="ปิดรายละเอียดเมนู" onClick={onClose}>✕</button>
      </div>
      <hr className="divider" />
      {groups.map((group) => {
        const selected = customer.opts[`group_${group.id}`] || [];
        const max = Number(group.maxSelections || 1);
        const full = selected.length >= max;
        return (
          <fieldset className="option-group" key={group.id}>
            <legend>{group.name} <span className="muted">· {group.required ? "ต้องเลือก" : "ไม่จำเป็น"} · สูงสุด {max} รายการ</span></legend>
            {group.items.map((item) => {
              const checked = selected.some((id) => String(id) === String(item.id));
              const disabled = max > 1 && full && !checked;
              return (
                <label key={item.id} className={`option-choice ${checked ? "selected" : ""} ${disabled ? "disabled" : ""}`}>
                  <span>
                    <input type={max === 1 && group.required ? "radio" : "checkbox"} name={`customer-option-${group.id}`} checked={checked} disabled={disabled} onChange={() => toggleOption(group, item.id)} />
                    {item.name}
                  </span>
                  {Number(item.priceDelta || 0) !== 0 ? <strong>{Number(item.priceDelta) > 0 ? "+" : "−"}{money(Math.abs(Number(item.priceDelta)))}</strong> : null}
                </label>
              );
            })}
            {max > 1 && full ? <p className="option-feedback" role="status">เลือกครบ {max} รายการแล้ว ยกเลิกตัวเลือกเดิมเพื่อเลือกอย่างอื่น</p> : null}
            {max === 1 && !group.required && selected.length > 0 ? <button type="button" className="text-button" onClick={() => onSetOpt(`group_${group.id}`, [])}>ไม่เลือก{group.name}</button> : null}
          </fieldset>
        );
      })}
      <div className="quantity-row">
        <strong>จำนวน</strong>
        <div className="qty-stepper">
          <button type="button" aria-label="ลดจำนวน" disabled={(customer.opts.qty || 1) <= 1} onClick={() => onQty(-1)}>−</button>
          <span>{customer.opts.qty || 1}</span>
          <button type="button" aria-label="เพิ่มจำนวน" disabled={(customer.opts.qty || 1) >= 99} onClick={() => onQty(1)}>+</button>
        </div>
      </div>
      <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={onAddToCart} disabled={!canAdd}>
        {canAdd ? `${customer.editCartIndex != null ? "บันทึกการแก้ไข" : "เพิ่มลงตะกร้า"} · ${money((Number(detailItem.price) + optionTotal) * (customer.opts.qty || 1))}` : "กรุณาตรวจสอบตัวเลือกและความพร้อมของเมนู"}
      </button>
    </CustomerModalFrame>
  );
}
