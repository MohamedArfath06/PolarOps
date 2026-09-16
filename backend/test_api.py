"""
POLARIS X — Live API Endpoints Verification Test
Tests all FastAPI endpoints using httpx AsyncClient.
"""

import asyncio
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from httpx import AsyncClient, ASGITransport
from main import app
from database import init_db


async def test_all_endpoints():
    print("\n--- Starting FastAPI Endpoints Verification ---")
    await init_db()
    transport = ASGITransport(app=app)
    
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health
        res = await client.get("/health")
        assert res.status_code == 200, f"/health returned {res.status_code}"
        assert res.json()["status"] == "healthy"
        print("  [PASS] GET /health -> 200 healthy")

        # 2. Root
        res = await client.get("/")
        assert res.status_code == 200
        assert res.json()["system"] == "POLAROPS"
        print("  [PASS] GET / -> 200 system POLAROPS")

        # 3. Dashboard
        res = await client.get("/dashboard")
        assert res.status_code == 200
        dash = res.json()
        assert "stats" in dash
        assert "stations" in dash
        assert "active_missions" in dash
        assert dash["stats"]["total_cargo"] >= 10
        print(f"  [PASS] GET /dashboard -> 200 (Mission continuity: {dash['stats']['mission_continuity']}%)")

        # 4. Stations
        res = await client.get("/stations")
        assert res.status_code == 200
        stations = res.json()
        assert len(stations) == 3
        print(f"  [PASS] GET /stations -> 200 ({len(stations)} stations)")

        # 5. Personnel
        res = await client.get("/personnel")
        assert res.status_code == 200
        pers = res.json()
        assert len(pers) >= 20
        print(f"  [PASS] GET /personnel -> 200 ({len(pers)} members)")

        # 6. Assets
        res = await client.get("/assets")
        assert res.status_code == 200
        assets = res.json()
        assert len(assets) >= 10
        print(f"  [PASS] GET /assets -> 200 ({len(assets)} assets)")

        # 7. Inventory
        res = await client.get("/inventory")
        assert res.status_code == 200
        inv = res.json()
        assert len(inv) >= 15
        print(f"  [PASS] GET /inventory -> 200 ({len(inv)} items with forecast)")

        # 8. Cargo
        res = await client.get("/cargo")
        assert res.status_code == 200
        cargo = res.json()
        c1042 = next(c for c in cargo if c["id"] == "C-1042")
        assert c1042["status"] == "Delayed"
        print("  [PASS] GET /cargo -> 200 (Found C-1042 Delayed)")

        # 9. Missions
        res = await client.get("/missions")
        assert res.status_code == 200
        missions = res.json()
        m027 = next(m for m in missions if m["id"] == "M-027")
        assert m027["status"] == "At Risk"
        print("  [PASS] GET /missions -> 200 (Found M-027 At Risk)")

        # 10. Impact Analysis POST /impact/analyze
        res = await client.post("/impact/analyze", json={
            "type": "cargo_delay",
            "entity_id": "C-1042",
            "delay_days": 5,
            "is_simulation": False
        })
        assert res.status_code == 200
        impact = res.json()
        assert impact["disruption_id"] is not None
        assert len(impact["impact_chain"]) > 0
        disruption_id = impact["disruption_id"]
        print(f"  [PASS] POST /impact/analyze -> 200 (Disruption ID: {disruption_id[:8]}..., Chain depth: {len(impact['impact_chain'])})")

        # 11. Recovery Generate POST /recovery/generate
        res = await client.post("/recovery/generate", json={"disruption_id": disruption_id})
        assert res.status_code == 200
        rec = res.json()
        assert len(rec["options"]) >= 2
        print(f"  [PASS] POST /recovery/generate -> 200 ({len(rec['options'])} options generated)")

        # 12. Non-Destructive Simulation POST /simulation/run
        res = await client.post("/simulation/run", json={
            "scenario_type": "cargo_delay",
            "entity_id": "C-1042",
            "parameters": {"delay_days": 5}
        })
        assert res.status_code == 200
        sim = res.json()
        assert "mission_continuity_before" in sim
        assert "mission_continuity_after" in sim
        print(f"  [PASS] POST /simulation/run -> 200 (Before: {sim['mission_continuity_before']} -> After: {sim['mission_continuity_after']})")

        # 13. Alerts GET /alerts
        res = await client.get("/alerts")
        assert res.status_code == 200
        alerts = res.json()
        assert len(alerts) >= 5
        print(f"  [PASS] GET /alerts -> 200 ({len(alerts)} alerts)")

        # 14. Demo Reset POST /demo/reset
        res = await client.post("/demo/reset")
        assert res.status_code == 200
        assert res.json()["success"] is True
        print("  [PASS] POST /demo/reset -> 200 (System restored)")

    print("\n--- All 14 API Endpoints Verified Successfully! ---")


if __name__ == "__main__":
    asyncio.run(test_all_endpoints())
