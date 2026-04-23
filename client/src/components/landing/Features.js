import React from 'react';

export default function Features() {
  const features = [
    {
      icon: "⚡",
      title: "Real-time Synchronization",
      description: "Changes appear instantly for everyone in the room. Enjoy a truly cooperative drawing experience with zero lag."
    },
    {
      icon: "🎨",
      title: "Expressive Tools",
      description: "Everything you need to sketch concepts: pencils, shape drawing, customizable lines, dynamic color palettes, and more."
    },
    {
      icon: "🔗",
      title: "Instant Sharing",
      description: "Generate a room code in one click. Share it with your team, and they can hop right onto the canvas instantly."
    },
    {
      icon: "🎭",
      title: "Multiplayer Cursors",
      description: "See where your teammates are pointing in real-time with vibrant, personalized cursor indicators."
    },
    {
      icon: "🖌️",
      title: "Hand-Drawn Style",
      description: "All shapes are rendered with a specialized 'roughness' algorithm giving your diagrams an authentic hand-drawn aesthetic."
    },
    {
      icon: "🔒",
      title: "No Accounts Required",
      description: "Skip the tedious signups. Type a nickname and start drawing right away. Frictionless teamwork."
    }
  ];

  return (
    <section id="features" className="features-section">
      <div className="features-header">
        <h2 className="section-title">Everything you need. <br/>Nothing you don't.</h2>
        <p className="section-subtitle">
          Built for speed, simplicity, and a seamless creative flow.
        </p>
      </div>

      <div className="features-grid">
        {features.map((ft, idx) => (
          <div key={idx} className="feature-card">
            <div className="feature-card-icon">{ft.icon}</div>
            <h3 className="feature-card-title">{ft.title}</h3>
            <p className="feature-card-text">{ft.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
