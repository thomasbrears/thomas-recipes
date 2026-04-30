"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getRecipe } from "../../../lib/recipes";
import RecipeMultiplier, { scaleIngredient } from "../../components/RecipeMultiplier";

import {
  Carousel, Row, Col, Card, Tag, Button, Space,
  Typography, Divider, Checkbox, List,
} from "antd";

import {
  ClockCircleOutlined, FireOutlined, TeamOutlined,
  DashboardOutlined, LinkOutlined, EditOutlined, DownloadOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function RecipePage() {
  const { id } = useParams();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const [multiplier, setMultiplier] = useState(1);

  useEffect(() => {
    getRecipe(id)
      .then((data) => setRecipe(data || null))
      .catch(() => setRecipe(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Reset checked items when multiplier changes so the list reflects new quantities
  const handleMultiplierChange = (mult) => {
    setMultiplier(mult);
    setCheckedItems([]);
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

      // Scale ingredients for PDF when multiplier !== 1
      const scaledRecipe = {
        ...recipe,
        ingredients: multiplier !== 1
          ? recipe.ingredients?.map((ing) => {
              const label = scaleIngredient(ing, multiplier);
              return typeof ing === "string" ? label : { ...ing, qty: scaleQty(ing.qty, multiplier) };
            })
          : recipe.ingredients,
        pageUrl: window.location.href,
        downloadedAt: new Date().toLocaleString("en-NZ", {
          dateStyle: "short",
          timeStyle: "short",
        }),
        multiplierNote: multiplier !== (recipe.defaultMultiplier ?? 1)
          ? `Scaled at ${multiplier}× (original: ${recipe.defaultMultiplier ?? 1}×)`
          : null,
      };

      const blob = await pdf(createElement(RecipePDF, { recipe: scaledRecipe })).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${(recipe.title ?? "recipe").replace(/[^a-z0-9]/gi, "_").toLowerCase()}${multiplier !== 1 ? `_${multiplier}x` : ""}.pdf`
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

  const images = [recipe.coverImage, ...(recipe.images || [])]
    .filter(Boolean)
    .filter((img, i, arr) => arr.indexOf(img) === i);

  const isManyIngredients = (recipe.ingredients?.length || 0) > 7;

  return (
    <div style={{ width: "100%", padding: "24px 16px 120px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1000 }}>
        <Link href="/">← Back to recipes</Link>

        {images.length > 0 && (
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
              <Title style={{ color: "white", margin: 0 }} level={2}>
                {recipe.title}
              </Title>
              {recipe.subtitle && (
                <Paragraph type="secondary" style={{ color: "white", margin: "20px 20px 0" }}>
                  {recipe.subtitle}
                </Paragraph>
              )}
            </div>
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
              <Card size="small" style={{ textAlign: "center" }}>
                <TeamOutlined />
                <div style={{ fontSize: 12, marginTop: 2 }}>Servings</div>
                <b style={{ fontSize: 14 }}>{recipe.servings}</b>
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
              {/* ── Multiplier selector ── */}
              <div style={{ marginBottom: 16 }}>
                <RecipeMultiplier
                  defaultMultiplier={defaultMultiplier}
                  onChange={handleMultiplierChange}
                />
              </div>

              <Title level={3}>
                Ingredients
                {multiplier !== 1 && (
                  <span style={{ fontSize: 14, fontWeight: 400, color: "#d4863a", marginLeft: 10 }}>
                    ({formatMult(multiplier)})
                  </span>
                )}
              </Title>

              <Checkbox.Group
                value={checkedItems}
                onChange={setCheckedItems}
                style={{ width: "100%" }}
                aria-label="Ingredients checklist"
              >
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isManyIngredients ? "1fr 1fr 1fr" : "1fr 1fr",
                  gap: 10,
                  width: "100%",
                }}>
                  {recipe.ingredients.map((item, i) => {
                    const label = scaleIngredient(item, multiplier);
                    return <Checkbox key={i} value={i}>{label}</Checkbox>;
                  })}
                </div>
              </Checkbox.Group>
            </>
          )}

          <Divider />

          {recipe.steps?.length > 0 && (
            <>
              <Title level={3}>Method</Title>
              <List
                dataSource={recipe.steps}
                renderItem={(step, i) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div style={{ color: "#333", lineHeight: 2, fontSize: 18 }}>
                          Step {i + 1}
                        </div>
                      }
                      description={
                        <div style={{ color: "#333", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.7, fontSize: 15 }}>
                          {step}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
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

        {/* ── Fixed bottom bar ── */}
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