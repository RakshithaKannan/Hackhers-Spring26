import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Navigation, CloudRain,
  Activity, ShieldAlert, Users, BarChart3,
  ArrowRight, MessageSquare,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold },
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, []) // eslint-disable-line
  return [ref, visible]
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useInView()
  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default function Home() {
  return (
    <div className="flex flex-col overflow-x-hidden">
      <HeroSection />
      <HowItWorksSection />
      <MiniStatsSection />
      <CommunitySection />
      <TurnAroundSection />
    </div>
  )
}

/* ── 1. HERO ─────────────────────────────────────────────────────────────── */
function HeroSection() {
  const { t } = useLanguage()
  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden water-bg">
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.38) saturate(1.3)' }}
      >
        <source src="https://videos.pexels.com/video-files/1093662/1093662-hd_1920_1080_30fps.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />
      <div className="orb orb-1" style={{ opacity: 0.25 }} />
      <div className="orb orb-2" style={{ opacity: 0.18 }} />

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto py-24">
        <div className="animate-badge inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-8 text-sky-200 text-sm font-medium">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          {t('live_flood_intel')}
        </div>
        <h1
          className="animate-hero-title font-black tracking-tight leading-none mb-4"
          style={{ fontSize: 'clamp(3.8rem, 13vw, 9rem)' }}
        >
          <span className="gradient-text text-glow">water</span><span style={{
            background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 40px rgba(34,197,94,0.55))',
          }}>Wise</span>
        </h1>
        <p
          className="animate-hero-slogan text-white/90 font-semibold tracking-widest uppercase mb-5"
          style={{ fontSize: 'clamp(0.8rem, 2vw, 1.1rem)', letterSpacing: '0.18em' }}
        >
          {t('hero_slogan')}
        </p>
        <p
          className="animate-hero-sub text-sky-100/70 font-light max-w-xl mx-auto mb-12 leading-relaxed"
          style={{ fontSize: 'clamp(1rem, 2.2vw, 1.25rem)' }}
        >
          {t('hero_sub')}
        </p>
        <div className="animate-hero-cta flex justify-center">
          <Link
            to="/map"
            className="group inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold px-10 py-4 rounded-2xl text-lg shadow-lg shadow-sky-500/40 hover:shadow-sky-400/50 transition-all duration-300 hover:scale-[1.04]"
          >
            {t('get_safe_route')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 leading-[0] pointer-events-none">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full block h-16 md:h-20">
          <path fill="#f8fafc" d="M0,48L80,42.7C160,37,320,27,480,32C640,37,800,59,960,64C1120,69,1280,55,1360,49L1440,44L1440,80L0,80Z" />
        </svg>
      </div>
    </section>
  )
}

/* ── 2. HOW IT WORKS — 5 cards with feature icons ───────────────────────── */
function HowItWorksSection() {
  const { t } = useLanguage()
  const steps = [
    { n: '01', icon: <Activity className="w-6 h-6" />,    accent: 'text-sky-600 bg-sky-50',     titleKey: 'step_real_time_title', descKey: 'step_real_time_desc' },
    { n: '02', icon: <BarChart3 className="w-6 h-6" />,   accent: 'text-violet-600 bg-violet-50', titleKey: 'step_ml_title',        descKey: 'step_ml_desc' },
    { n: '03', icon: <Navigation className="w-6 h-6" />,  accent: 'text-emerald-600 bg-emerald-50', titleKey: 'step_routing_title', descKey: 'step_routing_desc' },
    { n: '04', icon: <Users className="w-6 h-6" />,       accent: 'text-amber-600 bg-amber-50',  titleKey: 'step_community_title', descKey: 'step_community_desc' },
    { n: '05', icon: <MessageSquare className="w-6 h-6" />, accent: 'text-red-600 bg-red-50',    titleKey: 'step_ai_title',        descKey: 'step_ai_desc' },
  ]

  return (
    <section className="py-28 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-sky-500 font-semibold text-sm uppercase tracking-widest mb-3">{t('how_it_works_label')}</p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">{t('built_on_data')}</h2>
        </Reveal>

        {/* Row 1: 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {steps.slice(0, 3).map((s, i) => (
            <Reveal key={s.n} delay={i * 110}>
              <StepCard s={s} />
            </Reveal>
          ))}
        </div>
        {/* Row 2: 2 cards centered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl md:mx-auto">
          {steps.slice(3).map((s, i) => (
            <Reveal key={s.n} delay={i * 110 + 330}>
              <StepCard s={s} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* Step card */
function StepCard({ s }) {
  const { t } = useLanguage()
  return (
    <div className="card-pop bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center gap-3 mb-5">
        <div className={`inline-flex p-2.5 rounded-xl ${s.accent}`}>{s.icon}</div>
        <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">{s.n}</span>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{t(s.titleKey)}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{t(s.descKey)}</p>
    </div>
  )
}

/* ── 3. MINI STATS ───────────────────────────────────────────────────────── */
function MiniStatsSection() {
  const { t } = useLanguage()
  const items = [
    { value: '15 min', labelKey: 'update_interval' },
    { value: '0–80',   labelKey: 'risk_score_range' },
    { value: '6 hr',   labelKey: 'forecast_window' },
  ]
  return (
    <section className="py-10 px-6 bg-white border-y border-slate-100">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        {items.map((item) => (
          <div key={item.labelKey} className="flex-1 text-center px-8 py-4">
            <p className="text-2xl font-black text-sky-600">{item.value}</p>
            <p className="text-slate-500 text-xs font-medium mt-0.5 uppercase tracking-wide">{t(item.labelKey)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── 4. TURN AROUND DON'T DROWN — compact ocean blue ────────────────────── */
function TurnAroundSection() {
  const { t } = useLanguage()
  const [ref, visible] = useInView(0.2)
  return (
    <section
      className="relative py-12 px-6 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0c4a6e 0%, #0f172a 60%, #082f49 100%)' }}
    >
      {/* Subtle horizontal scan lines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'repeating-linear-gradient(0deg, rgba(56,189,248,0.03) 0px, rgba(56,189,248,0.03) 1px, transparent 1px, transparent 40px)' }}
      />

      <div ref={ref} className="relative z-10 max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">

        {/* Left: stacked text */}
        <div className="text-center select-none shrink-0">
          <p
            className={`font-black text-white tracking-tighter leading-none
              transition-[opacity,transform] duration-600 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
            style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}
          >
            TURN
          </p>
          {/* AROUND — serif italic for visual contrast */}
          <p
            className={`font-black tracking-tighter leading-none outline-text-blue
              transition-[opacity,transform] duration-600 delay-100 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
            style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
          >
            AROUND
          </p>
          <div className={`inline-block border border-sky-400/40 bg-sky-900/50 backdrop-blur-sm px-5 py-1.5 rounded-xl mt-3
            transition-[opacity,transform] duration-600 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="font-black text-sky-300 tracking-widest" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.5rem)' }}>
              DON&apos;T DROWN
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-24 bg-sky-700/40 shrink-0" />

        {/* Right: supporting text + icon centered above text */}
        <div className={`text-center transition-[opacity,transform] duration-600 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <AlertTriangle className="w-8 h-8 text-sky-400 mb-2 mx-auto"
            style={{ filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.5))' }} />
          <p className="text-sky-100 text-base font-semibold mb-1">{t('turn_around_warning')}</p>
          <p className="text-sky-300/70 text-sm">{t('turn_around_sub')}</p>
        </div>
      </div>
    </section>
  )
}

/* ── 5. COMMUNITY — compact ──────────────────────────────────────────────── */
function CommunitySection() {
  const { t } = useLanguage()
  return (
    <section className="py-12 px-6 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <div className="bg-gradient-to-br from-sky-500 to-cyan-600 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 text-white shadow-xl shadow-sky-500/15">
            <Users className="w-12 h-12 text-sky-100 shrink-0" />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold mb-1">{t('help_community')}</h2>
              <p className="text-sky-100/80 text-sm leading-relaxed">{t('help_community_desc')}</p>
            </div>
            <Link
              to="/community"
              className="shrink-0 inline-flex items-center gap-2 bg-white text-sky-600 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-sky-50 transition-colors shadow-md"
            >
              {t('view_reports')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

