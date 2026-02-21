"""
USGS Water Services API integration.
Fetches real-time stream gauge data for New Jersey — no API key required.
Docs: https://waterservices.usgs.gov/rest/IV-Service.html
"""

import httpx
from datetime import datetime, timedelta
from typing import Optional

USGS_IV_URL = "https://waterservices.usgs.gov/nwis/iv/"

# Major NJ stream gauge sites (site number: name)
NJ_GAUGE_SITES = {
    "01389500": "Passaic River at Millington",
    "01389890": "Passaic River at Two Bridges",
    "01390500": "Passaic River at Little Falls",
    "01396500": "Raritan River at Manville",
    "01403060": "Raritan River at New Brunswick",
    "01408500": "Toms River near Toms River",
    "01377000": "Hackensack River at Rivervale",
    "01396660": "Green Brook at Bound Brook",
}


def _closest_gauge(lat: float, lng: float) -> str:
    """Return the USGS site number of the closest NJ gauge to the given coordinates."""
    # Simple Euclidean distance in degrees
    gauge_coords = {
        "01389500": (40.697, -74.519),
        "01389890": (40.894, -74.275),
        "01390500": (40.877, -74.218),
        "01396500": (40.554, -74.594),
        "01403060": (40.487, -74.447),
        "01408500": (39.957, -74.197),
        "01377000": (41.018, -74.006),
        "01396660": (40.566, -74.534),
    }
    best_site = "01390500"
    best_dist = float("inf")
    for site, (glat, glng) in gauge_coords.items():
        dist = (lat - glat) ** 2 + (lng - glng) ** 2
        if dist < best_dist:
            best_dist = dist
            best_site = site
    return best_site


async def get_stream_gauge_data(lat: float, lng: float) -> dict:
    """
    Fetch the latest stream gauge height and change rate for the nearest NJ gauge.
    Returns dict with gauge_height_ft, change_rate_ft_per_hr, site_name.
    Falls back to safe defaults if the API is unavailable.
    """
    site = _closest_gauge(lat, lng)
    site_name = NJ_GAUGE_SITES.get(site, "NJ gauge")

    params = {
        "format": "json",
        "sites": site,
        "parameterCd": "00065",   # gage height in feet
        "siteType": "ST",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(USGS_IV_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        time_series = data["value"]["timeSeries"]
        if not time_series:
            return _default_gauge(site_name)

        values = time_series[0]["values"][0]["value"]
        if len(values) < 2:
            height = float(values[-1]["value"]) if values else 5.0
            return {"gauge_height_ft": height, "change_rate_ft_per_hr": 0.0, "site_name": site_name}

        latest = float(values[-1]["value"])
        prev = float(values[-2]["value"])

        # Parse timestamps to compute rate
        fmt = "%Y-%m-%dT%H:%M:%S.%f%z"
        try:
            t1 = datetime.strptime(values[-1]["dateTime"], fmt)
            t2 = datetime.strptime(values[-2]["dateTime"], fmt)
            hours_diff = (t1 - t2).total_seconds() / 3600 or 0.25
        except Exception:
            hours_diff = 0.25

        change_rate = (latest - prev) / hours_diff

        return {
            "gauge_height_ft": round(latest, 2),
            "change_rate_ft_per_hr": round(change_rate, 3),
            "site_name": site_name,
        }

    except Exception:
        return _default_gauge(site_name)


def _default_gauge(site_name: str) -> dict:
    return {"gauge_height_ft": 5.0, "change_rate_ft_per_hr": 0.0, "site_name": site_name}
