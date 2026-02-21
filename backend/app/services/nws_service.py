"""
National Weather Service (NWS) API integration.
Fetches precipitation forecasts — no API key required.
Docs: https://www.weather.gov/documentation/services-web-api

Returns raw precipitation PROBABILITY (0-100%) — not fabricated inch estimates.
PoP (Probability of Precipitation) = chance that measurable rain will fall.
It says nothing about how much rain, so we use it directly as a probability signal.
"""

import httpx

NWS_BASE = "https://api.weather.gov"
NWS_HEADERS = {"User-Agent": "SafeSphere/1.0 (safesphere-app@example.com)"}


async def get_precip_forecast(lat: float, lng: float) -> dict:
    """
    Fetch hourly precipitation probability forecast for a lat/lng.

    Returns:
        precip_prob_1hr_pct  — probability of rain in next 1 hour  (0-100)
        precip_prob_6hr_pct  — max probability over next 6 hours   (0-100)
        precip_prob_24hr_pct — max probability over next 24 hours  (0-100)
        source               — "NWS" if live, "fallback" if unavailable
    """
    try:
        async with httpx.AsyncClient(timeout=8.0, headers=NWS_HEADERS) as client:
            # Step 1: resolve lat/lng to NWS grid point
            point_resp = await client.get(f"{NWS_BASE}/points/{lat:.4f},{lng:.4f}")
            point_resp.raise_for_status()
            hourly_url = point_resp.json()["properties"]["forecastHourly"]

            # Step 2: fetch hourly forecast periods
            forecast_resp = await client.get(hourly_url)
            forecast_resp.raise_for_status()
            periods = forecast_resp.json()["properties"]["periods"]

        def pop(period) -> int:
            """Extract precipitation probability, default 0 if missing."""
            val = period.get("probabilityOfPrecipitation", {})
            return int(val.get("value") or 0)

        prob_1hr  = pop(periods[0])
        prob_6hr  = max(pop(p) for p in periods[:6])
        prob_24hr = max(pop(p) for p in periods[:24])

        return {
            "precip_prob_1hr_pct":  prob_1hr,
            "precip_prob_6hr_pct":  prob_6hr,
            "precip_prob_24hr_pct": prob_24hr,
            "source": "NWS",
        }

    except Exception:
        return {
            "precip_prob_1hr_pct":  0,
            "precip_prob_6hr_pct":  0,
            "precip_prob_24hr_pct": 0,
            "source": "fallback",
        }
