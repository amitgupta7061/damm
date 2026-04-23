"use client";
import { CURSOR_COLORS } from "@/lib/constants";

export default function CursorOverlay({ cursors, panOffset, scale }) {
  const cursorEntries = Object.entries(cursors);

  return (
    <div className="cursor-overlay">
      {cursorEntries.map(([socketId, { x, y, username }], index) => {
        const color = CURSOR_COLORS[index % CURSOR_COLORS.length];
        const screenX = x * scale + panOffset.x;
        const screenY = y * scale + panOffset.y;

        return (
          <div
            key={socketId}
            className="remote-cursor"
            style={{
              transform: `translate(${screenX}px, ${screenY}px)`,
              "--cursor-color": color,
            }}
          >
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill={color}
              className="cursor-arrow"
            >
              <path d="M0 0 L0 16 L4.5 12 L8 20 L10 19 L6.5 11 L12 11 Z" />
            </svg>
            <span className="cursor-label" style={{ backgroundColor: color }}>
              {username}
            </span>
          </div>
        );
      })}
    </div>
  );
}
