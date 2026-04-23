"use client";
import { TOOLS, TOOL_SHORTCUTS } from "@/lib/constants";
import { useEffect } from "react";

const tools = [
  { id: TOOLS.SELECT, icon: "↖", label: "Select", shortcut: "V" },
  { id: TOOLS.RECTANGLE, icon: "□", label: "Rectangle", shortcut: "R" },
  { id: TOOLS.ELLIPSE, icon: "○", label: "Ellipse", shortcut: "E" },
  { id: TOOLS.DIAMOND, icon: "◇", label: "Diamond", shortcut: "D" },
  { id: TOOLS.LINE, icon: "╱", label: "Line", shortcut: "L" },
  { id: TOOLS.ARROW, icon: "→", label: "Arrow", shortcut: "A" },
  { id: TOOLS.PENCIL, icon: "✎", label: "Pencil", shortcut: "P" },
  { id: TOOLS.TEXT, icon: "T", label: "Text", shortcut: "T" },
  { id: TOOLS.ERASER, icon: "⌫", label: "Eraser", shortcut: "X" },
  { id: TOOLS.HAND, icon: "✋", label: "Hand", shortcut: "H" },
];

export default function Toolbar({ activeTool, onToolChange }) {
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      )
        return;

      const key = e.key.toLowerCase();
      if (TOOL_SHORTCUTS[key]) {
        onToolChange(TOOL_SHORTCUTS[key]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToolChange]);

  return (
    <div className="toolbar" id="toolbar">
      {tools.map((t) => (
        <button
          key={t.id}
          className={`tool-button ${activeTool === t.id ? "active" : ""}`}
          onClick={() => onToolChange(t.id)}
          title={`${t.label} (${t.shortcut})`}
          id={`tool-${t.id}`}
        >
          <span className="tool-icon">{t.icon}</span>
          <span className="tool-shortcut">{t.shortcut}</span>
        </button>
      ))}
    </div>
  );
}
