import re
import asyncio
import httpx
from fastapi import APIRouter, HTTPException
from app.schemas.navigation import RouteRequest, RouteResponse, FloodWarning, NavStep, RouteRiskPoint
from app.config import settings
from app.services.flood_ml import flood_model
from app.services.usgs_service import get_stream_gauge_data
from app.services.nws_service import get_precip_forecast
from datetime import datetime

router = APIRouter(prefix="/navigation", tags=["navigation"])

DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"
GEOCODE_URL    = "https://maps.googleapis.com/maps/api/geocode/json"


async def _geocode(address: str) -> tuple[float, float]:
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.get(GEOCODE_URL, params={"address": address, "key": settings.GOOGLE_MAPS_API_KEY})
    data = resp.json()
    if data["status"] != "OK":
        raise HTTPException(status_code=400, detail=f"Could not geocode: {address}")
    loc = data["results"][0]["geometry"]["location"]
    return loc["lat"], loc["lng"]


async def _get_directions(origin: str, destination: str) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(DIRECTIONS_URL, params={
            "origin": origin, "destination": destination, "key": settings.GOOGLE_MAPS_API_KEY,
        })
    data = resp.json()
    if data["status"] != "OK":
        raise HTTPException(status_code=400, detail="Could not find route")
    leg = data["routes"][0]["legs"][0]
    return {
        "distance": leg["distance"]["text"],
        "duration": leg["duration"]["text"],
        "polyline": data["routes"][0]["overview_polyline"]["points"],
        "steps": leg["steps"],
    }


async def _assess_point(lat: float, lng: float, month: int, hour: int) -> dict:
    """
    Fetch live USGS + NWS data for one lat/lng and return risk assessment.
    Runs concurrently via asyncio.gather in the route handler.
    """
    gauge_data, precip_data = await asyncio.gather(
        get_stream_gauge_data(lat, lng),
        get_precip_forecast(lat, lng),
    )
    return flood_model.assess_location(
        lat=lat,
        lng=lng,
        stream_gauge_height=gauge_data["gauge_height_ft"],
        gauge_change_rate=gauge_data["change_rate_ft_per_hr"],
        precip_prob_1hr=precip_data["precip_prob_1hr_pct"],
        precip_prob_6hr=precip_data["precip_prob_6hr_pct"],
        month=month,
        hour=hour,
    )


def _sample_steps(steps: list, max_points: int = 10) -> list[int]:
    """
    Return indices of evenly-spaced steps to sample, always including
    the first and last step. Caps at max_points to limit API calls.
    """
    n = len(steps)
    if n <= max_points:
        return list(range(n))
    # Evenly spaced indices, always include first and last
    indices = [round(i * (n - 1) / (max_points - 1)) for i in range(max_points)]
    return sorted(set(indices))


@router.post("/route", response_model=RouteResponse)
async def get_safe_route(body: RouteRequest):
    """
    Flood-aware routing.
    Checks flood risk at every step along the route (concurrently),
    not just origin and destination.
    Overall risk = the highest risk score found anywhere on the path.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=503, detail="Google Maps API key not configured")

    directions = await _get_directions(body.origin, body.destination)
    now = datetime.utcnow()
    raw_steps = directions["steps"]

    # ── Build NavStep list (turn-by-turn instructions) ──────────────────────
    nav_steps = []
    for s in raw_steps:
        plain = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s.get("html_instructions", ""))).strip()
        nav_steps.append(NavStep(
            instruction=plain,
            distance=s["distance"]["text"],
            duration=s["duration"]["text"],
            maneuver=s.get("maneuver"),
            start_lat=s["start_location"]["lat"],
            start_lng=s["start_location"]["lng"],
        ))

    # ── Sample points along route & assess concurrently ─────────────────────
    # Use evenly-spaced step start locations (up to 10 points).
    # asyncio.gather runs all USGS + NWS calls in parallel so total latency
    # ≈ single request time, not N × single request time.
    sample_indices = _sample_steps(raw_steps, max_points=10)
    sample_coords = [
        (raw_steps[i]["start_location"]["lat"],
         raw_steps[i]["start_location"]["lng"],
         nav_steps[i].instruction)
        for i in sample_indices
    ]

    # Also always include the final destination point
    dest_lat, dest_lng = await _geocode(body.destination)
    sample_coords.append((dest_lat, dest_lng, "Destination"))

    # Fire all risk assessments in parallel
    assessments = await asyncio.gather(*[
        _assess_point(lat, lng, now.month, now.hour)
        for lat, lng, _ in sample_coords
    ])

    # ── Build route_risk_points and warnings ────────────────────────────────
    route_risk_points: list[RouteRiskPoint] = []
    warnings: list[FloodWarning] = []

    for (lat, lng, label), result in zip(sample_coords, assessments):
        route_risk_points.append(RouteRiskPoint(
            lat=lat,
            lng=lng,
            risk_score=result["risk_score"],
            risk_level=result["risk_level"],
            label=label,
        ))
        if result["risk_score"] >= 15:
            warnings.append(FloodWarning(
                location=label[:60],   # truncate long instructions
                risk_score=result["risk_score"],
                message=result["recommendation"],
            ))

    # Overall risk = worst point on the entire path
    overall_risk = max(p.risk_score for p in route_risk_points) if route_risk_points else 0.0

    return RouteResponse(
        origin=body.origin,
        destination=body.destination,
        distance=directions["distance"],
        duration=directions["duration"],
        polyline=directions["polyline"],
        flood_warnings=warnings,
        overall_risk=overall_risk,
        safe_alternative=None,
        steps=nav_steps,
        route_risk_points=route_risk_points,
    )
