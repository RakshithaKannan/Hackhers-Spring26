import { useState } from 'react'
import { createPost } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import { X } from 'lucide-react'

const CATEGORIES = ['flood_report', 'road_closure', 'weather_warning']

export default function CreatePost({ onCreated, onCancel }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    category: 'flood_report',
    title: '',
    body: '',
    location_name: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await createPost(form)
      onCreated?.(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">{t('new_post')}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Category */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setForm((f) => ({ ...f, category: cat }))}
              className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors ${
                form.category === cat
                  ? 'bg-primary text-white border-primary'
                  : 'text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {t(cat)}
            </button>
          ))}
        </div>

        <input
          className="input"
          placeholder={t('post_title')}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <textarea
          className="input resize-none"
          rows={3}
          placeholder={t('post_body')}
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          required
        />
        <input
          className="input"
          placeholder={t('post_location')}
          value={form.location_name}
          onChange={(e) => setForm((f) => ({ ...f, location_name: e.target.value }))}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-outline text-sm py-1.5" onClick={onCancel}>
            {t('cancel')}
          </button>
          <button type="submit" className="btn-primary text-sm py-1.5" disabled={loading}>
            {loading ? '...' : t('submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
