"use client";
import { useState } from "react";

export default function TopBar({
  roomId,
  users,
  isConnected,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onExport,
}) {
  const [copied, setCopied] = useState(false);

  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}`
      : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="topbar" id="topbar">
      <div className="topbar-left">
        <div className="logo">
          <span className="logo-icon">✦</span>
          <span className="logo-text">CollabDraw</span>
        </div>
      </div>

      <div className="topbar-center">
        <button
          className="topbar-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          id="undo-btn"
        >
          ↩
        </button>
        <button
          className="topbar-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          id="redo-btn"
        >
          ↪
        </button>
        <div className="topbar-divider" />
        <button
          className="topbar-btn danger"
          onClick={onClear}
          title="Clear canvas"
          id="clear-btn"
        >
          🗑
        </button>
        <button
          className="topbar-btn"
          onClick={onExport}
          title="Export as PNG"
          id="export-btn"
        >
          📥
        </button>
      </div>

      <div className="topbar-right">
        <div className="room-info">
          <span className={`connection-dot ${isConnected ? "connected" : ""}`} />
          <span className="room-id">Room: {roomId}</span>
        </div>

        <button
          className="share-btn"
          onClick={handleCopy}
          id="share-btn"
        >
          {copied ? "✓ Copied!" : "🔗 Share"}
        </button>

        <div className="users-list">
          {users.map((user, i) => (
            <div
              key={user.socketId || i}
              className="user-avatar"
              title={user.username}
              style={{
                "--avatar-hue": (i * 60) % 360,
                zIndex: users.length - i,
              }}
            >
              {user.username?.[0]?.toUpperCase() || "?"}
            </div>
          ))}
          {users.length > 0 && (
            <span className="users-count">{users.length} online</span>
          )}
        </div>
      </div>
    </div>
  );
}
