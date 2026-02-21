"""
Core ML algorithm: Gradient Boosting flood risk predictor.
Predicts flood risk score (0-80%) from environmental features.

Features:
  [0] stream_gauge_height_ft   - current gauge reading from USGS
  [1] gauge_change_rate         - ft/hr change (positive = rising)
  [2] precip_1hr_in             - NWS forecast: next 1 hour precipitation
  [3] precip_6hr_in             - NWS forecast: next 6 hour precipitation
  [4] precip_24hr_in            - NWS forecast: next 24 hour precipitation
  [5] is_flood_zone             - 0/1 known NJ flood-prone area
  [6] month                     - 1-12 (captures seasonal patterns)
  [7] hour                      - 0-23 (nighttime floods are harder to detect)
"""

import numpy as np
import joblib
import os
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import MinMaxScaler

MODEL_PATH = "flood_model.joblib"
SCALER_PATH = "flood_scaler.joblib"

# Known flood-prone bounding boxes in New Jersey
# (lat_min, lat_max, lng_min, lng_max, zone_name)
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


def _generate_training_data(n_samples: int = 2000):
    """Generate realistic synthetic training data for initial model fitting."""
    rng = np.random.default_rng(42)

    gauge_heights = rng.uniform(1.5, 18.0, n_samples)
    gauge_changes = rng.uniform(-1.0, 3.5, n_samples)
    precip_1hr = rng.exponential(0.15, n_samples)
    precip_6hr = rng.exponential(0.6, n_samples)
    precip_24hr = rng.exponential(1.5, n_samples)
    flood_zones = rng.integers(0, 2, n_samples)
    months = rng.integers(1, 13, n_samples)
    hours = rng.integers(0, 24, n_samples)

    X = np.column_stack([
        gauge_heights, gauge_changes, precip_1hr,
        precip_6hr, precip_24hr, flood_zones, months, hours
    ])

    # Deterministic risk formula (domain-informed)
    risk = np.zeros(n_samples)
    risk += np.clip(gauge_heights * 2.5, 0, 25)          # gauge height → up to 25 pts
    risk += np.clip(gauge_changes * 8.0, 0, 20)           # rising gauge → up to 20 pts
    risk += np.clip(precip_1hr * 10.0, 0, 12)             # heavy short burst → 12 pts
    risk += np.clip(precip_6hr * 2.5, 0, 10)              # sustained rain → 10 pts
    risk += np.clip(precip_24hr * 0.8, 0, 8)              # slow soak → 8 pts
    risk += flood_zones * 5.0                              # known zone bonus

    # Seasonal multiplier: spring thaw + hurricane season
    seasonal = np.where(np.isin(months, [3, 4, 5, 9, 10, 11]), 1.15, 1.0)
    risk *= seasonal
    risk = np.clip(risk, 0, 80)

    # Add realistic noise
    risk += rng.normal(0, 1.5, n_samples)
    risk = np.clip(risk, 0, 80)

    return X, risk


def _risk_level(score: float) -> str:
    if score < 15:
        return "low"
    elif score < 35:
        return "moderate"
    elif score < 55:
        return "high"
    else:
        return "critical"


def _recommendation(score: float, is_zone: bool) -> str:
    level = _risk_level(score)
    if level == "low":
        return "Conditions are normal. Proceed with standard caution."
    elif level == "moderate":
        return "Elevated flood risk detected. Monitor conditions and be ready to reroute."
    elif level == "high":
        return "High flood risk! Avoid low-lying roads and flood-prone areas. Seek alternate routes."
    else:
        zone_note = " This area is a known NJ flood zone." if is_zone else ""
        return f"CRITICAL flood risk!{zone_note} Do NOT proceed through this area. Turn around, don't drown."


class FloodMLModel:
    def __init__(self):
        self.model: GradientBoostingRegressor | None = None
        self.scaler: MinMaxScaler | None = None
        self._load_or_train()

    def _load_or_train(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            self.model = joblib.load(MODEL_PATH)
            self.scaler = joblib.load(SCALER_PATH)
        else:
            self._train()

    def _train(self):
        X, y = _generate_training_data(2000)
        self.scaler = MinMaxScaler()
        X_scaled = self.scaler.fit_transform(X)

        self.model = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.08,
            max_depth=4,
            min_samples_split=10,
            random_state=42,
        )
        self.model.fit(X_scaled, y)

        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.scaler, SCALER_PATH)

    def predict(
        self,
        stream_gauge_height: float,
        gauge_change_rate: float,
        precip_1hr: float,
        precip_6hr: float,
        precip_24hr: float,
        flood_zone: bool,
        month: int,
        hour: int,
    ) -> float:
        features = np.array([[
            stream_gauge_height,
            gauge_change_rate,
            precip_1hr,
            precip_6hr,
            precip_24hr,
            int(flood_zone),
            month,
            hour,
        ]])
        features_scaled = self.scaler.transform(features)
        score = float(self.model.predict(features_scaled)[0])
        return round(float(np.clip(score, 0, 80)), 1)

    def assess_location(
        self,
        lat: float,
        lng: float,
        stream_gauge_height: float = 5.0,
        gauge_change_rate: float = 0.0,
        precip_1hr: float = 0.0,
        precip_6hr: float = 0.0,
        precip_24hr: float = 0.0,
        month: int = 6,
        hour: int = 12,
    ) -> dict:
        in_zone = is_flood_zone(lat, lng)
        score = self.predict(
            stream_gauge_height, gauge_change_rate,
            precip_1hr, precip_6hr, precip_24hr,
            in_zone, month, hour,
        )
        return {
            "risk_score": score,
            "risk_level": _risk_level(score),
            "is_flood_zone": in_zone,
            "recommendation": _recommendation(score, in_zone),
        }


# Singleton — loaded once at startup
flood_model = FloodMLModel()
