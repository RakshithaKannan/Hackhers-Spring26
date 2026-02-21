from pydantic import BaseModel
from typing import Optional


class RouteRequest(BaseModel):
    origin: str
    destination: str
    avoid_flood: bool = True


class FloodWarning(BaseModel):
    location: str
    risk_score: float
    message: str


class RouteResponse(BaseModel):
    origin: str
    destination: str
    distance: str
    duration: str
    polyline: str
    flood_warnings: list[FloodWarning]
    overall_risk: float
    safe_alternative: Optional[str] = None
