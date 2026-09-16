from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from database import get_db
from models.models import Mission, Dependency, Personnel, Asset, Inventory, Cargo

router = APIRouter(prefix="/missions", tags=["missions"])


async def _compute_mission_risk_chain(
    db: AsyncSession,
    mission: Mission,
    assigned_assets: list,
    assigned_personnel: list,
    linked_cargo: list
) -> Dict[str, Any]:
    """
    Dynamically traverses upstream dependencies to determine
    why a mission is at risk. Grounded in real DB records.
    """
    risk_steps = []
    reasons = []

    # 1. Trace Assets -> Inventory -> Cargo
    for asset in assigned_assets:
        # Check if asset itself is failed or maintenance
        if asset.status in ("Failed", "Maintenance") or asset.condition_score < 60:
            reasons.append(f"Asset {asset.asset_code} is {asset.status} (Condition: {asset.condition_score:.0f}%)")

        # Find inventory dependencies for this asset
        inv_deps_result = await db.execute(
            select(Dependency).where(
                Dependency.target_type == "asset",
                Dependency.target_id == asset.id,
                Dependency.source_type == "inventory"
            )
        )
        inv_deps = inv_deps_result.scalars().all()

        for inv_dep in inv_deps:
            inv = await db.get(Inventory, inv_dep.source_id)
            if inv and (inv.quantity <= inv.critical_level or inv.quantity == 0):
                # Trace cargo that delivers this inventory
                cargo_deps_result = await db.execute(
                    select(Dependency).where(
                        Dependency.target_type == "inventory",
                        Dependency.target_id == inv.id,
                        Dependency.source_type == "cargo"
                    )
                )
                cargo_deps = cargo_deps_result.scalars().all()

                for c_dep in cargo_deps:
                    cargo = await db.get(Cargo, c_dep.source_id)
                    if cargo and (cargo.status == "Delayed" or cargo.delay_days > 0):
                        risk_steps.append({
                            "type": "cargo",
                            "id": cargo.cargo_code,
                            "label": f"{cargo.cargo_code} delayed by {cargo.delay_days} days",
                            "severity": "Critical" if cargo.priority == "Critical" else "High"
                        })
                        risk_steps.append({
                            "type": "inventory",
                            "id": inv.item_code,
                            "label": f"{inv.item_code} ({inv.item_name}) out of stock",
                            "severity": "Critical"
                        })
                        risk_steps.append({
                            "type": "asset",
                            "id": asset.asset_code,
                            "label": f"{asset.asset_code} ({asset.name}) maintenance blocked",
                            "severity": "Critical"
                        })
                        risk_steps.append({
                            "type": "mission",
                            "id": mission.mission_code,
                            "label": f"Mission {mission.mission_code} at risk",
                            "severity": "Critical"
                        })
                        if mission.team:
                            risk_steps.append({
                                "type": "team",
                                "id": f"Team-{mission.team}",
                                "label": f"Team {mission.team} operational readiness compromised",
                                "severity": "High"
                            })
                        reasons.append(
                            f"Cargo {cargo.cargo_code} delay (+{cargo.delay_days}d) deprives critical inventory {inv.item_code}, blocking {asset.asset_code} maintenance."
                        )

    # 2. Trace directly linked cargo
    for c in linked_cargo:
        if c.status == "Delayed" or c.delay_days > 0:
            if not any(s["id"] == c.cargo_code for s in risk_steps):
                risk_steps.append({
                    "type": "cargo",
                    "id": c.cargo_code,
                    "label": f"Required cargo {c.cargo_code} delayed by {c.delay_days} days",
                    "severity": "High"
                })
                reasons.append(f"Linked consignment {c.cargo_code} is delayed by {c.delay_days} days.")

    # 3. Trace personnel availability
    for p in assigned_personnel:
        if p.status in ("Medical", "Unavailable"):
            risk_steps.append({
                "type": "personnel",
                "id": p.id,
                "label": f"{p.name} unavailable ({p.status})",
                "severity": "High"
            })
            reasons.append(f"Assigned personnel {p.name} is currently {p.status}.")

    has_risk = len(risk_steps) > 0 or mission.status == "At Risk"

    return {
        "has_risk": has_risk,
        "risk_steps": risk_steps,
        "risk_summary": " · ".join(reasons) if reasons else ("Mission operational parameters are nominal." if mission.status != "At Risk" else "Mission is marked At Risk pending dependency verification."),
        "direct_cause": reasons[0] if reasons else None
    }


@router.get("")
async def list_missions(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    station_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Mission)
    if status:
        stmt = stmt.where(Mission.status == status)
    if priority:
        stmt = stmt.where(Mission.priority == priority)
    if station_id:
        stmt = stmt.where(Mission.station_id == station_id)
    result = await db.execute(stmt)
    missions = result.scalars().all()

    return [
        {
            "id": m.id, "mission_code": m.mission_code, "mission_name": m.mission_name,
            "station_id": m.station_id, "priority": m.priority, "status": m.status,
            "start_date": m.start_date, "end_date": m.end_date, "team": m.team,
            "required_personnel": m.required_personnel, "description": m.description,
            "objective": m.objective
        }
        for m in missions
    ]


@router.get("/{mission_id}")
async def get_mission(mission_id: str, db: AsyncSession = Depends(get_db)):
    mission = await db.get(Mission, mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    # Get all dependencies for this mission
    deps_result = await db.execute(
        select(Dependency).where(
            (Dependency.target_type == "mission") & (Dependency.target_id == mission_id) |
            (Dependency.source_type == "mission") & (Dependency.source_id == mission_id)
        )
    )
    deps = deps_result.scalars().all()

    # Resolve dependency names
    resolved_deps = []
    for dep in deps:
        resolved_deps.append({
            "source_type": dep.source_type, "source_id": dep.source_id,
            "target_type": dep.target_type, "target_id": dep.target_id,
            "relationship_type": dep.relationship_type, "criticality": dep.criticality
        })

    # Find personnel assigned to this mission
    pers_result = await db.execute(
        select(Personnel).where(Personnel.assigned_mission_id == mission_id)
    )
    assigned_personnel = pers_result.scalars().all()

    # Find assets assigned to this mission
    asset_result = await db.execute(
        select(Asset).where(Asset.assigned_mission_id == mission_id)
    )
    assigned_assets = asset_result.scalars().all()

    # Find cargo linked to this mission
    cargo_result = await db.execute(
        select(Cargo).where(Cargo.linked_mission_id == mission_id)
    )
    linked_cargo = cargo_result.scalars().all()

    # Dynamically compute why mission is at risk
    risk_analysis = await _compute_mission_risk_chain(
        db, mission, assigned_assets, assigned_personnel, linked_cargo
    )

    return {
        "id": mission.id, "mission_code": mission.mission_code,
        "mission_name": mission.mission_name, "station_id": mission.station_id,
        "priority": mission.priority, "status": mission.status,
        "start_date": mission.start_date, "end_date": mission.end_date,
        "team": mission.team, "required_personnel": mission.required_personnel,
        "description": mission.description, "objective": mission.objective,
        "dependencies": resolved_deps,
        "assigned_personnel": [
            {"id": p.id, "name": p.name, "role": p.role,
             "team": p.team, "status": p.status}
            for p in assigned_personnel
        ],
        "assigned_assets": [
            {"id": a.id, "asset_code": a.asset_code, "name": a.name,
             "type": a.type, "status": a.status, "condition_score": a.condition_score}
            for a in assigned_assets
        ],
        "linked_cargo": [
            {"id": c.id, "cargo_code": c.cargo_code, "description": c.description,
             "status": c.status, "priority": c.priority, "delay_days": c.delay_days}
            for c in linked_cargo
        ],
        "risk_analysis": risk_analysis
    }


@router.patch("/{mission_id}")
async def update_mission(mission_id: str, updates: dict, db: AsyncSession = Depends(get_db)):
    mission = await db.get(Mission, mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    allowed = {"status", "start_date", "end_date", "description", "priority"}
    for key, val in updates.items():
        if key in allowed:
            setattr(mission, key, val)

    await db.commit()
    await db.refresh(mission)
    return {"success": True, "mission_id": mission_id, "status": mission.status}
