"""
waterWise Flood Risk ML Model — GradientBoostingRegressor.

Trained on synthetic NJ flood data. Outputs a risk score (0–80).

Features:
  - gauge_height_ratio  : gauge height / flood stage (unitless)
  - gauge_rate          : ft/hr rise rate
  - precip_prob_1hr     : 0–100
  - precip_prob_6hr     : 0–100
  - in_flood_zone       : 0 or 1
  - is_high_risk_month  : 0 or 1 (Mar–May, Aug–Nov)

Risk levels (0–80 scale):
   0–20  → low
  21–40  → moderate
  41–60  → high
  61–80  → severe
"""

import os
import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler

# Paths relative to this file
_DIR = os.path.dirname(os.path.abspath(__file__))
_MODEL_PATH = os.path.join(_DIR, "../../../flood_model.joblib")
_SCALER_PATH = os.path.join(_DIR, "../../../flood_scaler.joblib")

# NJ high-risk months: spring snowmelt + hurricane season
HIGH_RISK_MONTHS = {3, 4, 5, 8, 9, 10, 11}

# Known NJ FEMA high-risk flood zone bounding boxes
NJ_FLOOD_ZONES = [
    (40.60, 40.85, -74.25, -74.00, "Newark/Passaic River basin"),
    (40.10, 40.35, -74.10, -73.90, "Raritan River basin"),
    (39.90, 40.10, -74.30, -74.10, "Toms River area"),
    (40.45, 40.65, -74.55, -74.30, "Bound Brook / Somerset"),
    (40.85, 41.05, -74.20, -74.00, "Pompton Lakes / Wayne"),
    (39.35, 39.55, -74.65, -74.40, "Atlantic City coastal"),
    (40.70, 40.90, -74.10, -73.95, "Hackensack River"),
    (40.30, 40.50, -74.50, -74.25, "Millstone River"),
]


def is_flood_zone(lat: float, lng: float) -> bool:
    for lat_min, lat_max, lng_min, lng_max, _ in NJ_FLOOD_ZONES:
        if lat_min <= lat <= lat_max and lng_min <= lng <= lng_max:
            return True
    return False


def _risk_level(score: float) -> str:
    if score <= 20:
        return "low"
    elif score <= 40:
        return "moderate"
    elif score <= 60:
        return "high"
    return "severe"


def _recommendation(score: float, in_zone: bool) -> str:
    level = _risk_level(score)
    zone_note = " This area is a known NJ FEMA flood zone." if in_zone else ""
    if level == "low":
        return f"Score {score}/80 — Minimal flood risk.{zone_note} Safe to proceed with normal caution."
    elif level == "moderate":
        return f"Score {score}/80 — Some flood risk detected.{zone_note} Exercise caution and monitor conditions."
    elif level == "high":
        return f"Score {score}/80 — Elevated flood risk!{zone_note} Avoid low-lying roads and flood-prone areas."
    return f"Score {score}/80 — SEVERE flood risk!{zone_note} Do NOT proceed. Turn Around, Don't Drown."


def _generate_training_data(n: int = 3000):
    """Generate synthetic NJ flood training samples."""
    rng = np.random.default_rng(42)

    gauge_ratio    = rng.uniform(0.0, 1.6, n)       # height / flood_stage
    gauge_rate     = rng.uniform(-0.2, 2.0, n)       # ft/hr
    precip_1hr     = rng.uniform(0, 100, n)          # %
    precip_6hr     = rng.uniform(0, 100, n)          # %
    in_zone        = rng.integers(0, 2, n).astype(float)
    high_risk_month= rng.integers(0, 2, n).astype(float)

    # Build scores using domain rules (ground-truth labels)
    scores = np.zeros(n)

    # Factor 1: gauge height ratio → 0–30 pts
    scores += np.where(gauge_ratio >= 1.0, 30,
              np.where(gauge_ratio >= 0.9, 24,
              np.where(gauge_ratio >= 0.7, 16,
              np.where(gauge_ratio >= 0.5,  6, 0))))

    # Factor 2: rising rate → 0–20 pts
    rate = np.maximum(gauge_rate, 0)
    scores += np.where(rate > 1.0, 20,
              np.where(rate > 0.5, 15,
              np.where(rate > 0.2,  9,
              np.where(rate > 0.0,  3, 0))))

    # Factor 3+4: precipitation
    scores += np.minimum(precip_1hr * 0.15, 15)
    scores += np.minimum(precip_6hr * 0.10, 10)

    # Factor 5: flood zone
    scores += in_zone * 5

    # Seasonal multiplier
    scores *= np.where(high_risk_month, 1.15, 1.0)

    # Add realistic noise and clip
    scores += rng.normal(0, 1.5, n)
    scores = np.clip(scores, 0, 80)

    X = np.column_stack([gauge_ratio, gauge_rate, precip_1hr,
                         precip_6hr, in_zone, high_risk_month])
    return X, scores


def _train_model():
    """Train and save the GradientBoostingRegressor."""
    print("[FloodML] Training GradientBoostingRegressor...")
    X, y = _generate_training_data(3000)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        random_state=42,
    )
    model.fit(X_scaled, y)

    joblib.dump(model, _MODEL_PATH)
    joblib.dump(scaler, _SCALER_PATH)
    print("[FloodML] Model trained and saved.")
    return model, scaler


def _load_or_train():
    if os.path.exists(_MODEL_PATH) and os.path.exists(_SCALER_PATH):
        try:
            model = joblib.load(_MODEL_PATH)
            scaler = joblib.load(_SCALER_PATH)
            print("[FloodML] Model loaded from disk.")
            return model, scaler
        except Exception:
            pass
    return _train_model()


class FloodMLModel:
    def __init__(self):
        self._model, self._scaler = _load_or_train()

    def assess_location(
        self,
        lat: float,
        lng: float,
        stream_gauge_height: float = 5.0,
        gauge_change_rate: float = 0.0,
        precip_prob_1hr: float = 0.0,
        precip_prob_6hr: float = 0.0,
        month: int = 6,
        hour: int = 12,
        flood_stage_ft: float = 12.0,
    ) -> dict:
        in_zone = is_flood_zone(lat, lng)
        gauge_ratio = stream_gauge_height / max(flood_stage_ft, 1.0)
        high_risk = 1.0 if month in HIGH_RISK_MONTHS else 0.0

        features = np.array([[
            gauge_ratio,
            gauge_change_rate,
            precip_prob_1hr,
            precip_prob_6hr,
            float(in_zone),
            high_risk,
        ]])

        X_scaled = self._scaler.transform(features)
        score = float(np.clip(self._model.predict(X_scaled)[0], 0, 80))
        score = round(score, 1)

        return {
            "risk_score": score,
            "risk_level": _risk_level(score),
            "is_flood_zone": in_zone,
            "recommendation": _recommendation(score, in_zone),
        }


# Singleton
flood_model = FloodMLModel()
