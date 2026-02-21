from fastapi import APIRouter
from datetime import datetime

from app.schemas.flood import FloodRiskRequest, FloodRiskResponse
from app.services.flood_ml import flood_model
from app.services.usgs_service import get_stream_gauge_data
from app.services.nws_service import get_precip_forecast

router = APIRouter(prefix="/flood", tags=["flood"])


@router.post("/risk", response_model=FloodRiskResponse)
async def get_flood_risk(body: FloodRiskRequest):
    """
    Assess flood risk at a given lat/lng.
    Fetches live USGS stream gauge + NWS forecast, then runs the ML model.
    """
    now = datetime.utcnow()

    # Fetch live data in parallel-ish (sequential is fine for hackathon)
    gauge_data = await get_stream_gauge_data(body.lat, body.lng)
    precip_data = await get_precip_forecast(body.lat, body.lng)

    result = flood_model.assess_location(
        lat=body.lat,
        lng=body.lng,
        stream_gauge_height=gauge_data["gauge_height_ft"],
        gauge_change_rate=gauge_data["change_rate_ft_per_hr"],
        precip_1hr=precip_data["precip_1hr_in"],
        precip_6hr=precip_data["precip_6hr_in"],
        precip_24hr=precip_data["precip_24hr_in"],
        month=now.month,
        hour=now.hour,
    )

    sources = ["ML Model (Gradient Boosting)", "USGS Water Services"]
    if precip_data["source"] == "NWS":
        sources.append("National Weather Service")

    return FloodRiskResponse(
        lat=body.lat,
        lng=body.lng,
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        stream_gauge_height=gauge_data["gauge_height_ft"],
        precip_forecast_1hr=precip_data["precip_1hr_in"],
        precip_forecast_6hr=precip_data["precip_6hr_in"],
        is_flood_zone=result["is_flood_zone"],
        recommendation=result["recommendation"],
        data_sources=sources,
    )
