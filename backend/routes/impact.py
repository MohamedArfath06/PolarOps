from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from database import get_db
from models.models import Disruption, ImpactRecord, RecoveryOption
from schemas.schemas import ImpactRequest, ImpactAnalysisResult
from services.impact_engine import analyze_impact

router = APIRouter(prefix="/impact", tags=["impact"])


@router.post("/analyze")
async def analyze_disruption_impact(
    request: ImpactRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze the cross-domain impact of a disruption event.
    Creates impact records, alerts, and returns structured analysis.
    """
    try:
        req_type = (request.type or "").lower()
        eid = request.entity_id or ""
        if "cargo" in req_type or eid.startswith("C-"):
            entity_type = "cargo"
        elif "vehicle" in req_type or "asset" in req_type or "breakdown" in req_type or "failure" in req_type or eid.startswith("A-") or eid.startswith("V-") or eid.startswith("G-"):
            entity_type = "asset"
        elif "inventory" in req_type or "shortage" in req_type or eid.startswith("INV-"):
            entity_type = "inventory"
        elif "personnel" in req_type or "medical" in req_type or eid.startswith("P-"):
            entity_type = "personnel"
        elif "mission" in req_type or eid.startswith("M-"):
            entity_type = "mission"
        else:
            entity_type = "asset"

        result = await analyze_impact(
            db=db,
            entity_type=entity_type,
            entity_id=request.entity_id,
            disruption_type=request.type,
            delay_days=request.delay_days or 0,
            parameters=request.parameters or {},
            is_simulation=request.is_simulation
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Impact analysis failed: {str(e)}")


@router.get("/disruptions")
async def list_disruptions(
    is_simulation: Optional[bool] = False,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Disruption)
    if is_simulation is not None:
        stmt = stmt.where(Disruption.is_simulation == is_simulation)
    result = await db.execute(stmt.order_by(Disruption.created_at.desc()))
    disruptions = result.scalars().all()

    return [
        {
            "id": d.id, "disruption_code": d.disruption_code, "type": d.type,
            "entity_type": d.entity_type, "entity_id": d.entity_id,
            "severity": d.severity, "description": d.description,
            "status": d.status, "is_simulation": d.is_simulation,
            "created_at": d.created_at.isoformat() if d.created_at else None
        }
        for d in disruptions
    ]


@router.get("/disruptions/{disruption_id}")
async def get_disruption(disruption_id: str, db: AsyncSession = Depends(get_db)):
    disruption = await db.get(Disruption, disruption_id)
    if not disruption:
        raise HTTPException(status_code=404, detail="Disruption not found")

    # Get impact records
    records_result = await db.execute(
        select(ImpactRecord).where(ImpactRecord.disruption_id == disruption_id)
    )
    records = records_result.scalars().all()

    # Get recovery options
    options_result = await db.execute(
        select(RecoveryOption).where(RecoveryOption.disruption_id == disruption_id)
        .order_by(RecoveryOption.rank)
    )
    options = options_result.scalars().all()

    return {
        "id": disruption.id, "disruption_code": disruption.disruption_code,
        "type": disruption.type, "entity_type": disruption.entity_type,
        "entity_id": disruption.entity_id, "severity": disruption.severity,
        "description": disruption.description, "status": disruption.status,
        "is_simulation": disruption.is_simulation,
        "created_at": disruption.created_at.isoformat() if disruption.created_at else None,
        "impact_records": [
            {
                "id": r.id, "affected_type": r.affected_type, "affected_id": r.affected_id,
                "affected_name": r.affected_name, "impact_level": r.impact_level,
                "impact_reason": r.impact_reason, "estimated_delay": r.estimated_delay
            }
            for r in records
        ],
        "recovery_options": [
            {
                "id": o.id, "option_name": o.option_name, "description": o.description,
                "total_score": o.total_score, "feasible": o.feasible, "rank": o.rank,
                "estimated_delay_days": o.estimated_delay_days
            }
            for o in options
        ]
    }
