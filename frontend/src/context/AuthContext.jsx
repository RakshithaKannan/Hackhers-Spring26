import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, register as apiRegister } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    const language = localStorage.getItem('language')
    if (token && username) setUser({ token, username, language: language || 'en' })
  }, [])

  const login = async (username, password) => {
    const res = await apiLogin({ username, password })
    const { access_token, username: uname, language } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('username', uname)
    localStorage.setItem('language', language)
    setUser({ token: access_token, username: uname, language })
  }

  const register = async (username, email, password, language = 'en') => {
    const res = await apiRegister({ username, email, password, language })
    const { access_token, username: uname } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('username', uname)
    localStorage.setItem('language', language)
    setUser({ token: access_token, username: uname, language })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('language')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
