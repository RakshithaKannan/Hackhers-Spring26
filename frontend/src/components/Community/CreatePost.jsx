import { useState } from 'react'
import { createPost } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import { X, LogIn } from 'lucide-react'

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
  const [sessionExpired, setSessionExpired] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) return
    setLoading(true)
    setError('')
    setSessionExpired(false)
    try {
      const res = await createPost(form)
      onCreated?.(res.data)
    } catch (err) {
      if (err.response?.status === 401) {
        setSessionExpired(true)
      } else {
        setError(err.response?.data?.detail || 'Failed to create post')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-base">{t('new_post')}</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {sessionExpired ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <LogIn className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm mb-1">Session expired</p>
            <p className="text-slate-500 text-xs">Please sign in again to post a report.</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              {t('sign_in')}
            </a>
            <button
              onClick={onCancel}
              className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Category */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: cat }))}
                className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
                  form.category === cat
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {t(cat)}
              </button>
            ))}
          </div>

          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
            placeholder={t('post_title')}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <textarea
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 resize-none"
            rows={3}
            placeholder={t('post_body')}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            required
          />
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
            placeholder={t('post_location')}
            value={form.location_name}
            onChange={(e) => setForm((f) => ({ ...f, location_name: e.target.value }))}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm px-4 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors font-semibold"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-sm px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold transition-colors disabled:opacity-50"
            >
              {loading ? '...' : t('submit')}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
