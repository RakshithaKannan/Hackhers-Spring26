from pydantic import BaseModel
from typing import Optional


class FloodRiskRequest(BaseModel):
    lat: float
    lng: float


class FloodRiskResponse(BaseModel):
    lat: float
    lng: float
    risk_score: float          # 0-80
    risk_level: str            # low | moderate | high | critical
    stream_gauge_height: Optional[float] = None
    precip_forecast_1hr: Optional[float] = None
    precip_forecast_6hr: Optional[float] = None
    is_flood_zone: bool
    recommendation: str
    data_sources: list[str]
