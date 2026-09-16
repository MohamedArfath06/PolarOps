from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from database import get_db
from models.models import Personnel, Mission
from schemas.schemas import PersonnelOut

router = APIRouter(prefix="/personnel", tags=["personnel"])


@router.get("", response_model=List[PersonnelOut])
async def list_personnel(
    team: Optional[str] = None,
    status: Optional[str] = None,
    station_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Personnel)
    if team:
        stmt = stmt.where(Personnel.team == team)
    if status:
        stmt = stmt.where(Personnel.status == status)
    if station_id:
        stmt = stmt.where(Personnel.station_id == station_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/teams")
async def get_team_summary(db: AsyncSession = Depends(get_db)):
    """Return readiness summary per team."""
    result = await db.execute(select(Personnel))
    personnel = result.scalars().all()

    teams = {}
    for p in personnel:
        team = p.team or "Unassigned"
        if team not in teams:
            teams[team] = {"total": 0, "available": 0, "assigned": 0,
                           "in_transit": 0, "medical": 0, "unavailable": 0}
        teams[team]["total"] += 1
        status_key = p.status.lower().replace(" ", "_")
        if status_key in teams[team]:
            teams[team][status_key] += 1

    team_list = []
    for name, data in teams.items():
        ready = data["available"] + data["assigned"]
        readiness = round((ready / data["total"]) * 100, 1) if data["total"] > 0 else 0
        team_list.append({"team": name, **data, "readiness": readiness})

    return team_list


@router.get("/{personnel_id}", response_model=PersonnelOut)
async def get_personnel(personnel_id: str, db: AsyncSession = Depends(get_db)):
    p = await db.get(Personnel, personnel_id)
    if not p:
        raise HTTPException(status_code=404, detail="Personnel not found")
    return p


@router.patch("/{personnel_id}")
async def update_personnel(
    personnel_id: str, updates: dict, db: AsyncSession = Depends(get_db)
):
    p = await db.get(Personnel, personnel_id)
    if not p:
        raise HTTPException(status_code=404, detail="Personnel not found")
    allowed = {"status", "current_location", "assigned_mission_id", "station_id"}
    for key, val in updates.items():
        if key in allowed:
            setattr(p, key, val)
    await db.commit()
    await db.refresh(p)
    return p
