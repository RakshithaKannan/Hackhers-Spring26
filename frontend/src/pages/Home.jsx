/**
 * Home.jsx — WaterWise landing page
 *
 * Sections (top → bottom):
 *   1. Hero          — full-screen animated water gradient, entrance animations
 *   2. How It Works  — 3 scroll-reveal step cards
 *   3. Turn Around   — cinematic "TURN AROUND / DON'T DROWN" warning
 *   4. Stats         — 4 live-data numbers
 *   5. Features      — 6 feature cards with hover pop
 *   6. Community     — gradient teaser card
 *   7. Footer CTA    — dark water bg, final call to action
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Droplets, AlertTriangle, Navigation, CloudRain,
  Activity, ShieldAlert, Users, BarChart3, ArrowRight, Radio, Map,
} from 'lucide-react'

/* ── Intersection Observer hook ─────────────────────────────────────────────
   Returns [ref, isVisible]. Triggers once when the element enters the viewport.
────────────────────────────────────────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold },
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return [ref, visible]
}

/* ── Scroll-reveal wrapper ───────────────────────────────────────────────────
   Wraps any content with a fade-up animation triggered on scroll.
   `delay` (ms) staggers children in a grid.
────────────────────────────────────────────────────────────────────────────── */
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

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  return (
    /* overflow-x-hidden prevents ambient orbs from creating horizontal scroll */
    <div className="flex flex-col overflow-x-hidden">
      <HeroSection />
      <HowItWorksSection />
      <TurnAroundSection />
      <StatsSection />
      <FeaturesSection />
      <CommunitySection />
      <FooterCta />
    </div>
  )
}

/* ── 1. HERO ─────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center water-bg overflow-hidden">

      {/* Ambient light orbs — CSS-animated, no JS needed */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ── Hero content ── */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto py-24">

        {/* Live badge */}
        <div className="animate-badge inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-8 text-sky-200 text-sm font-medium">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Live flood intelligence for New Jersey
        </div>

        {/* Main title — gradient + glow */}
        <h1 className="animate-hero-title gradient-text text-glow font-black tracking-tight leading-none mb-6"
          style={{ fontSize: 'clamp(3.8rem, 13vw, 9rem)' }}
        >
          WaterWise
        </h1>

        {/* Tagline */}
        <p className="animate-hero-sub text-sky-100/75 font-light max-w-2xl mx-auto mb-12 leading-relaxed"
          style={{ fontSize: 'clamp(1rem, 2.5vw, 1.35rem)' }}
        >
          Real-time flood risk. Safe routing. Instant SafeZone rescue.
          <br className="hidden md:block" />
          Built for New Jersey drivers.
        </p>

        {/* CTA row */}
        <div className="animate-hero-cta flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/map"
            className="group inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold px-9 py-4 rounded-2xl text-lg shadow-lg shadow-sky-500/30 hover:shadow-sky-400/40 transition-all duration-300 hover:scale-[1.03]"
          >
            Get Safe Route
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
          <Link
            to="/map"
            className="inline-flex items-center justify-center gap-2 glass text-white font-semibold px-9 py-4 rounded-2xl text-lg hover:bg-white/15 transition-all duration-300"
          >
            <Map className="w-5 h-5" />
            Live Map
          </Link>
        </div>
      </div>

      {/* Wave separator — transitions hero into the next section */}
      <div className="absolute bottom-0 left-0 right-0 leading-[0] pointer-events-none">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"
          className="w-full block h-16 md:h-20">
          <path fill="#f8fafc"
            d="M0,48L80,42.7C160,37,320,27,480,32C640,37,800,59,960,64C1120,69,1280,55,1360,49L1440,44L1440,80L0,80Z" />
        </svg>
      </div>
    </section>
  )
}

/* ── 2. HOW IT WORKS ─────────────────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    {
      n: '01',
      icon: <Activity className="w-7 h-7" />,
      title: 'Live Sensor Data',
      desc: '8 USGS stream gauges across NJ report live readings every 15 minutes — gauge height, official flood stage, and rising rate.',
    },
    {
      n: '02',
      icon: <BarChart3 className="w-7 h-7" />,
      title: 'Transparent Scoring',
      desc: 'No black-box ML. Every point is traceable: flood-stage %, rising rate, NWS rain probability, FEMA zone, and seasonal multiplier.',
    },
    {
      n: '03',
      icon: <Navigation className="w-7 h-7" />,
      title: 'Safe Routing',
      desc: 'Risk is checked at every step of your route. If High or Severe flood risk is found, a safer alternative path is returned.',
    },
  ]

  return (
    <section className="py-28 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">

        <Reveal className="text-center mb-16">
          <p className="text-sky-500 font-semibold text-sm uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Built on real data.</h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="card-pop bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full">
                {/* Step badge + icon */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-xs font-bold text-sky-500 bg-sky-50 border border-sky-100 rounded-lg px-2.5 py-1">
                    {s.n}
                  </span>
                  <div className="text-sky-600">{s.icon}</div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 3. TURN AROUND DON'T DROWN ──────────────────────────────────────────── */
function TurnAroundSection() {
  const [ref, visible] = useInView(0.2)

  return (
    <section className="relative py-24 px-6 bg-slate-950 overflow-hidden">
      {/* Diagonal amber warning stripes */}
      <div className="absolute inset-0 warning-stripes pointer-events-none" />
      {/* Red gradient depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/35 to-transparent pointer-events-none" />

      <div ref={ref} className="relative z-10 max-w-5xl mx-auto text-center">

        {/* Pulsing alert icon */}
        <div className={`transition-[opacity,transform] duration-500 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}>
          <AlertTriangle
            className="w-14 h-14 text-amber-400 mx-auto mb-10"
            style={{ filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.65))' }}
          />
        </div>

        {/* Stacked giant text — slides in from opposite sides */}
        <div className="mb-14 select-none">
          <p
            className={`font-black text-white tracking-tighter leading-none
              transition-[opacity,transform] duration-700 ${
              visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'
            }`}
            style={{ fontSize: 'clamp(3.2rem, 11vw, 7.5rem)' }}
          >
            TURN
          </p>

          {/* "AROUND" — outline only, slides from right */}
          <p
            className={`outline-text font-black tracking-tighter leading-none
              transition-[opacity,transform] duration-700 delay-150 ${
              visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'
            }`}
            style={{ fontSize: 'clamp(3.2rem, 11vw, 7.5rem)' }}
          >
            AROUND
          </p>

          {/* "DON'T DROWN" boxed in red — fades up */}
          <div className={`inline-block bg-red-600 px-8 py-3 rounded-2xl mt-5
            transition-[opacity,transform] duration-700 delay-300 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <p
              className="font-black text-white tracking-widest"
              style={{ fontSize: 'clamp(1.4rem, 4.5vw, 3.2rem)' }}
            >
              DON&apos;T DROWN
            </p>
          </div>
        </div>

        {/* Water danger stats */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto
          transition-[opacity,transform] duration-700 delay-500 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {[
            { v: '6"',    l: 'of moving water can knock you down' },
            { v: '12"',   l: 'can sweep away a small vehicle' },
            { v: '18–24"', l: 'will float most cars' },
          ].map((s) => (
            <div key={s.v} className="glass-dark rounded-2xl px-6 py-5 text-center">
              <p className="text-3xl font-black text-red-400 mb-1">{s.v}</p>
              <p className="text-slate-400 text-xs leading-snug">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 4. STATS BAR ────────────────────────────────────────────────────────── */
function StatsSection() {
  const stats = [
    { value: '8',     label: 'USGS Gauges',       sub: 'across New Jersey' },
    { value: '15min', label: 'Update Interval',   sub: 'live sensor readings' },
    { value: '0–80',  label: 'Risk Score Range',  sub: 'every point traceable' },
    { value: '6hr',   label: 'Forecast Window',   sub: 'NWS precipitation data' },
  ]

  return (
    <section className="py-16 px-6 bg-sky-600">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 80} className="text-center">
            <p className="text-3xl md:text-4xl font-black text-white">{s.value}</p>
            <p className="text-sky-100 font-semibold text-sm mt-1">{s.label}</p>
            <p className="text-sky-200/70 text-xs mt-0.5">{s.sub}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ── 5. FEATURES GRID ────────────────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'USGS Real-Time Gauges',
      desc: 'Live stream height from 8 NJ gauges. Broken sensors filtered out; app falls back to the next closest working station automatically.',
      accent: 'text-sky-600 bg-sky-50',
    },
    {
      icon: <CloudRain className="w-6 h-6" />,
      title: 'NWS Weather Forecast',
      desc: '1-hour and 6-hour precipitation probability pulled directly from the National Weather Service official API — no conversions, raw data.',
      accent: 'text-indigo-600 bg-indigo-50',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Transparent Risk Model',
      desc: 'No black-box AI. Every point is traceable: gauge-to-flood-stage ratio, rise rate, rain probability, FEMA zone, seasonal ×1.15 multiplier.',
      accent: 'text-violet-600 bg-violet-50',
    },
    {
      icon: <Navigation className="w-6 h-6" />,
      title: 'Full-Route Flood Check',
      desc: 'Risk is scored at every navigation step, not just origin and destination. A flooded bridge mid-route is caught before you reach it.',
      accent: 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: <ShieldAlert className="w-6 h-6" />,
      title: 'SafeZone Routing',
      desc: 'When risk reaches High or Severe, one tap routes you to the nearest police station, hospital, fire station, or transit shelter.',
      accent: 'text-red-600 bg-red-50',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Reports',
      desc: 'Real-time crowdsourced reports of flooded roads, closures, and hazards from other drivers — safety through shared knowledge.',
      accent: 'text-amber-600 bg-amber-50',
    },
  ]

  return (
    <section className="py-28 px-6 bg-white">
      <div className="max-w-6xl mx-auto">

        <Reveal className="text-center mb-16">
          <p className="text-sky-500 font-semibold text-sm uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
            Everything you need
            <br className="hidden md:block" />
            to stay safe.
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 75}>
              <div className="card-pop bg-white rounded-3xl p-7 border border-slate-100 shadow-sm h-full">
                <div className={`inline-flex p-3 rounded-2xl mb-5 ${f.accent}`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 6. COMMUNITY TEASER ─────────────────────────────────────────────────── */
function CommunitySection() {
  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className="bg-gradient-to-br from-sky-500 to-cyan-600 rounded-[2rem] p-10 md:p-16 text-center text-white shadow-2xl shadow-sky-500/20">
            <Users className="w-14 h-14 mx-auto mb-6 text-sky-100 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Help your community.</h2>
            <p className="text-sky-100 text-lg max-w-md mx-auto mb-8 leading-relaxed">
              Report flooded roads, closures, and hazards.
              Every post helps someone else avoid danger.
            </p>
            <Link
              to="/community"
              className="inline-flex items-center gap-2 bg-white text-sky-600 font-bold px-8 py-3.5 rounded-2xl text-base hover:bg-sky-50 transition-colors shadow-md"
            >
              View Community Reports <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ── 7. FOOTER CTA ───────────────────────────────────────────────────────── */
function FooterCta() {
  return (
    <section className="relative py-32 px-6 water-bg overflow-hidden">
      {/* Faint orbs for depth */}
      <div className="orb orb-1" style={{ opacity: 0.14 }} />
      <div className="orb orb-2" style={{ opacity: 0.09 }} />

      <Reveal className="relative z-10 text-center max-w-3xl mx-auto">
        <Droplets className="w-12 h-12 text-sky-300 mx-auto mb-6 opacity-80" />
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
          Stay Safe.{' '}
          <span className="gradient-text">Stay WaterWise.</span>
        </h2>
        <p className="text-sky-200/75 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Free. No app download. No login required to check flood risk.
          Just open and navigate safely.
        </p>
        <Link
          to="/map"
          className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold px-10 py-4 rounded-2xl text-lg shadow-lg shadow-sky-500/30 transition-all duration-300 hover:scale-[1.03]"
        >
          Open Live Map <ArrowRight className="w-5 h-5" />
        </Link>
      </Reveal>
    </section>
  )
}
