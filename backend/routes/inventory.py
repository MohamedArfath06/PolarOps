from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from database import get_db
from models.models import Inventory
from services.forecast_engine import get_global_forecast, get_station_forecast

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("")
async def list_inventory(
    station_id: Optional[str] = None,
    category: Optional[str] = None,
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Return inventory with computed forecast data."""
    if station_id:
        forecasts = await get_station_forecast(db, station_id)
    else:
        forecasts = await get_global_forecast(db)

    # Filter by category
    if category:
        forecasts = [f for f in forecasts if f["category"] == category]

    # Filter by state
    if state:
        forecasts = [f for f in forecasts if f["state"] == state]

    return forecasts


@router.get("/forecast")
async def get_forecast(db: AsyncSession = Depends(get_db)):
    """Return full forecast with shortage warnings."""
    forecasts = await get_global_forecast(db)
    warnings = [f for f in forecasts if f["shortage_risk"] in ("Critical", "High", "Out of Stock")]
    return {
        "all": forecasts,
        "warnings": warnings,
        "warning_count": len(warnings)
    }


@router.get("/{inventory_id}")
async def get_inventory_item(inventory_id: str, db: AsyncSession = Depends(get_db)):
    item = await db.get(Inventory, inventory_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    from services.forecast_engine import (
        calculate_days_remaining, assess_shortage_risk, get_inventory_state
    )
    available = max(0.0, item.quantity - item.reserved_quantity)
    days_rem = calculate_days_remaining(available, item.daily_consumption)
    risk = assess_shortage_risk(available, item.daily_consumption, item.next_resupply_days)
    state = get_inventory_state(item.quantity, item.minimum_stock, item.critical_level)

    return {
        "id": item.id, "item_code": item.item_code, "item_name": item.item_name,
        "category": item.category, "station_id": item.station_id,
        "quantity": item.quantity, "unit": item.unit,
        "available_quantity": available,
        "minimum_stock": item.minimum_stock, "critical_level": item.critical_level,
        "daily_consumption": item.daily_consumption,
        "reserved_quantity": item.reserved_quantity,
        "next_resupply_days": item.next_resupply_days,
        "days_remaining": days_rem if days_rem != float('inf') else None,
        "shortage_risk": risk["risk"],
        "shortfall_days": risk["shortfall_days"],
        "state": state
    }


@router.patch("/{inventory_id}")
async def update_inventory(inventory_id: str, updates: dict, db: AsyncSession = Depends(get_db)):
    item = await db.get(Inventory, inventory_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    allowed = {"quantity", "reserved_quantity", "daily_consumption", "next_resupply_days"}
    for key, val in updates.items():
        if key in allowed:
            if isinstance(val, (int, float)) and val < 0:
                raise HTTPException(status_code=400, detail=f"{key} cannot be negative")
            setattr(item, key, val)

    await db.commit()
    return {"success": True, "item_id": inventory_id}
