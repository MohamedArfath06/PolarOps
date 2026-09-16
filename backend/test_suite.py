"""
POLARIS X — Comprehensive Verification Test Suite
Tests:
1. Impact Engine (BFS cross-domain dependency traversal)
2. Recovery Engine (Option generation, 35/25/20/10/10 scoring formula)
3. Forecast Engine (Linear depletion forecast, shortage warning)
4. Non-Destructive Simulation Engine (Live DB remains unmodified)
5. End-to-End Primary Demo Workflow:
   - Cargo C-1042 delayed 5 days
   - Impact traversal down to generator G-03, mission M-027, Team Alpha
   - Recovery generation (3 options)
   - Option ranking & recommendation
   - Commander approval of recovery plan
   - Mission status restoral to 'Active'
   - Demo reset returning DB to pristine demo state
"""

import asyncio
import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from database import AsyncSessionLocal, init_db
from models.models import (
    Station, Personnel, Asset, Inventory, Cargo, Mission,
    Dependency, Disruption, ImpactRecord, RecoveryOption, RecoveryPlan
)
from services.impact_engine import analyze_impact
from services.recovery_engine import generate_recovery_options, _calculate_score
from services.forecast_engine import calculate_days_remaining, assess_shortage_risk, get_global_forecast
from services.simulation_engine import simulate_scenario
from sqlalchemy import select


async def run_tests():
    print("==================================================")
    print("   POLARIS X — VERIFICATION & VALIDATION SUITE   ")
    print("   SIH26062 | Antarctic Expedition Recovery     ")
    print("==================================================")
    
    await init_db()
    passed = 0
    total = 0

    # ----------------------------------------------------
    # TEST 1: Scoring Engine Formula Verification
    # ----------------------------------------------------
    total += 1
    print("\n[TEST 1] Testing Recovery Scoring Formula (35/25/20/10/10)...")
    # Exact formula: 0.35*mc + 0.25*safety + 0.20*time + 0.10*resource + 0.10*cost
    option_mock = {
        "mission_continuity_score": 90.0,
        "safety_score": 85.0,
        "time_score": 70.0,
        "resource_score": 80.0,
        "cost_score": 75.0
    }
    score = _calculate_score(option_mock)
    expected = 0.35 * 90.0 + 0.25 * 85.0 + 0.20 * 70.0 + 0.10 * 80.0 + 0.10 * 75.0
    assert abs(score - round(expected, 1)) < 0.01, f"Expected {expected}, got {score}"
    print(f"  [PASS] Score calculation verified: {score} == {round(expected, 1)}")
    passed += 1

    # ----------------------------------------------------
    # TEST 2: Forecast Engine Verification
    # ----------------------------------------------------
    total += 1
    print("\n[TEST 2] Testing Inventory Depletion Forecast...")
    # Available = 50, daily_use = 5 -> days = 10
    days = calculate_days_remaining(50.0, 5.0)
    assert days == 10.0, f"Expected 10.0 days, got {days}"
    
    # Shortage assessment when next resupply is in 15 days (shortfall of 5 days)
    risk = assess_shortage_risk(available=50.0, daily_consumption=5.0, next_resupply_days=15)
    assert risk["risk"] in ("Critical", "High"), f"Expected Critical or High, got {risk['risk']}"
    assert risk["shortfall_days"] == 5.0, f"Expected 5.0 shortfall, got {risk['shortfall_days']}"
    print(f"  [PASS] Forecast logic verified: {days}d remaining, Risk: {risk['risk']}, Shortfall: {risk['shortfall_days']}d")
    passed += 1

    # ----------------------------------------------------
    # TEST 3: Seed Data Presence & Coherence
    # ----------------------------------------------------
    total += 1
    print("\n[TEST 3] Testing Seed Data Integrity...")
    async with AsyncSessionLocal() as session:
        c1042 = await session.get(Cargo, "C-1042")
        assert c1042 is not None, "Cargo C-1042 missing from database"
        assert c1042.status == "Delayed", f"Expected C-1042 Delayed, got {c1042.status}"

        inv017 = await session.get(Inventory, "INV-017")
        assert inv017 is not None, "INV-017 missing from database"
        assert inv017.quantity == 0, f"Expected INV-017 qty=0, got {inv017.quantity}"

        m027 = await session.get(Mission, "M-027")
        assert m027 is not None, "Mission M-027 missing"
        assert m027.status == "At Risk", f"Expected M-027 At Risk, got {m027.status}"

        deps = (await session.execute(select(Dependency))).scalars().all()
        assert len(deps) >= 15, f"Expected >= 15 dependencies, found {len(deps)}"
        print(f"  [PASS] Seed data coherent: C-1042 (Delayed), INV-017 (0 qty), M-027 (At Risk), {len(deps)} dependencies.")
        passed += 1

    # ----------------------------------------------------
    # TEST 4: Impact Engine BFS Dependency Traversal
    # ----------------------------------------------------
    total += 1
    print("\n[TEST 4] Testing Cross-Domain BFS Impact Engine...")
    async with AsyncSessionLocal() as session:
        result = await analyze_impact(
            db=session,
            entity_type="cargo",
            entity_id="C-1042",
            disruption_type="cargo_delay",
            delay_days=5,
            is_simulation=False
        )
        assert result["disruption_id"] is not None
        assert result["severity"] in ("Critical", "High")
        # Check that chain touches inventory, asset, and mission
        types_affected = {n["type"] for n in result["impact_chain"]}
        assert "inventory" in types_affected, "Impact traversal did not reach inventory"
        assert "asset" in types_affected, "Impact traversal did not reach asset"
        assert "mission" in types_affected, "Impact traversal did not reach mission"
        print(f"  [PASS] BFS traversal verified: Affected chain depth {len(result['impact_chain'])}, touched {types_affected}")
        passed += 1

    # ----------------------------------------------------
    # TEST 5: Recovery Option Generation & Ranking
    # ----------------------------------------------------
    total += 1
    print("\n[TEST 5] Testing Recovery Engine Generation & Ranking...")
    async with AsyncSessionLocal() as session:
        # Generate recovery options for the disruption just analyzed
        disruption_id = result["disruption_id"]
        options = await generate_recovery_options(session, disruption_id)
        assert len(options) >= 2, f"Expected at least 2 recovery options, got {len(options)}"
        # Rank 1 must have highest score
        rank_1 = next(o for o in options if o["rank"] == 1)
        for opt in options:
            assert rank_1["total_score"] >= opt["total_score"], "Rank 1 does not have the highest score"
        print(f"  [PASS] Generated {len(options)} options. Recommended option: '{rank_1['option_name']}' (Score: {rank_1['total_score']})")
        passed += 1

    # ----------------------------------------------------
    # TEST 6: Non-Destructive Simulation Verification
    # ----------------------------------------------------
    total += 1
    print("\n[TEST 6] Testing Non-Destructive Simulation Engine...")
    async with AsyncSessionLocal() as session:
        # Record state of M-021 before simulation
        m021_before = await session.get(Mission, "M-021")
        status_before = m021_before.status

        # Run vehicle failure simulation on V-01 (used by M-021)
        sim = await simulate_scenario(
            db=session,
            scenario_type="vehicle_failure",
            entity_id="A-V01",
            parameters={}
        )
        
        # Verify simulation returned before and after delta
        assert sim["mission_continuity_after"] < sim["mission_continuity_before"], "Simulation should show degraded continuity"
        
        # Verify LIVE database record was NOT mutated
        await session.refresh(m021_before)
        assert m021_before.status == status_before, "CRITICAL ERROR: Simulation mutated live database record!"
        print(f"  [PASS] Non-destructive guarantee verified: Continuity dropped from {sim['mission_continuity_before']} to {sim['mission_continuity_after']} without modifying DB.")
        passed += 1

    # ----------------------------------------------------
    # TEST 7: Commander Approval & State Mutation Flow
    # ----------------------------------------------------
    total += 1
    print("\n[TEST 7] Testing Recovery Plan Approval Workflow...")
    async with AsyncSessionLocal() as session:
        # Create a recovery plan with Rank 1 option
        import uuid
        from datetime import datetime
        plan_id = str(uuid.uuid4())
        plan = RecoveryPlan(
            id=plan_id,
            disruption_id=disruption_id,
            selected_option_id=rank_1["id"],
            status="Pending Approval",
            created_at=datetime.utcnow()
        )
        session.add(plan)
        await session.commit()

        # Approve the plan via the approval service logic
        from routes.recovery import _apply_recovery_effects
        disruption_obj = await session.get(Disruption, disruption_id)
        option_obj = await session.get(RecoveryOption, rank_1["id"])
        
        await _apply_recovery_effects(session, disruption_obj, option_obj)
        plan.status = "Approved"
        plan.approved_by = "Commander"
        await session.commit()

        # Check that M-027 is restored to Active
        m027_after = await session.get(Mission, "M-027")
        assert m027_after.status == "Active", f"Expected M-027 Active after recovery approval, got {m027_after.status}"
        print(f"  [PASS] Recovery plan approved. Mission M-027 successfully restored to status: '{m027_after.status}'.")
        passed += 1

    # ----------------------------------------------------
    # TEST 8: Demo Reset Verification
    # ----------------------------------------------------
    total += 1
    print("\n[TEST 8] Testing Demo Reset Functionality...")
    async with AsyncSessionLocal() as session:
        from routes.misc import reset_demo
        reset_res = await reset_demo(session)
        assert reset_res["success"] is True

        # Check that M-027 is back to At Risk
        m027_reset = await session.get(Mission, "M-027")
        assert m027_reset.status == "At Risk", f"Expected M-027 reset to At Risk, got {m027_reset.status}"

        # Check disruptions were reset to baseline DIS-001 and no simulations remain
        disruptions_left = (await session.execute(select(Disruption))).scalars().all()
        assert all(not d.is_simulation for d in disruptions_left), "Simulation disruptions remain after reset"
        assert any(d.id == "DIS-001" for d in disruptions_left), "Baseline disruption DIS-001 missing after reset"
        print(f"  [PASS] Demo reset verified: Baseline DIS-001 restored, simulation data cleared, M-027 restored to 'At Risk'.")
        passed += 1

    print("\n==================================================")
    print(f"   ALL {passed}/{total} VERIFICATION TESTS PASSED SUCCESSFULLY!   ")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_tests())
