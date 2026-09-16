"""
Simulation Engine — POLARIS X

Creates a temporary (non-persistent) scenario state to compute
before/after comparison without modifying live operational data.

IMPORTANT: Simulated states NEVER overwrite the live database.
Only when a recovery plan is approved does the live state change.
"""

import copy
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.models import Cargo, Asset, Inventory, Mission, Personnel, Dependency


async def _snapshot_entity(db: AsyncSession, entity_type: str, entity_id: str) -> Dict:
    """Get a dict snapshot of any entity, supporting lookup by primary key or business code."""
    e = None
    if entity_type == "cargo":
        e = await db.get(Cargo, entity_id)
        if not e:
            res = await db.execute(select(Cargo).where(Cargo.cargo_code == entity_id))
            e = res.scalars().first()
    elif entity_type == "asset":
        e = await db.get(Asset, entity_id)
        if not e:
            res = await db.execute(select(Asset).where(Asset.asset_code == entity_id))
            e = res.scalars().first()
    elif entity_type == "inventory":
        e = await db.get(Inventory, entity_id)
        if not e:
            res = await db.execute(select(Inventory).where(Inventory.item_code == entity_id))
            e = res.scalars().first()
    elif entity_type == "mission":
        e = await db.get(Mission, entity_id)
        if not e:
            res = await db.execute(select(Mission).where(Mission.mission_code == entity_id))
            e = res.scalars().first()
    elif entity_type == "personnel":
        e = await db.get(Personnel, entity_id)
        if not e:
            res = await db.execute(select(Personnel).where(Personnel.name.ilike(f"%{entity_id}%")))
            e = res.scalars().first()
    else:
        return {}

    if not e:
        return {}

    return {c.name: getattr(e, c.name) for c in e.__table__.columns}


async def compute_mission_continuity(db: AsyncSession) -> float:
    """
    Compute an aggregate mission continuity score (0-100) based on:
    - Mission statuses
    - Asset readiness
    - Inventory state
    - Personnel availability
    """
    mission_result = await db.execute(select(Mission))
    missions = mission_result.scalars().all()

    asset_result = await db.execute(select(Asset))
    assets = asset_result.scalars().all()

    inv_result = await db.execute(select(Inventory))
    inventories = inv_result.scalars().all()

    pers_result = await db.execute(select(Personnel))
    personnel = pers_result.scalars().all()

    # Mission health (40%)
    if missions:
        healthy = sum(1 for m in missions if m.status in ("Planned", "Active", "Completed"))
        mission_score = (healthy / len(missions)) * 100
    else:
        mission_score = 100.0

    # Asset health (25%)
    if assets:
        op_assets = sum(1 for a in assets if a.status == "Operational")
        asset_score = (op_assets / len(assets)) * 100
    else:
        asset_score = 100.0

    # Inventory health (20%)
    if inventories:
        ok_inv = sum(1 for i in inventories if i.quantity >= i.minimum_stock)
        inv_score = (ok_inv / len(inventories)) * 100
    else:
        inv_score = 100.0

    # Personnel health (15%)
    if personnel:
        avail = sum(1 for p in personnel if p.status in ("Available", "Assigned"))
        pers_score = (avail / len(personnel)) * 100
    else:
        pers_score = 100.0

    return round(
        0.40 * mission_score +
        0.25 * asset_score +
        0.20 * inv_score +
        0.15 * pers_score,
        1
    )


def _apply_cargo_delay(entity_snapshot: dict, delay_days: int) -> dict:
    """Apply delay scenario to a cargo snapshot (non-destructive)."""
    sim = copy.deepcopy(entity_snapshot)
    sim["status"] = "Delayed"
    sim["delay_days"] = delay_days
    sim["_simulated"] = True
    return sim


def _apply_vehicle_failure(entity_snapshot: dict) -> dict:
    """Apply vehicle failure scenario."""
    sim = copy.deepcopy(entity_snapshot)
    sim["status"] = "Failed"
    sim["condition_score"] = 0.0
    sim["_simulated"] = True
    return sim


def _apply_inventory_shortage(entity_snapshot: dict, reduction_pct: float = 0.5) -> dict:
    """Apply inventory shortage scenario (reduce by given percentage)."""
    sim = copy.deepcopy(entity_snapshot)
    sim["quantity"] = max(0.0, sim.get("quantity", 0) * (1 - reduction_pct))
    sim["_simulated"] = True
    return sim


async def simulate_scenario(
    db: AsyncSession,
    scenario_type: str,
    entity_id: str,
    parameters: dict
) -> Dict[str, Any]:
    """
    Run a simulation scenario and return before/after state.
    NEVER modifies the live database.
    """
    entity_type_map = {
        "cargo_delay": "cargo",
        "vehicle_failure": "asset",
        "inventory_shortage": "inventory",
        "personnel_unavailable": "personnel",
        "communication_loss": "asset"
    }

    entity_type = entity_type_map.get(scenario_type, "cargo")
    before_snapshot = await _snapshot_entity(db, entity_type, entity_id)
    before_continuity = await compute_mission_continuity(db)

    if not before_snapshot:
        return {
            "error": f"Entity {entity_id} not found",
            "scenario_type": scenario_type,
            "entity_id": entity_id
        }

    # Apply scenario
    if scenario_type == "cargo_delay":
        delay_days = parameters.get("delay_days", 5)
        after_snapshot = _apply_cargo_delay(before_snapshot, delay_days)
        after_continuity = max(0.0, before_continuity - (delay_days * 4.6))
    elif scenario_type == "vehicle_failure":
        after_snapshot = _apply_vehicle_failure(before_snapshot)
        after_continuity = max(0.0, before_continuity - 16.0)
    elif scenario_type == "inventory_shortage":
        reduction = parameters.get("reduction_pct", 0.8)
        after_snapshot = _apply_inventory_shortage(before_snapshot, reduction)
        after_continuity = max(0.0, before_continuity - 12.0)
    elif scenario_type == "personnel_unavailable":
        after_snapshot = copy.deepcopy(before_snapshot)
        after_snapshot["status"] = "Medical"
        after_snapshot["_simulated"] = True
        after_continuity = max(0.0, before_continuity - 7.0)
    elif scenario_type == "communication_loss":
        after_snapshot = copy.deepcopy(before_snapshot)
        after_snapshot["status"] = "Failed"
        after_snapshot["_simulated"] = True
        after_continuity = max(0.0, before_continuity - 9.0)
    else:
        after_snapshot = copy.deepcopy(before_snapshot)
        after_snapshot["_simulated"] = True
        after_continuity = before_continuity - 5.0

    # Determine impacted missions for display
    affected = await _find_affected_missions(db, entity_type, entity_id)

    return {
        "scenario_type": scenario_type,
        "entity_id": entity_id,
        "entity_type": entity_type,
        "before_state": {
            "snapshot": before_snapshot,
            "mission_continuity": before_continuity
        },
        "after_state": {
            "snapshot": after_snapshot,
            "mission_continuity": round(after_continuity, 1)
        },
        "mission_continuity_before": before_continuity,
        "mission_continuity_after": round(after_continuity, 1),
        "affected_entities": affected,
        "impact_chain": _build_simple_chain(entity_type, entity_id, affected),
        "note": "⚠ SIMULATION ONLY — Live operational data has not been modified."
    }


async def _find_affected_missions(db: AsyncSession, entity_type: str, entity_id: str) -> List[Dict]:
    """Find missions downstream from this entity via dependency graph."""
    visited = set()
    queue = [(entity_type, entity_id, 0)]
    results = []

    while queue:
        cur_type, cur_id, depth = queue.pop(0)
        if (cur_type, cur_id) in visited or depth > 5:
            continue
        visited.add((cur_type, cur_id))

        if depth > 0:
            results.append({"type": cur_type, "id": cur_id, "depth": depth})

        stmt = select(Dependency).where(
            Dependency.source_type == cur_type,
            Dependency.source_id == cur_id
        )
        deps = (await db.execute(stmt)).scalars().all()
        for dep in deps:
            queue.append((dep.target_type, dep.target_id, depth + 1))

    return results


def _build_simple_chain(entity_type: str, entity_id: str, affected: List[Dict]) -> List[Dict]:
    chain = [{"type": entity_type, "id": entity_id, "depth": 0}]
    for a in sorted(affected, key=lambda x: x["depth"]):
        chain.append(a)
    return chain
