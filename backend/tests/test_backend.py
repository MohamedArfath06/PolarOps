"""
POLARIS X — Comprehensive Pytest Backend Test Suite
Covers:
1. Health check & Root system info
2. Database entities & seed data integrity
3. Recovery scoring engine formula & safety ranking
4. Inventory depletion forecast logic & endpoint
5. Cargo delay disruption BFS impact analysis
6. Vehicle failure disruption & alternative vehicle discovery
7. Dynamic mission risk reasoning ("Why is this mission at risk?")
8. Recovery options generation & recommendation
9. Non-destructive simulation verification
10. Recovery plan approval & demo reset roundtrip
"""

import pytest
import os
import sys
from httpx import AsyncClient, ASGITransport

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from database import init_db, AsyncSessionLocal
from models.models import (
    Station, Personnel, Asset, Inventory, Cargo, Mission,
    Dependency, Disruption, ImpactRecord, RecoveryOption, RecoveryPlan
)
from services.recovery_engine import _calculate_score, _rank_options
from services.forecast_engine import calculate_days_remaining, assess_shortage_risk
from services.simulation_engine import simulate_scenario
from sqlalchemy import select


@pytest.fixture(autouse=True)
async def ensure_db():
    await init_db()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_health_and_root(client: AsyncClient):
    res = await client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

    res_root = await client.get("/")
    assert res_root.status_code == 200
    root_data = res_root.json()
    assert "POLAROPS" in root_data["system"]
    assert "SIH26062" in root_data["note"]


@pytest.mark.asyncio
async def test_database_seed_integrity():
    async with AsyncSessionLocal() as session:
        stations = (await session.execute(select(Station))).scalars().all()
        assert len(stations) == 3, f"Expected 3 stations, got {len(stations)}"

        cargo = (await session.execute(select(Cargo))).scalars().all()
        assert len(cargo) >= 15, f"Expected at least 15 cargo consignments, got {len(cargo)}"

        assets = (await session.execute(select(Asset))).scalars().all()
        assert len(assets) >= 10, f"Expected at least 10 assets, got {len(assets)}"

        inventory = (await session.execute(select(Inventory))).scalars().all()
        assert len(inventory) >= 15, f"Expected at least 15 inventory items, got {len(inventory)}"

        personnel = (await session.execute(select(Personnel))).scalars().all()
        assert len(personnel) >= 20, f"Expected at least 20 personnel members, got {len(personnel)}"

        missions = (await session.execute(select(Mission))).scalars().all()
        assert len(missions) >= 5, f"Expected at least 5 missions, got {len(missions)}"

        disruptions = (await session.execute(select(Disruption))).scalars().all()
        assert len(disruptions) >= 1, f"Expected at least 1 baseline disruption, got {len(disruptions)}"


@pytest.mark.asyncio
async def test_scoring_formula_and_safety_ranking():
    # Exact weights: 0.35 MC, 0.25 Safety, 0.20 Time, 0.10 Resource, 0.10 Cost
    mock_option = {
        "mission_continuity_score": 90.0,
        "safety_score": 85.0,
        "time_score": 70.0,
        "resource_score": 80.0,
        "cost_score": 75.0,
    }
    score = _calculate_score(mock_option)
    expected = 0.35 * 90.0 + 0.25 * 85.0 + 0.20 * 70.0 + 0.10 * 80.0 + 0.10 * 75.0
    assert abs(score - round(expected, 1)) < 0.01

    # Infeasible option ranking safety test:
    # Option 1 has higher raw scores but is INFEASIBLE.
    # Option 2 has balanced scores and is FEASIBLE.
    # Feasible option must be ranked #1 and recommended.
    options = [
        {
            "id": "opt-infeasible",
            "is_feasible": False,
            "mission_continuity_score": 98.0,
            "safety_score": 95.0,
            "time_score": 90.0,
            "resource_score": 90.0,
            "cost_score": 90.0,
        },
        {
            "id": "opt-feasible",
            "is_feasible": True,
            "mission_continuity_score": 85.0,
            "safety_score": 80.0,
            "time_score": 80.0,
            "resource_score": 85.0,
            "cost_score": 80.0,
        },
    ]
    ranked = _rank_options(options)
    assert ranked[0]["id"] == "opt-feasible", "Feasible option did not outrank infeasible option!"
    assert ranked[0]["is_recommended"] is True
    assert ranked[1]["is_recommended"] is False


@pytest.mark.asyncio
async def test_inventory_forecasting(client: AsyncClient):
    days = calculate_days_remaining(60.0, 6.0)
    assert days == 10.0

    risk = assess_shortage_risk(available=30.0, daily_consumption=5.0, next_resupply_days=12)
    assert risk["risk"] in ("Critical", "High")
    assert risk["shortfall_days"] == 6.0

    res = await client.get("/inventory/forecast")
    assert res.status_code == 200
    forecast_data = res.json()
    assert "all" in forecast_data
    assert "warnings" in forecast_data
    forecast_list = forecast_data["all"]
    assert len(forecast_list) > 0
    assert any(f["item_code"] == "INV-017" for f in forecast_list)


@pytest.mark.asyncio
async def test_cargo_delay_impact_traversal(client: AsyncClient):
    # Analyze cargo C-1042 delay (5 days)
    payload = {
        "type": "cargo_delay",
        "entity_id": "C-1042",
        "delay_days": 5,
        "is_simulation": True,
    }
    res = await client.post("/impact/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["severity"] in ("Critical", "High")
    assert len(data["records"]) >= 3 or len(data["impact_chain"]) >= 3

    # Traversal must reach inventory, asset, or mission
    affected_ids = [r["affected_id"] for r in data["records"]]
    assert any("M-027" in aid or "G-03" in aid or "INV-017" in aid for aid in affected_ids)


@pytest.mark.asyncio
async def test_vehicle_failure_impact_traversal(client: AsyncClient):
    # Analyze vehicle failure on V-02
    payload = {
        "type": "vehicle_breakdown",
        "entity_id": "A-V02",
        "parameters": {"repair_hours": 36},
        "is_simulation": True,
    }
    res = await client.post("/impact/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["records"]) >= 1
    # Check that mission M-038 is in the blast radius
    affected_ids = [r["affected_id"] for r in data["records"]]
    assert any("M-038" in aid or "A-V02" in aid for aid in affected_ids)


@pytest.mark.asyncio
async def test_mission_dynamic_risk_chain(client: AsyncClient):
    # Mission M-027 is At Risk initially due to C-1042 delay and INV-017 stockout
    res = await client.get("/missions/M-027")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "At Risk"
    assert "risk_analysis" in data
    risk_info = data["risk_analysis"]
    assert risk_info["has_risk"] is True
    assert len(risk_info["risk_steps"]) >= 2

    # Verify that the risk steps mention cargo or inventory
    step_labels = " ".join(s["label"] for s in risk_info["risk_steps"])
    assert "C-1042" in step_labels or "cargo" in step_labels.lower()
    assert "INV-017" in step_labels or "exciter" in step_labels.lower()


@pytest.mark.asyncio
async def test_recovery_generation_and_recommendation(client: AsyncClient):
    # Fetch existing disruptions
    disruptions_res = await client.get("/impact/disruptions")
    assert disruptions_res.status_code == 200
    disruptions = disruptions_res.json()
    assert len(disruptions) > 0
    dis_id = disruptions[0]["id"]

    rec_res = await client.post("/recovery/generate", json={"disruption_id": dis_id})
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert "options" in rec_data
    options = rec_data["options"]
    assert len(options) >= 2

    # Exactly one option should be recommended
    recommended = [o for o in options if o.get("is_recommended")]
    assert len(recommended) == 1
    assert recommended[0]["total_score"] >= 70.0


@pytest.mark.asyncio
async def test_non_destructive_simulation():
    # Run simulation on V-02
    async with AsyncSessionLocal() as session:
        result = await simulate_scenario(
            db=session,
            scenario_type="vehicle_failure",
            entity_id="A-V02",
            parameters={"failure_duration_hours": 48}
        )
        assert result["scenario_type"] == "vehicle_failure"
        assert result["after_state"]["snapshot"]["_simulated"] is True
        assert result["mission_continuity_after"] < result["mission_continuity_before"]
        assert len(result["affected_entities"]) >= 1

        # Verify that the live DB record for V-02 was NOT permanently modified
        v02 = await session.get(Asset, "A-V02")
        assert v02 is not None
        assert v02.status == "Operational"


@pytest.mark.asyncio
async def test_recovery_approval_and_demo_reset(client: AsyncClient):
    # 1. Reset demo first to ensure clean state
    reset_res = await client.post("/reset-demo")
    assert reset_res.status_code == 200

    # 2. Verify M-027 starts At Risk
    m_res = await client.get("/missions/M-027")
    assert m_res.json()["status"] == "At Risk"

    # 3. Generate recovery for DIS-001
    rec_res = await client.post("/recovery/generate", json={"disruption_id": "DIS-001"})
    assert rec_res.status_code == 200
    options = rec_res.json()["options"]
    assert len(options) > 0
    rec_opt = [o for o in options if o.get("is_recommended")][0]

    # 4. Create recovery plan
    plan_res = await client.post("/recovery/plans", json={
        "disruption_id": "DIS-001",
        "selected_option_id": rec_opt["id"],
        "notes": "Automated test recovery plan approval"
    })
    assert plan_res.status_code == 200
    plan = plan_res.json()

    # 5. Approve recovery plan
    appr_res = await client.post(f"/recovery/plans/{plan['id']}/approve", json={
        "approved_by": "Commander Sharma",
        "notes": "Approved for emergency execution"
    })
    assert appr_res.status_code == 200

    # 6. Verify Mission M-027 is now restored to 'Active'
    m_restored = await client.get("/missions/M-027")
    assert m_restored.json()["status"] == "Active"

    # 7. Final Demo Reset to leave DB in pristine demo state
    final_reset = await client.post("/reset-demo")
    assert final_reset.status_code == 200
    m_final = await client.get("/missions/M-027")
    assert m_final.json()["status"] == "At Risk"
