"""
Impact Engine — POLARIS X

Traverses the dependency graph to determine the downstream impact
of any disruption on missions, assets, inventory, and personnel.

Uses BFS from the disrupted entity across the `dependencies` table.
"""

import uuid
from datetime import datetime
from typing import List, Dict, Set, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from models.models import (
    Dependency, Cargo, Inventory, Asset, Mission,
    Personnel, Disruption, ImpactRecord, Alert, AuditLog
)


async def _get_entity_name(db: AsyncSession, entity_type: str, entity_id: str) -> str:
    """Resolve a human-readable name for any entity."""
    try:
        if entity_type == "cargo":
            r = await db.get(Cargo, entity_id)
            return r.cargo_code if r else entity_id
        elif entity_type == "inventory":
            r = await db.get(Inventory, entity_id)
            return r.item_name if r else entity_id
        elif entity_type == "asset":
            r = await db.get(Asset, entity_id)
            return r.asset_code if r else entity_id
        elif entity_type == "mission":
            r = await db.get(Mission, entity_id)
            return r.mission_code if r else entity_id
        elif entity_type == "personnel":
            r = await db.get(Personnel, entity_id)
            return r.name if r else entity_id
        return entity_id
    except Exception:
        return entity_id


async def traverse_dependencies(
    db: AsyncSession,
    start_type: str,
    start_id: str,
    max_depth: int = 6
) -> List[Dict]:
    """
    BFS traversal of the dependency graph starting from (start_type, start_id).
    Returns list of affected nodes with depth and relationship info.
    """
    visited: Set[Tuple[str, str]] = set()
    queue = [(start_type, start_id, 0, "root", None)]
    results = []

    while queue:
        current_type, current_id, depth, rel_type, parent = queue.pop(0)
        key = (current_type, current_id)
        if key in visited or depth > max_depth:
            continue
        visited.add(key)

        name = await _get_entity_name(db, current_type, current_id)

        if depth > 0:  # skip the root node itself
            results.append({
                "type": current_type,
                "id": current_id,
                "name": name,
                "depth": depth,
                "relationship": rel_type,
                "parent": parent,
                "impact_level": _depth_to_impact(depth)
            })

        # Find all dependencies where this entity is the SOURCE
        stmt = select(Dependency).where(
            Dependency.source_type == current_type,
            Dependency.source_id == current_id
        )
        deps_result = await db.execute(stmt)
        deps = deps_result.scalars().all()

        for dep in deps:
            dep_key = (dep.target_type, dep.target_id)
            if dep_key not in visited:
                queue.append((dep.target_type, dep.target_id, depth + 1, dep.relationship_type, current_id))

        # Also traverse REVERSE: entities that depend on this one
        stmt2 = select(Dependency).where(
            Dependency.target_type == current_type,
            Dependency.target_id == current_id
        )
        deps2_result = await db.execute(stmt2)
        deps2 = deps2_result.scalars().all()

        for dep in deps2:
            dep_key = (dep.source_type, dep.source_id)
            if dep_key not in visited:
                queue.append((dep.source_type, dep.source_id, depth + 1, dep.relationship_type, current_id))

    return results


def _depth_to_impact(depth: int) -> str:
    if depth == 1:
        return "Critical"
    elif depth == 2:
        return "High"
    elif depth == 3:
        return "Medium"
    else:
        return "Low"


def _calculate_severity(affected: List[Dict]) -> str:
    mission_hits = sum(1 for a in affected if a["type"] == "mission")
    critical_hits = sum(1 for a in affected if a["impact_level"] == "Critical")
    if mission_hits > 0 and critical_hits > 1:
        return "Critical"
    elif mission_hits > 0:
        return "High"
    elif critical_hits > 0:
        return "Medium"
    return "Low"


async def analyze_impact(
    db: AsyncSession,
    entity_type: str,
    entity_id: str,
    disruption_type: str,
    delay_days: int = 0,
    parameters: dict = None,
    is_simulation: bool = False
) -> dict:
    """
    Main entry point for impact analysis.
    Creates a disruption record, traverses dependencies,
    creates impact records, generates alerts.
    Returns structured analysis result.
    """
    if parameters is None:
        parameters = {}

    import json

    # Create disruption record
    disruption_id = str(uuid.uuid4())
    disruption_code = f"DIS-{disruption_id[:6].upper()}"

    affected = await traverse_dependencies(db, entity_type, entity_id)
    severity = _calculate_severity(affected)

    # Auto-upgrade severity for cargo delays with missions affected
    mission_affected = any(a["type"] == "mission" for a in affected)
    if disruption_type == "cargo_delay" and delay_days >= 5 and mission_affected:
        severity = "Critical"

    params_dict = {"delay_days": delay_days}
    params_dict.update(parameters)

    disruption = Disruption(
        id=disruption_id,
        disruption_code=disruption_code,
        type=disruption_type,
        entity_type=entity_type,
        entity_id=entity_id,
        severity=severity,
        description=f"Disruption affecting {entity_type} {entity_id}",
        created_at=datetime.utcnow(),
        status="Active",
        parameters=json.dumps(params_dict),
        is_simulation=is_simulation
    )
    db.add(disruption)

    # Create impact records
    impact_records = []
    affected_by_type: Dict[str, List[str]] = {
        "cargo": [], "inventory": [], "asset": [],
        "mission": [], "personnel": [], "teams": []
    }
    teams_affected: Set[str] = set()

    for node in affected:
        record_id = str(uuid.uuid4())
        impact_rec = ImpactRecord(
            id=record_id,
            disruption_id=disruption_id,
            affected_type=node["type"],
            affected_id=node["id"],
            affected_name=node["name"],
            impact_level=node["impact_level"],
            impact_reason=f"Downstream dependency via {node.get('relationship', 'dependency chain')}",
            estimated_delay=delay_days if node["impact_level"] in ("Critical", "High") else 0,
            created_at=datetime.utcnow()
        )
        db.add(impact_rec)
        impact_records.append(impact_rec)

        t = node["type"]
        if t in affected_by_type:
            affected_by_type[t].append(node["id"])

        # Collect teams from personnel
        if t == "personnel":
            p = await db.get(Personnel, node["id"])
            if p and p.team:
                teams_affected.add(p.team)
        if t == "mission":
            m = await db.get(Mission, node["id"])
            if m and m.team:
                teams_affected.add(m.team)

    affected_by_type["teams"] = list(teams_affected)

    # Create alert
    if not is_simulation:
        alert_id = str(uuid.uuid4())
        alert = Alert(
            id=alert_id,
            type=disruption_type,
            severity=severity,
            title=f"{disruption_type.replace('_', ' ').title()} Detected",
            message=f"Disruption on {entity_type} {entity_id} affects {len(affected)} entities. Delay: {delay_days} days.",
            entity_type=entity_type,
            entity_id=entity_id,
            created_at=datetime.utcnow(),
            acknowledged=False,
            is_simulation=False
        )
        db.add(alert)

        # Audit log
        audit_id = str(uuid.uuid4())
        audit = AuditLog(
            id=audit_id,
            timestamp=datetime.utcnow(),
            action="impact_analysis",
            entity_type=entity_type,
            entity_id=entity_id,
            description=f"Impact analysis triggered: {disruption_code}. Severity: {severity}. Affected: {len(affected)} entities.",
            user_role="System",
            is_simulation=is_simulation
        )
        db.add(audit)

    await db.commit()

    # Build impact chain for UI
    impact_chain = [
        {"type": entity_type, "id": entity_id,
         "name": await _get_entity_name(db, entity_type, entity_id),
         "depth": 0, "impact_level": "Root"}
    ] + affected

    return {
        "disruption_id": disruption_id,
        "severity": severity,
        "affected_cargo": affected_by_type["cargo"],
        "affected_inventory": affected_by_type["inventory"],
        "affected_assets": affected_by_type["asset"],
        "affected_missions": affected_by_type["mission"],
        "affected_teams": list(teams_affected),
        "affected_personnel": affected_by_type["personnel"],
        "estimated_delay_days": delay_days,
        "impact_chain": impact_chain,
        "summary": _build_summary(affected_by_type, delay_days, teams_affected),
        "records": [
            {
                "id": r.id, "disruption_id": r.disruption_id,
                "affected_type": r.affected_type, "affected_id": r.affected_id,
                "affected_name": r.affected_name, "impact_level": r.impact_level,
                "impact_reason": r.impact_reason, "estimated_delay": r.estimated_delay
            }
            for r in impact_records
        ]
    }


def _build_summary(affected_by_type: dict, delay_days: int, teams: set) -> str:
    parts = []
    if affected_by_type["mission"]:
        parts.append(f"{len(affected_by_type['mission'])} mission(s) affected")
    if affected_by_type["asset"]:
        parts.append(f"{len(affected_by_type['asset'])} asset(s) at risk")
    if teams:
        parts.append(f"{len(teams)} team(s) impacted")
    if delay_days:
        parts.append(f"{delay_days}-day potential delay")
    return " · ".join(parts) if parts else "Impact assessment complete"
