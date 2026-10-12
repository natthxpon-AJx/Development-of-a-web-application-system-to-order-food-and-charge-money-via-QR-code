import React, { useRef, useState } from "react";
import { createOptionGroup, deleteOptionGroup, updateOptionGroup } from "../../services/api";

const emptyItem = () => ({ name: "", priceDelta: "0" });

// ตัวแก้ไขกลุ่มตัวเลือกที่ใช้ร่วมกับแบบฟอร์มเมนูของเจ้าของร้าน
export default function OptionTemplateEditor({
  optionGroups,
  selectedIds,
  onSelectedIdsChange,
  onGroupsChange,
  onError,
  disabled = false,
  onBusyChange,
}) {
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [validationError, setValidationError] = useState("");
  const blocked = busy || disabled;

  function reportError(message) {
    setValidationError(message);
    onError?.(message);
  }

  function beginSaving() {
    if (busyRef.current || disabled) return false;
    busyRef.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setValidationError("");
    return true;
  }

  function finishSaving() {
    busyRef.current = false;
    setBusy(false);
    onBusyChange?.(false);
  }

  function startCreate() {
    if (busyRef.current || disabled) return;
    if (draft && !window.confirm("ยกเลิกข้อมูลกลุ่มตัวเลือกที่กำลังแก้ไขหรือไม่?")) return;
    setValidationError("");
    setDraft({ id: null, name: "", required: false, maxSelections: 1, items: [emptyItem()] });
  }

  function startEdit(group) {
    if (busyRef.current || disabled) return;
    if (draft && !window.confirm("ยกเลิกข้อมูลกลุ่มตัวเลือกที่กำลังแก้ไขหรือไม่?")) return;
    setValidationError("");
    setDraft({
      id: group.id,
      name: group.name,
      required: group.required,
      maxSelections: group.maxSelections,
      items: group.items.map((item) => ({ name: item.name, priceDelta: String(item.priceDelta) })),
    });
  }

  function updateDraft(patch) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function updateDraftItem(index, patch) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  async function saveDraft() {
    if (!draft || busyRef.current || disabled) return;
    if (!draft.name.trim()) {
      reportError("กรุณากรอกชื่อกลุ่มตัวเลือก");
      return;
    }
    if (!draft.items.length || draft.items.some((item) => !item.name.trim())) {
      reportError("กรุณากรอกชื่อตัวเลือกย่อยให้ครบอย่างน้อย 1 รายการ");
      return;
    }
    if (draft.items.some((item) => item.priceDelta === "" || !Number.isFinite(Number(item.priceDelta)))) {
      reportError("กรุณากรอกราคาเพิ่มเป็นตัวเลขให้ครบ");
      return;
    }

    const itemNames = draft.items.map((item) => item.name.trim().toLocaleLowerCase("th-TH"));
    if (new Set(itemNames).size !== itemNames.length) {
      reportError("ชื่อตัวเลือกย่อยในกลุ่มต้องไม่ซ้ำกัน");
      return;
    }

    const maximum = Number(draft.maxSelections);
    if (!Number.isInteger(maximum) || maximum < 1 || maximum > draft.items.length) {
      reportError("จำนวนที่เลือกได้ต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึงจำนวนตัวเลือกย่อย");
      return;
    }

    const items = draft.items.map((item) => ({
      name: item.name.trim(),
      priceDelta: Number(item.priceDelta),
    }));
    if (!beginSaving()) return;
    try {
      const payload = {
        name: draft.name.trim(),
        required: draft.required,
        maxSelections: maximum,
        items,
      };
      // สร้างหรืออัปเดตกลุ่มตัวเลือกใน Backend แล้วส่งข้อมูลที่บันทึกแล้วกลับให้หน้า Owner
      const saved = draft.id ? await updateOptionGroup(draft.id, payload) : await createOptionGroup(payload);
      onGroupsChange((current) => (draft.id ? current.map((group) => (group.id === saved.id ? saved : group)) : [...current, saved]));
      setDraft(null);
    } catch (error) {
      reportError(error.message || "บันทึกกลุ่มตัวเลือกไม่สำเร็จ");
    } finally {
      finishSaving();
    }
  }

  async function removeGroup(group) {
    if (busyRef.current || disabled) return;
    if (!window.confirm(`ลบกลุ่มตัวเลือก "${group.name}" หรือไม่?`)) return;

    if (!beginSaving()) return;
    try {
      // ลบกลุ่มตัวเลือกใน Backend ก่อนเอาออกจากตัวเลือกและรายการบนหน้า Owner
      await deleteOptionGroup(group.id);
      onGroupsChange((current) => current.filter((item) => item.id !== group.id));
      onSelectedIdsChange(selectedIds.filter((id) => id !== group.id));
      if (draft?.id === group.id) setDraft(null);
    } catch (error) {
      reportError(error.message || "ลบกลุ่มตัวเลือกไม่สำเร็จ");
    } finally {
      finishSaving();
    }
  }

  function toggleSelected(id) {
    if (busyRef.current || disabled) return;
    onSelectedIdsChange(
      selectedIds.includes(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id]
    );
  }

  return (
    <div className="option-template-editor" style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
      <style>{`
        .option-template-section-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
        .option-template-section-title { font-size: 15.5px; }
        .option-template-list { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); width: 100%; }
        .option-template-card { background: var(--paper); border: 1px solid var(--line); border-radius: 12px; padding: 11px 12px; }
        .option-template-card-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 12px; }
        .option-template-group { display: flex; align-items: center; gap: 8px; min-width: 0; cursor: pointer; }
        .option-template-group > input { margin: 0; flex: 0 0 auto; }
        .option-template-group-copy { display: block; min-width: 0; }
        .option-template-group-name { display: block; color: var(--ink); font-size: 15.5px; line-height: 1.3; }
        .option-template-details { display: block; margin-top: 4px; color: var(--ink-soft); font-size: 13px; line-height: 1.3; }
        .option-template-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
        .option-template-chip { display: inline-flex; align-items: center; max-width: 100%; padding: 4px 9px; border-radius: 999px; background: var(--cream-100); color: var(--brown-800); font-size: 12.5px; line-height: 1.25; overflow-wrap: anywhere; }
        .option-template-actions { display: flex; align-items: flex-start; gap: 5px; flex-shrink: 0; }
        .option-template-actions .btn { padding: 5px 9px; font-size: 12px; line-height: 1.2; }
        .option-template-draft { margin-top: 14px; padding: 12px; background: var(--cream-100); border-radius: 10px; }
        .option-template-draft input { width: 100%; min-width: 0; border: 1px solid var(--line); border-radius: 9px; padding: 10px; font: inherit; background: var(--paper); }
        .option-template-draft input[type=checkbox] { width: auto; }
        .option-template-draft-actions { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
        .option-template-item-row { display: grid; grid-template-columns: minmax(0, 1fr) 120px auto; gap: 6px; margin-bottom: 6px; }
        .option-template-number-input { max-width: 120px; }
        @media (max-width: 520px) {
          .option-template-list { width: 100%; max-width: none; }
          .option-template-card { padding: 10px; }
          .option-template-card-header { gap: 8px; }
          .option-template-actions { gap: 4px; }
          .option-template-actions .btn { padding: 5px 7px; font-size: 11px; }
          .option-template-item-row { grid-template-columns: minmax(0, 1fr) 100px; }
          .option-template-item-row .btn-danger { grid-column: 1 / -1; justify-self: start; }
        }
        @media (max-width: 360px) {
          .option-template-card-header { grid-template-columns: 1fr; }
          .option-template-actions { justify-content: flex-end; }
        }
        @media (min-width: 521px) and (max-width: 768px) {
          .option-template-list { width: 100%; max-width: none; }
        }
      `}</style>
      <div className="option-template-section-header">
        <div className="option-template-section-title" style={{ fontWeight: 700 }}>ตัวเลือกเสริมของเมนู</div>
        <button type="button" className="btn" onClick={startCreate} disabled={blocked}>สร้างกลุ่มตัวเลือก</button>
      </div>
      {optionGroups.length ? (
        <div className="option-template-list">
          {optionGroups.map((group) => (
            <div key={group.id} className="option-template-card">
              <div className="option-template-card-header">
                <label className="option-template-group">
                  <input type="checkbox" checked={selectedIds.includes(group.id)} onChange={() => toggleSelected(group.id)} disabled={blocked} />
                  <span className="option-template-group-copy">
                    <strong className="option-template-group-name">{group.name}</strong>
                    <span className="option-template-details">
                      {group.required ? "บังคับเลือก" : "ไม่บังคับ"} · เลือกได้ {group.maxSelections} รายการ
                    </span>
                    <span className="option-template-chips" aria-label={`ตัวเลือกในกลุ่ม ${group.name}`}>
                      {group.items.map((item, index) => (
                        <span key={`${group.id}-${item.name}-${index}`} className="option-template-chip">
                          {item.name}{item.priceDelta ? ` +฿${item.priceDelta}` : ""}
                        </span>
                      ))}
                    </span>
                  </span>
                </label>
                <div className="option-template-actions">
                  <button type="button" className="btn" onClick={() => startEdit(group)} disabled={blocked}>แก้ไข</button>
                  <button type="button" className="btn btn-danger" onClick={() => removeGroup(group)} disabled={blocked}>ลบ</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="muted" style={{ fontSize: 13 }}>ยังไม่มีกลุ่มตัวเลือก</div>}
      {validationError ? <div className="load-error" style={{ marginTop: 10 }} role="alert">{validationError}</div> : null}

      {draft ? (
        <fieldset className="option-template-draft owner-form" disabled={blocked}>
          <div className="form-grid">
            <div className="field">
              <label>ชื่อกลุ่ม</label>
              <input aria-label="ชื่อกลุ่มตัวเลือก" value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} placeholder="เช่น เลือกโปรตีน" />
            </div>
            <div className="field">
              <label>เลือกได้สูงสุดกี่รายการ</label>
              <input aria-label="จำนวนตัวเลือกที่เลือกได้สูงสุด" className="option-template-number-input" type="number" min="1" max={draft.items.length || 1} step="1" value={draft.maxSelections} onChange={(event) => updateDraft({ maxSelections: event.target.value })} />
            </div>
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginBottom: 10 }}>
            <input type="checkbox" checked={draft.required} onChange={(event) => updateDraft({ required: event.target.checked })} />
            กลุ่มนี้บังคับเลือก
          </label>
          {draft.items.map((item, index) => (
            <div key={index} className="option-template-item-row">
              <input value={item.name} onChange={(event) => updateDraftItem(index, { name: event.target.value })} placeholder="ชื่อตัวเลือก เช่น กุ้ง" aria-label={`ชื่อตัวเลือกที่ ${index + 1}`} />
              <input type="number" step="0.01" value={item.priceDelta} onChange={(event) => updateDraftItem(index, { priceDelta: event.target.value })} placeholder="ราคาเพิ่ม" aria-label={`ราคาเพิ่มของตัวเลือกที่ ${index + 1}`} />
              <button type="button" className="btn btn-danger" onClick={() => updateDraft({ items: draft.items.filter((_, itemIndex) => itemIndex !== index) })} disabled={draft.items.length <= 1}>ลบ</button>
            </div>
          ))}
          <div className="option-template-draft-actions">
            <button type="button" className="btn" onClick={() => updateDraft({ items: [...draft.items, emptyItem()] })}>เพิ่มตัวเลือกย่อย</button>
            <button type="button" className="btn btn-primary" onClick={saveDraft} disabled={blocked}>{busy ? "กำลังบันทึก…" : "บันทึกกลุ่มตัวเลือก"}</button>
            <button type="button" className="btn" onClick={() => { setDraft(null); setValidationError(""); }} disabled={blocked}>ยกเลิก</button>
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
