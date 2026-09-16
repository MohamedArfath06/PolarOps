"""
POLAROPS — Backend API
Integrated Polar Expedition Logistics & Disruption Recovery Platform

SIH26062 | Ministry of Earth Sciences | NCPOR
⚠ SYNTHETIC / SIMULATED PROTOTYPE DATA — Not actual NCPOR data.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="POLAROPS",
    description=(
        "Integrated Polar Expedition Logistics & Disruption Recovery Platform. "
        "SIH26062 | NCPOR | Ministry of Earth Sciences. "
        "⚠ SYNTHETIC / SIMULATED PROTOTYPE DATA."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Startup ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    from database import init_db
    await init_db()
    print("[OK] POLAROPS backend started.")
    print("   API docs: http://localhost:8000/api/docs")


# ─── Routes ──────────────────────────────────────────────────────────────────
from routes.dashboard import router as dashboard_router
from routes.stations import router as stations_router
from routes.personnel import router as personnel_router
from routes.assets import router as assets_router
from routes.inventory import router as inventory_router
from routes.cargo import router as cargo_router
from routes.missions import router as missions_router
from routes.impact import router as impact_router
from routes.recovery import router as recovery_router
from routes.misc import router as simulation_router, router_alerts, router_audit, router_demo

app.include_router(dashboard_router)
app.include_router(stations_router)
app.include_router(personnel_router)
app.include_router(assets_router)
app.include_router(inventory_router)
app.include_router(cargo_router)
app.include_router(missions_router)
app.include_router(impact_router)
app.include_router(recovery_router)
app.include_router(simulation_router)
app.include_router(router_alerts)
app.include_router(router_audit)
app.include_router(router_demo)


# ─── Root ─────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "system": "POLAROPS",
        "version": "1.0.0",
        "status": "operational",
        "note": "SYNTHETIC / SIMULATED PROTOTYPE DATA — SIH26062",
        "docs": "/api/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "database": "connected"}


@app.post("/reset-demo")
async def reset_demo_alias():
    from database import AsyncSessionLocal
    from routes.misc import reset_demo
    async with AsyncSessionLocal() as db:
        return await reset_demo(db)
