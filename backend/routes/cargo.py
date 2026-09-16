from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from database import get_db
from models.models import Cargo, Dependency, Mission

router = APIRouter(prefix="/cargo", tags=["cargo"])


@router.get("")
async def list_cargo(
    priority: Optional[str] = None,
    status: Optional[str] = None,
    destination: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Cargo)
    if priority:
        stmt = stmt.where(Cargo.priority == priority)
    if status:
        stmt = stmt.where(Cargo.status == status)
    if destination:
        stmt = stmt.where(Cargo.destination == destination)
    result = await db.execute(stmt)
    cargo_list = result.scalars().all()

    output = []
    for c in cargo_list:
        output.append({
            "id": c.id, "cargo_code": c.cargo_code, "description": c.description,
            "category": c.category, "origin": c.origin, "destination": c.destination,
            "current_location": c.current_location, "transport_mode": c.transport_mode,
            "weight": c.weight, "quantity": c.quantity, "priority": c.priority,
            "status": c.status, "planned_departure": c.planned_departure,
            "planned_arrival": c.planned_arrival, "actual_arrival": c.actual_arrival,
            "delay_days": c.delay_days, "linked_mission_id": c.linked_mission_id,
            "linked_inventory_id": c.linked_inventory_id, "linked_asset_id": c.linked_asset_id,
            "container_id": c.container_id
        })
    return output


@router.get("/{cargo_id}")
async def get_cargo(cargo_id: str, db: AsyncSession = Depends(get_db)):
    cargo = await db.get(Cargo, cargo_id)
    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo not found")

    # Dependencies
    deps_result = await db.execute(
        select(Dependency).where(
            (Dependency.source_type == "cargo") & (Dependency.source_id == cargo_id)
        )
    )
    deps = deps_result.scalars().all()

    mission = None
    if cargo.linked_mission_id:
        mission = await db.get(Mission, cargo.linked_mission_id)

    # Build timeline
    timeline = _build_timeline(cargo)

    return {
        "id": cargo.id, "cargo_code": cargo.cargo_code, "description": cargo.description,
        "category": cargo.category, "origin": cargo.origin, "destination": cargo.destination,
        "current_location": cargo.current_location, "transport_mode": cargo.transport_mode,
        "weight": cargo.weight, "quantity": cargo.quantity, "priority": cargo.priority,
        "status": cargo.status, "planned_departure": cargo.planned_departure,
        "planned_arrival": cargo.planned_arrival, "actual_arrival": cargo.actual_arrival,
        "delay_days": cargo.delay_days, "linked_mission_id": cargo.linked_mission_id,
        "linked_inventory_id": cargo.linked_inventory_id, "linked_asset_id": cargo.linked_asset_id,
        "container_id": cargo.container_id,
        "timeline": timeline,
        "dependencies": [
            {"target_type": d.target_type, "target_id": d.target_id,
             "relationship_type": d.relationship_type, "criticality": d.criticality}
            for d in deps
        ],
        "linked_mission": {
            "mission_code": mission.mission_code,
            "mission_name": mission.mission_name,
            "status": mission.status,
            "priority": mission.priority
        } if mission else None
    }


def _build_timeline(cargo: Cargo) -> list:
    stages = [
        {"stage": "Planned", "date": cargo.planned_departure, "completed": True},
        {"stage": "Packed", "date": cargo.planned_departure, "completed": cargo.status not in ("Planned",)},
        {"stage": "Dispatched", "date": cargo.planned_departure, "completed": cargo.status in ("In Transit", "At Station", "Delayed", "Delivered")},
        {"stage": "In Transit", "date": None, "completed": cargo.status in ("At Station", "Delivered")},
        {"stage": "Delivered", "date": cargo.actual_arrival, "completed": cargo.status == "Delivered"},
    ]
    if cargo.status == "Delayed":
        stages.append({"stage": "Delayed", "date": None, "completed": True, "alert": True})
    return stages


@router.patch("/{cargo_id}")
async def update_cargo(cargo_id: str, updates: dict, db: AsyncSession = Depends(get_db)):
    cargo = await db.get(Cargo, cargo_id)
    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo not found")

    allowed = {"status", "delay_days", "current_location", "actual_arrival"}
    for key, val in updates.items():
        if key in allowed:
            setattr(cargo, key, val)

    await db.commit()
    return {"success": True, "cargo_id": cargo_id}
