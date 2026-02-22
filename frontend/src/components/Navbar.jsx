/**
 * Navbar.jsx — WaterWise navigation bar
 *
 * Behaviour:
 *   - Transparent when the user is at the very top of the page (over the hero)
 *   - Transitions to frosted-glass white when the user scrolls down (Apple style)
 *   - All existing auth / language / navigation logic preserved
 */

import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t, lang, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  // Always solid — locked in on every page including the hero
  const scrolled = true

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  /* ── Dynamic class helpers ── */
  const navBg   = scrolled ? 'bg-white/88 backdrop-blur-xl border-b border-slate-200/60 shadow-sm' : 'bg-transparent'
  const linkCls = scrolled ? 'text-slate-600 hover:text-sky-600' : 'text-white/80 hover:text-white'
  const pillCls = scrolled
    ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
    : 'border-white/20 text-white hover:bg-white/10'

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center">
          <WaterWiseLogo className="h-9 w-auto transition-all duration-300" />
        </Link>

        {/* ── Nav links (desktop) ── */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium">
          {[
            { to: '/',          label: t('home') },
            { to: '/map',       label: t('map') },
            { to: '/community', label: t('community') },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`transition-colors duration-200 ${linkCls}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* ── Right-side actions ── */}
        <div className="flex items-center gap-3">

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className={`text-xs font-semibold border rounded-lg px-2.5 py-1.5 transition-all duration-300 ${pillCls}`}
            title="Toggle language"
          >
            {lang === 'en' ? '🇺🇸 EN' : '🇲🇽 ES'}
          </button>

          {user ? (
            <>
              <span className={`text-sm hidden sm:block transition-colors duration-300 ${scrolled ? 'text-slate-500' : 'text-white/70'}`}>
                Hi, {user.username}
              </span>
              <button
                onClick={handleLogout}
                className={`text-sm font-semibold px-4 py-1.5 rounded-lg border transition-all duration-300 ${pillCls}`}
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`text-sm font-semibold px-4 py-1.5 rounded-lg border transition-all duration-300 ${pillCls}`}
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                className="text-sm font-bold px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white transition-colors shadow-sm shadow-sky-500/30"
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function WaterWiseLogo({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 50" className={className}>
      <defs>
        {/* Soft drop shadow */}
        <filter id="dshadow" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2.2" floodColor="#0369a1" floodOpacity="0.28"/>
        </filter>

        <clipPath id="dropClip">
          <path d="M20,1 C20,1 34,18 34,36 A14,14 0 0,1 6,36 C6,18 20,1 20,1Z"/>
        </clipPath>

        {/* Light sky → sky-blue */}
        <linearGradient id="gSky" x1="20" y1="1" x2="20" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#e0f2fe"/>
          <stop offset="100%" stopColor="#7dd3fc"/>
        </linearGradient>

        {/* Bright ocean → deep navy */}
        <linearGradient id="gSea" x1="20" y1="24" x2="20" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#0ea5e9"/>
          <stop offset="100%" stopColor="#075985"/>
        </linearGradient>

        {/* Grass green → light green */}
        <linearGradient id="gRoad" x1="20" y1="50" x2="20" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#15803d"/>
          <stop offset="100%" stopColor="#4ade80"/>
        </linearGradient>
      </defs>

      {/* Drop with shadow */}
      <g filter="url(#dshadow)">
        <path d="M20,1 C20,1 34,18 34,36 A14,14 0 0,1 6,36 C6,18 20,1 20,1Z" fill="url(#gSky)"/>
      </g>

      {/* Clipped water + road interior */}
      <g clipPath="url(#dropClip)">
        <rect x="4" y="24" width="32" height="28" fill="url(#gSea)"/>

        {/* Three waves */}
        <path d="M4,24 Q12,19 20,24 Q28,29 36,24" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85"/>
        <path d="M4,29 Q12,24 20,29 Q28,34 36,29" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.55"/>
        <path d="M4,34 Q12,29 20,34 Q28,39 36,34" stroke="white" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.35"/>

        {/* Winding road */}
        <path d="M20,50 Q16,42 20,34 Q24,26 20,18 Q18,12 20,8"
              stroke="url(#gRoad)" strokeWidth="6" strokeLinecap="round" fill="none"/>
        {/* Road centre dashes */}
        <path d="M20,50 Q16,42 20,34 Q24,26 20,18 Q18,12 20,8"
              stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 3" fill="none" opacity="0.55"/>

        {/* Gloss highlight on upper-left drop */}
        <path d="M13,8 Q11,16 12,22" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.28"/>
      </g>

      {/* Location pin */}
      <circle cx="20" cy="10" r="5.2" fill="white"/>
      <circle cx="20" cy="10" r="2.1" fill="#0284c7"/>
      <path d="M20,15.2 L20,20.5" stroke="white" strokeWidth="2.6" strokeLinecap="round"/>
      <circle cx="20" cy="21.5" r="1.4" fill="white"/>

      {/* Subtle drop outline */}
      <path d="M20,1 C20,1 34,18 34,36 A14,14 0 0,1 6,36 C6,18 20,1 20,1Z"
            stroke="#0369a1" strokeWidth="0.7" fill="none" opacity="0.22"/>

      {/* Text — single element, tspan = zero gap between water and Wise */}
      <text
        y="33"
        fontFamily="'Inter','SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif"
        fontWeight="800"
        fontSize="22"
        letterSpacing="-0.4"
      >
        <tspan x="42" fill="#0ea5e9">water</tspan><tspan fill="#22c55e">Wise</tspan>
      </text>
    </svg>
  )
}
