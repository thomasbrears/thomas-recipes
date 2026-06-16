"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getRecipe } from "../../../lib/recipes";
import RecipeMultiplier, { scaleIngredient } from "../../components/RecipeMultiplier";

import {
  Carousel, Row, Col, Card, Tag, Button, Space,
  Typography, Divider, Checkbox, List, Switch,
} from "antd";

import {
  ClockCircleOutlined, FireOutlined, TeamOutlined,
  DashboardOutlined, LinkOutlined, EditOutlined, DownloadOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSection(item) {
  return item && item.type === "section";
}

// ─── Unit conversion helpers ──────────────────────────────────────────────────
const METRIC_TO_IMPERIAL = [
  { from: /\b(\d+(?:\.\d+)?)\s*kg\b/gi,  to: (n) => `${round(n * 2.20462, 2)} lb` },
  { from: /\b(\d+(?:\.\d+)?)\s*g\b/gi,   to: (n) => `${round(n * 0.035274, 2)} oz` },
  { from: /\b(\d+(?:\.\d+)?)\s*ml\b/gi,  to: (n) => `${round(n * 0.202884, 2)} tsp` },
  { from: /\b(\d+(?:\.\d+)?)\s*litre?s?\b/gi, to: (n) => `${round(n * 4.22675, 2)} cups` },
  { from: /\b(\d+(?:\.\d+)?)\s*L\b/g,    to: (n) => `${round(n * 4.22675, 2)} cups` },
  { from: /\b(\d+(?:\.\d+)?)\s*°?C\b/g,  to: (n) => `${round(n * 9/5 + 32, 0)}°F` },
  { from: /\b(\d+(?:\.\d+)?)\s*cm\b/gi,  to: (n) => `${round(n * 0.393701, 1)}"` },
  { from: /\b(\d+(?:\.\d+)?)\s*mm\b/gi,  to: (n) => `${round(n * 0.0393701, 2)}"` },
];

const IMPERIAL_TO_METRIC = [
  { from: /\b(\d+(?:\.\d+)?)\s*lb[s]?\b/gi,  to: (n) => `${round(n * 0.453592, 2)} kg` },
  { from: /\b(\d+(?:\.\d+)?)\s*oz\b/gi,       to: (n) => `${round(n * 28.3495, 1)} g` },
  { from: /\b(\d+(?:\.\d+)?)\s*cups?\b/gi,    to: (n) => `${round(n * 236.588, 0)} ml` },
  { from: /\b(\d+(?:\.\d+)?)\s*tbsp\b/gi,     to: (n) => `${round(n * 14.7868, 1)} ml` },
  { from: /\b(\d+(?:\.\d+)?)\s*tsp\b/gi,      to: (n) => `${round(n * 4.92892, 1)} ml` },
  { from: /\b(\d+(?:\.\d+)?)\s*°?F\b/g,       to: (n) => `${round((n - 32) * 5/9, 0)}°C` },
  { from: /\b(\d+(?:\.\d+)?)\s*"\b/g,         to: (n) => `${round(n * 2.54, 1)} cm` },
];

function round(num, dp) {
  return parseFloat(num.toFixed(dp));
}

function convertUnits(str, mode) {
  if (!str) return str;
  const conversions = mode === "imperial" ? METRIC_TO_IMPERIAL : IMPERIAL_TO_METRIC;
  let result = str;
  for (const { from, to } of conversions) {
    from.lastIndex = 0;
    result = result.replace(from, (_, num) => to(parseFloat(num)));
  }
  return result;
}

// ─── Servings formatter ───────────────────────────────────────────────────────
function scaleServings(servingsStr, relativeMult) {
  if (!servingsStr || relativeMult === 1) return servingsStr;
  return servingsStr.replace(/\d+(?:\.\d+)?/g, (match) => {
    const scaled = parseFloat(match) * relativeMult;
    return Number.isInteger(scaled) ? scaled : parseFloat(scaled.toPrecision(3));
  });
}

// ─── Ingredients checklist with section headers ───────────────────────────────
function IngredientsChecklist({ ingredients, checkedIngredients, onChange, relativeMult, unitMode }) {
  // We can't use a single Checkbox.Group across section headers because the
  // group renders everything flat. Instead we manage checked state ourselves
  // (passed in as a Set of array indices) and render Checkbox components individually.

  // Build a list of only ingredient indices so we can pass the full array index
  // as the checkbox value — this keeps compatibility with the existing state shape.
  const ingredientIndices = ingredients
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => !isSection(item))
    .map(({ i }) => i);

  const toggleOne = (idx) => {
    const next = checkedIngredients.includes(idx)
      ? checkedIngredients.filter((v) => v !== idx)
      : [...checkedIngredients, idx];
    onChange(next);
  };

  // Group into runs for rendering
  const runs = [];
  let currentRun = null;
  for (const [i, item] of ingredients.entries()) {
    if (isSection(item)) {
      if (currentRun) runs.push(currentRun);
      currentRun = { label: item.label, entries: [] };
    } else {
      if (!currentRun) currentRun = { label: null, entries: [] };
      currentRun.entries.push({ item, i });
    }
  }
  if (currentRun) runs.push(currentRun);

  return (
    <div style={{ width: "100%" }}>
      {runs.map((run, ri) => (
        <div key={ri}>
          {run.label && (
            <div
              style={{
                margin: ri === 0 ? "0 0 8px" : "16px 0 8px",
                padding: "4px 10px",
                background: "#fdf6ec",
                border: "1px solid #e8c88a",
                borderRadius: 6,
                display: "inline-block",
                fontSize: 12,
                fontWeight: 700,
                color: "#8a5020",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {run.label}
            </div>
          )}
          <div className={`ingredients-grid${ingredientIndices.length > 7 ? " ingredients-grid--many" : ""}`}>
            {run.entries.map(({ item, i }) => {
              const scaled = scaleIngredient(item, relativeMult);
              const label = unitMode === "imperial" ? convertUnits(scaled, "imperial") : scaled;
              const checked = checkedIngredients.includes(i);
              return (
                <Checkbox
                  key={i}
                  checked={checked}
                  onChange={() => toggleOne(i)}
                >
                  {label}
                </Checkbox>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function RecipePage() {
  const { id } = useParams();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState([]);
  const [checkedSteps, setCheckedSteps] = useState([]);
  const [multiplier, setMultiplier] = useState(1);
  const [unitMode, setUnitMode] = useState("metric");

  useEffect(() => {
    getRecipe(id)
      .then((data) => setRecipe(data || null))
      .catch(() => setRecipe(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleMultiplierChange = (mult) => {
    setMultiplier(mult);
    setCheckedIngredients([]);
  };

  const handleDownloadPDF = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!recipe || downloading) return;
    setDownloading(true);

    try {
      const [{ pdf }, { RecipePDF }, { createElement }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../../components/RecipePDF"),
        import("react"),
      ]);

      const defaultMultiplier = recipe.defaultMultiplier ?? 1;

      const scaledRecipe = {
        ...recipe,
        ingredients: multiplier !== defaultMultiplier
          ? recipe.ingredients?.map((ing) => {
              if (isSection(ing)) return ing; // pass section headers through unchanged
              const relativeMult = multiplier / defaultMultiplier;
              return typeof ing === "string"
                ? scaleIngredient(ing, relativeMult)
                : { ...ing, qty: scaleQty(ing.qty, relativeMult) };
            })
          : recipe.ingredients,
        pageUrl: window.location.href,
        downloadedAt: new Date().toLocaleString("en-NZ", {
          dateStyle: "short",
          timeStyle: "short",
        }),
        multiplierNote: multiplier !== defaultMultiplier
          ? `Scaled at ${formatMult(multiplier)} (original: ${formatMult(defaultMultiplier)})`
          : null,
      };

      const blob = await pdf(createElement(RecipePDF, { recipe: scaledRecipe })).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${(recipe.title ?? "recipe").replace(/[^a-z0-9]/gi, "_").toLowerCase()}${multiplier !== defaultMultiplier ? `_${multiplier}x` : ""}.pdf`
      );
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert(`PDF generation failed: ${err?.message ?? err}`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!recipe) return null;

  const defaultMultiplier = recipe.defaultMultiplier ?? 1;
  const relativeMult = multiplier / defaultMultiplier;

  const images = [recipe.coverImage, ...(recipe.images || [])]
    .filter(Boolean)
    .filter((img, i, arr) => arr.indexOf(img) === i);

  // Only count actual ingredient rows (not section headers)
  const ingredientCount = recipe.ingredients?.filter((i) => !isSection(i)).length ?? 0;

  const scaledServings = scaleServings(recipe.servings, relativeMult);

  const toggleStep = (index) => {
    setCheckedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div style={{ width: "100%", padding: "24px 16px 120px", display: "flex", justifyContent: "center" }}>
      <style>{`
        .ingredients-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          width: 100%;
          margin-bottom: 4px;
        }
        @media (min-width: 600px) {
          .ingredients-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 900px) {
          .ingredients-grid--many {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .ingredients-grid .ant-checkbox-wrapper {
          display: flex;
          align-items: flex-start;
          white-space: normal;
          overflow: visible;
          text-overflow: unset;
          line-height: 1.5;
        }

        .ingredients-grid .ant-checkbox-label {
          white-space: normal;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .step-item {
          cursor: pointer;
          border-radius: 8px;
          padding: 4px 8px;
          transition: background 0.2s, opacity 0.2s;
        }
        .step-item:hover { background: #fdf6ee; }
        .step-item--done { opacity: 0.45; }
        .step-item--done .step-body {
          text-decoration: line-through;
          color: #999 !important;
        }
        .step-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f0e0c8;
          color: #b8621a;
          font-weight: 700;
          font-size: 13px;
          margin-right: 10px;
          flex-shrink: 0;
          transition: background 0.2s, color 0.2s;
        }
        .step-item--done .step-number { background: #e0e0e0; color: #aaa; }
        .step-header { display: flex; align-items: center; margin-bottom: 4px; }

        .unit-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fdf6ee;
          border: 1px solid #f0e0c8;
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 13px;
          color: #7a4f2a;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 1000 }}>
        <Link href="/">← Back to recipes</Link>

        {images.length > 0 ? (
          <div style={{ marginTop: 16, position: "relative" }}>
            <Carousel autoplay>
              {images.map((img, i) => (
                <div key={i}>
                  <img
                    src={img}
                    alt={`${recipe.title} — photo ${i + 1}`}
                    style={{ width: "100%", height: 420, objectFit: "cover", borderRadius: 16 }}
                  />
                </div>
              ))}
            </Carousel>

            <div style={{
              position: "absolute", inset: 0, borderRadius: 16,
              background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
              display: "flex", alignItems: "flex-end", padding: 24,
            }}>
              <div>
                <Title style={{ color: "white", margin: 0 }} level={2}>{recipe.title}</Title>
                {recipe.subtitle && (
                  <Paragraph type="secondary" style={{ color: "white", margin: "8px 0 0" }}>
                    {recipe.subtitle}
                  </Paragraph>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <Title level={2} style={{ color: "#2a2420", marginBottom: recipe.subtitle ? 4 : 0 }}>
              {recipe.title}
            </Title>
            {recipe.subtitle && (
              <Paragraph type="secondary" style={{ fontSize: 16, margin: 0 }}>
                {recipe.subtitle}
              </Paragraph>
            )}
          </div>
        )}

        <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
          {recipe.prepTime && (
            <Col xs={12} md={6}>
              <Card size="small" style={{ textAlign: "center" }}>
                <ClockCircleOutlined />
                <div style={{ fontSize: 12, marginTop: 2 }}>Prep</div>
                <b style={{ fontSize: 14 }}>{recipe.prepTime}</b>
              </Card>
            </Col>
          )}
          {recipe.cookTime && (
            <Col xs={12} md={6}>
              <Card size="small" style={{ textAlign: "center" }}>
                <FireOutlined />
                <div style={{ fontSize: 12, marginTop: 2 }}>Cook</div>
                <b style={{ fontSize: 14 }}>{recipe.cookTime}</b>
              </Card>
            </Col>
          )}
          {recipe.servings && (
            <Col xs={12} md={6}>
              <Card
                size="small"
                style={{
                  textAlign: "center",
                  border: relativeMult !== 1 ? "1px solid #f0c87a" : undefined,
                  background: relativeMult !== 1 ? "#fffbf0" : undefined,
                  transition: "background 0.3s, border 0.3s",
                }}
              >
                <TeamOutlined />
                <div style={{ fontSize: 12, marginTop: 2 }}>Servings</div>
                <b style={{ fontSize: 14 }}>{scaledServings}</b>
                {relativeMult !== 1 && (
                  <div style={{ fontSize: 10, color: "#b8861a", marginTop: 1 }}>
                    (was {recipe.servings})
                  </div>
                )}
              </Card>
            </Col>
          )}
          {recipe.difficulty && (
            <Col xs={12} md={6}>
              <Card size="small" style={{ textAlign: "center" }}>
                <DashboardOutlined />
                <div style={{ fontSize: 12, marginTop: 2 }}>Difficulty</div>
                <b style={{ fontSize: 14 }}>{recipe.difficulty}</b>
              </Card>
            </Col>
          )}
        </Row>

        <Space wrap style={{ marginTop: 12 }}>
          {recipe.tags?.map((t) => <Tag key={t}>{t}</Tag>)}
        </Space>

        <div style={{ marginTop: 24 }}>
          {recipe.description && (
            <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
              {recipe.description}
            </Paragraph>
          )}

          <Divider />

          {recipe.ingredients?.length > 0 && (
            <>
              <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                <RecipeMultiplier
                  defaultMultiplier={defaultMultiplier}
                  onChange={handleMultiplierChange}
                />
                <label className="unit-toggle" style={{ cursor: "pointer" }}>
                  <span style={{ fontWeight: unitMode === "metric" ? 700 : 400 }}>Metric</span>
                  <Switch
                    size="small"
                    checked={unitMode === "imperial"}
                    onChange={(checked) => setUnitMode(checked ? "imperial" : "metric")}
                    style={{ background: unitMode === "imperial" ? "#b8621a" : undefined }}
                  />
                  <span style={{ fontWeight: unitMode === "imperial" ? 700 : 400 }}>Imperial</span>
                </label>
              </div>

              <Title level={3}>
                Ingredients
                {multiplier !== defaultMultiplier && (
                  <span style={{ fontSize: 14, fontWeight: 400, color: "#d4863a", marginLeft: 10 }}>
                    ({formatMult(multiplier)})
                  </span>
                )}
              </Title>

              <IngredientsChecklist
                ingredients={recipe.ingredients}
                checkedIngredients={checkedIngredients}
                onChange={setCheckedIngredients}
                relativeMult={relativeMult}
                unitMode={unitMode}
              />
            </>
          )}

          <Divider />

          {recipe.steps?.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                <Title level={3} style={{ margin: 0 }}>Method</Title>
                {checkedSteps.length > 0 && (
                  <Button
                    size="small"
                    type="text"
                    style={{ color: "#999", fontSize: 12 }}
                    onClick={() => setCheckedSteps([])}
                  >
                    Reset steps
                  </Button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {recipe.steps.map((step, i) => {
                  const done = checkedSteps.includes(i);
                  return (
                    <div key={i}>
                      {i > 0 && (
                        <div style={{ borderTop: "1px solid #f0e8df", margin: "0 8px" }} />
                      )}
                      <div
                        className={`step-item${done ? " step-item--done" : ""}`}
                        onClick={() => toggleStep(i)}
                        role="checkbox"
                        aria-checked={done}
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === " " || e.key === "Enter") ? toggleStep(i) : null}
                      >
                        <div className="step-header">
                          <span className="step-number">{done ? "✓" : i + 1}</span>
                        </div>
                        <div
                          className="step-body"
                          style={{
                            color: "#333",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            lineHeight: 1.7,
                            fontSize: 15,
                            paddingLeft: 38,
                          }}
                        >
                          {unitMode === "imperial" ? convertUnits(step, "imperial") : step}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {recipe.steps.length > 1 && (
                <div style={{ marginTop: 12, fontSize: 13, color: "#999" }}>
                  {checkedSteps.length === recipe.steps.length
                    ? "🎉 All steps complete!"
                    : `${checkedSteps.length} of ${recipe.steps.length} steps done`}
                </div>
              )}
            </>
          )}

          {recipe.notes && (
            <>
              <Divider />
              <Title level={3}>Notes & Tips</Title>
              <div style={{
                background: "#fdf6ee",
                border: "1px solid #f0e0c8",
                borderRadius: 12,
                padding: "16px 20px",
              }}>
                <Paragraph style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 0, whiteSpace: "pre-wrap" }}>
                  {recipe.notes}
                </Paragraph>
              </div>
            </>
          )}
        </div>

        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "white", borderTop: "1px solid #eee",
          padding: "10px 16px", display: "flex", justifyContent: "center", zIndex: 1000,
        }}>
          <Space wrap>
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              Copy Link
            </Button>
            <Button
              icon={<DownloadOutlined />}
              loading={downloading}
              onClick={handleDownloadPDF}
            >
              {downloading ? "Generating…" : "Download PDF"}
            </Button>
            <Link href={`/admin/edit/${id}`}>
              <Button icon={<EditOutlined />}>Edit</Button>
            </Link>
          </Space>
        </div>
      </div>
    </div>
  );
}

function formatMult(mult) {
  if (mult === 0.5) return "½×";
  if (mult === 1.5) return "1½×";
  return `${mult}×`;
}

function scaleQty(qty, mult) {
  if (qty === "" || qty === undefined || qty === null) return qty;
  const num = parseFloat(qty);
  if (isNaN(num)) return qty;
  return parseFloat((num * mult).toPrecision(4)).toString();
}