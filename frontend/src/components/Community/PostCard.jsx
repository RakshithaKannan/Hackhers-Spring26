import { useState } from 'react'
import { addComment, deletePost } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { MessageSquare, MapPin, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const CATEGORY_STYLES = {
  flood_report:    'bg-blue-100 text-blue-700',
  road_closure:    'bg-red-100 text-red-700',
  weather_warning: 'bg-yellow-100 text-yellow-700',
}

const CATEGORY_ICONS = {
  flood_report:    '🌊',
  road_closure:    '🚧',
  weather_warning: '⛈️',
}

export default function PostCard({ post, onDeleted }) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState(post.comments || [])
  const [commentInput, setCommentInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleComment = async () => {
    if (!commentInput.trim()) return
    setSubmitting(true)
    try {
      const res = await addComment(post.id, commentInput.trim())
      setComments((prev) => [...prev, res.data])
      setCommentInput('')
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    try {
      await deletePost(post.id)
      onDeleted?.(post.id)
    } catch {
      /* ignore */
    }
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_STYLES[post.category]}`}>
            {CATEGORY_ICONS[post.category]} {t(post.category)}
          </span>
          <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
        </div>
        {user?.username === post.author_username && (
          <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{post.body}</p>

      {post.location_name && (
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <MapPin className="w-3 h-3" />
          {post.location_name}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>by @{post.author_username}</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          {(post.comment_count ?? comments.length)} {t('comments')}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Comments section */}
      {expanded && (
        <div className="mt-3 border-t border-gray-100 pt-3 flex flex-col gap-2">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-semibold text-gray-700">@{c.author_username}</span>
              <span className="text-gray-600 ml-1">{c.body}</span>
            </div>
          ))}

          {user ? (
            <div className="flex gap-2 mt-1">
              <input
                className="input text-sm py-1"
                placeholder={t('add_comment')}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              />
              <button
                className="btn-primary text-sm py-1 px-3 shrink-0"
                onClick={handleComment}
                disabled={submitting}
              >
                {t('post_comment')}
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">{t('login_to_post')}</p>
          )}
        </div>
      )}
    </div>
  )
}
