import { useState } from 'react'
import { addComment, deletePost } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { MessageSquare, MapPin, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const CATEGORY_META = {
  flood_report:    { icon: '🌊', topColor: '#3b82f6', tagBg: '#eff6ff', tagText: '#1d4ed8' },
  road_closure:    { icon: '🚧', topColor: '#ef4444', tagBg: '#fef2f2', tagText: '#b91c1c' },
  weather_warning: { icon: '⛈️', topColor: '#f59e0b', tagBg: '#fffbeb', tagText: '#b45309' },
}

const PIN_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#a855f7']
const ROTATIONS  = ['-1.5deg', '1deg', '-2deg', '0.5deg', '2deg']

export default function PostCard({ post, onDeleted, index = 0 }) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState(post.comments || [])
  const [commentInput, setCommentInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [hovered, setHovered] = useState(false)

  const meta      = CATEGORY_META[post.category] ?? CATEGORY_META.flood_report
  const pinColor  = PIN_COLORS[index % PIN_COLORS.length]
  const rotation  = hovered ? '0deg' : ROTATIONS[index % ROTATIONS.length]

  const handleComment = async () => {
    if (!commentInput.trim()) return
    setSubmitting(true)
    try {
      const res = await addComment(post.id, commentInput.trim())
      setComments((prev) => [...prev, res.data])
      setCommentInput('')
    } catch { /* ignore */ } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    try {
      await deletePost(post.id)
      onDeleted?.(post.id)
    } catch { /* ignore */ }
  }

  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  }

  return (
    <div
      className="relative"
      style={{ transform: `rotate(${rotation})`, transformOrigin: 'top center', transition: 'transform 0.3s ease' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Pushpin ── */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
        {/* Pin head */}
        <div
          className="w-6 h-6 rounded-full border-2 border-white/70"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${pinColor}dd, ${pinColor})`,
            boxShadow: `0 3px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.4)`,
          }}
        />
        {/* Pin shaft */}
        <div className="w-px h-4 bg-gray-500/50" />
      </div>

      {/* ── Paper note ── */}
      <div
        className="bg-[#fffef5] rounded-sm overflow-hidden"
        style={{
          boxShadow: hovered
            ? '6px 10px 24px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.15)'
            : '3px 5px 14px rgba(0,0,0,0.28), 0 1px 3px rgba(0,0,0,0.12)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {/* Colored top accent bar */}
        <div style={{ height: 5, background: meta.topColor }} />

        {/* Content */}
        <div className="px-4 pt-5 pb-4">
          {/* Category tag */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: meta.tagBg, color: meta.tagText }}
            >
              {meta.icon} {t(post.category)}
            </span>
          </div>
          {/* Exact timestamp */}
          <p className="text-[10px] text-gray-400 mb-2">{formatTime(post.created_at)}</p>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2">{post.title}</h3>

          {/* Body */}
          <p className="text-xs text-gray-600 leading-relaxed mb-3">{post.body}</p>

          {/* Location */}
          {post.location_name && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{post.location_name}</span>
            </div>
          )}

          {/* Ruled lines decoration */}
          <div className="space-y-1.5 mb-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-px bg-blue-100/60" />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-500">@{post.author_username}</span>
            <div className="flex items-center gap-2 text-gray-400">
              {user?.username === post.author_username && (
                <button onClick={handleDelete} className="hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 hover:text-sky-600 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{post.comment_count ?? comments.length}</span>
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Comments ── */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3 flex flex-col gap-2 bg-amber-50/40">
            {comments.map((c) => (
              <div key={c.id} className="text-xs bg-white/70 rounded px-2.5 py-1.5 border border-gray-100">
                <span className="font-semibold text-gray-700">@{c.author_username}</span>
                <span className="text-gray-600 ml-1">{c.body}</span>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-1">{t('no_comments')}</p>
            )}
            {user ? (
              <div className="flex gap-1.5 mt-1">
                <input
                  className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-400 bg-white"
                  placeholder={t('add_comment')}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                />
                <button
                  className="text-xs bg-sky-500 hover:bg-sky-400 text-white px-3 py-1.5 rounded font-semibold disabled:opacity-50 transition-colors"
                  onClick={handleComment}
                  disabled={submitting}
                >
                  {t('post_comment')}
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic text-center">
                <a href="/login" className="text-sky-600 underline">{t('sign_in')}</a> {t('to_comment')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
