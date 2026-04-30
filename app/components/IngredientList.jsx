"use client";
import { useRef, useState } from "react";
import { Button, Input, AutoComplete } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

// ── Unit definitions with aliases for autocomplete ────────────────────────────
const UNITS = [
  // Volume
  { label: "teaspoon", value: "teaspoon", aliases: ["tsp", "t"] },
  { label: "tablespoon", value: "tablespoon", aliases: ["tbsp", "tbs", "tb", "T"] },
  { label: "cup", value: "cup", aliases: ["c", "cups"] },
  { label: "fluid oz", value: "fl oz", aliases: ["floz", "fl", "fluid oz"] },
  { label: "ml", value: "ml", aliases: ["millilitre", "milliliter", "mls"] },
  { label: "litre", value: "litre", aliases: ["liter", "l", "L"] },
  // Weight
  { label: "gram", value: "g", aliases: ["gram", "grams", "gr"] },
  { label: "kg", value: "kg", aliases: ["kilogram", "kilograms"] },
  { label: "oz", value: "oz", aliases: ["ounce", "ounces"] },
  { label: "lb", value: "lb", aliases: ["pound", "pounds", "lbs"] },
  // Misc
  { label: "pinch", value: "pinch", aliases: ["pn"] },
  { label: "dash", value: "dash", aliases: [] },
  { label: "handful", value: "handful", aliases: ["hndf"] },
  { label: "slice", value: "slice", aliases: ["slices"] },
  { label: "piece", value: "piece", aliases: ["pcs", "pieces", "pc"] },
  { label: "can", value: "can", aliases: ["tin", "cans"] },
  { label: "sheet", value: "sheet", aliases: ["sheets"] },
  { label: "sprig", value: "sprig", aliases: ["sprigs"] },
  { label: "clove", value: "clove", aliases: ["cloves"] },
  { label: "bunch", value: "bunch", aliases: ["bunches"] },
];

function getUnitOptions(input) {
  if (!input) return UNITS.map((u) => ({ value: u.value, label: u.label }));
  const lower = input.toLowerCase();
  return UNITS.filter(
    (u) =>
      u.value.toLowerCase().startsWith(lower) ||
      u.label.toLowerCase().startsWith(lower) ||
      u.aliases.some((a) => a.toLowerCase().startsWith(lower))
  ).map((u) => ({ value: u.value, label: `${u.label} (${u.value})` }));
}

// ── Single ingredient row ─────────────────────────────────────────────────────
function IngredientRow({ item, index, onChange, onRemove, onEnter, showRemove, qtyRef, unitRef, nameRef, notesRef }) {
  const [unitOptions, setUnitOptions] = useState(getUnitOptions(""));

  const update = (field, val) => onChange({ ...item, [field]: val });

  const handleUnitSearch = (val) => {
    setUnitOptions(getUnitOptions(val));
    update("unit", val);
  };

  const handleUnitSelect = (val) => {
    update("unit", val);
    nameRef?.current?.focus();
  };

  const handleKeyDown = (field) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "qty") unitRef?.current?.focus();
      else if (field === "unit") nameRef?.current?.focus();
      else if (field === "name") notesRef?.current?.focus();
      else if (field === "notes") onEnter?.();
    }
  };

  const inputStyle = { borderRadius: 7 };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
      {/* Row number */}
      <div style={{
        minWidth: 24, height: 24, borderRadius: "50%",
        background: "#f5ede0", color: "#c07030",
        fontSize: 11, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {index + 1}
      </div>

      {/* Qty */}
      <Input
        ref={qtyRef}
        value={item.qty}
        onChange={(e) => update("qty", e.target.value)}
        onKeyDown={handleKeyDown("qty")}
        placeholder="Qty"
        style={{ ...inputStyle, width: 64 }}
      />

      {/* Unit — autocomplete */}
      <AutoComplete
        value={item.unit}
        options={unitOptions}
        onSearch={handleUnitSearch}
        onSelect={handleUnitSelect}
        onChange={(val) => update("unit", val)}
        style={{ width: 130 }}
        popupMatchSelectWidth={160}
      >
        <Input
          ref={unitRef}
          placeholder="Unit"
          onKeyDown={handleKeyDown("unit")}
          style={inputStyle}
        />
      </AutoComplete>

      {/* Name */}
      <Input
        ref={nameRef}
        value={item.name}
        onChange={(e) => update("name", e.target.value)}
        onKeyDown={handleKeyDown("name")}
        placeholder="Ingredient name"
        style={{ ...inputStyle, flex: 1 }}
      />

      {/* Notes */}
      <Input
        ref={notesRef}
        value={item.notes}
        onChange={(e) => update("notes", e.target.value)}
        onKeyDown={handleKeyDown("notes")}
        placeholder="Notes (optional)"
        style={{ ...inputStyle, width: 160 }}
      />

      {/* Remove */}
      {showRemove && (
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={onRemove}
          style={{ color: "#ccc", flexShrink: 0 }}
        />
      )}
    </div>
  );
}

// ── Column headers ─────────────────────────────────────────────────────────────
function ColumnHeaders() {
  const labelStyle = { fontSize: 11, fontWeight: 600, color: "#9c9086", textTransform: "uppercase", letterSpacing: "0.05em" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, paddingLeft: 30 }}>
      <div style={{ ...labelStyle, width: 64 }}>Qty</div>
      <div style={{ ...labelStyle, width: 130 }}>Unit</div>
      <div style={{ ...labelStyle, flex: 1 }}>Ingredient</div>
      <div style={{ ...labelStyle, width: 160 }}>Notes</div>
      <div style={{ width: 32 }} />
    </div>
  );
}

// ── Empty ingredient ──────────────────────────────────────────────────────────
export function emptyIngredient() {
  return { qty: "", unit: "", name: "", notes: "" };
}

// ── Main IngredientList ───────────────────────────────────────────────────────
export default function IngredientList({ items, onChange }) {
  // refs[i] = { qty, unit, name, notes }
  const refs = useRef([]);

  const ensureRefs = (i) => {
    if (!refs.current[i]) refs.current[i] = { qty: null, unit: null, name: null, notes: null };
    return refs.current[i];
  };

  const updateItem = (i, updated) => {
    const next = [...items];
    next[i] = updated;
    onChange(next);
  };

  const removeItem = (i) => {
    refs.current.splice(i, 1);
    onChange(items.filter((_, idx) => idx !== i));
  };

  const addItem = () => {
    onChange([...items, emptyIngredient()]);
    setTimeout(() => refs.current[items.length]?.qty?.focus(), 50);
  };

  const handleEnter = (i) => {
    if (i < items.length - 1) {
      refs.current[i + 1]?.qty?.focus();
    } else {
      addItem();
    }
  };

  return (
    <div>
      <ColumnHeaders />
      {items.map((item, i) => {
        const r = ensureRefs(i);
        return (
          <IngredientRow
            key={i}
            item={item}
            index={i}
            onChange={(updated) => updateItem(i, updated)}
            onRemove={() => removeItem(i)}
            onEnter={() => handleEnter(i)}
            showRemove={items.length > 1}
            qtyRef={(el) => { ensureRefs(i).qty = el?.input || el; }}
            unitRef={(el) => { ensureRefs(i).unit = el?.input || el; }}
            nameRef={(el) => { ensureRefs(i).name = el?.input || el; }}
            notesRef={(el) => { ensureRefs(i).notes = el?.input || el; }}
          />
        );
      })}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addItem}
        style={{ marginTop: 4, borderRadius: 8, borderColor: "#d4863a", color: "#d4863a", width: "fit-content" }}
      >
        Add ingredient
      </Button>
    </div>
  );
}