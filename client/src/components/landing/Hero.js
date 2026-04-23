"use client";
import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';


export default function Hero() {
  const router = useRouter();
  const { createRoom } = useSocket();
  const [loading, setLoading] = useState(false);

  const handleStartDrawing = async () => {
    setLoading(true);
    // Auto-generate name and UUID since this is the quick-start button
    const username = sessionStorage.getItem("collabdraw-username") || "Creator";
    sessionStorage.setItem("collabdraw-username", username);
    
    // In our implementation, socket createRoom returns the ID.
    try {
        const roomId = await createRoom(username);
        router.push(`/room/${roomId}`);
    } catch(err) {
        console.error(err);
        setLoading(false);
    }
  };
  return (
    <section className="hero-section">
      <div className="landing-bg">
        <div className="grid-pattern" />
      </div>

      <div className="hero-content">
        <div className="chip">✨ Introducing CollabDraw 2.0</div>
        
        <h1 className="hero-title">
          Think, draw, and <br/>
          <span className="text-gradient">create together.</span>
        </h1>
        
        <p className="hero-subtitle">
          The ultimate real-time collaborative whiteboard designed for seamless teamwork. 
          No sign-ups, no friction. Just creativity.
        </p>

        <div className="hero-cta">
          <button className="btn-primary hero-btn" onClick={handleStartDrawing} disabled={loading}>
            {loading ? "Starting..." : "Start Drawing"} <span className="arrow">→</span>
          </button>
          <a href="#features" className="btn-secondary hero-btn outline-btn">
            Explore Features
          </a>
        </div>
        
        <div className="hero-visual">
          <div className="mockup-window">
             <div className="mockup-header">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
             </div>
             <div className="mockup-body">
                {/* Visual abstract representation of the whiteboard */}
                <div className="abstract-shape shape-1"></div>
                <div className="abstract-shape shape-2"></div>
                <div className="cursor-mock cursor-1">
                   <div className="cursor-arrow" style={{ transform: "rotate(-20deg)"}}>▶</div>
                   <div className="cursor-label" style={{ background: "#4ade80" }}>Alex</div>
                </div>
                <div className="cursor-mock cursor-2">
                   <div className="cursor-arrow" style={{ transform: "rotate(-10deg)"}}>▶</div>
                   <div className="cursor-label" style={{ background: "#60a5fa" }}>Sarah</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
