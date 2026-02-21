import { useState, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api'
import { getFloodRisk } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const NJ_CENTER = { lat: 40.2206, lng: -74.7597 }

const MAP_OPTIONS = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  zoomControlOptions: { position: 9 },
}

const RISK_MARKER_ICONS = {
  low:      'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
  moderate: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  high:     'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  critical: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
}

function riskLevel(score) {
  if (score < 15) return 'low'
  if (score < 35) return 'moderate'
  if (score < 55) return 'high'
  return 'critical'
}

export default function MapView({ routeData }) {
  const { t } = useLanguage()
  const [directions, setDirections] = useState(null)
  const [riskMarkers, setRiskMarkers] = useState([])
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [loadingRisk, setLoadingRisk] = useState(false)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: MAPS_KEY || '',
    libraries: ['places'],
  })

  // When parent provides route data, fetch directions polyline
  const handleMapClick = useCallback(async (e) => {
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    setLoadingRisk(true)
    try {
      const res = await getFloodRisk(lat, lng)
      const data = res.data
      setRiskMarkers((prev) => [...prev, { lat, lng, ...data, id: Date.now() }])
    } catch {
      // silently ignore
    } finally {
      setLoadingRisk(false)
    }
  }, [])

  if (!MAPS_KEY) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 text-sm">
        {t('no_api_key')} — set VITE_GOOGLE_MAPS_API_KEY in frontend/.env
      </div>
    )
  }

  if (loadError) {
    return <div className="flex items-center justify-center h-full text-red-500 text-sm">Map failed to load</div>
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">{t('loading')}</div>
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={NJ_CENTER}
        zoom={9}
        options={MAP_OPTIONS}
        onClick={handleMapClick}
      >
        {/* Route directions */}
        {directions && <DirectionsRenderer directions={directions} />}

        {/* Flood risk markers from user clicks */}
        {riskMarkers.map((m) => (
          <Marker
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            icon={RISK_MARKER_ICONS[riskLevel(m.risk_score)]}
            onClick={() => setSelectedMarker(m)}
          />
        ))}

        {/* InfoWindow for selected marker */}
        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="text-sm max-w-xs">
              <p className="font-bold text-gray-800 mb-1">
                {t('flood_risk')}: {selectedMarker.risk_score}/80
                <span className="ml-1 capitalize text-gray-500">({selectedMarker.risk_level})</span>
              </p>
              <p className="text-gray-600">{selectedMarker.recommendation}</p>
              {selectedMarker.is_flood_zone && (
                <p className="mt-1 text-orange-600 font-semibold text-xs">⚠️ Known NJ Flood Zone</p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Overlay hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-gray-600 text-xs px-3 py-1.5 rounded-full shadow pointer-events-none">
        Click anywhere on the map to check flood risk
      </div>

      {loadingRisk && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 text-blue-700 text-xs px-3 py-1.5 rounded-full shadow">
          Analyzing risk...
        </div>
      )}
    </div>
  )
}
