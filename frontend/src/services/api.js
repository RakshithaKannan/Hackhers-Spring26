import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_URL })

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)

// Flood risk
export const getFloodRisk = (lat, lng) =>
  api.post('/flood/risk', { lat, lng })

// Navigation
export const getRoute = (origin, destination) =>
  api.post('/navigation/route', { origin, destination, avoid_flood: true })

export const getSafeZone = (lat, lng) =>
  api.post('/navigation/safezone', { lat, lng })

// Chat
export const sendChatMessage = (message, riskScore, riskLevel, location, history) =>
  api.post('/chat/message', {
    message,
    risk_score: riskScore,
    risk_level: riskLevel,
    location,
    history,
  })

// Community
export const getPosts = (category) =>
  api.get('/community/posts', { params: category ? { category } : {} })

export const getPost = (id) => api.get(`/community/posts/${id}`)

export const createPost = (data) => api.post('/community/posts', data)

export const deletePost = (id) => api.delete(`/community/posts/${id}`)

export const addComment = (postId, body) =>
  api.post(`/community/posts/${postId}/comments`, { body })
