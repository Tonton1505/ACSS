export default function GlassBackdrop() {
  return <div className="glass-backdrop" aria-hidden="true">
    <div className="scene-depth">
    <div className="scene-tint tint-green"/><div className="scene-tint tint-clear"/>
    <div className="ambient-orb orb-one"/><div className="ambient-orb orb-two"/>
    <svg className="glass-sculpture" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="crystal-body" x1=".15" y1="0" x2=".85" y2="1">
          <stop stopColor="#ffffff" stopOpacity=".82"/>
          <stop offset=".28" stopColor="#e0ede2" stopOpacity=".22"/>
          <stop offset=".54" stopColor="#aacdaf" stopOpacity=".45"/>
          <stop offset=".72" stopColor="#4b8c64" stopOpacity=".36"/>
          <stop offset=".8" stopColor="#d2e5d5" stopOpacity=".14"/>
          <stop offset="1" stopColor="#f5fbf0" stopOpacity=".9"/>
        </linearGradient>
        <linearGradient id="crystal-rim" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffffff"/>
          <stop offset=".35" stopColor="#ffffff" stopOpacity=".15"/>
          <stop offset=".65" stopColor="#438c59" stopOpacity=".55"/>
          <stop offset="1" stopColor="#ffffff" stopOpacity=".95"/>
        </linearGradient>
        <filter id="crystal-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="20" stdDeviation="22" floodColor="#438b65" floodOpacity=".12"/></filter>
      </defs>
      <g transform="translate(1120 470) rotate(28)" filter="url(#crystal-shadow)">
        <ellipse rx="270" ry="340" fill="none" stroke="url(#crystal-body)" strokeWidth="72"/>
        <ellipse rx="306" ry="376" fill="none" stroke="url(#crystal-rim)" strokeWidth="1.6"/>
        <ellipse rx="234" ry="304" fill="none" stroke="url(#crystal-rim)" strokeWidth="1.2"/>
        <ellipse rx="282" ry="352" fill="none" stroke="#fff" strokeOpacity=".36" strokeWidth="1"/>
      </g>
    </svg>
    <svg className="mint-ribbon" viewBox="0 0 1600 1100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="ribbon-light" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fdfffc"/><stop offset=".35" stopColor="#d0e2d1"/><stop offset=".7" stopColor="#8fb799"/><stop offset="1" stopColor="#dfebdf"/></linearGradient>
        <linearGradient id="ribbon-edge"><stop stopColor="#fff" stopOpacity=".75"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
        <filter id="ribbon-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>
      </defs>
      <path d="M 1490 -100 C 950 100, 1620 390, 1130 620 S 240 460, 80 1180" fill="none" stroke="#3f8860" strokeWidth="190" opacity=".12" filter="url(#ribbon-shadow)"/>
      <path d="M 1450 -120 C 920 90, 1580 380, 1090 610 S 200 460, 40 1160" fill="none" stroke="url(#ribbon-light)" strokeWidth="160"/>
      <path d="M 1400 -120 C 880 80, 1510 350, 1050 550 S 120 440, -20 1160" fill="none" stroke="url(#ribbon-edge)" strokeWidth="2"/>
    </svg>
    </div>
    <div className="scene-grain"/>
  </div>;
}
