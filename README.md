# waterWise — Flood-Safe Navigation for New Jersey

> Real-time flood risk scoring, flood-aware routing, community hazard reports, AI guidance, and emergency SafeZone finder — all powered by live USGS stream gauges, NWS precipitation forecasts, and Google Gemini.

---

## What It Does

waterWise is a full-stack flood safety platform built for New Jersey drivers. Standard navigation apps like Google Maps route you based on distance and traffic — they have no concept of flood risk. waterWise fixes that.

| Feature | Description |
|---------|-------------|
| **Flood Risk Scoring** | Click anywhere on the map to get an instant 0–80 risk score with level (Low / Moderate / High / Severe) and data confidence rating |
| **Flood-Aware Routing** | Enter origin + destination — every step of your route is risk-scored using live sensor data. High/Severe routes automatically suggest a safer alternative |
| **Turn-by-Turn Navigation** | Google Maps-style step-by-step directions with live position tracking and maneuver arrows |
| **SafeZone Finder** | Enter any address to find the nearest hospital and emergency shelter with driving directions |
| **AI Assistant** | Gemini-powered chatbot that answers flood questions, interprets your risk score, and gives real-time safety advice |
| **Community Safety Board** | Drivers post and browse live reports of flooded roads, closures, and weather warnings |
| **Bilingual** | Full English / Spanish support — toggle in the navbar |
| **Confidence Level** | Every risk score comes with a data confidence rating (High / Medium / Low) based on which live data sources were available |

---

## The Risk Scoring Algorithm

File: `backend/app/services/flood_ml.py`

waterWise uses a **transparent, rule-based scorer** — not a black-box ML model. Every point in the 0–80 score is traceable to a real-world flood indicator. This was a deliberate design choice: the previous version trained a GradientBoostingRegressor on synthetically generated data (the same formula used for scoring), which added noise but no real accuracy — just circular learning. The current system is fully explainable.

### Scoring Factors (total: 0–80 points)

**Factor 1 — Stream gauge height vs flood stage (0–30 pts)**

Scored as a percentage of that river's official USGS flood stage — not arbitrary thresholds. Each river has a different flood stage, so this is an apples-to-apples comparison.

| Gauge height vs flood stage | Points |
|-----------------------------|--------|
| < 50% of flood stage | 0 (normal) |
| 50–70% | 6 (elevated) |
| 70–90% | 16 (approaching) |
| 90–100% | 24 (near flood stage) |
| ≥ 100% | 30 (at or above — flooding now) |

**Factor 2 — Gauge rising rate (0–20 pts)**

A rapidly rising gauge is the #1 flash flood indicator (NWS standard). Falling water scores 0.

| Rise rate | Points |
|-----------|--------|
| ≤ 0 ft/hr | 0 (stable or falling) |
| 0–0.2 ft/hr | 3 (slow rise) |
| 0.2–0.5 ft/hr | 9 (moderate rise) |
| 0.5–1.0 ft/hr | 15 (rapid rise — alert) |
| > 1.0 ft/hr | 20 (dangerous — flash flood possible) |

**Factor 3 — Short-term rain probability (0–15 pts)**

NWS 1-hour precipitation probability, used directly. Short bursts cause the most flash flooding on NJ roads.

```
score = min(prob_1hr% × 0.15, 15)
Examples: 20% → 3 pts | 60% → 9 pts | 100% → 15 pts
```

**Factor 4 — Sustained rain probability (0–10 pts)**

NWS 6-hour max precipitation probability. Sustained rain saturates soil and overwhelms drainage.

```
score = min(prob_6hr% × 0.10, 10)
Examples: 50% → 5 pts | 100% → 10 pts
```

**Factor 5 — FEMA flood zone (0–5 pts)**

+5 pts flat if the location falls within one of 8 FEMA-designated NJ high-risk bounding boxes (Newark/Passaic, Raritan, Toms River, Bound Brook, Pompton Lakes, Atlantic City, Hackensack, Millstone).

**Seasonal multiplier (×1.0 or ×1.15)**

NJ flood peaks during spring snowmelt (Mar–May) and hurricane season (Aug–Nov). During these months the base score is multiplied by 1.15.

```
Final score = min(sum of factors × seasonal multiplier, 80)
```

### Risk Levels

| Score | Level | Meaning |
|-------|-------|---------|
| 0–20 | Low | Normal conditions — safe to proceed |
| 21–40 | Moderate | Elevated risk — monitor conditions |
| 41–60 | High | Avoid low-lying roads — seek alternate route |
| 61–80 | Severe | Do NOT proceed — Turn Around, Don't Drown |

### Worked Example

```
Location: Bound Brook, NJ (April — spring multiplier applies)
Gauge:     11 ft at a river with 10 ft flood stage → 110% → 30 pts
Rate:      0.7 ft/hr (rapid rise) → 15 pts
Rain 1hr:  70% probability → 10.5 pts
Rain 6hr:  80% probability → 8 pts
FEMA zone: Yes → 5 pts
Base:      68.5 pts × 1.15 = 78.8 → Score: 79 → SEVERE
```

---

## Data Confidence

Every risk assessment includes a **data confidence** rating based on which live sources responded:

| Condition | Confidence |
|-----------|-----------|
| Live USGS gauge data + live NWS forecast | High |
| Only one source available | Medium |
| Both sources unavailable (fallback defaults used) | Low |

USGS gauge fallback: `gauge_height = 5.0 ft, rate = 0.0 ft/hr`
NWS fallback: `precip_prob = 0%`

This is displayed prominently in the route panel and map info windows so users know how much to trust the score.

---

## Flood-Aware Routing

File: `backend/app/routers/navigation.py`

1. Google Directions API is called with `alternatives=true` to get multiple candidate routes
2. An avoid-highways variant is also fetched in parallel
3. Every step of the primary route is risk-scored using cached USGS + NWS data (parallel API calls, keyed by gauge site ID and NWS grid cell)
4. If `overall_risk ≥ 60` (High), all candidate routes are scored and the safest is returned as an alternative
5. The alternative must genuinely score lower — no fallback is shown if all routes cross the same flooded basin

`overall_risk = max risk score across all sampled waypoints` (worst single point, not average)

---

## SafeZone Finder

File: `backend/app/routers/navigation.py` → `POST /navigation/safezone`

Accepts either a free-text address or a `lat,lng` coordinate string. The backend:
1. Geocodes the input to coordinates (Google Geocoding API)
2. Searches Google Places Nearby for the nearest **hospital** and **emergency shelter** within 20 km
3. Fetches driving directions to each in parallel
4. Returns step-by-step turn-by-turn instructions for both

Triggered automatically from the route panel when risk is Severe, or manually via the SafeZone page with address autocomplete.

---

## AI Assistant

File: `backend/app/services/ai_service.py`

Powered by **Google Gemini** (`gemini-2.5-flash` with `thinking_budget=0` for fast responses). The system prompt positions Gemini as a flood safety expert with knowledge of NJ-specific geography. Each message includes live context:

```
[SYSTEM CONTEXT: Current ML flood risk at {location} — Score: {pct}%, Level: {level}]
```

Full conversation history is passed on every request for contextual continuity. Model fallback chain: `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-2.0-flash-lite`.

---

## Community Safety Board

- JWT-authenticated post creation (categories: Flood Report, Road Closure, Weather Warning)
- Real-time comment threads on each post
- Filterable by category
- Post and comment deletion for authors
- 7-day JWT tokens to minimize re-login friction

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend | FastAPI (Python) | Async, auto-docs at `/docs` |
| Frontend | React 18 + Vite | Hot module reload |
| Database | SQLite + aiosqlite | Zero-config, async |
| ORM | SQLAlchemy (async) | Type-safe models |
| Auth | JWT (python-jose + bcrypt) | 7-day tokens |
| Maps | Google Maps JS API | Directions, Geocoding, Places, Autocomplete |
| AI | Google Gemini 2.5 Flash | Flood safety expert persona |
| Styling | Tailwind CSS | Utility-first |
| External Data | USGS Water Services API | Free, no key — real-time stream gauges |
| External Data | NWS Weather API | Free, no key — precipitation forecasts |
| i18n | Custom LanguageContext | English + Spanish |

---

## API Keys Required

| Key | Where to Get | Used For |
|-----|-------------|----------|
| `GOOGLE_MAPS_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com) | Maps, Directions, Geocoding, Places, Autocomplete |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/app/apikey) | AI Assistant |

**Enable these Google APIs in your Cloud Console project:**
- Maps JavaScript API
- Directions API
- Geocoding API
- Places API (New)

---

## Setup & Run

### Backend (Python / FastAPI)

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env — fill in GOOGLE_MAPS_API_KEY and GEMINI_API_KEY

# Run the server (use venv's uvicorn, not system)
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Or use the included script: `bash start_backend.sh`

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend (React / Vite)

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env — fill in VITE_GOOGLE_MAPS_API_KEY

# Run dev server
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
waterWise/
├── backend/
│   ├── main.py                          # FastAPI app entry point
│   ├── app/
│   │   ├── config.py                    # Pydantic settings (reads .env)
│   │   ├── database.py                  # SQLAlchemy async engine + init
│   │   ├── models/                      # SQLAlchemy ORM models
│   │   ├── schemas/                     # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py                  # Register / Login / JWT
│   │   │   ├── flood.py                 # POST /flood/risk
│   │   │   ├── navigation.py            # POST /route, POST /safezone, GET /autocomplete
│   │   │   ├── chat.py                  # POST /chat/message
│   │   │   └── community.py             # CRUD posts + comments
│   │   └── services/
│   │       ├── flood_ml.py              # Transparent rule-based risk scorer (0–80)
│   │       ├── usgs_service.py          # USGS Water Services API (8 NJ gauges)
│   │       ├── nws_service.py           # NWS Weather API (precip forecasts)
│   │       └── ai_service.py            # Google Gemini integration
│   ├── .env.example                     # Template — copy to .env
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx                 # Landing page + hero + stats
    │   │   ├── MapPage.jsx              # Map + RoutePanel layout
    │   │   ├── ChatPage.jsx             # Full-page AI assistant
    │   │   ├── CommunityPage.jsx        # Safety board
    │   │   ├── SafeZonePage.jsx         # Emergency location finder
    │   │   ├── LoginPage.jsx
    │   │   └── RegisterPage.jsx
    │   ├── components/
    │   │   ├── Map/MapView.jsx          # Google Maps + risk markers + InfoWindow
    │   │   ├── Navigation/RoutePanel.jsx # Route input + risk score + directions
    │   │   ├── Community/PostCard.jsx   # Board post with comments
    │   │   ├── Community/CreatePost.jsx # New post form
    │   │   └── WaterWiseLogo.jsx        # Shared SVG logo
    │   ├── context/
    │   │   ├── AuthContext.jsx          # JWT auth state
    │   │   └── LanguageContext.jsx      # i18n (en/es)
    │   ├── i18n/
    │   │   ├── en.js                    # English strings
    │   │   └── es.js                    # Spanish strings
    │   └── services/api.js              # Axios client for all backend calls
    └── .env.example                     # Template — copy to .env
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  BROWSER (React + Vite)                   │
│                                                          │
│  Home   Map (Google Maps)   Community   SafeZone   AI    │
│         RoutePanel          PostCard    Location         │
│         MapView (InfoWindow) CreatePost  Autocomplete    │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS / Axios
                         ▼
┌──────────────────────────────────────────────────────────┐
│                FastAPI Backend (:8000)                    │
│                                                          │
│  POST /auth/register  POST /auth/login                   │
│  POST /flood/risk ──────────────── risk score + confidence│
│  POST /navigation/route ─────────── flood-aware routing  │
│  POST /navigation/safezone ──────── nearest hospital/shelter│
│  GET  /navigation/autocomplete ──── address suggestions  │
│  POST /chat/message ─────────────── Gemini AI response   │
│  CRUD /community/posts + comments                        │
└──────┬──────────┬──────────┬──────────┬──────────────────┘
       │          │          │          │
  SQLite DB   USGS API    NWS API   Gemini API
  (async      (free,      (free,    (2.5-flash)
  SQLAlch)    no key)     no key)
       │          │          │
       │   ┌──────┴──────────┘
       │   │  Rule-Based Risk Scorer
       │   │  5 factors × seasonal multiplier
       │   │  Score: 0–80, fully transparent
       │   └─────────────────────────────────
       │
  JWT Auth (7-day tokens)
  bcrypt password hashing
```

---

## Why Not a Black-Box ML Model?

The original design used a `GradientBoostingRegressor` trained on ~2,000 synthetic samples. After analysis, we removed it because:

1. **Circular training** — the synthetic data was generated by the same formula used for scoring. The model just learned to approximate its own training function with added noise.
2. **No real accuracy gain** — without labeled historical flood events, there's no ground truth for the model to learn from.
3. **Explainability** — at a hackathon (and in production for safety-critical apps), "the model said so" is not a good answer. Every point in our score is traceable to a real sensor reading.

The current transparent scorer produces the same results with better explainability, no scikit-learn dependency, and zero training time.

---

## Demo Script

> waterWise was built after personally getting stranded in floodwaters on a route Google Maps said was clear.
>
> **[Map page]** Type Newark → Toms River. waterWise calls 8 USGS stream gauges across NJ in real time, pulls NWS precipitation forecasts, and scores every step of your route. If risk is High or Severe, a safer alternative appears automatically in green.
>
> **[Click map]** Click anywhere — instant risk score with confidence level. Red means danger. Green means go.
>
> **[SafeZone]** Type your address — nearest hospital and emergency shelter appear with step-by-step driving directions.
>
> **[AI Assistant]** "I see water on Route 1 near Princeton" — Gemini responds with context-aware guidance tied to your current risk score.
>
> **[Community Board]** Drivers post live reports of flooded roads and closures to warn each other in real time.
>
> All on real NJ sensor data, right now. No fabricated numbers.

---

## Judge Q&A

**Why a rule-based scorer instead of ML?**
We originally used GradientBoostingRegressor but removed it — the training data was synthetically generated by the same formula, so the model was just approximating itself. Without labeled historical flood events as ground truth, ML adds noise not accuracy. Our transparent scorer is more reliable, faster, and fully explainable.

**How accurate is the risk score?**
Each factor is calibrated to real NWS/USGS standards. Factor 1 uses each river's official USGS flood stage (not arbitrary thresholds). Factor 2 mirrors NWS flash flood criteria. The seasonal multiplier matches NJ's documented flood seasons. In testing against known NJ flood events, the scorer correctly identified High/Severe conditions.

**Why not just use Google Maps flood data?**
Google Maps does not provide quantified flood risk scores, predictive 2–6 hour warnings, confidence ratings, or community-sourced hazard reports. We add all of that on top of their mapping layer.

**How does it scale beyond NJ?**
USGS covers all 50 states with thousands of gauges. NWS covers the entire US. Scaling = adding gauge site IDs, flood stage values, and FEMA zone polygons for additional states. The scoring algorithm is fully geographic.

**Is the data real-time?**
Yes. USGS gauge data is fetched live on every request (15-minute update cycle from USGS). NWS forecasts are fetched live. Route scoring caches gauge/NWS data per unique site ID within a single request to avoid redundant API calls.
