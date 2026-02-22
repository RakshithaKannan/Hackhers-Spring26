export default function WaterWiseLogo({ className = 'h-9 w-auto' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 50" className={className}>
      <defs>
        <filter id="dshadow" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2.2" floodColor="#0369a1" floodOpacity="0.28"/>
        </filter>
        <clipPath id="dropClip">
          <path d="M20,1 C20,1 34,18 34,36 A14,14 0 0,1 6,36 C6,18 20,1 20,1Z"/>
        </clipPath>
        <linearGradient id="gSky" x1="20" y1="1" x2="20" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#e0f2fe"/>
          <stop offset="100%" stopColor="#7dd3fc"/>
        </linearGradient>
        <linearGradient id="gSea" x1="20" y1="24" x2="20" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#0ea5e9"/>
          <stop offset="100%" stopColor="#075985"/>
        </linearGradient>
        <linearGradient id="gRoad" x1="20" y1="50" x2="20" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#15803d"/>
          <stop offset="100%" stopColor="#4ade80"/>
        </linearGradient>
      </defs>
      <g filter="url(#dshadow)">
        <path d="M20,1 C20,1 34,18 34,36 A14,14 0 0,1 6,36 C6,18 20,1 20,1Z" fill="url(#gSky)"/>
      </g>
      <g clipPath="url(#dropClip)">
        <rect x="4" y="24" width="32" height="28" fill="url(#gSea)"/>
        <path d="M4,24 Q12,19 20,24 Q28,29 36,24" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85"/>
        <path d="M4,29 Q12,24 20,29 Q28,34 36,29" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.55"/>
        <path d="M4,34 Q12,29 20,34 Q28,39 36,34" stroke="white" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.35"/>
        <path d="M20,50 Q16,42 20,34 Q24,26 20,18 Q18,12 20,8" stroke="url(#gRoad)" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M20,50 Q16,42 20,34 Q24,26 20,18 Q18,12 20,8" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 3" fill="none" opacity="0.55"/>
        <path d="M13,8 Q11,16 12,22" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.28"/>
      </g>
      <circle cx="20" cy="10" r="5.2" fill="white"/>
      <circle cx="20" cy="10" r="2.1" fill="#0284c7"/>
      <path d="M20,15.2 L20,20.5" stroke="white" strokeWidth="2.6" strokeLinecap="round"/>
      <circle cx="20" cy="21.5" r="1.4" fill="white"/>
      <path d="M20,1 C20,1 34,18 34,36 A14,14 0 0,1 6,36 C6,18 20,1 20,1Z" stroke="#0369a1" strokeWidth="0.7" fill="none" opacity="0.22"/>
      <text y="33" fontFamily="'Inter','SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif" fontWeight="800" fontSize="22" letterSpacing="-0.4">
        <tspan x="42" fill="#0ea5e9">water</tspan><tspan fill="#22c55e">Wise</tspan>
      </text>
    </svg>
  )
}
