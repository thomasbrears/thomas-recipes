"use client";
import { useRef, useState, useEffect } from "react";
import { Button, Input, AutoComplete } from "antd";
import { PlusOutlined, DeleteOutlined, TagOutlined, HolderOutlined } from "@ant-design/icons";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Unit definitions ──────────────────────────────────────────────────────────
const UNITS = [
  { label: "teaspoon", value: "teaspoon", aliases: ["tsp", "t"] },
  { label: "tablespoon", value: "tablespoon", aliases: ["tbsp", "tbs", "tb", "T"] },
  { label: "cup", value: "cup", aliases: ["c", "cups"] },
  { label: "fluid oz", value: "fl oz", aliases: ["floz", "fl", "fluid oz"] },
  { label: "ml", value: "ml", aliases: ["millilitre", "milliliter", "mls"] },
  { label: "litre", value: "litre", aliases: ["liter", "l", "L"] },
  { label: "gram", value: "g", aliases: ["gram", "grams", "gr"] },
  { label: "kg", value: "kg", aliases: ["kilogram", "kilograms"] },
  { label: "oz", value: "oz", aliases: ["ounce", "ounces"] },
  { label: "lb", value: "lb", aliases: ["pound", "pounds", "lbs"] },
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

// ── Helpers ───────────────────────────────────────────────────────────────────
export function emptyIngredient() {
  return { qty: "", unit: "", name: "", notes: "" };
}

export function emptySection() {
  return { type: "section", label: "" };
}

export function isSection(item) {
  return item && item.type === "section";
}

function ensureId(item) {
  if (item._id) return item;
  return { ...item, _id: Math.random().toString(36).slice(2) };
}

export function stripIds(items) {
  return items.map(({ _id, ...rest }) => rest);
}

// ── Drag handle ───────────────────────────────────────────────────────────────
function DragHandle({ listeners, attributes }) {
  return (
    <div
      {...listeners}
      {...attributes}
      style={{
        cursor: "grab",
        color: "#ccc",
        display: "flex",
        alignItems: "center",
        padding: "0 2px",
        flexShrink: 0,
        touchAction: "none",
      }}
      aria-label="Drag to reorder"
    >
      <HolderOutlined style={{ fontSize: 14 }} />
    </div>
  );
}

// ── Sortable section row ──────────────────────────────────────────────────────
function SortableSectionRow({ item, onLabelChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, display: "flex", alignItems: "center", gap: 8, margin: "12px 0 6px" }}>
      <DragHandle listeners={listeners} attributes={attributes} />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#fdf6ec",
          border: "1.5px dashed #d4aa7d",
          borderRadius: 7,
          paddingLeft: 10,
          minWidth: 0,
        }}
      >
        <TagOutlined style={{ color: "#d4863a", fontSize: 13, flexShrink: 0 }} />
        <Input
          value={item.label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Section name — e.g. Base, Filling, Topping…"
          variant="borderless"
          style={{ fontWeight: 600, fontSize: 13, color: "#8a5020", padding: "5px 4px", flex: 1 }}
        />
      </div>
      <Button
        type="text"
        icon={<DeleteOutlined />}
        onClick={onRemove}
        style={{ color: "#ccc", flexShrink: 0 }}
        aria-label="Remove section"
      />
    </div>
  );
}

// ── Sortable ingredient row ───────────────────────────────────────────────────
function SortableIngredientRow({ item, index, onChange, onRemove, onEnter, showRemove, qtyRef, unitRef, nameRef, notesRef }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [unitOptions, setUnitOptions] = useState(getUnitOptions(""));
  const update = (field, val) => onChange({ ...item, [field]: val });

  const handleUnitSearch = (val) => { setUnitOptions(getUnitOptions(val)); update("unit", val); };
  const handleUnitSelect = (val) => { update("unit", val); nameRef?.current?.focus(); };

  const handleKeyDown = (field) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "qty") unitRef?.current?.focus();
      else if (field === "unit") nameRef?.current?.focus();
      else if (field === "name") notesRef?.current?.focus();
      else if (field === "notes") onEnter?.();
    }
  };

  return (
    <div ref={setNodeRef} style={{ ...style, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
      <DragHandle listeners={listeners} attributes={attributes} />
      <div style={{
        minWidth: 22, height: 22, borderRadius: "50%",
        background: "#f5ede0", color: "#c07030",
        fontSize: 11, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {index + 1}
      </div>

      <Input
        ref={qtyRef}
        value={item.qty}
        onChange={(e) => update("qty", e.target.value)}
        onKeyDown={handleKeyDown("qty")}
        placeholder="Qty"
        style={{ borderRadius: 7, width: 64 }}
      />

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
          style={{ borderRadius: 7 }}
        />
      </AutoComplete>

      <Input
        ref={nameRef}
        value={item.name}
        onChange={(e) => update("name", e.target.value)}
        onKeyDown={handleKeyDown("name")}
        placeholder="Ingredient name"
        style={{ borderRadius: 7, flex: 1, minWidth: 140 }}
      />

      <Input
        ref={notesRef}
        value={item.notes}
        onChange={(e) => update("notes", e.target.value)}
        onKeyDown={handleKeyDown("notes")}
        placeholder="Notes (optional)"
        style={{ borderRadius: 7, width: 160 }}
      />

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

// ── Column headers ────────────────────────────────────────────────────────────
function ColumnHeaders() {
  const labelStyle = { fontSize: 11, fontWeight: 600, color: "#9c9086", textTransform: "uppercase", letterSpacing: "0.05em" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, paddingLeft: 4 }}>
      <div style={{ width: 18, flexShrink: 0 }} />
      <div style={{ width: 22, flexShrink: 0 }} />
      <div style={{ ...labelStyle, width: 64 }}>Qty</div>
      <div style={{ ...labelStyle, width: 130 }}>Unit</div>
      <div style={{ ...labelStyle, flex: 1, minWidth: 140 }}>Ingredient</div>
      <div style={{ ...labelStyle, width: 160 }}>Notes</div>
      <div style={{ width: 32 }} />
    </div>
  );
}

// ── Main IngredientList ───────────────────────────────────────────────────────
export default function IngredientList({ items: rawItems, onChange }) {
  const [items, setItems] = useState(() => rawItems.map(ensureId));

  const refs = useRef({});
  const ensureRefs = (id) => {
    if (!refs.current[id]) refs.current[id] = { qty: null, unit: null, name: null, notes: null };
    return refs.current[id];
  };

  const emit = (next) => {
    setItems(next);
    onChange(stripIds(next));
  };

  const updateItem = (id, updated) => emit(items.map((it) => it._id === id ? updated : it));
  const removeItem = (id) => emit(items.filter((it) => it._id !== id));

  const addIngredient = () => {
    const newItem = ensureId(emptyIngredient());
    const next = [...items, newItem];
    emit(next);
    setTimeout(() => refs.current[newItem._id]?.qty?.focus(), 50);
  };

  const addSection = () => emit([...items, ensureId(emptySection())]);

  const handleEnter = (id) => {
    const idx = items.findIndex((it) => it._id === id);
    for (let j = idx + 1; j < items.length; j++) {
      if (!isSection(items[j])) {
        refs.current[items[j]._id]?.qty?.focus();
        return;
      }
    }
    addIngredient();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((it) => it._id === active.id);
      const newIndex = items.findIndex((it) => it._id === over.id);
      emit(arrayMove(items, oldIndex, newIndex));
    }
  };

  const ingredientCount = items.filter((it) => !isSection(it)).length;
  let ingredientCounter = 0;

  return (
    <div>
      <div style={{ position: "relative" }}>
        <div style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "thin",
          scrollbarColor: "#e0d8ce transparent",
          paddingBottom: 4,
        }}>
          <div style={{ minWidth: 600 }}>
            <ColumnHeaders />
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((it) => it._id)} strategy={verticalListSortingStrategy}>
                {items.map((item) => {
                  if (isSection(item)) {
                    return (
                      <SortableSectionRow
                        key={item._id}
                        item={item}
                        onLabelChange={(label) => updateItem(item._id, { ...item, label })}
                        onRemove={() => removeItem(item._id)}
                      />
                    );
                  }
                  const displayIndex = ingredientCounter++;
                  ensureRefs(item._id);
                  return (
                    <SortableIngredientRow
                      key={item._id}
                      item={item}
                      index={displayIndex}
                      onChange={(updated) => updateItem(item._id, updated)}
                      onRemove={() => removeItem(item._id)}
                      onEnter={() => handleEnter(item._id)}
                      showRemove={ingredientCount > 1}
                      qtyRef={(el) => { ensureRefs(item._id).qty = el?.input || el; }}
                      unitRef={(el) => { ensureRefs(item._id).unit = el?.input || el; }}
                      nameRef={(el) => { ensureRefs(item._id).name = el?.input || el; }}
                      notesRef={(el) => { ensureRefs(item._id).notes = el?.input || el; }}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div aria-hidden="true" style={{
          position: "absolute", top: 0, right: 0, bottom: 4, width: 40,
          background: "linear-gradient(to right, transparent, #faf8f4)",
          pointerEvents: "none", borderRadius: "0 8px 8px 0",
        }} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addIngredient}
          style={{ borderRadius: 8, borderColor: "#d4863a", color: "#d4863a" }}
        >
          Add ingredient
        </Button>
        <Button
          type="dashed"
          icon={<TagOutlined />}
          onClick={addSection}
          style={{ borderRadius: 8, borderColor: "#b8a090", color: "#9c7060" }}
        >
          Add section
        </Button>
      </div>
    </div>
  );
}
