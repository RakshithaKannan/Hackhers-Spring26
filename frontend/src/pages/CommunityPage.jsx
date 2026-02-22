import { useState, useEffect } from 'react'
import { getPosts } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import PostCard from '../components/Community/PostCard'
import CreatePost from '../components/Community/CreatePost'
import { Plus, Loader } from 'lucide-react'

const FILTERS = ['all', 'flood_report', 'road_closure', 'weather_warning']

export default function CommunityPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const fetchPosts = async (cat) => {
    setLoading(true)
    try {
      const res = await getPosts(cat === 'all' ? null : cat)
      setPosts(res.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPosts(filter) }, [filter])

  const handleCreated = (newPost) => {
    setPosts((prev) => [{ ...newPost, comment_count: 0 }, ...prev])
    setShowCreate(false)
  }

  const handleDeleted = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  const filterLabel = (f) => {
    const icons = { all: '📌', flood_report: '🌊', road_closure: '🚧', weather_warning: '⛈️' }
    return `${icons[f]} ${t(f === 'all' ? 'all_categories' : f)}`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* ── Page header ── */}
        <div className="text-center mb-8">
          <p className="text-sky-500 font-semibold text-xs uppercase tracking-widest mb-2">{t('community')}</p>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {t('community_title')}
          </h1>
          <p className="text-slate-500 text-sm">{t('community_subtitle')}</p>
        </div>

        {/* ── Controls ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-sm px-4 py-1.5 rounded-full font-semibold transition-all duration-200 ${
                  filter === f
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30 scale-105'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {filterLabel(f)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!user && (
              <span className="text-xs text-slate-500">
                <a href="/login" className="underline text-sky-500 hover:text-sky-600">{t('sign_in')}</a> {t('to_post')}
              </span>
            )}
            {user && (
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-sm shadow-sky-500/20 transition-all duration-200 hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                {showCreate ? t('cancel') : t('pin_a_report')}
              </button>
            )}
          </div>
        </div>

        {/* ── Create post form ── */}
        {showCreate && (
          <div className="mb-6 max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <CreatePost onCreated={handleCreated} onCancel={() => setShowCreate(false)} />
          </div>
        )}

        {/* ── Board outer frame ── */}
        <div className="rounded-2xl border border-sky-200 bg-white shadow-sm overflow-hidden">

          {/* Board header strip */}
          <div className="bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-3 flex items-center justify-between">
            <span className="text-white text-xs font-black uppercase tracking-widest">
              ⚠️ &nbsp;{t('active_alerts_label')}&nbsp; ⚠️
            </span>
            <span className="text-white/70 text-xs">{posts.length} {posts.length === 1 ? 'report' : 'reports'}</span>
          </div>

          {/* Board surface */}
          <div className="p-6 min-h-[420px] bg-white">
            {loading && (
              <div className="flex justify-center py-20 text-sky-400">
                <Loader className="w-8 h-8 animate-spin" />
              </div>
            )}

            {!loading && posts.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <div className="text-6xl mb-3">📌</div>
                <p className="font-bold text-lg text-slate-500">{t('board_empty')}</p>
                <p className="text-sm mt-1 text-slate-400">{t('board_empty_sub')}</p>
              </div>
            )}

            {!loading && posts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} onDeleted={handleDeleted} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
