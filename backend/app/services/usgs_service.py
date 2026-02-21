"""
USGS Water Services API integration.
Fetches real-time stream gauge data for New Jersey — no API key required.
Docs: https://waterservices.usgs.gov/nwis/iv/

Gauge height parameter: 00065 (gage height, feet)
Sentinel value -999999 means equipment malfunction — we skip those readings.
"""

import httpx
from datetime import datetime

USGS_IV_URL = "https://waterservices.usgs.gov/nwis/iv/"

# Major NJ stream gauge sites with their USGS-published flood stages (feet).
# action_ft = action stage (elevated monitoring)
# flood_ft  = official flood stage (property/road flooding begins)
# These come from USGS NWISWeb gauge pages for each site.
NJ_GAUGE_SITES = {
    "01389500": {
        "name":       "Passaic River at Millington",
        "coords":     (40.697, -74.519),
        "action_ft":  8.0,
        "flood_ft":   9.0,
    },
    "01389890": {
        "name":       "Passaic River at Two Bridges",
        "coords":     (40.894, -74.275),
        "action_ft":  11.0,
        "flood_ft":   16.0,
    },
    "01390500": {
        "name":       "Passaic River at Little Falls",
        "coords":     (40.877, -74.218),
        "action_ft":  11.0,
        "flood_ft":   14.0,
    },
    "01396500": {
        "name":       "Raritan River at Manville",
        "coords":     (40.554, -74.594),
        "action_ft":  14.0,
        "flood_ft":   22.0,
    },
    "01403060": {
        "name":       "Raritan River at New Brunswick",
        "coords":     (40.487, -74.447),
        "action_ft":  13.0,
        "flood_ft":   16.0,
    },
    "01408500": {
        "name":       "Toms River near Toms River",
        "coords":     (39.957, -74.197),
        "action_ft":  5.5,
        "flood_ft":   7.0,
    },
    "01377000": {
        "name":       "Hackensack River at Rivervale",
        "coords":     (41.018, -74.006),
        "action_ft":  8.0,
        "flood_ft":   10.0,
    },
    "01396660": {
        "name":       "Green Brook at Bound Brook",
        "coords":     (40.566, -74.534),
        "action_ft":  4.0,
        "flood_ft":   6.0,
    },
}

USGS_SENTINEL = -999999.0   # USGS "no data / equipment malfunction" value


def closest_gauge(lat: float, lng: float) -> str:
    """Return the site ID of the closest NJ gauge to the given coordinates."""
    best_site = "01390500"
    best_dist = float("inf")
    for site, info in NJ_GAUGE_SITES.items():
        glat, glng = info["coords"]
        dist = (lat - glat) ** 2 + (lng - glng) ** 2
        if dist < best_dist:
            best_dist = dist
            best_site = site
    return best_site


def _ordered_gauges(lat: float, lng: float) -> list[str]:
    """Return all gauge site IDs sorted by distance (closest first)."""
    def dist(site):
        glat, glng = NJ_GAUGE_SITES[site]["coords"]
        return (lat - glat) ** 2 + (lng - glng) ** 2
    return sorted(NJ_GAUGE_SITES.keys(), key=dist)


def _valid_values(raw_values: list) -> list:
    """Filter out USGS sentinel -999999 and equipment-malfunction readings."""
    good = []
    for v in raw_values:
        try:
            f = float(v["value"])
        except (ValueError, TypeError):
            continue
        if f <= USGS_SENTINEL + 1:        # sentinel
            continue
        if "Eqp" in v.get("qualifiers", []):   # equipment malfunction
            continue
        good.append((f, v["dateTime"]))
    return good


async def _fetch_gauge(site: str) -> dict | None:
    """
    Fetch gauge height and change rate for one USGS site.
    Returns None if the gauge has no valid readings.
    """
    params = {
        "format":      "json",
        "sites":       site,
        "parameterCd": "00065",
        "siteType":    "ST",
        "period":      "PT3H",   # last 3 hours — enough for rate of change
    }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(USGS_IV_URL, params=params)
            resp.raise_for_status()
        time_series = resp.json()["value"]["timeSeries"]
        if not time_series:
            return None

        raw = time_series[0]["values"][0]["value"]
        valid = _valid_values(raw)

        if not valid:
            return None   # gauge is broken / no valid data

        height = valid[-1][0]

        # Compute rate of change from last two valid readings
        if len(valid) >= 2:
            h2, t2 = valid[-1]
            h1, t1 = valid[-2]
            try:
                fmt = "%Y-%m-%dT%H:%M:%S.%f%z"
                dt1 = datetime.strptime(t1, fmt)
                dt2 = datetime.strptime(t2, fmt)
                hours = (dt2 - dt1).total_seconds() / 3600 or 0.25
            except Exception:
                hours = 0.25
            change_rate = (h2 - h1) / hours
        else:
            change_rate = 0.0

        info = NJ_GAUGE_SITES[site]
        return {
            "gauge_height_ft":       round(height, 2),
            "change_rate_ft_per_hr": round(change_rate, 3),
            "site_name":             info["name"],
            "action_stage_ft":       info["action_ft"],
            "flood_stage_ft":        info["flood_ft"],
        }

    except Exception:
        return None


async def get_stream_gauge_data(lat: float, lng: float) -> dict:
    """
    Fetch real-time gauge data for the nearest working NJ gauge.
    Falls back to the next closest gauge if the nearest has no valid data.
    Always returns a dict with gauge_height_ft, change_rate_ft_per_hr,
    action_stage_ft, flood_stage_ft, site_name.
    """
    for site in _ordered_gauges(lat, lng):
        result = await _fetch_gauge(site)
        if result is not None:
            return result

    # All gauges unavailable — return safe defaults
    return {
        "gauge_height_ft":       5.0,
        "change_rate_ft_per_hr": 0.0,
        "site_name":             "NJ gauge (fallback)",
        "action_stage_ft":       8.0,
        "flood_stage_ft":        12.0,
    }
