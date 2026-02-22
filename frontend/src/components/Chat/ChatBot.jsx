import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import { MessageCircle, X, Send, Bot, Loader } from 'lucide-react'

export default function ChatBot({ riskScore = 0, riskLevel = 'unknown', location = '' }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm waterWise AI. Tell me what you see on the road and I'll help you navigate safely." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Build history for context (exclude the initial greeting)
    const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await sendChatMessage(text, riskScore, riskLevel, location || 'your location', history)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Connection error. If you see water on the road — turn around, don\'t drown.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-50"
          title={t('chat_title')}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 w-80 h-[460px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Bot className="w-4 h-4" />
              {t('chat_title')}
            </div>
            {riskScore > 0 && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                Risk: {riskScore.toFixed(0)}/80
              </span>
            )}
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 rounded p-0.5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] ${
                  m.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-2xl rounded-tl-sm text-sm flex items-center gap-1">
                  <Loader className="w-3 h-3 animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-2 flex gap-2">
            <input
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t('chat_placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="btn-primary py-1.5 px-3 rounded-lg text-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
