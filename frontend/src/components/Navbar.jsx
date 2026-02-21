/**
 * Navbar.jsx — WaterWise navigation bar
 *
 * Behaviour:
 *   - Transparent when the user is at the very top of the page (over the hero)
 *   - Transitions to frosted-glass white when the user scrolls down (Apple style)
 *   - All existing auth / language / navigation logic preserved
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t, lang, toggleLanguage } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  // Only the home page (/) gets the transparent-over-hero effect.
  // All other pages (map, community, login, register) always show solid glass.
  const isHome = location.pathname === '/'

  const [scrolled, setScrolled] = useState(!isHome)
  useEffect(() => {
    if (!isHome) { setScrolled(true); return }
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

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

        {/* ── Logo — real WaterWise image, white-filtered when transparent ── */}
        <Link to="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="WaterWise"
            className={`h-9 w-auto object-contain transition-all duration-300 ${
              scrolled ? 'brightness-100' : 'brightness-0 invert'
            }`}
          />
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
