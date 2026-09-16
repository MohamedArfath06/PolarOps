from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.models import Alert, AuditLog
from schemas.schemas import SimulationRequest
from services.simulation_engine import simulate_scenario

router = APIRouter(prefix="/simulation", tags=["simulation"])


@router.post("/run")
async def run_simulation(
    request: SimulationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Run a non-destructive scenario simulation.
    NEVER modifies live operational data.
    """
    result = await simulate_scenario(
        db=db,
        scenario_type=request.scenario_type,
        entity_id=request.entity_id,
        parameters=request.parameters
    )
    return result


router_alerts = APIRouter(prefix="/alerts", tags=["alerts"])


@router_alerts.get("")
async def list_alerts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Alert).where(Alert.is_simulation == False).order_by(Alert.created_at.desc())
    )
    alerts = result.scalars().all()
    return [
        {
            "id": a.id, "type": a.type, "severity": a.severity, "title": a.title,
            "message": a.message, "entity_type": a.entity_type, "entity_id": a.entity_id,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "acknowledged": a.acknowledged
        }
        for a in alerts
    ]


@router_alerts.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    await db.commit()
    return {"success": True}


router_audit = APIRouter(prefix="/audit", tags=["audit"])


@router_audit.get("")
async def get_audit_log(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100)
    )
    logs = result.scalars().all()
    return [
        {
            "id": l.id,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "description": l.description,
            "user_role": l.user_role,
            "is_simulation": l.is_simulation
        }
        for l in logs
    ]


router_demo = APIRouter(prefix="/demo", tags=["demo"])


@router_demo.post("/reset")
async def reset_demo(db: AsyncSession = Depends(get_db)):
    """
    Reset the demo to initial state.
    Clears all disruptions, recovery options, plans, and simulation alerts.
    Restores mission M-027 to At Risk status.
    """
    from models.models import Disruption, ImpactRecord, RecoveryOption, RecoveryPlan, Mission, Cargo

    # Delete simulation-related data
    disruptions_result = await db.execute(select(Disruption))
    for d in disruptions_result.scalars().all():
        await db.delete(d)

    impact_result = await db.execute(select(ImpactRecord))
    for i in impact_result.scalars().all():
        await db.delete(i)

    opts_result = await db.execute(select(RecoveryOption))
    for o in opts_result.scalars().all():
        await db.delete(o)

    plans_result = await db.execute(select(RecoveryPlan))
    for p in plans_result.scalars().all():
        await db.delete(p)

    # Restore M-027 to At Risk
    m027 = await db.get(Mission, "M-027")
    if m027:
        m027.status = "At Risk"

    # Restore C-1042 to Delayed
    c1042 = await db.get(Cargo, "C-1042")
    if c1042:
        c1042.status = "Delayed"
        c1042.delay_days = 5

    # Clear simulation alerts but keep operational ones
    sim_alerts_result = await db.execute(
        select(Alert).where(Alert.is_simulation == True)
    )
    for a in sim_alerts_result.scalars().all():
        await db.delete(a)

    # Reset acknowledged on key alerts
    key_alert_result = await db.execute(
        select(Alert).where(Alert.id.in_(["ALT-001", "ALT-002", "ALT-003"]))
    )
    for a in key_alert_result.scalars().all():
        a.acknowledged = False

    # Restore baseline disruption DIS-001
    dis_001 = Disruption(
        id="DIS-001",
        disruption_code="DIS-20260913-001",
        type="cargo_delay",
        entity_type="cargo",
        entity_id="C-1042",
        severity="Critical",
        description="5-day shipping delay on Cargo C-1042 (Exciter Module for G-03 Generator).",
        parameters='{"delay_days": 5}',
        status="Active",
        is_simulation=False,
        created_at=__import__('datetime').datetime.utcnow()
    )
    db.add(dis_001)

    audit = AuditLog(
        id=str(__import__('uuid').uuid4()),
        timestamp=__import__('datetime').datetime.utcnow(),
        action="demo_reset",
        entity_type="system",
        entity_id="POLAROPS",
        description="Demo reset executed. System returned to initial demonstration state.",
        user_role="Demo"
    )
    db.add(audit)
    await db.commit()

    return {"success": True, "message": "Demo reset complete. System restored to initial demonstration state."}
