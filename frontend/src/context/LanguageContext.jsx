import { createContext, useContext, useState } from 'react'
import en from '../i18n/en'
import es from '../i18n/es'

const strings = { en, es }

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('language') || 'en')

  const t = (key) => strings[lang]?.[key] || strings.en[key] || key

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'es' : 'en'
    setLang(next)
    localStorage.setItem('language', next)
  }

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
