import { useState, useCallback, useEffect, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow, Polyline } from '@react-google-maps/api'
import { getFloodRisk } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import { ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Navigation, X } from 'lucide-react'

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
  severe:   'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
}

function riskLevel(score) {
  if (score <= 20) return 'low'
  if (score <= 40) return 'moderate'
  if (score <= 60) return 'high'
  return 'severe'
}

/** Decode a Google Maps encoded polyline into [{lat, lng}] array */
function decodePolyline(encoded) {
  const points = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    for (const isLng of [false, true]) {
      let shift = 0, result = 0, b
      do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
      const delta = result & 1 ? ~(result >> 1) : result >> 1
      isLng ? (lng += delta) : (lat += delta)
    }
    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return points
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function findCurrentStep(userLat, userLng, steps) {
  let minDist = Infinity
  let idx = 0
  steps.forEach((step, i) => {
    const d = haversineMeters(userLat, userLng, step.start_lat, step.start_lng)
    if (d < minDist) { minDist = d; idx = i }
  })
  return idx
}

function maneuverArrow(maneuver, size = 'w-10 h-10') {
  const cls = `${size} text-white`
  if (!maneuver) return <ArrowUp className={cls} />
  if (maneuver.includes('left')) return <ArrowLeft className={cls} />
  if (maneuver.includes('right')) return <ArrowRight className={cls} />
  if (maneuver.includes('roundabout') || maneuver.includes('uturn')) return <RotateCcw className={cls} />
  return <ArrowUp className={cls} />
}

export default function MapView({ routeData }) {
  const { t } = useLanguage()
  const [directions, setDirections] = useState(null)
  const [altPolyline, setAltPolyline] = useState(null)
  const [safeZonePolyline, setSafeZonePolyline] = useState(null)
  const [safeZonePlace, setSafeZonePlace] = useState(null)
  const [riskMarkers, setRiskMarkers] = useState([])
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [loadingRisk, setLoadingRisk] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const mapRef = useRef(null)
  const watchIdRef = useRef(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: MAPS_KEY || '',
    libraries: ['places'],
  })

  // Draw route when routeData changes
  useEffect(() => {
    if (!routeData || !isLoaded) return

    // SafeZone result: draw purple route from current location to safe place
    if (routeData._isSafeZone) {
      setDirections(null)
      setAltPolyline(null)
      setSafeZonePolyline(decodePolyline(routeData.polyline))
      setSafeZonePlace(routeData.safe_place ?? null)
      // Pan map to the safe place
      if (mapRef.current && routeData.safe_place) {
        mapRef.current.panTo({ lat: routeData.safe_place.lat, lng: routeData.safe_place.lng })
        mapRef.current.setZoom(14)
      }
      return
    }

    // Normal route
    setSafeZonePolyline(null)
    setSafeZonePlace(null)
    const directionsService = new window.google.maps.DirectionsService()
    directionsService.route(
      { origin: routeData.origin, destination: routeData.destination, travelMode: window.google.maps.TravelMode.DRIVING },
      (result, status) => { if (status === 'OK') setDirections(result) }
    )
    setAltPolyline(routeData.alternative_route?.polyline
      ? decodePolyline(routeData.alternative_route.polyline)
      : null)
    setCurrentStepIdx(0)
    setIsNavigating(false)
    stopNavigation()
  }, [routeData, isLoaded])

  const stopNavigation = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsNavigating(false)
    setUserLocation(null)
    if (mapRef.current) {
      mapRef.current.panTo(NJ_CENTER)
      mapRef.current.setZoom(9)
    }
  }, [])

  const startNavigation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    setIsNavigating(true)
    setCurrentStepIdx(0)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLocation({ lat, lng })
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng })
          mapRef.current.setZoom(17)
        }
        if (routeData?.steps?.length) {
          setCurrentStepIdx(findCurrentStep(lat, lng, routeData.steps))
        }
      },
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    )
  }, [routeData])

  const handleMapClick = useCallback(async (e) => {
    if (isNavigating) return
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    setLoadingRisk(true)
    try {
      const res = await getFloodRisk(lat, lng)
      setRiskMarkers((prev) => [...prev, { lat, lng, ...res.data, id: Date.now() }])
    } catch { } finally {
      setLoadingRisk(false)
    }
  }, [isNavigating])

  if (!MAPS_KEY) return (
    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 text-sm">
      {t('no_api_key')} — set VITE_GOOGLE_MAPS_API_KEY in frontend/.env
    </div>
  )
  if (loadError) return <div className="flex items-center justify-center h-full text-red-500 text-sm">Map failed to load</div>
  if (!isLoaded) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">{t('loading')}</div>

  const currentStep = routeData?.steps?.[currentStepIdx]
  const nextStep = routeData?.steps?.[currentStepIdx + 1]
  const isLastStep = currentStepIdx === (routeData?.steps?.length ?? 0) - 1

  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* ── NAVIGATION BANNER (top of map, Google Maps style) ── */}
      {isNavigating && currentStep && (
        <div className="absolute top-0 left-0 right-0 z-20 shadow-xl">
          {/* Current maneuver */}
          <div className="bg-blue-700 flex items-center gap-4 px-5 py-4">
            <div className="shrink-0">
              {maneuverArrow(currentStep.maneuver, 'w-12 h-12')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xl font-bold leading-tight truncate">
                {currentStep.instruction}
              </p>
              <p className="text-blue-200 text-sm mt-0.5">{currentStep.distance}</p>
            </div>
            <button
              onClick={stopNavigation}
              className="shrink-0 bg-blue-900/60 hover:bg-blue-900 text-white rounded-full p-1.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Next maneuver preview */}
          {nextStep && (
            <div className="bg-blue-900 flex items-center gap-3 px-5 py-2">
              <span className="text-blue-300 text-xs font-medium uppercase tracking-wide">{t('then')}</span>
              <div className="shrink-0">{maneuverArrow(nextStep.maneuver, 'w-4 h-4')}</div>
              <p className="text-blue-100 text-sm truncate flex-1">{nextStep.instruction}</p>
              <span className="text-blue-300 text-xs shrink-0">{nextStep.distance}</span>
            </div>
          )}

          {/* Arrived banner */}
          {isLastStep && (
            <div className="bg-green-600 text-white text-center text-sm font-semibold py-2">
              {t('arriving_destination')}
            </div>
          )}
        </div>
      )}

      {/* ── MAP ── */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={NJ_CENTER}
        zoom={9}
        options={MAP_OPTIONS}
        onClick={handleMapClick}
        onLoad={(map) => { mapRef.current = map }}
      >
        {/* Primary route — blue */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: { strokeColor: '#1a73e8', strokeWeight: 6, strokeOpacity: 0.9 },
              suppressMarkers: false,
            }}
          />
        )}

        {/* SafeZone route — purple solid */}
        {safeZonePolyline && (
          <Polyline
            path={safeZonePolyline}
            options={{
              strokeColor: '#7c3aed',
              strokeWeight: 6,
              strokeOpacity: 0.9,
            }}
          />
        )}

        {/* SafeZone destination marker */}
        {safeZonePlace && (
          <Marker
            position={{ lat: safeZonePlace.lat, lng: safeZonePlace.lng }}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
            }}
            onClick={() => setSelectedMarker({
              lat: safeZonePlace.lat,
              lng: safeZonePlace.lng,
              risk_score: 0,
              risk_level: 'low',
              recommendation: safeZonePlace.vicinity,
              label: `${safeZonePlace.place_type}: ${safeZonePlace.name}`,
              is_flood_zone: false,
            })}
          />
        )}

        {/* Alternative safer route — green dashed */}
        {altPolyline && (
          <Polyline
            path={altPolyline}
            options={{
              strokeColor: '#34a853',
              strokeWeight: 5,
              strokeOpacity: 0.85,
              icons: [{
                icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
                offset: '0',
                repeat: '20px',
              }],
            }}
          />
        )}

        {/* Live user location — blue dot */}
        {userLocation && isLoaded && (
          <Marker
            position={userLocation}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            }}
            zIndex={999}
          />
        )}

        {/* Route risk markers — one per sampled step along the path */}
        {!isNavigating && routeData?.route_risk_points?.map((pt, i) => (
          <Marker
            key={`route-risk-${i}`}
            position={{ lat: pt.lat, lng: pt.lng }}
            icon={RISK_MARKER_ICONS[pt.risk_level]}
            onClick={() => setSelectedMarker({ ...pt, id: `route-risk-${i}` })}
          />
        ))}

        {/* Flood risk markers from manual clicks */}
        {riskMarkers.map((m) => (
          <Marker
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            icon={RISK_MARKER_ICONS[riskLevel(m.risk_score)]}
            onClick={() => setSelectedMarker(m)}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="text-sm max-w-xs">
              {selectedMarker.label && (
                <p className="font-semibold text-gray-700 mb-2 text-xs">{selectedMarker.label}</p>
              )}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{t('risk_score_label')}</span>
                <span className="font-bold text-gray-900 text-sm capitalize">
                  {selectedMarker.risk_level} · {Math.round(selectedMarker.risk_score / 80 * 100)}%
                </span>
              </div>
              {selectedMarker.confidence && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{t('confidence_label')}</span>
                  <span className={`text-xs font-bold ${
                    selectedMarker.confidence === 'High' ? 'text-emerald-600'
                    : selectedMarker.confidence === 'Medium' ? 'text-amber-600'
                    : 'text-red-600'
                  }`}>
                    {t(`confidence_${selectedMarker.confidence.toLowerCase()}`)}
                  </span>
                </div>
              )}
              <p className="text-gray-600 text-xs border-t border-gray-100 pt-1.5">{selectedMarker.recommendation}</p>
              {selectedMarker.is_flood_zone && (
                <p className="mt-1 text-orange-600 font-semibold text-xs">⚠️ Known NJ Flood Zone</p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* ── START NAVIGATION button (bottom right) ── */}
      {routeData && !isNavigating && (
        <button
          onClick={startNavigation}
          className="absolute bottom-14 right-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-lg font-semibold text-sm flex items-center gap-2 z-10"
        >
          <Navigation className="w-4 h-4" />
          {t('start_navigation')}
        </button>
      )}

      {/* Hint text */}
      {!isNavigating && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-gray-600 text-xs px-3 py-1.5 rounded-full shadow pointer-events-none z-10">
          {routeData ? t('route_loaded_hint') : t('click_risk_hint')}
        </div>
      )}

      {loadingRisk && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 text-blue-700 text-xs px-3 py-1.5 rounded-full shadow z-10">
          {t('analyzing_risk')}
        </div>
      )}
    </div>
  )
}
