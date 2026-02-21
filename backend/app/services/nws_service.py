"""
National Weather Service (NWS) API integration.
Fetches precipitation forecasts — no API key required.
Docs: https://www.weather.gov/documentation/services-web-api
"""

import httpx
from typing import Optional

NWS_BASE = "https://api.weather.gov"
NWS_HEADERS = {"User-Agent": "SafeSphere/1.0 (safesphere-app@example.com)"}


async def get_precip_forecast(lat: float, lng: float) -> dict:
    """
    Fetch hourly precipitation forecast for a lat/lng.
    Returns precip_1hr_in, precip_6hr_in, precip_24hr_in.
    Falls back gracefully if NWS is unavailable.
    """
    try:
        async with httpx.AsyncClient(timeout=8.0, headers=NWS_HEADERS) as client:
            # Step 1: resolve gridpoint
            point_resp = await client.get(f"{NWS_BASE}/points/{lat:.4f},{lng:.4f}")
            point_resp.raise_for_status()
            point_data = point_resp.json()

            hourly_url = point_data["properties"]["forecastHourly"]

            # Step 2: fetch hourly forecast
            forecast_resp = await client.get(hourly_url)
            forecast_resp.raise_for_status()
            periods = forecast_resp.json()["properties"]["periods"]

        # Extract precipitation probability as a proxy (NWS doesn't give raw precip amount)
        # Use probabilityOfPrecipitation scaled to inches estimate
        def prob_to_inches(prob: int, hours: int) -> float:
            # 100% prob over 1hr ≈ 0.3 in (conservative estimate)
            return round((prob / 100) * 0.3 * hours, 3)

        p1 = periods[0]["probabilityOfPrecipitation"]["value"] or 0
        p6 = max(p["probabilityOfPrecipitation"]["value"] or 0 for p in periods[:6])
        p24 = max(p["probabilityOfPrecipitation"]["value"] or 0 for p in periods[:24])

        return {
            "precip_1hr_in": prob_to_inches(p1, 1),
            "precip_6hr_in": prob_to_inches(p6, 6),
            "precip_24hr_in": prob_to_inches(p24, 24),
            "precip_prob_1hr_pct": p1,
            "source": "NWS",
        }

    except Exception:
        return {
            "precip_1hr_in": 0.0,
            "precip_6hr_in": 0.0,
            "precip_24hr_in": 0.0,
            "precip_prob_1hr_pct": 0,
            "source": "fallback",
        }
