import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../services/api'
import { Send, Bot, Loader, Sparkles, AlertTriangle } from 'lucide-react'

const SUGGESTIONS = [
  'Is it safe to drive right now?',
  'What does a risk score of 45 mean?',
  'What should I do if I see water on the road?',
  'How accurate are the flood predictions?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm WaterWise AI, powered by Gemini. Ask me anything about flood conditions, road safety, or your current risk score — I'm here to help you stay safe.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const trimmed = (text ?? input).trim()
    if (!trimmed || loading) return
    setInput('')

    const userMsg = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }))
    try {
      const res = await sendChatMessage(trimmed, 0, 'unknown', 'your area', history)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Connection error. If you see water on the road — turn around, don't drown.",
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #0c4a6e 60%, #082f49 100%)' }}>

      {/* ── Header ── */}
      <div className="shrink-0 px-6 py-5 border-b border-white/10"
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">WaterWise AI</h1>
            <p className="text-sky-300/70 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Powered by Gemini · Flood Safety Expert
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-300 text-xs font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* ── Message area ── */}
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">

          {/* Safety notice */}
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-400/20 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-200/80 text-xs leading-relaxed">
              In an emergency, always call 911. This AI provides guidance but is not a substitute for official emergency services.
            </p>
          </div>

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-600 flex items-center justify-center shrink-0 mt-1 shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-600 flex items-center justify-center shrink-0 mt-1 shadow-md">
                  <span className="text-white text-xs font-bold">You</span>
                </div>
              )}
              {/* Bubble */}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md ${
                  m.role === 'user'
                    ? 'bg-sky-500 text-white rounded-tr-sm'
                    : 'bg-white/10 text-sky-50 rounded-tl-sm border border-white/10 backdrop-blur-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/10 border border-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2 text-sky-300 text-sm">
                <Loader className="w-3.5 h-3.5 animate-spin" /> Thinking…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Suggestion chips (only on first message) ── */}
      {messages.length === 1 && (
        <div className="shrink-0 px-4 pb-2">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2 justify-center">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs bg-white/10 hover:bg-white/20 border border-white/15 text-sky-200 px-3 py-1.5 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="shrink-0 px-4 pb-5 pt-2" style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            className="flex-1 bg-white/10 border border-white/20 text-white placeholder-sky-300/50 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 backdrop-blur-sm"
            placeholder="Ask about flood conditions, road safety, risk scores…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 transition-all hover:scale-105 disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
