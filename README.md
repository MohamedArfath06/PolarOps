# PolarOps ❄️
### Integrated Polar Expedition Logistics & Disruption Recovery Platform
**Smart India Hackathon 2026 — Problem Statement ID:** SIH26062  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** National Centre for Polar and Ocean Research (NCPOR)  
**Category:** Software | **Theme:** Smart Automation  

---

> ⚠️ **PROTOTYPE NOTICE:** Educational prototype using documented real-world case studies and simulated operational data generated for the Smart India Hackathon 2026. This system is not connected to real NCPOR production systems or classified Antarctic communication networks.

---

## 🧭 Executive Summary

Antarctic and Arctic research expeditions operate in Earth's harshest, most unforgiving environments. Traditional logistics ERPs track static inventory and point-to-point shipments, but **fail entirely when disruptions cascade across interconnected mission dependencies**:
- A cargo vessel's heavy crane locks up at Mawson Station.
- 40km of fast ice blocks resupply ships from reaching horseshoe harbour.
- Impenetrable Weddell Sea pack ice stops maritime access 85nm from Halley Station.
- Heavy sled TS-04 suffers a structural runner shear on the Leverett Glacier en route to the South Pole.

**POLARIS X** solves this with **Disruption Intelligence & Real-World Case Studies**:
1. **Real-World Case Studies Suite**: Evaluates four documented polar logistics incidents (AAP 2024 Mawson Crane Failure, AAP 2021 Sea-Ice Lockout, AAP 2002 Halley Access Blockage, USAP 2003 South Pole Traverse Sled Breakdown).
2. **Cross-Domain Graph Traversal**: Automatically maps dependencies from Cargo → Inventory → Assets → Missions → Personnel → Stations.
3. **Impact Engine**: Quantifies blast radius and projects timeline slippages across all linked missions.
4. **Recovery Engine & Multi-Criteria Scoring**: Evaluates alternative mitigations using a balanced 5-pillar scoring algorithm:
   $$\text{Score} = 0.35 \times \text{MissionContinuity} + 0.25 \times \text{Safety} + 0.20 \times \text{Time} + 0.10 \times \text{Resource} + 0.10 \times \text{Cost}$$
5. **Non-Destructive Scenario Lab**: Simulates real-world disruptions and mitigations in an isolated sandbox without mutating live operational records.
6. **Commander Approval Workflow**: Single-click authorization to operationalize the optimal recovery plan.

---

## 📚 Real-World Polar Logistics Case Studies

| Case Study | Documented Location | Disruption Type | Primary Recovery Strategy |
|---|---|---|---|
| **1. Mawson Crane Failure** | Mawson Station (2024) | Vessel Crane Malfunction | Sikorsky S-92 Heavy-Lift Helicopter Air-Bridge |
| **2. Mawson Sea-Ice Lockout** | Mawson Station (2021) | 40km Fast Ice Barrier | Basler BT-67 Ski-Plane Aerial Drop & Shuttle |
| **3. Halley Access Blockage** | Halley VI / Weddell Sea (2002) | Maritime Ice Lockout (85nm) | Staging Camp Airfield & Twin Otter Air-Bridge |
| **4. South Pole Sled Breakdown** | South Pole Traverse (2003) | Structural Sled Runner Shear | Depot 3 Sled Replacement + LC-130 Air Support |

---

## ⚡ System Architecture & Technology Stack

┌───────────────────────────────────────────────────────────┐
│                    POLARIS X FRONTEND                     │
│  React 19 + TypeScript + Vite 8 + Tailwind CSS            │
│  React Router + Recharts + React-Leaflet + Lucide Icons   │
│  Interactive Operational Graph + Case Studies Engine      │
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

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** installed

### 2. Backend Setup & Startup
```powershell
# Navigate to backend
cd "backend"

# Install Python dependencies
pip install -r requirements.txt

# Run the comprehensive 8/8 verification test suite
python test_suite.py

# Start the FastAPI backend server (Runs on port 8000)
uvicorn main:app --reload --port 8000
