from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models.models import (
    Station, Personnel, Asset, Inventory, Cargo, Mission, Alert
)
from services.simulation_engine import compute_mission_continuity

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """Return all key dashboard metrics."""

    # Counts
    total_personnel = (await db.execute(select(func.count(Personnel.id)))).scalar()
    total_cargo = (await db.execute(select(func.count(Cargo.id)))).scalar()
    critical_alerts = (await db.execute(
        select(func.count(Alert.id)).where(Alert.severity == "Critical", Alert.acknowledged == False)
    )).scalar()
    active_alerts = (await db.execute(
        select(func.count(Alert.id)).where(Alert.acknowledged == False)
    )).scalar()

    # Asset readiness
    total_assets = (await db.execute(select(func.count(Asset.id)))).scalar()
    op_assets = (await db.execute(
        select(func.count(Asset.id)).where(Asset.status == "Operational")
    )).scalar()
    failed_assets = (await db.execute(
        select(func.count(Asset.id)).where(Asset.status.in_(["Failed", "Maintenance"]))
    )).scalar()
    asset_readiness = round((op_assets / total_assets * 100) if total_assets else 100.0, 1)

    # Inventory low/critical
    inv_result = await db.execute(select(Inventory))
    inventories = inv_result.scalars().all()
    low_inventory = sum(1 for i in inventories if i.quantity <= i.minimum_stock)
    critical_inventory = sum(1 for i in inventories if i.quantity <= i.critical_level)

    # Personnel readiness
    avail_pers = (await db.execute(
        select(func.count(Personnel.id)).where(Personnel.status.in_(["Available", "Assigned"]))
    )).scalar()
    personnel_readiness = round((avail_pers / total_personnel * 100) if total_personnel else 100.0, 1)

    # Resource readiness (inventory health)
    ok_inv = sum(1 for i in inventories if i.quantity >= i.minimum_stock)
    resource_readiness = round((ok_inv / len(inventories) * 100) if inventories else 100.0, 1)

    # Mission continuity
    mission_continuity = await compute_mission_continuity(db)

    # Active missions
    active_missions = (await db.execute(
        select(Mission).where(Mission.status.in_(["Active", "At Risk"]))
    )).scalars().all()

    # Recent alerts
    alerts_result = await db.execute(
        select(Alert).where(Alert.acknowledged == False).order_by(Alert.created_at.desc()).limit(8)
    )
    alerts = alerts_result.scalars().all()

    # Stations
    stations_result = await db.execute(select(Station))
    stations = stations_result.scalars().all()

    return {
        "stats": {
            "active_expeditions": 1,
            "total_personnel": total_personnel,
            "total_cargo": total_cargo,
            "critical_assets": failed_assets,
            "low_inventory": low_inventory,
            "critical_inventory": critical_inventory,
            "active_alerts": active_alerts,
            "critical_alerts": critical_alerts,
            "mission_continuity": mission_continuity,
            "resource_readiness": resource_readiness,
            "asset_readiness": asset_readiness,
            "personnel_readiness": personnel_readiness,
        },
        "stations": [
            {
                "id": s.id, "code": s.code, "name": s.name,
                "latitude": s.latitude, "longitude": s.longitude,
                "status": s.status, "fuel_level": s.fuel_level,
                "personnel_count": s.personnel_count, "capacity": s.capacity
            }
            for s in stations
        ],
        "active_missions": [
            {
                "id": m.id, "mission_code": m.mission_code, "mission_name": m.mission_name,
                "station_id": m.station_id, "priority": m.priority, "status": m.status,
                "team": m.team, "start_date": m.start_date, "end_date": m.end_date
            }
            for m in active_missions
        ],
        "alerts": [
            {
                "id": a.id, "type": a.type, "severity": a.severity,
                "title": a.title, "message": a.message,
                "entity_type": a.entity_type, "entity_id": a.entity_id,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "acknowledged": a.acknowledged
            }
            for a in alerts
        ]
    }
