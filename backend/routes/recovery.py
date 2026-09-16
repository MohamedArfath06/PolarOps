from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import uuid
from database import get_db
from models.models import RecoveryOption, RecoveryPlan, Disruption, Mission, Cargo, AuditLog
from schemas.schemas import RecoveryGenerateRequest, RecoveryPlanCreate, RecoveryPlanApprove
from services.recovery_engine import generate_recovery_options

router = APIRouter(prefix="/recovery", tags=["recovery"])


@router.post("/generate")
async def generate_options(
    request: RecoveryGenerateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate recovery options for a given disruption."""
    disruption = await db.get(Disruption, request.disruption_id)
    if not disruption:
        raise HTTPException(status_code=404, detail="Disruption not found")

    options = await generate_recovery_options(db, request.disruption_id)

    if not options:
        return {
            "disruption_id": request.disruption_id,
            "options": [],
            "message": "No feasible recovery plan found. Escalation required.",
            "recommended_option_id": None
        }

    # Best option is rank 1
    best = min(options, key=lambda o: o.get("rank", 99))

    return {
        "disruption_id": request.disruption_id,
        "options": options,
        "recommended_option_id": best.get("id"),
        "recommended_option_name": best.get("option_name"),
        "message": f"Recommended: {best.get('option_name')} (Score: {best.get('total_score')})"
    }


@router.get("/options/{disruption_id}")
async def get_recovery_options(disruption_id: str, db: AsyncSession = Depends(get_db)):
    """Get all recovery options for a disruption."""
    result = await db.execute(
        select(RecoveryOption)
        .where(RecoveryOption.disruption_id == disruption_id)
        .order_by(RecoveryOption.rank)
    )
    options = result.scalars().all()

    return [
        {
            "id": o.id, "disruption_id": o.disruption_id, "option_name": o.option_name,
            "description": o.description, "mission_continuity_score": o.mission_continuity_score,
            "safety_score": o.safety_score, "time_score": o.time_score,
            "resource_score": o.resource_score, "cost_score": o.cost_score,
            "total_score": o.total_score, "feasible": o.feasible, "rank": o.rank,
            "action_steps": o.action_steps, "estimated_delay_days": o.estimated_delay_days,
            "explanation": o.explanation
        }
        for o in options
    ]


@router.post("/plans")
async def create_recovery_plan(
    request: RecoveryPlanCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a recovery plan with selected option."""
    plan_id = str(uuid.uuid4())
    plan = RecoveryPlan(
        id=plan_id,
        disruption_id=request.disruption_id,
        selected_option_id=request.selected_option_id,
        status="Pending Approval",
        created_at=datetime.utcnow(),
        notes=request.notes
    )
    db.add(plan)

    audit = AuditLog(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        action="recovery_plan_created",
        entity_type="recovery_plan",
        entity_id=plan_id,
        description=f"Recovery plan {plan_id[:8]} created. Awaiting commander approval.",
        user_role="System"
    )
    db.add(audit)
    await db.commit()

    return {"id": plan_id, "plan_id": plan_id, "status": "Pending Approval"}


@router.get("/plans")
async def list_recovery_plans(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RecoveryPlan).order_by(RecoveryPlan.created_at.desc()))
    plans = result.scalars().all()
    return [
        {
            "id": p.id, "disruption_id": p.disruption_id,
            "selected_option_id": p.selected_option_id,
            "status": p.status, "approved_by": p.approved_by,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "approved_at": p.approved_at.isoformat() if p.approved_at else None,
            "notes": p.notes
        }
        for p in plans
    ]


@router.post("/plans/{plan_id}/approve")
async def approve_recovery_plan(
    plan_id: str,
    request: RecoveryPlanApprove,
    db: AsyncSession = Depends(get_db)
):
    """
    Approve a recovery plan.
    This is the ONLY action that modifies live operational state.
    """
    plan = await db.get(RecoveryPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")

    if plan.status not in ("Pending Approval",):
        raise HTTPException(status_code=400, detail=f"Plan is already {plan.status}")

    # Get the selected option
    option = await db.get(RecoveryOption, plan.selected_option_id)
    if not option:
        raise HTTPException(status_code=404, detail="Recovery option not found")

    # Get the disruption
    disruption = await db.get(Disruption, plan.disruption_id)
    if disruption:
        disruption.status = "Resolved"

    plan.status = "Approved"
    plan.approved_by = request.approved_by
    plan.approved_at = datetime.utcnow()
    if request.notes:
        plan.notes = request.notes

    # Apply recovery effects to live state based on option
    await _apply_recovery_effects(db, disruption, option)

    audit = AuditLog(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        action="recovery_plan_approved",
        entity_type="recovery_plan",
        entity_id=plan_id,
        description=f"Recovery plan approved by {request.approved_by}. Option: {option.option_name}. Operational state updated.",
        user_role=request.approved_by
    )
    db.add(audit)
    await db.commit()

    return {
        "plan_id": plan_id,
        "status": "Approved",
        "approved_by": request.approved_by,
        "approved_at": plan.approved_at.isoformat(),
        "effects_applied": True,
        "message": f"Recovery plan approved. {option.option_name} is now in effect."
    }


async def _apply_recovery_effects(db, disruption, option):
    """Apply the approved recovery option's effects to the live database."""
    if not disruption:
        return

    import json
    from models.models import Cargo, Mission, Asset, Inventory

    entity_id = disruption.entity_id
    entity_type = disruption.entity_type

    if disruption.type == "cargo_delay" and "Transfer" in option.option_name:
        # Transfer spare from Maitri: update inventory
        # Find G-03 mission and update status
        mission_result = await db.execute(
            select(Mission).where(Mission.status == "At Risk")
        )
        at_risk_missions = mission_result.scalars().all()
        for m in at_risk_missions:
            if m.id == "M-027" or "Generator" in (m.mission_name or ""):
                m.status = "Active"

        # Update cargo status
        cargo = await db.get(Cargo, entity_id)
        if cargo:
            cargo.status = "In Transit"
            cargo.delay_days = max(0, cargo.delay_days - 3)

    elif disruption.type == "vehicle_failure":
        # Find the failed asset, mark it as maintenance
        asset = await db.get(Asset, entity_id)
        if asset:
            asset.status = "Maintenance"

    elif disruption.type == "inventory_shortage":
        if "Transfer" in option.option_name:
            inv = await db.get(Inventory, entity_id)
            if inv:
                inv.quantity = max(inv.quantity, inv.minimum_stock * 1.5)
