"use client";
import { useState, useRef } from "react";
import {
  Form, Input, Select, Button, Upload, Tag,
  Row, Col, Typography, Card, InputNumber, Tooltip,
} from "antd";
import {
  PlusOutlined, DeleteOutlined, InboxOutlined,
  StarFilled, StarOutlined, QuestionCircleOutlined,
} from "@ant-design/icons";
import IngredientList, { emptyIngredient } from "../components/IngredientList";
import StepList, { isStepSection, emptyStepSection } from "../components/StepList";
import ImportJson from "../components/ImportJson";

const { TextArea } = Input;
const { Text } = Typography;

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

// ─── Tags Input ───────────────────────────────────────────────────────────────
function TagsInput({ tags, onChange, nextRef }) {
  const [input, setInput] = useState("");
  const inputRef = useRef();
  const addTag = (value) => {
    const tag = value.trim().toLowerCase();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setInput("");
  };
  const handleKeyDown = (e) => {
    if (["Enter", ",", "Tab"].includes(e.key)) {
      e.preventDefault();
      if (input) addTag(input);
      else nextRef?.current?.focus();
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };
  return (
    <div
      style={{
        display: "flex", flexWrap: "wrap", gap: 6, padding: "6px 11px",
        border: "1px solid #d9d9d9", borderRadius: 8, minHeight: 40,
        cursor: "text", background: "#fff", alignItems: "center",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <Tag key={tag} closable onClose={() => onChange(tags.filter((t) => t !== tag))}
          style={{ margin: 0, borderRadius: 20, padding: "2px 10px" }} color="orange">
          {tag}
        </Tag>
      ))}
      <input
        ref={inputRef} value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addTag(input)}
        placeholder={tags.length === 0 ? "Add tags — press Enter or comma…" : ""}
        style={{ border: "none", outline: "none", flex: 1, minWidth: 140, fontSize: 14, background: "transparent" }}
      />
    </div>
  );
}

// ─── Image Uploader ───────────────────────────────────────────────────────────
function ImageUploader({ images, onAdd, onRemove, coverIndex, onSetCover }) {
  const handleChange = ({ fileList }) => {
    fileList.forEach((f) => {
      if (f.originFileObj && !images.find((img) => img.uid === f.uid)) {
        const preview = URL.createObjectURL(f.originFileObj);
        onAdd({ file: f.originFileObj, preview, uid: f.uid });
      }
    });
  };
  return (
    <div>
      <Upload.Dragger multiple accept="image/*" showUploadList={false}
        beforeUpload={() => false} onChange={handleChange}
        style={{ borderRadius: 12, background: "#fafaf8", borderColor: "#e5e0d5", padding: "8px 0" }}
      >
        <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
          <InboxOutlined style={{ fontSize: 36, color: "#d4863a" }} />
        </p>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#3a3530", marginBottom: 2 }}>
          Drag photos here, or click to browse
        </p>
        <p style={{ fontSize: 13, color: "#9c9086" }}>
          Upload multiple images — click any to set as cover
        </p>
      </Upload.Dragger>
      {images.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginTop: 14 }}>
          {images.map((img, i) => (
            <div key={i} onClick={() => onSetCover(i)} style={{
              position: "relative", borderRadius: 10, overflow: "hidden",
              aspectRatio: "1", cursor: "pointer",
              border: i === coverIndex ? "3px solid #d4863a" : "3px solid transparent",
              boxShadow: i === coverIndex ? "0 0 0 2px #d4863a33" : "none",
              transition: "all 0.15s",
            }}>
              <img src={img.preview || img.url} alt={`Photo ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{
                position: "absolute", top: 5, left: 5,
                background: i === coverIndex ? "#d4863a" : "rgba(0,0,0,0.35)",
                borderRadius: 20, padding: "1px 7px", fontSize: 11, color: "#fff",
                fontWeight: 600, display: "flex", alignItems: "center", gap: 3,
              }}>
                {i === coverIndex ? <StarFilled style={{ fontSize: 9 }} /> : <StarOutlined style={{ fontSize: 9 }} />}
                {i === coverIndex ? "Cover" : ""}
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(i); }} style={{
                position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.55)",
                border: "none", borderRadius: "50%", width: 22, height: 22,
                color: "#fff", cursor: "pointer", fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
              }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <Card style={{ marginBottom: 20, borderRadius: 14, border: "1px solid #ede8df", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
      styles={{ body: { padding: "24px 28px" } }}>
      <Text style={{ fontSize: 16, fontWeight: 700, color: "#2a2420", letterSpacing: "-0.01em", fontFamily: "'Georgia', serif", display: "block", marginBottom: 20 }}>
        {title}
      </Text>
      {children}
    </Card>
  );
}

// ─── Dynamic List (for steps only) ───────────────────────────────────────────
function DynamicList({ items, onChange, placeholder, multiline = false }) {
  const refs = useRef([]);
  const updateItem = (i, value) => { const next = [...items]; next[i] = value; onChange(next); };
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));
  const addItem = () => { onChange([...items, ""]); setTimeout(() => refs.current[items.length]?.focus(), 50); };
  const handleKeyDown = (i, e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (i < items.length - 1) refs.current[i + 1]?.focus();
      else { onChange([...items, ""]); setTimeout(() => refs.current[items.length]?.focus(), 50); }
    }
    if (e.key === "Backspace" && !items[i] && items.length > 1) {
      e.preventDefault();
      removeItem(i);
      setTimeout(() => refs.current[Math.max(0, i - 1)]?.focus(), 50);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 26, height: 26, marginTop: multiline ? 7 : 5, borderRadius: "50%", background: "#f5ede0", color: "#c07030", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {i + 1}
          </div>
          {multiline ? (
            <TextArea ref={(el) => (refs.current[i] = el?.resizableTextArea?.textArea)}
              value={item} onChange={(e) => updateItem(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              placeholder={`${placeholder} ${i + 1}…`}
              autoSize={{ minRows: 1, maxRows: 6 }} style={{ borderRadius: 8, flex: 1 }} />
          ) : (
            <Input ref={(el) => (refs.current[i] = el?.input)}
              value={item} onChange={(e) => updateItem(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              placeholder={placeholder} style={{ borderRadius: 8, flex: 1 }} />
          )}
          {items.length > 1 && (
            <Button type="text" icon={<DeleteOutlined />} onClick={() => removeItem(i)} style={{ color: "#ccc", marginTop: 1 }} />
          )}
        </div>
      ))}
      <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}
        style={{ marginTop: 4, borderRadius: 8, borderColor: "#d4863a", color: "#d4863a", width: "fit-content" }}>
        Add step
      </Button>
    </div>
  );
}

// ─── Normalise ingredients coming in from JSON or initialData ─────────────────
function normaliseIngredients(raw) {
  if (!raw?.length) return [emptyIngredient()];
  return raw.map((item) => {
    // Pass section headers through untouched
    if (item?.type === "section") return item;

    if (typeof item === "string") {
      return { qty: "", unit: "", name: item, notes: "" };
    }
    return {
      qty: item.qty ?? "",
      unit: item.unit ?? "",
      name: item.name ?? "",
      notes: item.notes ?? "",
    };
  });
}

function normaliseSteps(raw) {
  if (!raw?.length) return [""];
  return raw; // sections and strings pass through as-is
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function RecipeForm({ initialData = {}, onSubmit, submitting, isEditing = false }) {
  const titleRef = useRef();
  const subtitleRef = useRef();
  const descriptionRef = useRef();
  const prepTimeRef = useRef();
  const cookTimeRef = useRef();
  const servingsRef = useRef();

  const [title, setTitle] = useState(initialData.title ?? "");
  const [subtitle, setSubtitle] = useState(initialData.subtitle ?? "");
  const [description, setDescription] = useState(initialData.description ?? "");
  const [tags, setTags] = useState(initialData.tags ?? []);
  const [prepTime, setPrepTime] = useState(initialData.prepTime ?? "");
  const [cookTime, setCookTime] = useState(initialData.cookTime ?? "");
  const [servings, setServings] = useState(initialData.servings ?? "");
  const [difficulty, setDifficulty] = useState(initialData.difficulty ?? "");
  const [defaultMultiplier, setDefaultMultiplier] = useState(initialData.defaultMultiplier ?? 1);
  const [ingredients, setIngredients] = useState(() => normaliseIngredients(initialData.ingredients));
  const [steps, setSteps] = useState(initialData.steps?.length ? initialData.steps : [""]);
  const [notes, setNotes] = useState(initialData.notes ?? "");
  const [images, setImages] = useState(
    () => (initialData.images ?? []).map((url) => ({ url, preview: url }))
  );
  const [coverIndex, setCoverIndex] = useState(initialData.coverIndex ?? 0);
  const [importKey, setImportKey] = useState(0);


  // ── JSON import handler ──────────────────────────────────────────────────
  const handleImport = (data) => {
    if (data.title !== undefined) setTitle(data.title ?? "");
    if (data.subtitle !== undefined) setSubtitle(data.subtitle ?? "");
    if (data.description !== undefined) setDescription(data.description ?? "");
    if (data.tags !== undefined) setTags(data.tags ?? []);
    if (data.prepTime !== undefined) setPrepTime(data.prepTime ?? "");
    if (data.cookTime !== undefined) setCookTime(data.cookTime ?? "");
    if (data.servings !== undefined) setServings(data.servings ?? "");
    if (data.difficulty !== undefined) setDifficulty(data.difficulty ?? "");
    if (data.defaultMultiplier !== undefined) setDefaultMultiplier(data.defaultMultiplier ?? 1);
    if (data.ingredients !== undefined) setIngredients(normaliseIngredients(data.ingredients));
    if (data.steps !== undefined) setSteps(data.steps?.length ? data.steps : [""]);
    if (data.steps !== undefined) setSteps(data.steps?.length ? data.steps : [""]);
    if (data.notes !== undefined) setNotes(data.notes ?? "");
    setImportKey(k => k + 1);
  };

  const handleImageAdd = (img) => setImages((prev) => [...prev, img]);
  const handleImageRemove = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    if (coverIndex >= images.length - 1) setCoverIndex(0);
  };

  const handleSubmit = () => {
    onSubmit({
      title, subtitle, description, tags,
      prepTime, cookTime, servings, difficulty,
      defaultMultiplier,
      ingredients: ingredients.filter((ing) =>
        ing.type === "section" ? ing.label.trim() !== "" : ing.name.trim() !== ""
      ),      
      steps: steps.filter((s) => (typeof s === "object" ? s.label?.trim() : s?.trim())),
      notes, images, coverIndex, published: true,
    });
  };

  const labelStyle = { fontWeight: 600, color: "#4a4038", fontSize: 13 };
  const inputStyle = { borderRadius: 8 };

  return (
    <div style={{ maxWidth: 780 }}>
      {/* ── JSON Import ── */}
      <ImportJson onImport={handleImport} />

      <Section title="Photos">
        <ImageUploader images={images} onAdd={handleImageAdd} onRemove={handleImageRemove} coverIndex={coverIndex} onSetCover={setCoverIndex} />
      </Section>

      <Section title="Basic Info">
        <Form layout="vertical">
          <Form.Item label={<span style={labelStyle}>Recipe Title *</span>}>
            <Input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); subtitleRef.current?.focus(); } }}
              placeholder="e.g. Chocolate Chip Mug Cake" size="large" style={{ ...inputStyle, fontSize: 16 }} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>Subtitle / Tagline</span>}>
            <Input ref={subtitleRef} value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); descriptionRef.current?.focus(); } }}
              placeholder="e.g. Quick, rich, and ready in 5 minutes" style={inputStyle} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>Description</span>}>
            <TextArea ref={descriptionRef} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="A short, enticing description of this recipe…" autoSize={{ minRows: 3, maxRows: 6 }} style={inputStyle} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>Tags</span>} style={{ marginBottom: 0 }}>
            <TagsInput tags={tags} onChange={setTags} nextRef={prepTimeRef} />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>Press Enter or comma to add a tag</Text>
          </Form.Item>
        </Form>
      </Section>

      <Section title="Details">
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Prep Time</span>}>
                <Input ref={prepTimeRef} value={prepTime} onChange={(e) => setPrepTime(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); cookTimeRef.current?.focus(); } }}
                  placeholder="e.g. 15 mins" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Cook Time</span>}>
                <Input ref={cookTimeRef} value={cookTime} onChange={(e) => setCookTime(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); servingsRef.current?.focus(); } }}
                  placeholder="e.g. 30 mins" style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Servings</span>}>
                <Input ref={servingsRef} value={servings} onChange={(e) => setServings(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                  placeholder="e.g. 4 people" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Difficulty</span>}>
                <Select value={difficulty || undefined} onChange={setDifficulty} placeholder="Select difficulty"
                  style={{ width: "100%" }} options={DIFFICULTIES.map((d) => ({ label: d, value: d }))} />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Default Multiplier ── */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                style={{ marginBottom: 0 }}
                label={
                  <span style={labelStyle}>
                    Default Recipe Scale&nbsp;
                    <Tooltip title="Sets the default multiplier shown when someone views this recipe. Great for commercial-sized recipes — e.g. set to 50× if written for a large batch, so home cooks see it scaled down. Viewers can always adjust it themselves.">
                      <QuestionCircleOutlined style={{ color: "#9c9086", fontSize: 13 }} />
                    </Tooltip>
                  </span>
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: 0, width: "fit-content" }}>
                  <button
                    type="button"
                    onClick={() => setDefaultMultiplier((v) => Math.max(0.25, parseFloat((v - (v <= 1 ? 0.25 : 1)).toFixed(4))))}
                    style={{
                      width: 36, height: 36, borderRadius: "8px 0 0 8px",
                      border: "1.5px solid #d9d9d9", borderRight: "none",
                      background: "#fafaf8", cursor: "pointer",
                      fontSize: 18, fontWeight: 700, color: "#6b5e52",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f5ede0"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#fafaf8"}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={defaultMultiplier}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 0.25) setDefaultMultiplier(val);
                    }}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (isNaN(val) || val < 0.25) setDefaultMultiplier(1);
                    }}
                    style={{
                      width: 72, height: 36, textAlign: "center",
                      border: "1.5px solid #d9d9d9",
                      fontSize: 15, fontWeight: 700, color: "#2a2420",
                      outline: "none", background: "#fff",
                      MozAppearance: "textfield",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setDefaultMultiplier((v) => parseFloat((v + (v < 1 ? 0.25 : 1)).toFixed(4)))}
                    style={{
                      width: 36, height: 36, borderRadius: "0 8px 8px 0",
                      border: "1.5px solid #d9d9d9", borderLeft: "none",
                      background: "#fafaf8", cursor: "pointer",
                      fontSize: 18, fontWeight: 700, color: "#6b5e52",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f5ede0"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#fafaf8"}
                  >
                    +
                  </button>
                </div>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 6, display: "block" }}>
                  Ingredients on the recipe page will default to this scale. Defaults to 1× if not set.
                </Text>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Section>

      <Section title="Ingredients">
        <IngredientList key={`ing-${importKey}`} items={ingredients} onChange={setIngredients} />
      </Section>

      <Section title="Method">
        <StepList key={`step-${importKey}`} items={steps} onChange={setSteps} />
      </Section>

      <Section title="Notes & Tips">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Storage tips, substitutions, serving suggestions…"
          autoSize={{ minRows: 3, maxRows: 8 }} style={{ borderRadius: 8 }} />
      </Section>

      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4, paddingBottom: 40 }}>
        <Button
          size="large" type="primary" loading={submitting}
          disabled={!title} onClick={handleSubmit}
          style={{ borderRadius: 10, background: "#d4863a", borderColor: "#d4863a", fontWeight: 600, paddingInline: 28 }}
        >
          {isEditing ? "Save Changes ✓" : "Publish Recipe ✓"}
        </Button>
      </div>
    </div>
  );
}