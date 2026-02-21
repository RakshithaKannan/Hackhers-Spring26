import { useState, useRef } from 'react'
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { getRoute } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import {
  Navigation, AlertTriangle, CheckCircle, Loader,
  ArrowLeft, ArrowRight, ArrowUp, RotateCcw, MapPin, Flag,
} from 'lucide-react'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const LIBRARIES = ['places']

const RISK_COLORS = {
  low:      'text-green-700 bg-green-50 border-green-200',
  moderate: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  high:     'text-orange-700 bg-orange-50 border-orange-200',
  severe:   'text-red-700 bg-red-50 border-red-200',
}

function maneuverIcon(maneuver) {
  const cls = 'w-4 h-4 text-white'
  if (!maneuver) return <ArrowUp className={cls} />
  if (maneuver.includes('left')) return <ArrowLeft className={cls} />
  if (maneuver.includes('right')) return <ArrowRight className={cls} />
  if (maneuver.includes('roundabout') || maneuver.includes('uturn'))
    return <RotateCcw className={cls} />
  return <ArrowUp className={cls} />
}

function riskLevel(score) {
  if (score <= 20) return 'low'
  if (score <= 40) return 'moderate'
  if (score <= 60) return 'high'
  return 'severe'
}

export default function RoutePanel({ onRouteResult }) {
  const { t } = useLanguage()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const originAcRef = useRef(null)
  const destAcRef = useRef(null)

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: MAPS_KEY || '', libraries: LIBRARIES })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!origin.trim() || !destination.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setActiveStep(0)
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
      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 z-10 pointer-events-none" />
          {isLoaded ? (
            <Autocomplete
              onLoad={(ac) => { originAcRef.current = ac }}
              onPlaceChanged={() => {
                const place = originAcRef.current?.getPlace()
                if (place?.formatted_address) setOrigin(place.formatted_address)
                else if (place?.name) setOrigin(place.name)
              }}
            >
              <input
                className="input pl-9"
                placeholder={t('from_placeholder')}
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </Autocomplete>
          ) : (
            <input
              className="input pl-9"
              placeholder={t('from_placeholder')}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          )}
        </div>
        <div className="relative">
          <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 z-10 pointer-events-none" />
          {isLoaded ? (
            <Autocomplete
              onLoad={(ac) => { destAcRef.current = ac }}
              onPlaceChanged={() => {
                const place = destAcRef.current?.getPlace()
                if (place?.formatted_address) setDestination(place.formatted_address)
                else if (place?.name) setDestination(place.name)
              }}
            >
              <input
                className="input pl-9"
                placeholder={t('to_placeholder')}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </Autocomplete>
          ) : (
            <input
              className="input pl-9"
              placeholder={t('to_placeholder')}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          )}
        </div>
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
          {/* Route summary bar */}
          <div className="bg-blue-600 text-white rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              <span className="font-bold text-sm">{result.duration}</span>
            </div>
            <span className="text-blue-200 text-sm">{result.distance}</span>
          </div>

          {/* Flood risk */}
          <div className={`border rounded-xl p-3 flex items-start gap-2 ${RISK_COLORS[level]}`}>
            {level === 'low'
              ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
            <p className="text-sm font-semibold">
              Flood Risk: {level.charAt(0).toUpperCase() + level.slice(1)} ({result.overall_risk.toFixed(0)}/80)
            </p>
          </div>

          {/* Flood warnings */}
          {result.flood_warnings.map((w, i) => (
            <div key={i} className={`border rounded-lg p-3 text-sm ${RISK_COLORS[riskLevel(w.risk_score)]}`}>
              <p className="font-semibold">{w.location} — {w.risk_score.toFixed(0)}/80</p>
              <p className="mt-0.5">{w.message}</p>
            </div>
          ))}

          {/* Turn-by-turn directions — always shown, Google Maps style */}
          {result.steps?.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Directions</span>
                <span className="text-xs text-gray-400">{result.steps.length} steps</span>
              </div>

              {/* Origin row */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-800 truncate">{result.origin}</span>
              </div>

              {/* Steps */}
              <div className="divide-y divide-gray-100">
                {result.steps.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                      activeStep === i ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {/* Step number + icon */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        activeStep === i ? 'bg-blue-600' : 'bg-gray-400'
                      }`}>
                        {maneuverIcon(step.maneuver)}
                      </div>
                      {i < result.steps.length - 1 && (
                        <div className="w-0.5 h-4 bg-gray-200 mt-1" />
                      )}
                    </div>

                    {/* Instruction */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-sm leading-snug ${
                        activeStep === i ? 'text-blue-800 font-semibold' : 'text-gray-800'
                      }`}>
                        {step.instruction}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{step.distance} · {step.duration}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Destination row */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white border-t border-gray-100">
                <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                  <Flag className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-800 truncate">{result.destination}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
