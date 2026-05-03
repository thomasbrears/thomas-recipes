"use client";

import { useState, useEffect } from "react";
import { WarningFilled } from "@ant-design/icons";

/**
 * Formats an ingredient object or string, scaling the numeric qty by `mult`.
 *
 * NOTE: `mult` here is the *relative* multiplier — i.e. the ratio of the
 * selected scale to the recipe's defaultMultiplier. The caller (RecipePage) is
 * responsible for computing:
 *
 *   relativeMult = selectedMultiplier / defaultMultiplier
 *
 * and passing that in, NOT the raw selected multiplier.
 */
export function scaleIngredient(item, mult) {
  if (typeof item === "string") return item;

  const { qty, unit, name, notes } = item;

  let scaledQty = qty;
  if (qty !== "" && qty !== undefined && qty !== null) {
    const num = parseFloat(qty);
    if (!isNaN(num)) {
      const result = num * mult;
      scaledQty = parseFloat(result.toPrecision(4)).toString();
    }
  }

  return [scaledQty, unit, name, notes ? `(${notes})` : ""].filter(Boolean).join(" ");
}

/**
 * RecipeMultiplier
 *
 * Props:
 *  - defaultMultiplier: number — the recipe's authored scale (e.g. 8).
 *  - onChange: (selectedMultiplier: number) => void
 */
export default function RecipeMultiplier({ defaultMultiplier = 1, onChange }) {
  const [selected, setSelected] = useState(defaultMultiplier);

  // Expose initial value on mount
  useEffect(() => {
    onChange?.(defaultMultiplier);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (next) => {
    setSelected(next);
    onChange?.(next);
  };

  const decrement = () => {
    const next = Math.max(0.25, parseFloat((selected - (selected <= 1 ? 0.25 : 1)).toFixed(4)));
    handleChange(next);
  };

  const increment = () => {
    const next = parseFloat((selected + (selected < 1 ? 0.25 : 1)).toFixed(4));
    handleChange(next);
  };

  const handleInputChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0.25) handleChange(val);
  };

  const handleInputBlur = (e) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val) || val < 0.25) handleChange(defaultMultiplier);
  };

  const showWarning = selected !== defaultMultiplier;

  const btnBase = {
    width: 36, height: 36,
    border: "1.5px solid #d9d9d9",
    background: "#fafaf8", cursor: "pointer",
    fontSize: 18, fontWeight: 700, color: "#6b5e52",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.1s",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 12, fontWeight: 600, color: "#9c9086",
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          Scale
        </span>

        {/* ── Stepper ── */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            type="button"
            onClick={decrement}
            style={{ ...btnBase, borderRight: "none", borderRadius: "8px 0 0 8px" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f5ede0"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#fafaf8"}
          >
            −
          </button>
          <input
            type="number"
            min="0.25"
            step="0.25"
            value={selected}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
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
            onClick={increment}
            style={{ ...btnBase, borderLeft: "none", borderRadius: "0 8px 8px 0" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f5ede0"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#fafaf8"}
          >
            +
          </button>
        </div>



        {/* ── Reset to default button — only shown when off default ── */}
        {showWarning && (
          <button
            type="button"
            onClick={() => handleChange(defaultMultiplier)}
            style={{
              fontSize: 12, fontWeight: 600, color: "#9c9086",
              background: "none", border: "1.5px solid #e0d8ce",
              borderRadius: 20, padding: "2px 10px", cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#6b5e52"; e.currentTarget.style.borderColor = "#c0b8ae"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#9c9086"; e.currentTarget.style.borderColor = "#e0d8ce"; }}
          >
            Reset to default ({formatMult(defaultMultiplier)})
          </button>
        )}
      </div>

      {/* ── Warning banner ── */}
      {showWarning && (
        <div style={{
          marginTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#fff8ec",
          border: "1px solid #f5c97a",
          borderRadius: 8,
          padding: "8px 14px",
          fontSize: 13,
          color: "#7a4f00",
        }}>
          <WarningFilled style={{ color: "#d4863a", fontSize: 15, flexShrink: 0 }} />
          <span>
            Viewing at <strong>{formatMult(selected)}</strong> — this recipe is written for{" "}
            <strong>{formatMult(defaultMultiplier)}</strong>. Double-check quantities before you start cooking!
          </span>
        </div>
      )}
    </div>
  );
}

function formatMult(mult) {
  if (mult === 0.5) return "½X";
  if (mult === 1.5) return "1½X";
  return `${mult}X`;
}