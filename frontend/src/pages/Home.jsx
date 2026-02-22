/**
 * Home.jsx — WaterWise landing page (Apple-style, cinematic)
 *
 * Sections:
 *   1. Hero            — video background, animated title, one CTA
 *   2. How It Works    — 5 scroll-reveal cards
 *   3. Mini Stats      — 3 small data points
 *   4. Turn Around     — ocean-themed "TURN AROUND DON'T DROWN"
 *   5. Features        — 6 feature cards
 *   6. Community       — gradient teaser
 *   7. Footer CTA      — dark water bg
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Navigation, CloudRain,
  Activity, ShieldAlert, Users, BarChart3,
  ArrowRight, MessageSquare, Map,
} from 'lucide-react'

/* ── Intersection Observer hook — triggers once on enter ─────────────────── */
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

/* ── Scroll-reveal wrapper ───────────────────────────────────────────────── */
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
    <div className="flex flex-col overflow-x-hidden">
      <HeroSection />
      <HowItWorksSection />
      <MiniStatsSection />
      <TurnAroundSection />
      <FeaturesSection />
      <CommunitySection />
      <FooterCta />
    </div>
  )
}

/* ── 1. HERO ─────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden water-bg">

      {/* ── Video background — autoplay, muted, looping water footage ── */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.38) saturate(1.3)' }}
      >
        <source
          src="https://videos.pexels.com/video-files/1093662/1093662-hd_1920_1080_30fps.mp4"
          type="video/mp4"
        />
        {/* CSS animated gradient is the fallback when video can't load */}
      </video>

      {/* Subtle dark vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />

      {/* Ambient orbs — sit on top of video for extra depth */}
      <div className="orb orb-1" style={{ opacity: 0.25 }} />
      <div className="orb orb-2" style={{ opacity: 0.18 }} />

      {/* ── Hero content ── */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto py-24">

        {/* Live badge */}
        <div className="animate-badge inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-8 text-sky-200 text-sm font-medium">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Live Flood Intelligence
        </div>

        {/* WaterWise title */}
        <h1
          className="animate-hero-title gradient-text text-glow font-black tracking-tight leading-none mb-4"
          style={{ fontSize: 'clamp(3.8rem, 13vw, 9rem)' }}
        >
          WaterWise
        </h1>

        {/* Slogan — prominent, right under the title */}
        <p
          className="animate-hero-slogan text-white/90 font-semibold tracking-widest uppercase mb-5"
          style={{ fontSize: 'clamp(0.8rem, 2vw, 1.1rem)', letterSpacing: '0.18em' }}
        >
          Stay Safe. Stay WaterWise.
        </p>

        {/* Tagline */}
        <p
          className="animate-hero-sub text-sky-100/70 font-light max-w-xl mx-auto mb-12 leading-relaxed"
          style={{ fontSize: 'clamp(1rem, 2.2vw, 1.25rem)' }}
        >
          Real-time flood risk. Safe routing. Instant SafeZone rescue.
        </p>

        {/* Single CTA */}
        <div className="animate-hero-cta flex justify-center">
          <Link
            to="/map"
            className="group inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold px-10 py-4 rounded-2xl text-lg shadow-lg shadow-sky-500/40 hover:shadow-sky-400/50 transition-all duration-300 hover:scale-[1.04]"
          >
            Get Safe Route
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </div>

      {/* Wave bottom separator */}
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

/* ── 2. HOW IT WORKS — 5 cards ───────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    {
      n: '01',
      icon: <Activity className="w-7 h-7" />,
      title: 'Real-Time Tracking',
      desc: 'Report live reading every 15 minutes based on precipitation, rising levels, seasons, and flood prone zones.',
    },
    {
      n: '02',
      icon: <BarChart3 className="w-7 h-7" />,
      title: 'Machine Learning Prediction',
      desc: 'Our gradient boosting model predicts flood risk 2–6 hours ahead with transparent scores from 0–80%, weighted by USGS and NWS data.',
    },
    {
      n: '03',
      icon: <Navigation className="w-7 h-7" />,
      title: 'Safe Routing',
      desc: 'Every step of your route is risk-scored. When flood risk is High or Severe, a safer alternative route is returned automatically.',
    },
    {
      n: '04',
      icon: <Users className="w-7 h-7" />,
      title: 'Community Reports',
      desc: 'Real-time crowdsourced reports of flooded roads, closures, and hazards from other drivers in your area - safety through shared knowledge.',
    },
    {
      n: '05',
      icon: <MessageSquare className="w-7 h-7" />,
      title: 'AI Assistant',
      desc: 'Powered by Gemini, our AI chatbot answers flood questions, gives safety advice, and interprets your current risk score.',
    },
  ]

  return (
    <section className="py-28 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">

        <Reveal className="text-center mb-16">
          <p className="text-sky-500 font-semibold text-sm uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Built on real data.</h2>
        </Reveal>

        {/* 3 + 2 layout: first row 3 cards, second row 2 centered */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {steps.slice(0, 3).map((s, i) => (
            <Reveal key={s.n} delay={i * 110}>
              <StepCard s={s} />
            </Reveal>
          ))}
        </div>
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

function StepCard({ s }) {
  return (
    <div className="card-pop bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs font-bold text-sky-500 bg-sky-50 border border-sky-100 rounded-lg px-2.5 py-1">
          {s.n}
        </span>
        <div className="text-sky-600">{s.icon}</div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
    </div>
  )
}

/* ── 3. MINI STATS ───────────────────────────────────────────────────────── */
function MiniStatsSection() {
  const items = [
    { value: '15 min', label: 'Update Interval' },
    { value: '0–80%',   label: 'Risk Score Range' },
    { value: '6 hr',   label: 'Forecast Window' },
  ]
  return (
    <section className="py-10 px-6 bg-white border-y border-slate-100">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        {items.map((item) => (
          <div key={item.label} className="flex-1 text-center px-8 py-4">
            <p className="text-2xl font-black text-sky-600">{item.value}</p>
            <p className="text-slate-500 text-xs font-medium mt-0.5 uppercase tracking-wide">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── 4. TURN AROUND DON'T DROWN — ocean blue theme ──────────────────────── */
function TurnAroundSection() {
  const [ref, visible] = useInView(0.2)
  return (
    <section className="relative py-20 px-6 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0c4a6e 0%, #0f172a 60%, #082f49 100%)' }}>

      {/* Animated water shimmer overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(56,189,248,0.04) 0px, rgba(56,189,248,0.04) 1px, transparent 1px, transparent 40px)',
        }}
      />

      <div ref={ref} className="relative z-10 max-w-4xl mx-auto text-center">

        {/* Icon */}
        <div className={`transition-[opacity,transform] duration-500 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <AlertTriangle
            className="w-12 h-12 text-sky-400 mx-auto mb-8"
            style={{ filter: 'drop-shadow(0 0 16px rgba(56,189,248,0.6))' }}
          />
        </div>

        {/* Stacked text — TURN slides left, AROUND slides right */}
        <div className="mb-10 select-none">
          <p
            className={`font-black text-white tracking-tighter leading-none
              transition-[opacity,transform] duration-700 ${
              visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
            style={{ fontSize: 'clamp(2.8rem, 9vw, 6rem)' }}
          >
            TURN
          </p>

          {/* Outline only — cyan stroke */}
          <p
            className={`outline-text-blue font-black tracking-tighter leading-none
              transition-[opacity,transform] duration-700 delay-150 ${
              visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
            style={{ fontSize: 'clamp(2.8rem, 9vw, 6rem)' }}
          >
            AROUND
          </p>

          {/* DON'T DROWN — glass ocean box */}
          <div className={`inline-block border border-sky-400/40 bg-sky-900/50 backdrop-blur-sm px-8 py-2.5 rounded-2xl mt-4
            transition-[opacity,transform] duration-700 delay-300 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            <p
              className="font-black text-sky-300 tracking-widest"
              style={{ fontSize: 'clamp(1.2rem, 3.5vw, 2.5rem)' }}
            >
              DON&apos;T DROWN
            </p>
          </div>
        </div>

        {/* Simple supporting line */}
        <p className={`text-sky-300/70 text-base max-w-sm mx-auto leading-relaxed
          transition-[opacity,transform] duration-700 delay-500 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          Never drive through flooded roads.
          WaterWise warns you before you get there.
        </p>
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
      desc: '1-hour and 6-hour precipitation probability pulled directly from the National Weather Service — raw probability, no fake conversions.',
      accent: 'text-indigo-600 bg-indigo-50',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Transparent Risk Model',
      desc: 'No black-box AI. Every point traceable: gauge-to-flood-stage ratio, rise rate, NWS rain probability, FEMA zone, seasonal ×1.15 multiplier.',
      accent: 'text-violet-600 bg-violet-50',
    },
    {
      icon: <Navigation className="w-6 h-6" />,
      title: 'Full-Route Flood Check',
      desc: 'Risk scored at every navigation step, not just start and end. A flooded bridge mid-route is caught before you reach it.',
      accent: 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: <ShieldAlert className="w-6 h-6" />,
      title: 'SafeZone Routing',
      desc: 'When risk hits High or Severe, one tap routes you to the nearest police station, hospital, fire station, or transit shelter.',
      accent: 'text-red-600 bg-red-50',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Reports',
      desc: 'Crowdsourced real-time reports of flooded roads, closures, and hazards from other drivers — safety through shared knowledge.',
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
                <div className={`inline-flex p-3 rounded-2xl mb-5 ${f.accent}`}>{f.icon}</div>
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
