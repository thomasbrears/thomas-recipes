"use client";
import { useState } from "react";
import { Button, Typography, Alert, Collapse } from "antd";
import {
  CodeOutlined,
  CaretRightOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Text, Paragraph } = Typography;

// ── JSON format instructions shown to the user ────────────────────────────────
const FORMAT_DOCS = [
  {
    field: "title",
    type: "text",
    required: true,
    example: '"Classic Waffles"',
    notes: "The name of the recipe.",
  },
  {
    field: "subtitle",
    type: "text",
    required: false,
    example: '"Light, crispy, and perfect every time"',
    notes: "A short tagline. Leave out if you don't have one.",
  },
  {
    field: "description",
    type: "text",
    required: false,
    example: '"A family favourite for lazy Sunday mornings…"',
    notes: "A few sentences about the recipe.",
  },
  {
    field: "tags",
    type: "array of text",
    required: false,
    example: '["breakfast", "vegetarian", "quick"]',
    notes: "Short lowercase keywords. Great for filtering later.",
  },
  {
    field: "prepTime",
    type: "text",
    required: false,
    example: '"10 mins"',
    notes: "How long prep takes.",
  },
  {
    field: "cookTime",
    type: "text",
    required: false,
    example: '"20 mins"',
    notes: "How long cooking takes.",
  },
  {
    field: "servings",
    type: "text",
    required: false,
    example: '"4 people"',
    notes: "Number of servings.",
  },
  {
    field: "difficulty",
    type: "text",
    required: false,
    example: '"Easy"',
    notes: 'Must be exactly "Easy", "Medium", or "Hard".',
  },
  {
    field: "ingredients",
    type: "array of objects",
    required: true,
    example:
      '[{ "qty": "2", "unit": "cups", "name": "plain flour", "notes": "sifted" }]',
    notes:
      'Each ingredient needs at least "name". "qty", "unit", and "notes" are optional. Unit can be anything — cups, grams, ml, tsp, tbsp, etc.',
  },
  {
    field: "steps",
    type: "array of text",
    required: true,
    example: '["Mix the dry ingredients.", "Whisk in the eggs and milk."]',
    notes: "One step per item. Write each as a full sentence or two.",
  },
  {
    field: "notes",
    type: "text",
    required: false,
    example: '"Store in an airtight container for up to 3 days."',
    notes: "Storage tips, substitutions, serving ideas — anything extra.",
  },
];

const EXAMPLE_JSON = `{
  "title": "Classic Waffles",
  "subtitle": "Light, crispy, and perfect every time",
  "description": "A family favourite for lazy Sunday mornings. These waffles are crispy on the outside, fluffy inside.",
  "tags": ["breakfast", "vegetarian", "quick"],
  "prepTime": "10 mins",
  "cookTime": "20 mins",
  "servings": "4 people",
  "difficulty": "Easy",
  "ingredients": [
    { "qty": "2", "unit": "cups", "name": "plain flour", "notes": "sifted" },
    { "qty": "1", "unit": "tbsp", "name": "baking powder" },
    { "qty": "0.5", "unit": "tsp", "name": "salt" },
    { "qty": "2", "unit": "", "name": "eggs" },
    { "qty": "1.5", "unit": "cups", "name": "milk" },
    { "qty": "100", "unit": "g", "name": "butter", "notes": "melted" }
  ],
  "steps": [
    "Whisk together the flour, baking powder, and salt in a large bowl.",
    "In a separate bowl, beat the eggs then mix in the milk and melted butter.",
    "Pour the wet ingredients into the dry and stir until just combined — don't over-mix.",
    "Heat your waffle iron and lightly grease it. Pour in enough batter to fill it.",
    "Cook for 4–5 minutes until golden and crisp. Serve immediately."
  ],
  "notes": "Leftover waffles freeze well. Reheat in a toaster for best results."
}`;

// ── Prompt to give to AI ──────────────────────────────────────────────────────
const AI_PROMPT = `Please convert this recipe into JSON using this exact format:

{
  "title": "Recipe name",
  "subtitle": "Short tagline (optional)",
  "description": "Brief description (optional)",
  "tags": ["tag1", "tag2"],
  "prepTime": "X mins",
  "cookTime": "X mins",
  "servings": "X people",
  "difficulty": "Easy | Medium | Hard",
  "ingredients": [
    { "qty": "amount as string", "unit": "unit name", "name": "ingredient name", "notes": "optional note e.g. sifted, melted" }
  ],
  "steps": [
    "Step one as a full sentence.",
    "Step two as a full sentence."
  ],
  "notes": "Any storage tips, substitutions, or serving suggestions."
}

Rules:
- ingredients must be an array of objects with qty, unit, name, notes — not plain strings
- qty should always be a string (e.g. "2", "0.5")
- unit can be empty string "" if there's no unit (e.g. for "2 eggs")
- Return ONLY the JSON — no explanation, no markdown, no code fences`;

export default function ImportJson({ onImport }) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleImport = () => {
    setError(null);
    setSuccess(false);
    let parsed;
    try {
      parsed = JSON.parse(json.trim());
    } catch {
      setError("That doesn't look like valid JSON. Check for missing commas, quotes, or brackets.");
      return;
    }
    if (!parsed.title) {
      setError('Your JSON needs at least a "title" field.');
      return;
    }
    onImport(parsed);
    setSuccess(true);
    setJson("");
    setTimeout(() => setSuccess(false), 3000);
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        marginBottom: 24,
        borderRadius: 14,
        border: "1.5px dashed #d4aa7d",
        background: "linear-gradient(135deg, #fffdf9 0%, #fdf6ec 100%)",
        overflow: "hidden",
      }}
    >
      {/* ── Header toggle ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <CodeOutlined style={{ color: "#d4863a", fontSize: 16 }} />
        <Text style={{ fontWeight: 700, fontSize: 14, color: "#2a2420", flex: 1 }}>
          Import from JSON
        </Text>
        <CaretRightOutlined
          style={{
            color: "#bbb",
            fontSize: 12,
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {open && (
        <div style={{ padding: "0 20px 20px" }}>

          {/* ── Instructions ── */}
          <Collapse
            ghost
            size="small"
            style={{ marginBottom: 14, background: "#fff8f0", borderRadius: 10, border: "1px solid #ede0cc" }}
            items={[
              {
                key: "instructions",
                label: (
                  <Text style={{ fontSize: 13, fontWeight: 600, color: "#8a5020" }}>
                    📋 How to get JSON from an AI (ChatGPT, Claude, etc.)
                  </Text>
                ),
                children: (
                  <div style={{ fontSize: 13, color: "#4a3828", lineHeight: 1.7 }}>
                    <Paragraph style={{ marginBottom: 10 }}>
                      The easiest way is to paste your recipe into ChatGPT, Claude, or any AI,
                      along with this prompt. Click the button to copy it:
                    </Paragraph>
                    <div
                      style={{
                        background: "#fdf3e3",
                        border: "1px solid #e8c88a",
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontFamily: "monospace",
                        fontSize: 12,
                        whiteSpace: "pre-wrap",
                        marginBottom: 10,
                        color: "#3a2810",
                        maxHeight: 160,
                        overflowY: "auto",
                      }}
                    >
                      {AI_PROMPT}
                    </div>
                    <Button
                      size="small"
                      onClick={copyPrompt}
                      style={{ borderRadius: 6, borderColor: "#d4aa7d", color: "#8a5020", marginBottom: 16 }}
                    >
                      {copied ? "✓ Copied!" : "Copy this prompt"}
                    </Button>

                    <Paragraph style={{ fontWeight: 600, marginBottom: 6 }}>JSON field reference:</Paragraph>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#f5e8d0" }}>
                          {["Field", "Type", "Required", "Example", "Notes"].map((h) => (
                            <th key={h} style={{ padding: "6px 8px", textAlign: "left", borderBottom: "1px solid #e0c898", fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {FORMAT_DOCS.map((row, i) => (
                          <tr key={row.field} style={{ background: i % 2 === 0 ? "#fffdf9" : "#fdf6ec" }}>
                            <td style={{ padding: "5px 8px", fontFamily: "monospace", color: "#c07030", borderBottom: "1px solid #f0e0c0" }}>{row.field}</td>
                            <td style={{ padding: "5px 8px", borderBottom: "1px solid #f0e0c0" }}>{row.type}</td>
                            <td style={{ padding: "5px 8px", borderBottom: "1px solid #f0e0c0", textAlign: "center" }}>{row.required ? "✓" : ""}</td>
                            <td style={{ padding: "5px 8px", fontFamily: "monospace", fontSize: 11, color: "#555", borderBottom: "1px solid #f0e0c0" }}>{row.example}</td>
                            <td style={{ padding: "5px 8px", color: "#6a5040", borderBottom: "1px solid #f0e0c0" }}>{row.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <Paragraph style={{ marginTop: 14, fontWeight: 600, marginBottom: 6 }}>Full example:</Paragraph>
                    <pre
                      style={{
                        background: "#1e1810",
                        color: "#f0d090",
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 11,
                        overflowX: "auto",
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {EXAMPLE_JSON}
                    </pre>
                  </div>
                ),
              },
            ]}
          />

          {/* ── Paste area ── */}
          <div style={{ position: "relative" }}>
            <textarea
              value={json}
              onChange={(e) => { setJson(e.target.value); setError(null); }}
              placeholder={'Paste your JSON here…\n\n{\n  "title": "My Recipe",\n  "ingredients": [...],\n  ...\n}'}
              rows={10}
              style={{
                width: "100%",
                borderRadius: 10,
                border: "1.5px solid #e0c898",
                background: "#1e1810",
                color: "#f0d090",
                fontFamily: "monospace",
                fontSize: 12,
                padding: "12px 14px",
                resize: "vertical",
                outline: "none",
                lineHeight: 1.6,
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              closable
              onClose={() => setError(null)}
              style={{ marginTop: 10, borderRadius: 8 }}
            />
          )}
          {success && (
            <Alert
              type="success"
              icon={<CheckCircleOutlined />}
              message="Recipe imported — fields populated below ✓"
              style={{ marginTop: 10, borderRadius: 8 }}
            />
          )}

          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              disabled={!json.trim()}
              onClick={handleImport}
              style={{
                borderRadius: 8,
                background: "#d4863a",
                borderColor: "#d4863a",
                fontWeight: 600,
              }}
            >
              Populate fields →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}