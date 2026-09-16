# POLARIS X ❄️
### Integrated Polar Expedition Logistics & Disruption Recovery Platform
**Smart India Hackathon 2026 — Problem Statement ID:** SIH26062  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** National Centre for Polar and Ocean Research (NCPOR)  
**Category:** Software | **Theme:** Smart Automation  

---

> ⚠️ **PROTOTYPE NOTICE:** All data, telemetry, routes, and coordinates in this platform are **SYNTHETIC / SIMULATED PROTOTYPE DATA** generated for the Smart India Hackathon 2026. This system is not connected to real NCPOR production systems or classified Antarctic communication networks.

---

## 🧭 Executive Summary

Antarctic and Arctic research expeditions operate in Earth's harshest, most unforgiving environments. Traditional logistics ERPs track static inventory and point-to-point shipments, but **fail entirely when disruptions cascade across interconnected mission dependencies**:
- A 5-day blizzard delays a cargo ship.
- A critical generator exciter module runs out of stock at Bharati station.
- Scheduled maintenance on Generator G-03 is blocked.
- Deep Ice Core Mission M-027 faces power failure and is thrown into "At Risk" status.
- Team Alpha's scientific mission is compromised.

**POLARIS X** solves this with **Disruption Intelligence**:
1. **Cross-Domain Graph Traversal**: Automatically maps dependencies from Cargo → Inventory → Assets → Missions → Personnel → Stations.
2. **Impact Engine**: Quantifies blast radius and projects timeline slippages across all linked missions.
3. **Recovery Engine & Multi-Criteria Scoring**: Evaluates alternative mitigations using a balanced 5-pillar scoring algorithm:
   $$\text{Score} = 0.35 \times \text{MissionContinuity} + 0.25 \times \text{Safety} + 0.20 \times \text{Time} + 0.10 \times \text{Resource} + 0.10 \times \text{Cost}$$
4. **Non-Destructive Scenario Lab**: Simulates disruptions and mitigations in an isolated sandbox without mutating live operational records.
5. **Commander Approval Workflow**: Single-click authorization to operationalize the optimal recovery plan.

---

## ⚡ System Architecture & Technology Stack

```
┌───────────────────────────────────────────────────────────┐
│                    POLARIS X FRONTEND                     │
│  React 19 + TypeScript + Vite 8 + Tailwind CSS            │
│  React Router + Recharts + React-Leaflet + Lucide Icons   │
│  Resilient LocalStorage Offline Cache                     │
└─────────────────────────────▲─────────────────────────────┘
                              │ REST (JSON)
┌─────────────────────────────▼─────────────────────────────┐
│                    POLARIS X BACKEND                      │
│  FastAPI (Python 3.11+) + Pydantic v2                     │
│  SQLAlchemy 2.x (Async) + aiosqlite                       │
├───────────────────────────────────────────────────────────┤
│                     CORE ENGINES                          │
│  • impact_engine.py      (BFS Cross-Domain Traversal)     │
│  • recovery_engine.py    (Multi-Option Generation & Rank) │
│  • simulation_engine.py  (Non-Destructive Sandbox)        │
│  • forecast_engine.py    (Linear Depletion & Shortage)    │
├───────────────────────────────────────────────────────────┤
│                     SQLITE DATABASE                       │
│  Stations · Personnel · Assets · Inventory · Cargo        │
│  Missions · Dependencies · Disruptions · ImpactRecords   │
│  RecoveryOptions · RecoveryPlans · Alerts · AuditLogs     │
└───────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** installed

### 2. Backend Setup & Startup
```powershell
# Navigate to backend
cd "c:\Users\SRIVARSHAN\OneDrive\Desktop\project y\polaris-x\backend"

# Install Python dependencies
pip install -r requirements.txt

# Run the comprehensive 8/8 verification test suite
python test_suite.py

# Start the FastAPI backend server (Runs on port 8000)
uvicorn main:app --reload --port 8000
```
Backend Swagger Documentation: `http://localhost:8000/api/docs`  
Backend Health Check: `http://localhost:8000/health`

### 3. Frontend Setup & Startup
```powershell
# Navigate to frontend in a new terminal
cd "c:\Users\SRIVARSHAN\OneDrive\Desktop\project y\polaris-x\frontend"

# Build verification
npm run build

# Start the Vite development server (Runs on port 5173)
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 🎬 End-to-End Demo Walkthrough Script

| Step | Screen | Action | Observed Result |
|---|---|---|---|
| **1** | `/login` | Click "Access System" with preset `commander / polaris2026` | Logs in as Expedition Commander and redirects to Dashboard. |
| **2** | `/dashboard` | View top metrics, radar health chart, active alerts, and stations | Mission Continuity shows **86.5%** with active warning alerts. |
| **3** | `/cargo` | Locate consignment **C-1042** (Generator Spare) | Marked as **Delayed (+5 days)**. Linked to Mission M-027. |
| **4** | `/cargo` | Click on C-1042 row to open details, click **"Analyze Impact"** | System invokes the BFS Impact Engine. |
| **5** | `/impact` | Inspect the visual dependency chain | Chain shows: `C-1042 (Cargo) → INV-017 (Inventory) → A-G03 (Asset) → M-027 (Mission) → Team Alpha (Personnel)`. |
| **6** | `/scenario-lab` | Select Scenario: "Cargo Delay" → C-1042 → Click "Simulate Disruption" | Sandbox proves non-destructive: Shows Mission Continuity dropping from **86.5% → 63.5%** without touching the live DB. |
| **7** | `/scenario-lab` | Click "Find Recovery Options" | Engine generates 3 ranked options. **Plan B (Transfer from Maitri)** is recommended with Top Score **82.5**. |
| **8** | `/recovery` | Select Plan B and click **"Approve"** | Commander authorization commits the recovery intervention. |
| **9** | `/missions` | Navigate to Missions list | Mission **M-027** is automatically restored from **At Risk → Active**. Mission continuity climbs back. |
| **10** | Sidebar | Click **"Reset Demo"** at the bottom of the sidebar | Clears simulation records and restores demo back to initial state for the next judge evaluation. |

---

## 🧪 Automated Verification Suite

Run the full automated test suite anytime to prove engine correctness:
```powershell
cd backend
python test_suite.py
python test_api.py
```

### Verified Test Cases:
- `[PASS]` Recovery scoring model (35% Continuity, 25% Safety, 20% Time, 10% Resource, 10% Cost)
- `[PASS]` Linear inventory depletion forecast with resupply shortfall warnings
- `[PASS]` Seed data graph coherence across 3 stations, 25 personnel, 11 assets, 18 inventory items, 11 cargo shipments, 6 missions, 20 dependencies
- `[PASS]` BFS cross-domain impact engine traversal down 5 distinct entity layers
- `[PASS]` Recovery option generator ranking algorithms
- `[PASS]` Non-destructive sandbox guarantee (live database records immutable during simulation)
- `[PASS]` Commander approval state transition workflow
- `[PASS]` Complete demo state reset
- `[PASS]` All 14 FastAPI REST endpoints verified

---

## 🛡️ Hackathon Evaluation Standards (SIH26062)
- **Zero non-functional UI elements**: Every button, tab, filter, and modal performs an active, verified action.
- **Fail-safe Offline Cache**: In case of network disconnection during jury presentations, the client automatically serves cached operational state.
- **Dark Tactical Polar Aesthetics**: Engineered to match Antarctic expedition ops centers (deep navy `#020817`, cyan/ice `#38bdf8`, clear severity color coding).
