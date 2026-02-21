import { useState } from 'react'
import MapView from '../components/Map/MapView'
import RoutePanel from '../components/Navigation/RoutePanel'
import ChatBot from '../components/Chat/ChatBot'
import { useLanguage } from '../context/LanguageContext'

export default function MapPage() {
  const { t } = useLanguage()
  const [routeData, setRouteData] = useState(null)
  const [currentRisk, setCurrentRisk] = useState({ score: 0, level: 'unknown' })

  const handleRouteResult = (data) => {
    setRouteData(data)
    if (data.overall_risk > 0) {
      const level = data.overall_risk < 15 ? 'low'
        : data.overall_risk < 35 ? 'moderate'
        : data.overall_risk < 55 ? 'high' : 'critical'
      setCurrentRisk({ score: data.overall_risk, level })
    }
  }

  return (
    <div className="flex h-[calc(100vh-60px)]">
      {/* Left panel */}
      <div className="w-80 shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-4 flex flex-col gap-4">
        <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{t('get_safe_route')}</h2>
        <RoutePanel onRouteResult={handleRouteResult} />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView routeData={routeData} />
      </div>

      {/* Floating AI chatbot */}
      <ChatBot
        riskScore={currentRisk.score}
        riskLevel={currentRisk.level}
        location={routeData ? `${routeData.origin} to ${routeData.destination}` : ''}
      />
    </div>
  )
}
