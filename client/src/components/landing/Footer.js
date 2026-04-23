import React from 'react';

export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="landing-logo-icon">✦</div>
          <span className="footer-brand-name">CollabDraw</span>
        </div>
        <p className="footer-desc">
          Building the fastest collaborative drawing tools for remote teams and creative minds.
        </p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">X (Twitter)</a>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} CollabDraw. All rights reserved.
      </div>
    </footer>
  );
}
