from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.routers import auth, flood, navigation, chat, community


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB and pre-load ML model on startup
    await init_db()
    from app.services.flood_ml import flood_model  # triggers model load/train
    print("✅ waterWise backend ready")
    yield


app = FastAPI(
    title="waterWise API",
    description="Flood-aware navigation and safety for New Jersey",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(flood.router)
app.include_router(navigation.router)
app.include_router(chat.router)
app.include_router(community.router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": "waterWise"}
