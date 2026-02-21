import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { Shield, Zap, Map, Users } from 'lucide-react'

export default function Home() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <Shield className="w-16 h-16 text-blue-200" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {t('hero_title')}
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-xl mx-auto">
            {t('hero_subtitle')}
          </p>
          <Link
            to="/map"
            className="inline-block bg-white text-blue-700 font-bold px-8 py-3 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            {t('get_safe_route')} →
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-blue-800 text-white py-4">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-center text-sm">
          <div><span className="font-bold text-2xl block">8</span>USGS Gauges</div>
          <div><span className="font-bold text-2xl block">2-6hr</span>Forecast Window</div>
          <div><span className="font-bold text-2xl block">0-80</span>Risk Score</div>
          <div><span className="font-bold text-2xl block">NJ</span>Coverage</div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">{t('how_it_works')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              icon={<Zap className="w-8 h-8 text-blue-600" />}
              title={t('step1_title')}
              desc={t('step1_desc')}
              step="01"
            />
            <StepCard
              icon={<Shield className="w-8 h-8 text-blue-600" />}
              title={t('step2_title')}
              desc={t('step2_desc')}
              step="02"
            />
            <StepCard
              icon={<Map className="w-8 h-8 text-blue-600" />}
              title={t('step3_title')}
              desc={t('step3_desc')}
              step="03"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-red-50 border-t border-red-200 py-12 px-6 text-center">
        <p className="text-red-800 font-bold text-xl mb-2">⚠️ Turn Around, Don't Drown</p>
        <p className="text-red-600 text-sm max-w-md mx-auto">
          Just 6 inches of moving water can knock you down. 12 inches can carry away a small vehicle.
          SafeSphere helps you avoid these dangers before you reach them.
        </p>
      </section>

      {/* Community teaser */}
      <section className="py-16 px-6 bg-gray-50 text-center">
        <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-3">{t('community_title')}</h2>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          Report flooded roads, closures, and weather alerts to help your community.
        </p>
        <Link to="/community" className="btn-primary">View Reports</Link>
      </section>
    </div>
  )
}

function StepCard({ icon, title, desc, step }) {
  return (
    <div className="card flex flex-col items-start gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-blue-400 bg-blue-50 rounded px-2 py-0.5">{step}</span>
        {icon}
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-gray-600 text-sm">{desc}</p>
    </div>
  )
}
