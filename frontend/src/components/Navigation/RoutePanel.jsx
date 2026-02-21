import { useState } from 'react'
import { getRoute } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import { Navigation, AlertTriangle, CheckCircle, Loader } from 'lucide-react'

const RISK_COLORS = {
  low: 'text-green-700 bg-green-50 border-green-200',
  moderate: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  high: 'text-orange-700 bg-orange-50 border-orange-200',
  critical: 'text-red-700 bg-red-50 border-red-200',
}

function riskLevel(score) {
  if (score < 15) return 'low'
  if (score < 35) return 'moderate'
  if (score < 55) return 'high'
  return 'critical'
}

export default function RoutePanel({ onRouteResult }) {
  const { t } = useLanguage()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!origin.trim() || !destination.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await getRoute(origin, destination)
      setResult(res.data)
      if (onRouteResult) onRouteResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not get route. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  const level = result ? riskLevel(result.overall_risk) : null

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          className="input"
          placeholder={t('from_placeholder')}
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
        <input
          className="input"
          placeholder={t('to_placeholder')}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <button type="submit" className="btn-primary flex items-center justify-center gap-2" disabled={loading}>
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
          {loading ? t('loading') : t('get_route')}
        </button>
      </form>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3 mt-1">
          {/* Route summary */}
          <div className="card flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Navigation className="w-4 h-4 text-primary" />
              {result.distance} · {result.duration}
            </div>
          </div>

          {/* Overall risk */}
          <div className={`border rounded-xl p-3 flex items-start gap-2 ${RISK_COLORS[level]}`}>
            {level === 'low' ? (
              <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-bold text-sm">
                {t('flood_risk')}: {t(`risk_${level}`)} ({result.overall_risk.toFixed(0)}/80)
              </p>
            </div>
          </div>

          {/* Individual warnings */}
          {result.flood_warnings.map((w, i) => (
            <div key={i} className={`border rounded-lg p-3 text-sm ${RISK_COLORS[riskLevel(w.risk_score)]}`}>
              <p className="font-semibold">{w.location} — {w.risk_score.toFixed(0)}/80</p>
              <p className="mt-0.5">{w.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
