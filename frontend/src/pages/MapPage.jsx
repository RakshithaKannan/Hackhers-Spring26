import { useState } from 'react'
import MapView from '../components/Map/MapView'
import RoutePanel from '../components/Navigation/RoutePanel'
import { useLanguage } from '../context/LanguageContext'

export default function MapPage() {
  const { t } = useLanguage()
  const [routeData, setRouteData] = useState(null)

  const handleRouteResult = (data) => {
    setRouteData(data)
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
    </div>
  )
}
