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
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts(filter)
  }, [filter])

  const handleCreated = (newPost) => {
    setPosts((prev) => [{ ...newPost, comment_count: 0 }, ...prev])
    setShowCreate(false)
  }

  const handleDeleted = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('community_title')}</h1>
        {user && !showCreate && (
          <button className="btn-primary flex items-center gap-1 text-sm py-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> {t('new_post')}
          </button>
        )}
      </div>

      {/* Create post form */}
      {showCreate && (
        <div className="mb-6">
          <CreatePost onCreated={handleCreated} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {!user && !showCreate && (
        <div className="mb-4 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <a href="/login" className="text-primary font-semibold hover:underline">Sign in</a> to post reports and comments.
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1 rounded-full border font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-white border-primary'
                : 'text-gray-600 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {t(f === 'all' ? 'all_categories' : f)}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-12 text-gray-400">
          <Loader className="w-6 h-6 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No reports yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  )
}
