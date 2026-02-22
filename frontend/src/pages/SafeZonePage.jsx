import { useState } from 'react'
import { getSafeZone } from '../services/api'
import { MapPin, Hospital, Shield, Navigation, Loader, AlertTriangle, Phone, ChevronDown, ChevronUp } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const TYPE_META = {
  'Hospital':          { icon: Hospital,   color: 'text-red-500',    bg: 'bg-red-50',   border: 'border-red-200',   badge: 'bg-red-100 text-red-700' },
  'Emergency Shelter': { icon: Shield,     color: 'text-sky-600',    bg: 'bg-sky-50',   border: 'border-sky-200',   badge: 'bg-sky-100 text-sky-700' },
}

function ResultCard({ result }) {
  const [expanded, setExpanded] = useState(false)
  const meta = TYPE_META[result.place_type] ?? TYPE_META['Hospital']
  const Icon = meta.icon

  return (
    <div className={`rounded-2xl border ${meta.border} bg-white shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className={`${meta.bg} px-5 py-4 flex items-start gap-4`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm`}>
          <Icon className={`w-5 h-5 ${meta.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`inline-block text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-1.5 ${meta.badge}`}>
            {result.place_type}
          </span>
          <h3 className="font-bold text-slate-900 text-base leading-snug">{result.place_name}</h3>
          {result.vicinity && (
            <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />{result.vicinity}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-slate-900 font-black text-lg leading-none">{result.duration}</p>
          <p className="text-slate-400 text-xs mt-0.5">{result.distance}</p>
        </div>
      </div>

      {/* Directions toggle */}
      <div className="px-5 py-3 border-t border-slate-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-500 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          {expanded ? 'Hide directions' : 'Show directions'}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {expanded && result.steps && result.steps.length > 0 && (
          <ol className="mt-3 flex flex-col gap-2">
            {result.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{step.instruction}</span>
                <span className="ml-auto text-xs text-slate-400 shrink-0 pt-0.5">{step.distance}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

export default function SafeZonePage() {
  const { t } = useLanguage()
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState('idle')   // idle | loading | done | error
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSearch = async (e) => {
    e?.preventDefault()
    const trimmed = location.trim()
    if (!trimmed || status === 'loading') return

    setStatus('loading')
    setErrorMsg('')
    setResult(null)

    try {
      const res = await getSafeZone(trimmed)
      setResult(res.data)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Could not find nearby locations. Try a more specific address.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-8">

        {/* ── Header ── */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-sky-100 border border-sky-200 rounded-full px-4 py-1.5 mb-5">
            <Shield className="w-4 h-4 text-sky-600" />
            <span className="text-sky-700 text-xs font-bold uppercase tracking-widest">{t('emergency_services')}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3 leading-tight">{t('safezone_title')}</h1>
          <p className="text-slate-500 text-base leading-relaxed max-w-md mx-auto">
            Enter your location to find the nearest hospital and emergency shelter.
          </p>
        </div>

        {/* ── Location input ── */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <label className="block text-slate-700 text-sm font-semibold">Your current location</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. 123 Main St, Trenton, NJ"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                disabled={status === 'loading'}
              />
            </div>
            <button
              type="submit"
              disabled={!location.trim() || status === 'loading'}
              className="px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-sm shadow-sky-500/20"
            >
              {status === 'loading'
                ? <><Loader className="w-4 h-4 animate-spin" /> Searching…</>
                : <><Navigation className="w-4 h-4" /> Find</>
              }
            </button>
          </div>
        </form>

        {/* ── Error ── */}
        {status === 'error' && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{errorMsg}</p>
          </div>
        )}

        {/* ── Results ── */}
        {status === 'done' && result && (
          <div className="flex flex-col gap-5">
            {/* Resolved address */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Showing results near <span className="font-semibold text-slate-700">{result.user_location}</span></span>
            </div>

            {/* Place result cards */}
            {result.results.map((r, i) => (
              <ResultCard key={i} result={r} />
            ))}

            {/* Emergency numbers */}
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-red-700 text-xs font-bold uppercase tracking-widest mb-3">{t('safezone_emergency_numbers')}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('safezone_911'), number: '911' },
                  { label: t('safezone_nj_flood'), number: '1-877-NJ-FLOOD' },
                ].map(({ label, number }) => (
                  <a
                    key={number}
                    href={`tel:${number}`}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-white border border-red-200 hover:border-red-400 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-red-500" />
                    <span className="text-slate-900 font-bold text-sm">{number}</span>
                    <span className="text-slate-500 text-xs text-center">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Idle hint ── */}
        {status === 'idle' && (
          <div className="flex flex-col items-center gap-3 py-10 text-slate-400">
            <Shield className="w-12 h-12 text-slate-200" />
            <p className="text-sm font-medium">Enter your location above to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
