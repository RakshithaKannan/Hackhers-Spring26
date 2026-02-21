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


class NavStep(BaseModel):
    instruction: str
    distance: str
    duration: str
    maneuver: Optional[str] = None
    start_lat: float
    start_lng: float


class RouteRiskPoint(BaseModel):
    lat: float
    lng: float
    risk_score: float
    risk_level: str
    label: str   # e.g. "Step 3: Turn left onto Main St"


class AlternativeRoute(BaseModel):
    distance: str
    duration: str
    polyline: str
    overall_risk: float
    risk_level: str
    steps: list[NavStep] = []
    route_risk_points: list[RouteRiskPoint] = []


class RouteResponse(BaseModel):
    origin: str
    destination: str
    distance: str
    duration: str
    polyline: str
    flood_warnings: list[FloodWarning]
    overall_risk: float
    alternative_route: Optional[AlternativeRoute] = None
    steps: list[NavStep] = []
    route_risk_points: list[RouteRiskPoint] = []
