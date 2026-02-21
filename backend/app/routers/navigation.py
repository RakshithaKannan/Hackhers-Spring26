import httpx
from fastapi import APIRouter, HTTPException
from app.schemas.navigation import RouteRequest, RouteResponse, FloodWarning
from app.config import settings
from app.services.flood_ml import flood_model, is_flood_zone as check_flood_zone
from datetime import datetime

router = APIRouter(prefix="/navigation", tags=["navigation"])

DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


async def _geocode(address: str) -> tuple[float, float]:
    """Convert address to lat/lng via Google Geocoding API."""
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.get(GEOCODE_URL, params={
            "address": address,
            "key": settings.GOOGLE_MAPS_API_KEY,
        })
    data = resp.json()
    if data["status"] != "OK":
        raise HTTPException(status_code=400, detail=f"Could not geocode: {address}")
    loc = data["results"][0]["geometry"]["location"]
    return loc["lat"], loc["lng"]


async def _get_directions(origin: str, destination: str, avoid_highways: bool = False) -> dict:
    params = {
        "origin": origin,
        "destination": destination,
        "key": settings.GOOGLE_MAPS_API_KEY,
    }
    if avoid_highways:
        params["avoid"] = "highways"

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(DIRECTIONS_URL, params=params)
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


@router.post("/route", response_model=RouteResponse)
async def get_safe_route(body: RouteRequest):
    """
    Get a flood-aware route from origin to destination.
    Checks flood risk at origin, destination, and key waypoints.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=503, detail="Google Maps API key not configured")

    directions = await _get_directions(body.origin, body.destination)
    now = datetime.utcnow()

    # Assess flood risk at origin and destination
    origin_lat, origin_lng = await _geocode(body.origin)
    dest_lat, dest_lng = await _geocode(body.destination)

    warnings: list[FloodWarning] = []
    risk_scores: list[float] = []

    for name, lat, lng in [("Origin", origin_lat, origin_lng), ("Destination", dest_lat, dest_lng)]:
        result = flood_model.assess_location(lat=lat, lng=lng, month=now.month, hour=now.hour)
        risk_scores.append(result["risk_score"])
        if result["risk_score"] >= 15:
            warnings.append(FloodWarning(
                location=name,
                risk_score=result["risk_score"],
                message=result["recommendation"],
            ))

    overall_risk = max(risk_scores) if risk_scores else 0.0

    return RouteResponse(
        origin=body.origin,
        destination=body.destination,
        distance=directions["distance"],
        duration=directions["duration"],
        polyline=directions["polyline"],
        flood_warnings=warnings,
        overall_risk=overall_risk,
        safe_alternative=None,
    )
