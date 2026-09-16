from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from database import get_db
from models.models import Station, Personnel, Asset, Inventory
from schemas.schemas import StationOut

router = APIRouter(prefix="/stations", tags=["stations"])


@router.get("", response_model=List[StationOut])
async def list_stations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Station))
    return result.scalars().all()


@router.get("/{station_id}")
async def get_station(station_id: str, db: AsyncSession = Depends(get_db)):
    station = await db.get(Station, station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    # Personnel at this station
    pers_result = await db.execute(
        select(Personnel).where(Personnel.station_id == station_id)
    )
    personnel = pers_result.scalars().all()

    # Assets at this station
    asset_result = await db.execute(
        select(Asset).where(Asset.station_id == station_id)
    )
    assets = asset_result.scalars().all()

    # Inventory at this station
    inv_result = await db.execute(
        select(Inventory).where(Inventory.station_id == station_id)
    )
    inventories = inv_result.scalars().all()

    return {
        "id": station.id, "code": station.code, "name": station.name,
        "location": station.location, "latitude": station.latitude, "longitude": station.longitude,
        "status": station.status, "capacity": station.capacity,
        "personnel_count": station.personnel_count, "fuel_level": station.fuel_level,
        "personnel": [
            {"id": p.id, "name": p.name, "role": p.role, "team": p.team,
             "status": p.status, "current_location": p.current_location}
            for p in personnel
        ],
        "assets": [
            {"id": a.id, "asset_code": a.asset_code, "name": a.name,
             "type": a.type, "status": a.status, "condition_score": a.condition_score}
            for a in assets
        ],
        "inventory_summary": [
            {"id": i.id, "item_name": i.item_name, "category": i.category,
             "quantity": i.quantity, "unit": i.unit,
             "state": "Critical" if i.quantity <= i.critical_level else
                      "Low" if i.quantity <= i.minimum_stock else "Normal"}
            for i in inventories
        ]
    }
