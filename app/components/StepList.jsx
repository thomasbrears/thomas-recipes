"use client";
import { useRef, useState, useEffect } from "react";
import { Button, Input } from "antd";
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

const { TextArea } = Input;

// ── Helpers ───────────────────────────────────────────────────────────────────

// A step is either a plain string (the step text) or { type: "section", label: "" }
export function isStepSection(item) {
  return item && typeof item === "object" && item.type === "section";
}

export function emptyStepSection() {
  return { type: "section", label: "" };
}

function ensureId(item) {
  if (item && typeof item === "object") {
    if (item._id) return item;
    return { ...item, _id: Math.random().toString(36).slice(2) };
  }
  // plain string step
  return { _text: item, _id: Math.random().toString(36).slice(2) };
}

// Strip internal _id/_text back to the shape RecipeForm expects:
//   sections  → { type: "section", label }
//   steps     → plain string
export function stripStepIds(items) {
  return items.map((item) => {
    const { _id, _text, ...rest } = item;
    if (isStepSection(item)) return rest; // { type, label }
    return _text ?? ""; // plain string
  });
}

// Normalise incoming steps (strings or section objects) into internal shape
function normalise(steps) {
  return steps.map(ensureId);
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
        marginTop: 6,
        touchAction: "none",
      }}
      aria-label="Drag to reorder"
    >
      <HolderOutlined style={{ fontSize: 14 }} />
    </div>
  );
}

// ── Sortable section header row ───────────────────────────────────────────────
function SortableStepSectionRow({ item, onLabelChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item._id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "12px 0 6px",
      }}
    >
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
        }}
      >
        <TagOutlined style={{ color: "#d4863a", fontSize: 13, flexShrink: 0 }} />
        <Input
          value={item.label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Section name — e.g. Make the base, Assemble…"
          variant="borderless"
          style={{ fontWeight: 600, fontSize: 13, color: "#8a5020", padding: "5px 4px", flex: 1 }}
        />
      </div>
      <Button
        type="text"
        icon={<DeleteOutlined />}
        onClick={onRemove}
        style={{ color: "#ccc", flexShrink: 0, marginTop: 0 }}
        aria-label="Remove section"
      />
    </div>
  );
}

// ── Sortable step row ─────────────────────────────────────────────────────────
function SortableStepRow({ item, index, onTextChange, onRemove, onEnter, showRemove, textRef }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item._id });

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnter?.();
    }
    if (e.key === "Backspace" && !item._text && showRemove) {
      e.preventDefault();
      onRemove?.();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <DragHandle listeners={listeners} attributes={attributes} />
      <div style={{
        minWidth: 26, height: 26, marginTop: 5,
        borderRadius: "50%", background: "#f5ede0", color: "#c07030",
        fontSize: 12, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {index + 1}
      </div>
      <TextArea
        ref={textRef}
        value={item._text ?? ""}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Step ${index + 1}…`}
        autoSize={{ minRows: 1, maxRows: 6 }}
        style={{ borderRadius: 8, flex: 1 }}
      />
      {showRemove && (
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={onRemove}
          style={{ color: "#ccc", marginTop: 1, flexShrink: 0 }}
        />
      )}
    </div>
  );
}

// ── Main StepList ─────────────────────────────────────────────────────────────
export default function StepList({ items: rawItems, onChange }) {
  const [items, setItems] = useState(() => normalise(rawItems));
   

  const textRefs = useRef({});

  const emit = (next) => {
    setItems(next);
    onChange(stripStepIds(next));
  };

  const updateText = (id, text) =>
    emit(items.map((it) => it._id === id ? { ...it, _text: text } : it));

  const updateLabel = (id, label) =>
    emit(items.map((it) => it._id === id ? { ...it, label } : it));

  const removeItem = (id) => {
    const idx = items.findIndex((it) => it._id === id);
    const next = items.filter((it) => it._id !== id);
    emit(next);
    // focus previous step after removal
    setTimeout(() => {
      const prev = next[Math.max(0, idx - 1)];
      if (prev) textRefs.current[prev._id]?.focus?.();
    }, 50);
  };

  const addStep = () => {
    const newItem = ensureId("");
    emit([...items, newItem]);
    setTimeout(() => textRefs.current[newItem._id]?.focus?.(), 50);
  };

  const addSection = () => emit([...items, ensureId(emptyStepSection())]);

  const handleEnter = (id) => {
    const idx = items.findIndex((it) => it._id === id);
    // Focus next step if it exists
    for (let j = idx + 1; j < items.length; j++) {
      if (!isStepSection(items[j])) {
        textRefs.current[items[j]._id]?.focus?.();
        return;
      }
    }
    addStep();
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

  const stepCount = items.filter((it) => !isStepSection(it)).length;
  let stepCounter = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((it) => it._id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => {
            if (isStepSection(item)) {
              return (
                <SortableStepSectionRow
                  key={item._id}
                  item={item}
                  onLabelChange={(label) => updateLabel(item._id, label)}
                  onRemove={() => removeItem(item._id)}
                />
              );
            }
            const displayIndex = stepCounter++;
            return (
              <SortableStepRow
                key={item._id}
                item={item}
                index={displayIndex}
                onTextChange={(text) => updateText(item._id, text)}
                onRemove={() => removeItem(item._id)}
                onEnter={() => handleEnter(item._id)}
                showRemove={stepCount > 1}
                textRef={(el) => {
                  textRefs.current[item._id] = el?.resizableTextArea?.textArea ?? el;
                }}
              />
            );
          })}
        </SortableContext>
      </DndContext>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addStep}
          style={{ borderRadius: 8, borderColor: "#d4863a", color: "#d4863a" }}
        >
          Add step
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