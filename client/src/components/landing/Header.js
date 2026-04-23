import Link from 'next/link';
import React from 'react';

export default function Header() {
  return (
    <header className="landing-header">
      <div className="header-container">
        <Link href="/" className="header-logo">
          <span className="landing-logo-icon">✦</span>
          <span className="landing-logo-text">CollabDraw</span>
        </Link>
        <nav className="header-nav">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
        <div className="header-actions">
          <Link href="/workshop">
            <button className="btn-primary header-btn">Enter Workshop</button>
          </Link>
        </div>
      </div>
    </header>
  );
}
