"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";

export default function LandingPage() {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { createRoom } = useSocket();

  const handleCreate = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      sessionStorage.setItem("collabdraw-username", username.trim());
      const roomId = await createRoom(username.trim());
      router.push(`/room/${roomId}`);
    } catch (err) {
      console.error("Failed to create room:", err);
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (!username.trim() || !roomCode.trim()) return;
    sessionStorage.setItem("collabdraw-username", username.trim());
    router.push(`/room/${roomCode.trim()}`);
  };

  return (
    <div className="landing-page">
      <div className="landing-bg">
        <div className="grid-pattern" />
      </div>

      <div className="landing-content">
        <div className="landing-logo">
          <span className="landing-logo-icon">✦</span>
          <span className="landing-logo-text">CollabDraw</span>
        </div>

        <p className="landing-subtitle">
          A real-time collaborative whiteboard. Create a room, share the link,
          and draw together with anyone — instantly.
        </p>

        <div className="landing-card">
          <div className="input-group">
            <label htmlFor="username-input">Your Name</label>
            <input
              id="username-input"
              className="input-field"
              type="text"
              placeholder="Enter your name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleCreate}
            disabled={!username.trim() || loading}
            id="create-room-btn"
          >
            {loading ? "Creating..." : "✨ Create New Room"}
          </button>

          <div className="divider">or join existing</div>

          <div className="join-row">
            <input
              id="room-code-input"
              className="input-field"
              type="text"
              placeholder="Enter room code..."
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <button
              className="btn-secondary"
              onClick={handleJoin}
              disabled={!username.trim() || !roomCode.trim()}
              id="join-room-btn"
            >
              Join →
            </button>
          </div>
        </div>

        <div className="landing-features">
          <div className="feature-item">
            <span className="feature-icon">🎨</span>
            <span>Drawing Tools</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">👥</span>
            <span>Real-time Collab</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔗</span>
            <span>Share & Join</span>
          </div>
        </div>
      </div>
    </div>
  );
}
