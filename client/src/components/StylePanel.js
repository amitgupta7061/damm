"use client";
import {
  STROKE_COLORS,
  FILL_COLORS,
  STROKE_WIDTHS,
} from "@/lib/constants";

export default function StylePanel({ style, onStyleChange }) {
  return (
    <div className="style-panel" id="style-panel">
      {/* Stroke Color */}
      <div className="style-section">
        <label className="style-label">Stroke</label>
        <div className="color-grid">
          {STROKE_COLORS.map((color) => (
            <button
              key={color}
              className={`color-swatch ${style.strokeColor === color ? "active" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => onStyleChange({ strokeColor: color })}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Fill Color */}
      <div className="style-section">
        <label className="style-label">Fill</label>
        <div className="color-grid">
          {FILL_COLORS.map((color, i) => (
            <button
              key={i}
              className={`color-swatch fill-swatch ${style.fillColor === color ? "active" : ""}`}
              style={{
                backgroundColor: color === "transparent" ? "transparent" : color,
              }}
              onClick={() => onStyleChange({ fillColor: color })}
              title={color === "transparent" ? "No fill" : color}
            >
              {color === "transparent" && <span className="no-fill-icon">∅</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="style-section">
        <label className="style-label">Stroke Width</label>
        <div className="width-options">
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              className={`width-btn ${style.strokeWidth === w ? "active" : ""}`}
              onClick={() => onStyleChange({ strokeWidth: w })}
              title={`${w}px`}
            >
              <div
                className="width-preview"
                style={{ height: `${Math.min(w, 6)}px` }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
