import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Shield } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t, lang, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Shield className="w-6 h-6" />
          SafeSphere
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link to="/" className="hover:text-primary transition-colors">{t('home')}</Link>
          <Link to="/map" className="hover:text-primary transition-colors">{t('map')}</Link>
          <Link to="/community" className="hover:text-primary transition-colors">{t('community')}</Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="text-xs font-semibold border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-100 transition-colors"
            title="Toggle language"
          >
            {lang === 'en' ? '🇺🇸 EN' : '🇲🇽 ES'}
          </button>

          {user ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:block">Hi, {user.username}</span>
              <button onClick={handleLogout} className="btn-outline text-sm py-1">
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline text-sm py-1">{t('login')}</Link>
              <Link to="/register" className="btn-primary text-sm py-1">{t('register')}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
