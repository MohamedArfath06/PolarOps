from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from database import get_db
from models.models import Asset, Dependency, Mission
from schemas.schemas import AssetOut, AssetUpdate

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("", response_model=List[AssetOut])
async def list_assets(
    type: Optional[str] = None,
    status: Optional[str] = None,
    station_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Asset)
    if type:
        stmt = stmt.where(Asset.type == type)
    if status:
        stmt = stmt.where(Asset.status == status)
    if station_id:
        stmt = stmt.where(Asset.station_id == station_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{asset_id}")
async def get_asset(asset_id: str, db: AsyncSession = Depends(get_db)):
    asset = await db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Get dependencies
    deps_result = await db.execute(
        select(Dependency).where(
            (Dependency.source_type == "asset") & (Dependency.source_id == asset_id) |
            (Dependency.target_type == "asset") & (Dependency.target_id == asset_id)
        )
    )
    deps = deps_result.scalars().all()

    mission = None
    if asset.assigned_mission_id:
        mission = await db.get(Mission, asset.assigned_mission_id)

    return {
        "id": asset.id, "asset_code": asset.asset_code, "name": asset.name,
        "type": asset.type, "station_id": asset.station_id, "status": asset.status,
        "condition_score": asset.condition_score, "fuel_level": asset.fuel_level,
        "battery_level": asset.battery_level, "maintenance_due": asset.maintenance_due,
        "assigned_mission_id": asset.assigned_mission_id,
        "assigned_mission": {"mission_code": mission.mission_code, "mission_name": mission.mission_name} if mission else None,
        "dependencies": [
            {"source_type": d.source_type, "source_id": d.source_id,
             "target_type": d.target_type, "target_id": d.target_id,
             "relationship_type": d.relationship_type, "criticality": d.criticality}
            for d in deps
        ]
    }


@router.patch("/{asset_id}")
async def update_asset(asset_id: str, updates: AssetUpdate, db: AsyncSession = Depends(get_db)):
    asset = await db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    update_data = updates.model_dump(exclude_unset=True)

    # Validate
    if "condition_score" in update_data and not (0 <= update_data["condition_score"] <= 100):
        raise HTTPException(status_code=400, detail="condition_score must be 0-100")
    if "fuel_level" in update_data and not (0 <= update_data["fuel_level"] <= 100):
        raise HTTPException(status_code=400, detail="fuel_level must be 0-100")

    for key, val in update_data.items():
        setattr(asset, key, val)

    await db.commit()
    await db.refresh(asset)
    return asset
