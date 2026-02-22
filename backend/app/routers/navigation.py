import re
import asyncio
import httpx
from fastapi import APIRouter, HTTPException
from datetime import datetime

import math

from app.schemas.navigation import (
    RouteRequest, RouteResponse, FloodWarning,
    NavStep, RouteRiskPoint, AlternativeRoute,
    SafeZoneRequest, SafeZoneResponse, SafeZoneResult,
)
from app.config import settings
from app.services.flood_ml import flood_model
from app.services.usgs_service import get_stream_gauge_data, closest_gauge
from app.services.nws_service import get_precip_forecast

router = APIRouter(prefix="/navigation", tags=["navigation"])

DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"
GEOCODE_URL    = "https://maps.googleapis.com/maps/api/geocode/json"
PLACES_URL     = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

# Safe place types searched in priority order
SAFE_PLACE_TYPES = ["police", "hospital", "fire_station", "transit_station"]
SAFE_PLACE_LABELS = {
    "police":          "Police Station",
    "hospital":        "Hospital",
    "fire_station":    "Fire Station",
    "transit_station": "Transit Station",
}


async def _geocode(address: str) -> tuple[float, float]:
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.get(GEOCODE_URL, params={"address": address, "key": settings.GOOGLE_MAPS_API_KEY})
    data = resp.json()
    if data["status"] != "OK":
        raise HTTPException(status_code=400, detail=f"Could not geocode: {address}")
    loc = data["results"][0]["geometry"]["location"]
    return loc["lat"], loc["lng"]


async def _get_directions(origin: str, destination: str, avoid: str | None = None) -> list[dict]:
    """
    Fetch route(s) from Google Directions API.
    Always requests alternatives=true so we get up to 3 options.
    Returns a list of route dicts (each has distance, duration, polyline, steps).
    """
    params = {
        "origin": origin,
        "destination": destination,
        "alternatives": "true",
        "key": settings.GOOGLE_MAPS_API_KEY,
    }
    if avoid:
        params["avoid"] = avoid

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(DIRECTIONS_URL, params=params)
    data = resp.json()

    if data["status"] != "OK":
        raise HTTPException(status_code=400, detail="Could not find route")

    routes = []
    for route in data["routes"]:
        leg = route["legs"][0]
        routes.append({
            "distance": leg["distance"]["text"],
            "duration": leg["duration"]["text"],
            "polyline": route["overview_polyline"]["points"],
            "raw_steps": leg["steps"],
        })
    return routes


def _parse_nav_steps(raw_steps: list) -> list[NavStep]:
    """Convert raw Google steps to NavStep objects."""
    steps = []
    for s in raw_steps:
        plain = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s.get("html_instructions", ""))).strip()
        steps.append(NavStep(
            instruction=plain,
            distance=s["distance"]["text"],
            duration=s["duration"]["text"],
            maneuver=s.get("maneuver"),
            start_lat=s["start_location"]["lat"],
            start_lng=s["start_location"]["lng"],
        ))
    return steps


def _risk_label(score: float) -> str:
    if score <= 20: return "low"
    if score <= 40: return "moderate"
    if score <= 60: return "high"
    return "severe"


async def _score_route(
    raw_steps: list,
    dest_lat: float,
    dest_lng: float,
    month: int,
    hour: int,
    nav_steps: list[NavStep],
) -> tuple[list[RouteRiskPoint], list[FloodWarning], float]:
    """
    Score EVERY step on a route using cached USGS + NWS data.

    Caching strategy:
      - USGS: keyed by gauge site ID  (NJ has only 8 gauges — many steps share one)
      - NWS:  keyed by (lat rounded to 1dp, lng rounded to 1dp)
                       (NWS grid cells are county-sized, nearby points share a forecast)

    This means a 30-step route typically makes only 3-4 USGS calls
    and 4-6 NWS calls, all fired in parallel.
    """
    # Build full list of (lat, lng, label) for every step + destination
    points: list[tuple[float, float, str]] = [
        (s["start_location"]["lat"], s["start_location"]["lng"], nav_steps[i].instruction)
        for i, s in enumerate(raw_steps)
    ]
    points.append((dest_lat, dest_lng, "Destination"))

    # Identify unique gauge sites and NWS grid cells
    unique_gauges: dict[str, tuple[float, float]] = {}   # site_id → representative (lat, lng)
    unique_nws: dict[tuple, tuple[float, float]] = {}    # (r_lat, r_lng) → representative (lat, lng)

    for lat, lng, _ in points:
        site = closest_gauge(lat, lng)
        if site not in unique_gauges:
            unique_gauges[site] = (lat, lng)
        nws_key = (round(lat, 1), round(lng, 1))
        if nws_key not in unique_nws:
            unique_nws[nws_key] = (lat, lng)

    # Fire all unique API calls in parallel
    gauge_keys  = list(unique_gauges.keys())
    nws_keys    = list(unique_nws.keys())
    gauge_latlngs = [unique_gauges[k] for k in gauge_keys]
    nws_latlngs   = [unique_nws[k]   for k in nws_keys]

    all_results = await asyncio.gather(
        *[get_stream_gauge_data(lat, lng) for lat, lng in gauge_latlngs],
        *[get_precip_forecast(lat, lng)   for lat, lng in nws_latlngs],
    )

    gauge_cache = dict(zip(gauge_keys, all_results[:len(gauge_keys)]))
    nws_cache   = dict(zip(nws_keys,   all_results[len(gauge_keys):]))

    # Score every point using cached data
    risk_points: list[RouteRiskPoint] = []
    warnings:    list[FloodWarning]   = []

    for lat, lng, label in points:
        site    = closest_gauge(lat, lng)
        nws_key = (round(lat, 1), round(lng, 1))
        gauge   = gauge_cache[site]
        precip  = nws_cache[nws_key]

        result = flood_model.assess_location(
            lat=lat,
            lng=lng,
            stream_gauge_height=gauge["gauge_height_ft"],
            gauge_change_rate=gauge["change_rate_ft_per_hr"],
            precip_prob_1hr=precip["precip_prob_1hr_pct"],
            precip_prob_6hr=precip["precip_prob_6hr_pct"],
            month=month,
            hour=hour,
            flood_stage_ft=gauge["flood_stage_ft"],
        )

        risk_points.append(RouteRiskPoint(
            lat=lat, lng=lng,
            risk_score=result["risk_score"],
            risk_level=result["risk_level"],
            label=label[:80],
        ))

        if result["risk_score"] > 20:
            warnings.append(FloodWarning(
                location=label[:60],
                risk_score=result["risk_score"],
                message=result["recommendation"],
            ))

    overall_risk = max(p.risk_score for p in risk_points) if risk_points else 0.0
    return risk_points, warnings, overall_risk


@router.post("/route", response_model=RouteResponse)
async def get_safe_route(body: RouteRequest):
    """
    Flood-aware routing:
    1. Fetches primary route + up to 2 Google alternatives simultaneously
    2. Checks flood risk at EVERY step on the primary route
    3. If primary risk >= High (41), scores alternatives and returns the safest one
    4. overall_risk = worst single point on the path (not just start/end)
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=503, detail="Google Maps API key not configured")

    now = datetime.utcnow()
    dest_lat, dest_lng = await _geocode(body.destination)

    # Fetch primary route (with alternatives) and avoid-highways variant in parallel
    primary_routes, avoid_routes = await asyncio.gather(
        _get_directions(body.origin, body.destination),
        _get_directions(body.origin, body.destination, avoid="highways"),
    )

    # All candidate routes: primary alternatives + avoid-highways alternatives
    all_candidates = primary_routes + avoid_routes

    # Score the primary route (first result from Google — their best suggestion)
    primary = primary_routes[0]
    primary_nav = _parse_nav_steps(primary["raw_steps"])
    primary_risk_pts, primary_warnings, primary_overall = await _score_route(
        primary["raw_steps"], dest_lat, dest_lng, now.month, now.hour, primary_nav
    )

    # Only suggest an alternative when primary risk is High or Severe (>= 60/80).
    # The alternative must genuinely score lower — no alternative shown if all
    # routes score the same (e.g. all cross the same flooded basin).
    alternative_route = None
    if primary_overall >= 60 and len(all_candidates) > 1:
        def _alt_score_key(result_tuple):
            pts, _, overall = result_tuple
            high_count = sum(1 for p in pts if p.risk_score > 40)
            return (high_count, overall)

        primary_key  = _alt_score_key((primary_risk_pts, primary_warnings, primary_overall))
        best_alt     = None
        best_alt_nav = None
        best_alt_pts = None
        best_alt_overall = primary_overall
        best_key     = primary_key

        for candidate in all_candidates[1:]:
            if candidate["polyline"] == primary["polyline"]:
                continue
            cand_nav = _parse_nav_steps(candidate["raw_steps"])
            cand_pts, _, cand_overall = await _score_route(
                candidate["raw_steps"], dest_lat, dest_lng, now.month, now.hour, cand_nav
            )
            cand_key = _alt_score_key((cand_pts, None, cand_overall))
            if cand_key < best_key:
                best_key         = cand_key
                best_alt         = candidate
                best_alt_nav     = cand_nav
                best_alt_pts     = cand_pts
                best_alt_overall = cand_overall

        if best_alt:
            alternative_route = AlternativeRoute(
                distance=best_alt["distance"],
                duration=best_alt["duration"],
                polyline=best_alt["polyline"],
                overall_risk=best_alt_overall,
                risk_level=_risk_label(best_alt_overall),
                steps=best_alt_nav,
                route_risk_points=best_alt_pts,
            )

    return RouteResponse(
        origin=body.origin,
        destination=body.destination,
        distance=primary["distance"],
        duration=primary["duration"],
        polyline=primary["polyline"],
        flood_warnings=primary_warnings,
        overall_risk=primary_overall,
        alternative_route=alternative_route,
        steps=primary_nav,
        route_risk_points=primary_risk_pts,
    )


# ─────────────────────────────────────────────────────────────────────────────
# SafeZone endpoint
# ─────────────────────────────────────────────────────────────────────────────

def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return great-circle distance in km between two lat/lng points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def _search_places(lat: float, lng: float, place_type: str) -> list[dict]:
    """Search Google Places Nearby for a given type within 10 km."""
    params = {
        "location": f"{lat},{lng}",
        "radius":   10000,           # 10 km
        "type":     place_type,
        "key":      settings.GOOGLE_MAPS_API_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(PLACES_URL, params=params)
        data = resp.json()
        return data.get("results", [])
    except Exception:
        return []


async def _search_places_keyword(lat: float, lng: float, keyword: str) -> list[dict]:
    """Search Google Places Nearby using a keyword (e.g. 'emergency shelter')."""
    params = {
        "location": f"{lat},{lng}",
        "radius":   20000,
        "keyword":  keyword,
        "key":      settings.GOOGLE_MAPS_API_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(PLACES_URL, params=params)
        return resp.json().get("results", [])
    except Exception:
        return []


async def _nearest_of_type(
    lat: float, lng: float, place_type: str | None, keyword: str | None, label: str
) -> dict | None:
    """Return the closest candidate of a given Places type or keyword, or None."""
    if keyword:
        places = await _search_places_keyword(lat, lng, keyword)
    else:
        places = await _search_places(lat, lng, place_type)

    best = None
    for p in places:
        loc = p.get("geometry", {}).get("location", {})
        plat, plng = loc.get("lat"), loc.get("lng")
        if plat is None or plng is None:
            continue
        dist = _haversine_km(lat, lng, plat, plng)
        if best is None or dist < best["distance_km"]:
            best = {
                "place_name":  p.get("name", "Unknown"),
                "place_type":  label,
                "lat":         plat,
                "lng":         plng,
                "distance_km": dist,
                "vicinity":    p.get("vicinity", ""),
            }
    return best


@router.post("/safezone", response_model=SafeZoneResponse)
async def get_safezone(body: SafeZoneRequest):
    """
    Accept a free-text location, geocode it, then find the nearest hospital
    and emergency shelter and return driving directions to each.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=503, detail="Google Maps API key not configured")

    # Geocode the user's text address
    try:
        user_lat, user_lng = await _geocode(body.location)
    except HTTPException:
        raise HTTPException(status_code=400, detail=f"Could not find location: {body.location}")

    # Resolve a display address for the geocoded point
    async with httpx.AsyncClient(timeout=8.0) as hclient:
        rev = await hclient.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"latlng": f"{user_lat},{user_lng}", "key": settings.GOOGLE_MAPS_API_KEY},
        )
    rev_data = rev.json()
    display_addr = (
        rev_data["results"][0]["formatted_address"]
        if rev_data.get("results")
        else body.location
    )

    # Search hospital and shelter in parallel
    hospital_cand, shelter_cand = await asyncio.gather(
        _nearest_of_type(user_lat, user_lng, "hospital", None, "Hospital"),
        _nearest_of_type(user_lat, user_lng, None, "emergency shelter", "Emergency Shelter"),
    )

    candidates = [c for c in [hospital_cand, shelter_cand] if c is not None]
    if not candidates:
        raise HTTPException(status_code=404, detail="No hospitals or shelters found within 20 km")

    # Get driving directions for each candidate in parallel
    origin_str = f"{user_lat},{user_lng}"

    async def _build_result(cand: dict) -> SafeZoneResult:
        dest_str = f"{cand['lat']},{cand['lng']}"
        routes = await _get_directions(origin_str, dest_str)
        route = routes[0]
        return SafeZoneResult(
            place_name=cand["place_name"],
            place_type=cand["place_type"],
            vicinity=cand["vicinity"],
            distance_km=cand["distance_km"],
            distance=route["distance"],
            duration=route["duration"],
            steps=_parse_nav_steps(route["raw_steps"]),
        )

    results = await asyncio.gather(*[_build_result(c) for c in candidates])

    return SafeZoneResponse(
        user_location=display_addr,
        results=list(results),
    )
