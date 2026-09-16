"""
Recovery Engine — POLARIS X

Generates feasible recovery options from the operational database state
based on the disruption type and available resources.

NOTE: This is a prototype recovery recommendation engine.
Operational weights require domain validation.
"""

import uuid
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.models import (
    Disruption, Asset, Inventory, Personnel, Cargo, Mission,
    RecoveryOption, AuditLog
)


async def generate_recovery_options(
    db: AsyncSession,
    disruption_id: str
) -> List[Dict]:
    """
    Main entry: given a disruption_id, look up its type and generate
    feasible recovery alternatives.
    """
    disruption = await db.get(Disruption, disruption_id)
    if not disruption:
        return []

    d_type = disruption.type
    entity_id = disruption.entity_id
    params = json.loads(disruption.parameters or "{}")

    options: List[Dict] = []

    if d_type == "cargo_delay":
        options = await _recover_cargo_delay(db, entity_id, params)
    elif d_type == "vehicle_failure":
        options = await _recover_vehicle_failure(db, entity_id, params)
    elif d_type == "inventory_shortage":
        options = await _recover_inventory_shortage(db, entity_id, params)
    elif d_type == "personnel_unavailable":
        options = await _recover_personnel_unavailable(db, entity_id, params)
    elif d_type == "communication_loss":
        options = await _recover_communication_loss(db, entity_id, params)
    else:
        options = _generic_options()

    # Persist to DB
    saved_options = []
    for opt in options:
        opt_id = str(uuid.uuid4())
        record = RecoveryOption(
            id=opt_id,
            disruption_id=disruption_id,
            option_name=opt["option_name"],
            description=opt["description"],
            mission_continuity_score=opt["mission_continuity_score"],
            safety_score=opt["safety_score"],
            time_score=opt["time_score"],
            resource_score=opt["resource_score"],
            cost_score=opt["cost_score"],
            total_score=opt["total_score"],
            feasible=opt["feasible"],
            rank=opt["rank"],
            action_steps=json.dumps(opt.get("action_steps", [])),
            estimated_delay_days=opt.get("estimated_delay_days", 0),
            explanation=opt.get("explanation", ""),
            created_at=datetime.utcnow()
        )
        db.add(record)
        saved_options.append({**opt, "id": opt_id, "disruption_id": disruption_id})

    # Audit
    audit = AuditLog(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        action="recovery_options_generated",
        entity_type=disruption.entity_type,
        entity_id=disruption.entity_id,
        description=f"{len(options)} recovery options generated for disruption {disruption_id[:8]}.",
        user_role="System"
    )
    db.add(audit)

    await db.commit()
    return saved_options


async def _recover_cargo_delay(db: AsyncSession, cargo_id: str, params: dict) -> List[Dict]:
    """Generate recovery options for a delayed cargo item."""
    delay_days = params.get("delay_days", 5)
    options = []

    # Find the cargo to check what inventory it's linked to
    cargo = await db.get(Cargo, cargo_id)
    linked_inv_id = cargo.linked_inventory_id if cargo else None

    # Option A: Wait for original shipment
    options.append({
        "option_name": "Plan A — Wait for Original Shipment",
        "description": f"Continue waiting for {cargo.cargo_code if cargo else cargo_id}. Current delay: {delay_days} days.",
        "mission_continuity_score": 55.0,
        "safety_score": 95.0,
        "time_score": 30.0,
        "resource_score": 90.0,
        "cost_score": 95.0,
        "total_score": 0.0,
        "feasible": True,
        "rank": 3,
        "estimated_delay_days": delay_days,
        "action_steps": [
            "Maintain current plan",
            "Monitor updated ETA from logistics",
            "Brief affected mission teams",
            "Prepare contingency buffers"
        ],
        "explanation": (
            f"Waiting preserves resources but incurs a {delay_days}-day mission delay. "
            "Acceptable only if mission timeline has buffer."
        )
    })

    # Check for compatible spare at Maitri (e.g. INV-024 or any spare with qty > 0)
    alternate_found = False
    alternate_inv_name = "INV-024"
    inv_result = await db.execute(
        select(Inventory).where(
            Inventory.station_id == "STA-02",
            (Inventory.item_code == "INV-024") | (Inventory.item_name.like("%Generator%"))
        )
    )
    m_inv = inv_result.scalars().first()
    if m_inv and m_inv.quantity > 0:
        alternate_found = True
        alternate_inv_name = f"{m_inv.item_code} ({m_inv.item_name})"

    # Check for available operational transport vehicle at Bharati (STA-01)
    veh_result = await db.execute(
        select(Asset).where(
            Asset.type == "Vehicle",
            Asset.status == "Operational",
            Asset.fuel_level >= 30.0
        )
    )
    transport_vehicles = veh_result.scalars().all()
    has_vehicle = len(transport_vehicles) > 0
    chosen_vehicle = transport_vehicles[0].asset_code if has_vehicle else "None"

    feasibility_b = alternate_found and has_vehicle
    options.append({
        "option_name": "Plan B — Transfer Spare from Maitri",
        "description": f"Transfer {alternate_inv_name} from Maitri reserves via vehicle {chosen_vehicle}." if feasibility_b else "Overland transfer from Maitri (INVIABLE: lack of verified spares or fueled vehicle).",
        "mission_continuity_score": 88.0 if feasibility_b else 20.0,
        "safety_score": 95.0 if feasibility_b else 40.0,
        "time_score": 75.0 if feasibility_b else 10.0,
        "resource_score": 70.0 if feasibility_b else 10.0,
        "cost_score": 60.0 if feasibility_b else 30.0,
        "total_score": 0.0,
        "feasible": feasibility_b,
        "rank": 1 if feasibility_b else 3,
        "estimated_delay_days": max(0, delay_days - 3) if feasibility_b else delay_days,
        "action_steps": [
            f"Verify spare part compatibility at Maitri ({alternate_inv_name})",
            f"Dispatch {chosen_vehicle} from Bharati to Maitri (Est. 2 hrs)",
            "Load and secure spare module",
            "Return to Bharati via Route Alpha (Est. 2 hrs)",
            "Deliver to Generator G-03 maintenance team",
            "Resume Mission M-027"
        ] if feasibility_b else [
            "Log transfer failure: required spare or operational vehicle unavailable",
            "Escalate to Expedition Commander for alternative logistics routing"
        ],
        "explanation": (
            f"Compatible spare verified at Maitri ({alternate_inv_name}). "
            f"Transport vehicle {chosen_vehicle} operational. Reduces mission delay from {delay_days} to {max(0, delay_days - 3)} days. "
            "Recommended action."
        ) if feasibility_b else (
            "Transfer option is infeasible due to insufficient spare inventory or unavailable transport vehicle."
        )
    })

    # Option C: Priority alternate shipment
    options.append({
        "option_name": "Plan C — Priority Alternate Shipment",
        "description": "Request expedited delivery via priority air freight from Goa logistics hub.",
        "mission_continuity_score": 95.0,
        "safety_score": 80.0,
        "time_score": 90.0,
        "resource_score": 40.0,
        "cost_score": 20.0,
        "total_score": 0.0,
        "feasible": True,
        "rank": 2,
        "estimated_delay_days": 0,
        "action_steps": [
            "Raise priority shipment request to Goa Logistics",
            "Coordinate with NCPOR air transport team",
            "Clear customs and staging",
            "Air delivery to Bharati (Est. 24 hrs)",
            "Inspect and install on arrival"
        ],
        "explanation": (
            "No mission delay but high logistics cost and air transport risk. "
            "Feasible only if air window is available. Score penalized for cost."
        )
    })

    return _rank_options(options)


async def _recover_vehicle_failure(db: AsyncSession, asset_id: str, params: dict) -> List[Dict]:
    """Generate recovery options for a vehicle failure."""
    options = []

    # Find alternative operational vehicles
    vehicle_result = await db.execute(
        select(Asset).where(
            Asset.type == "Vehicle",
            Asset.status == "Operational",
            Asset.id != asset_id
        )
    )
    vehicles = vehicle_result.scalars().all()

    if not vehicles:
        options.append({
            "option_name": "No Compatible Replacement Found",
            "description": "No operational vehicles available. Manual escalation required.",
            "mission_continuity_score": 0.0,
            "safety_score": 80.0,
            "time_score": 0.0,
            "resource_score": 0.0,
            "cost_score": 50.0,
            "total_score": 20.0,
            "feasible": False,
            "rank": 1,
            "estimated_delay_days": 10,
            "action_steps": ["Escalate to base commander", "Request emergency vehicle"],
            "explanation": "No available compatible assets. Escalation required."
        })
        return options

    # Sort vehicles by condition score
    vehicles_sorted = sorted(vehicles, key=lambda v: (v.fuel_level + v.condition_score), reverse=True)

    for i, v in enumerate(vehicles_sorted[:3]):
        eta_min = 15 + i * 13
        mc_score = 85.0 - (i * 8)
        options.append({
            "option_name": f"Plan {chr(65+i)} — Reassign {v.asset_code}",
            "description": f"Redeploy {v.name} ({v.asset_code}) from {v.station_id}. Condition: {v.condition_score:.0f}%. Fuel: {v.fuel_level:.0f}%.",
            "mission_continuity_score": mc_score,
            "safety_score": min(95.0, v.condition_score),
            "time_score": max(30.0, 90.0 - i * 15),
            "resource_score": min(90.0, v.fuel_level),
            "cost_score": 75.0 - i * 5,
            "total_score": 0.0,
            "feasible": True,
            "rank": i + 1,
            "estimated_delay_days": 0 if eta_min < 30 else 1,
            "action_steps": [
                f"Redirect {v.asset_code} to mission site",
                "Brief replacement vehicle operator",
                "Update mission manifest",
                "Resume operations"
            ],
            "explanation": (
                f"{v.asset_code} is the {'best' if i == 0 else 'next best'} available replacement. "
                f"ETA: ~{eta_min} minutes. Condition: {v.condition_score:.0f}%."
            )
        })

    return _rank_options(options)


async def _recover_inventory_shortage(db: AsyncSession, inv_id: str, params: dict) -> List[Dict]:
    """Generate recovery options for inventory shortage."""
    options = []
    inventory = await db.get(Inventory, inv_id)
    item_name = inventory.item_name if inventory else inv_id

    options = [
        {
            "option_name": "Plan A — Emergency Transfer from Maitri",
            "description": f"Transfer {item_name} stock from Maitri station reserves.",
            "mission_continuity_score": 85.0, "safety_score": 90.0,
            "time_score": 70.0, "resource_score": 65.0, "cost_score": 55.0,
            "total_score": 0.0, "feasible": True, "rank": 1,
            "estimated_delay_days": 1,
            "action_steps": ["Check Maitri reserves", "Dispatch V-02", "Transfer stock", "Update inventory"],
            "explanation": f"Maitri has sufficient {item_name} reserves. Transit time ~4 hours."
        },
        {
            "option_name": "Plan B — Expedite Resupply",
            "description": "Priority resupply request to Goa logistics hub.",
            "mission_continuity_score": 92.0, "safety_score": 85.0,
            "time_score": 50.0, "resource_score": 40.0, "cost_score": 30.0,
            "total_score": 0.0, "feasible": True, "rank": 2,
            "estimated_delay_days": 2,
            "action_steps": ["Raise priority resupply", "Air transport coordination", "Delivery"],
            "explanation": "Expedited resupply ensures full stock restoration but incurs cost."
        },
        {
            "option_name": "Plan C — Reduce Daily Allocation",
            "description": f"Implement 30% consumption reduction for {item_name} to extend runway.",
            "mission_continuity_score": 60.0, "safety_score": 75.0,
            "time_score": 95.0, "resource_score": 95.0, "cost_score": 98.0,
            "total_score": 0.0, "feasible": True, "rank": 3,
            "estimated_delay_days": 0,
            "action_steps": ["Issue conservation directive", "Update consumption guidelines", "Monitor daily"],
            "explanation": "Buys time without external logistics. Mission continuity partially impaired."
        }
    ]

    return _rank_options(options)


async def _recover_personnel_unavailable(db: AsyncSession, personnel_id: str, params: dict) -> List[Dict]:
    """Generate recovery options for personnel unavailability."""
    person = await db.get(Personnel, personnel_id)
    person_name = person.name if person else personnel_id
    person_role = person.role if person else "Unknown"

    available_result = await db.execute(
        select(Personnel).where(
            Personnel.status == "Available",
            Personnel.id != personnel_id
        )
    )
    available = available_result.scalars().all()
    compatible = [p for p in available if p.role == person_role or "Engineer" in (p.role or "")]

    options = []
    if compatible:
        p = compatible[0]
        options.append({
            "option_name": f"Plan A — Reassign {p.name}",
            "description": f"Reassign {p.name} ({p.role}, {p.team}) to cover {person_name}'s role.",
            "mission_continuity_score": 82.0, "safety_score": 90.0,
            "time_score": 85.0, "resource_score": 80.0, "cost_score": 90.0,
            "total_score": 0.0, "feasible": True, "rank": 1, "estimated_delay_days": 0,
            "action_steps": [f"Brief {p.name} on role", "Update assignment", "Monitor performance"],
            "explanation": f"{p.name} has compatible skills and is available immediately."
        })

    options.append({
        "option_name": "Plan B — Delay Mission Pending Recovery",
        "description": f"Delay mission until {person_name} returns to active duty.",
        "mission_continuity_score": 45.0, "safety_score": 95.0,
        "time_score": 20.0, "resource_score": 90.0, "cost_score": 95.0,
        "total_score": 0.0, "feasible": True, "rank": 2, "estimated_delay_days": 3,
        "action_steps": ["Medical assessment", "Set return timeline", "Reschedule mission"],
        "explanation": "Safest option but delays mission by 2-4 days."
    })

    return _rank_options(options)


async def _recover_communication_loss(db: AsyncSession, asset_id: str, params: dict) -> List[Dict]:
    options = [
        {
            "option_name": "Plan A — Activate Backup COM Unit",
            "description": "Switch to backup communication unit COM-02.",
            "mission_continuity_score": 88.0, "safety_score": 92.0,
            "time_score": 90.0, "resource_score": 80.0, "cost_score": 85.0,
            "total_score": 85.6, "feasible": True, "rank": 1, "estimated_delay_days": 0,
            "action_steps": ["Activate COM-02", "Test link", "Notify all teams"],
            "explanation": "COM-02 is operational and can serve as primary. Minimal disruption."
        },
        {
            "option_name": "Plan B — Satellite Phone Relay",
            "description": "Use satellite phone for critical communications until primary is restored.",
            "mission_continuity_score": 65.0, "safety_score": 88.0,
            "time_score": 95.0, "resource_score": 60.0, "cost_score": 50.0,
            "total_score": 72.0, "feasible": True, "rank": 2, "estimated_delay_days": 0,
            "action_steps": ["Issue sat-phones to team leads", "Establish check-in schedule"],
            "explanation": "Adequate for safety but limited bandwidth. Use as bridge."
        }
    ]
    return _rank_options(options)


def _generic_options() -> List[Dict]:
    return [{
        "option_name": "Manual Review Required",
        "description": "No automatic recovery options available. Manual assessment required.",
        "mission_continuity_score": 50.0, "safety_score": 80.0,
        "time_score": 50.0, "resource_score": 50.0, "cost_score": 50.0,
        "total_score": 57.5, "feasible": False, "rank": 1, "estimated_delay_days": 0,
        "action_steps": ["Escalate to Commander", "Assess manually"],
        "explanation": "This disruption type requires manual intervention."
    }]


DEFAULT_WEIGHTS = {
    "mission_continuity": 0.35,
    "safety": 0.25,
    "time": 0.20,
    "resource": 0.10,
    "cost": 0.10
}


def _calculate_score(option: dict, weights: Optional[dict] = None) -> float:
    """
    Normalized multi-criteria scoring model:
      Mission Continuity: 35%
      Safety: 25%
      Time: 20%
      Resource Availability: 10%
      Cost: 10%
    Safely clamps inputs to [0.0, 100.0] and handles missing values.
    """
    w = dict(DEFAULT_WEIGHTS)
    if weights and isinstance(weights, dict):
        w.update(weights)

    total_w = sum(w.values())
    if total_w <= 0:
        total_w = 1.0
        w = dict(DEFAULT_WEIGHTS)

    mc = max(0.0, min(100.0, float(option.get("mission_continuity_score", 0.0))))
    safety = max(0.0, min(100.0, float(option.get("safety_score", 0.0))))
    time_score = max(0.0, min(100.0, float(option.get("time_score", 0.0))))
    resource = max(0.0, min(100.0, float(option.get("resource_score", 0.0))))
    cost = max(0.0, min(100.0, float(option.get("cost_score", 0.0))))

    score = (
        (w["mission_continuity"] * mc) +
        (w["safety"] * safety) +
        (w["time"] * time_score) +
        (w["resource"] * resource) +
        (w["cost"] * cost)
    ) / total_w

    is_feas = option.get("is_feasible", option.get("feasible", True))
    if not is_feas:
        score = min(score, 30.0)

    return round(score, 1)


def _rank_options(options: List[Dict], weights: Optional[dict] = None) -> List[Dict]:
    """Scores options and sorts them ensuring feasible options always outrank infeasible ones."""
    for opt in options:
        if "mission_continuity_score" in opt or "total_score" not in opt:
            opt["total_score"] = _calculate_score(opt, weights)
    options.sort(
        key=lambda x: (
            1 if x.get("is_feasible", x.get("feasible", True)) else 0,
            x.get("total_score", 0.0)
        ),
        reverse=True
    )
    for i, opt in enumerate(options):
        opt["rank"] = i + 1
        opt["is_recommended"] = (i == 0 and bool(opt.get("is_feasible", opt.get("feasible", True))))
    return options

