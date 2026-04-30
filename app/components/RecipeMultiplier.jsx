"use client";

import { useState, useEffect } from "react";
import { Tag, Tooltip } from "antd";
import { WarningFilled } from "@ant-design/icons";

const MULTIPLIERS = [0.5, 1, 1.5, 2, 3, 4, 5, 10];

/**
 * Formats an ingredient object or string, scaling the numeric qty by `mult`.
 * Returns the display label.
 */
export function scaleIngredient(item, mult) {
  if (typeof item === "string") return item; // can't reliably parse free-text

  const { qty, unit, name, notes } = item;

  let scaledQty = qty;
  if (qty !== "" && qty !== undefined && qty !== null) {
    const num = parseFloat(qty);
    if (!isNaN(num)) {
      const result = num * mult;
      // Show up to 3 sig figs, strip trailing zeros
      scaledQty = parseFloat(result.toPrecision(4)).toString();
    }
  }

  return [scaledQty, unit, name, notes ? `(${notes})` : ""].filter(Boolean).join(" ");
}

/**
 * RecipeMultiplier
 *
 * Props:
 *  - defaultMultiplier: number (1 fallback)
 *  - onChange: (mult: number) => void
 */
export default function RecipeMultiplier({ defaultMultiplier = 1, onChange }) {
  const [selected, setSelected] = useState(() => {
    // Snap to nearest known multiplier or use default
    return MULTIPLIERS.includes(defaultMultiplier) ? defaultMultiplier : defaultMultiplier;
  });
  const [showWarning, setShowWarning] = useState(false);

  // Expose initial value on mount
  useEffect(() => {
    onChange?.(selected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (mult) => {
    setSelected(mult);
    onChange?.(mult);

    // Show warning when it's not the default
    setShowWarning(mult !== defaultMultiplier);
  };

  // Ensure defaultMultiplier appears in the list
  const options = MULTIPLIERS.includes(defaultMultiplier)
    ? MULTIPLIERS
    : [...MULTIPLIERS, defaultMultiplier].sort((a, b) => a - b);

  return (
    <div>
      {/* ── Multiplier pills ── */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#9c9086", marginRight: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Scale
        </span>

        {options.map((mult) => {
          const isActive = selected === mult;
          const isDefault = mult === defaultMultiplier;

          return (
            <button
              key={mult}
              type="button"
              onClick={() => handleSelect(mult)}
              style={{
                padding: "3px 12px",
                borderRadius: 20,
                border: isActive ? "2px solid #d4863a" : "1.5px solid #e0d8ce",
                background: isActive ? "#d4863a" : "#fff",
                color: isActive ? "#fff" : "#6b5e52",
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s",
                lineHeight: 1.5,
                position: "relative",
              }}
            >
              {formatMult(mult)}
              {isDefault && (
                <span style={{
                  position: "absolute",
                  top: -5,
                  right: -4,
                  background: "#f5c97a",
                  color: "#7a4f00",
                  fontSize: 8,
                  fontWeight: 800,
                  borderRadius: 4,
                  padding: "0 3px",
                  lineHeight: "13px",
                  letterSpacing: "0.04em",
                }}>
                  DEF
                </span>
              )}
            </button>
          );
        })}
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
            You're viewing this recipe at <strong>{formatMult(selected)}</strong> — the original is scaled for <strong>{formatMult(defaultMultiplier)}</strong>. Double-check quantities before you start cooking!
          </span>
        </div>
      )}
    </div>
  );
}

function formatMult(mult) {
  if (mult === 0.5) return "½×";
  if (mult === 1.5) return "1½×";
  return `${mult}×`;
}