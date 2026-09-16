"""
Forecast Engine — POLARIS X

Simple rule-based resource depletion forecasting.
Calculates days_remaining from current consumption rate.
Flags shortage risk if depletion occurs before next resupply.

NOTE: This is a prototype linear forecasting model.
Real consumption patterns may vary.
"""

from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.models import Inventory, Station


def calculate_days_remaining(quantity: float, daily_consumption: float) -> float:
    """Calculate how many days a resource will last at current consumption."""
    if daily_consumption <= 0:
        return float('inf')
    return round(quantity / daily_consumption, 1)


def assess_shortage_risk(
    available: float,
    daily_consumption: float,
    next_resupply_days: int,
    safety_buffer: float = 0.20
) -> Dict:
    """
    Determine if a shortage will occur before resupply.
    safety_buffer = 20% reserve threshold.
    """
    days_remaining = calculate_days_remaining(available, daily_consumption)
    days_needed = next_resupply_days * (1 + safety_buffer)

    if daily_consumption <= 0:
        return {"risk": "None", "days_remaining": None, "shortfall_days": 0, "projected_depletion": None}

    risk = "None"
    shortfall_days = 0

    if days_remaining <= 0:
        risk = "Out of Stock"
        shortfall_days = next_resupply_days
    elif days_remaining < next_resupply_days:
        shortfall_days = round(next_resupply_days - days_remaining, 1)
        if shortfall_days > next_resupply_days * 0.5:
            risk = "Critical"
        else:
            risk = "High"
    elif days_remaining < days_needed:
        risk = "Medium"
    else:
        risk = "Low"

    return {
        "risk": risk,
        "days_remaining": days_remaining,
        "shortfall_days": shortfall_days,
        "next_resupply_days": next_resupply_days
    }


def get_inventory_state(quantity: float, minimum_stock: float, critical_level: float) -> str:
    """Return the inventory status label."""
    if quantity <= 0:
        return "Out of Stock"
    elif quantity <= critical_level:
        return "Critical"
    elif quantity <= minimum_stock:
        return "Low"
    return "Normal"


async def get_station_forecast(db: AsyncSession, station_id: str) -> List[Dict]:
    """Return forecast data for all inventory items at a station."""
    result = await db.execute(
        select(Inventory).where(Inventory.station_id == station_id)
    )
    items = result.scalars().all()

    forecasts = []
    for item in items:
        available = max(0.0, item.quantity - item.reserved_quantity)
        days_rem = calculate_days_remaining(available, item.daily_consumption)
        risk_info = assess_shortage_risk(
            available, item.daily_consumption, item.next_resupply_days
        )
        state = get_inventory_state(item.quantity, item.minimum_stock, item.critical_level)
        forecasts.append({
            "id": item.id,
            "item_code": item.item_code,
            "item_name": item.item_name,
            "category": item.category,
            "station_id": item.station_id,
            "quantity": item.quantity,
            "unit": item.unit,
            "available_quantity": available,
            "minimum_stock": item.minimum_stock,
            "critical_level": item.critical_level,
            "daily_consumption": item.daily_consumption,
            "reserved_quantity": item.reserved_quantity,
            "next_resupply_days": item.next_resupply_days,
            "days_remaining": days_rem if days_rem != float('inf') else None,
            "shortage_risk": risk_info["risk"],
            "shortfall_days": risk_info["shortfall_days"],
            "state": state
        })

    return forecasts


async def get_global_forecast(db: AsyncSession) -> List[Dict]:
    """Return forecast for ALL inventory across all stations."""
    result = await db.execute(select(Inventory))
    items = result.scalars().all()

    forecasts = []
    for item in items:
        available = max(0.0, item.quantity - item.reserved_quantity)
        days_rem = calculate_days_remaining(available, item.daily_consumption)
        state = get_inventory_state(item.quantity, item.minimum_stock, item.critical_level)
        risk_info = assess_shortage_risk(
            available, item.daily_consumption, item.next_resupply_days
        )
        forecasts.append({
            "id": item.id,
            "item_code": item.item_code,
            "item_name": item.item_name,
            "category": item.category,
            "station_id": item.station_id,
            "quantity": item.quantity,
            "unit": item.unit,
            "available_quantity": available,
            "minimum_stock": item.minimum_stock,
            "critical_level": item.critical_level,
            "daily_consumption": item.daily_consumption,
            "reserved_quantity": item.reserved_quantity,
            "next_resupply_days": item.next_resupply_days,
            "days_remaining": days_rem if days_rem != float('inf') else None,
            "shortage_risk": risk_info["risk"],
            "shortfall_days": risk_info["shortfall_days"],
            "state": state
        })

    return forecasts
