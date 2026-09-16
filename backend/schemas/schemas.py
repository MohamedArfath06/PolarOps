from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# ─── Station ────────────────────────────────────────────────────────────────

class StationBase(BaseModel):
    code: str
    name: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str = "Operational"
    capacity: int = 50
    personnel_count: int = 0
    fuel_level: float = 100.0

class StationCreate(StationBase):
    id: str

class StationOut(StationBase):
    id: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ─── Personnel ──────────────────────────────────────────────────────────────

class PersonnelBase(BaseModel):
    name: str
    role: str
    team: Optional[str] = None
    station_id: Optional[str] = None
    status: str = "Available"
    current_location: Optional[str] = None
    assigned_mission_id: Optional[str] = None
    availability: float = 1.0
    specialization: Optional[str] = None

class PersonnelCreate(PersonnelBase):
    id: str

class PersonnelOut(PersonnelBase):
    id: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ─── Asset ──────────────────────────────────────────────────────────────────

class AssetBase(BaseModel):
    asset_code: str
    name: str
    type: Optional[str] = None
    station_id: Optional[str] = None
    status: str = "Operational"
    condition_score: float = 100.0
    fuel_level: float = 100.0
    battery_level: float = 100.0
    maintenance_due: Optional[str] = None
    assigned_mission_id: Optional[str] = None

class AssetCreate(AssetBase):
    id: str

class AssetOut(AssetBase):
    id: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class AssetUpdate(BaseModel):
    status: Optional[str] = None
    condition_score: Optional[float] = None
    fuel_level: Optional[float] = None
    battery_level: Optional[float] = None
    assigned_mission_id: Optional[str] = None


# ─── Inventory ──────────────────────────────────────────────────────────────

class InventoryBase(BaseModel):
    item_code: str
    item_name: str
    category: Optional[str] = None
    station_id: Optional[str] = None
    quantity: float = 0.0
    unit: str = "units"
    minimum_stock: float = 0.0
    critical_level: float = 0.0
    daily_consumption: float = 0.0
    reserved_quantity: float = 0.0
    next_resupply_days: int = 0

class InventoryCreate(InventoryBase):
    id: str

class InventoryOut(InventoryBase):
    id: str
    available_quantity: Optional[float] = None
    days_remaining: Optional[float] = None
    state: Optional[str] = None
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ─── Cargo ──────────────────────────────────────────────────────────────────

class CargoBase(BaseModel):
    cargo_code: str
    description: Optional[str] = None
    category: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    current_location: Optional[str] = None
    transport_mode: Optional[str] = None
    weight: float = 0.0
    quantity: int = 1
    priority: str = "Normal"
    status: str = "Planned"
    planned_departure: Optional[str] = None
    planned_arrival: Optional[str] = None
    actual_arrival: Optional[str] = None
    delay_days: int = 0
    linked_mission_id: Optional[str] = None
    linked_inventory_id: Optional[str] = None
    linked_asset_id: Optional[str] = None
    container_id: Optional[str] = None

class CargoCreate(CargoBase):
    id: str

class CargoOut(CargoBase):
    id: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class CargoUpdate(BaseModel):
    status: Optional[str] = None
    delay_days: Optional[int] = None
    current_location: Optional[str] = None


# ─── Mission ────────────────────────────────────────────────────────────────

class MissionBase(BaseModel):
    mission_code: str
    mission_name: str
    station_id: Optional[str] = None
    priority: str = "Normal"
    status: str = "Planned"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    team: Optional[str] = None
    required_personnel: int = 0
    description: Optional[str] = None
    objective: Optional[str] = None

class MissionCreate(MissionBase):
    id: str

class MissionOut(MissionBase):
    id: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ─── Dependency ─────────────────────────────────────────────────────────────

class DependencyBase(BaseModel):
    source_type: str
    source_id: str
    target_type: str
    target_id: str
    relationship_type: Optional[str] = None
    criticality: str = "High"

class DependencyCreate(DependencyBase):
    id: str

class DependencyOut(DependencyBase):
    id: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ─── Disruption ─────────────────────────────────────────────────────────────

class DisruptionRequest(BaseModel):
    type: str
    entity_type: str
    entity_id: str
    severity: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[dict] = None
    is_simulation: bool = False

class DisruptionOut(BaseModel):
    id: str
    disruption_code: str
    type: str
    entity_type: str
    entity_id: str
    severity: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    status: str
    is_simulation: bool = False
    model_config = {"from_attributes": True}


# ─── Impact ─────────────────────────────────────────────────────────────────

class ImpactRequest(BaseModel):
    type: str
    entity_id: str
    delay_days: Optional[int] = None
    parameters: Optional[dict] = None
    is_simulation: bool = False

class ImpactRecordOut(BaseModel):
    id: str
    disruption_id: str
    affected_type: str
    affected_id: str
    affected_name: Optional[str] = None
    impact_level: str
    impact_reason: Optional[str] = None
    estimated_delay: int = 0
    model_config = {"from_attributes": True}

class ImpactAnalysisResult(BaseModel):
    disruption_id: str
    severity: str
    affected_cargo: List[str] = []
    affected_inventory: List[str] = []
    affected_assets: List[str] = []
    affected_missions: List[str] = []
    affected_teams: List[str] = []
    affected_personnel: List[str] = []
    estimated_delay_days: int = 0
    impact_chain: List[dict] = []
    summary: str = ""
    records: List[ImpactRecordOut] = []


# ─── Recovery ───────────────────────────────────────────────────────────────

class RecoveryGenerateRequest(BaseModel):
    disruption_id: str

class RecoveryOptionOut(BaseModel):
    id: str
    disruption_id: str
    option_name: str
    description: Optional[str] = None
    mission_continuity_score: float
    safety_score: float
    time_score: float
    resource_score: float
    cost_score: float
    total_score: float
    feasible: bool
    rank: int
    action_steps: Optional[str] = None
    estimated_delay_days: int = 0
    explanation: Optional[str] = None
    model_config = {"from_attributes": True}


# ─── Recovery Plan ──────────────────────────────────────────────────────────

class RecoveryPlanCreate(BaseModel):
    disruption_id: str
    selected_option_id: str
    notes: Optional[str] = None

class RecoveryPlanOut(BaseModel):
    id: str
    disruption_id: str
    selected_option_id: str
    status: str
    approved_by: Optional[str] = None
    created_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    notes: Optional[str] = None
    model_config = {"from_attributes": True}

class RecoveryPlanApprove(BaseModel):
    approved_by: str = "Commander"
    notes: Optional[str] = None


# ─── Alert ──────────────────────────────────────────────────────────────────

class AlertOut(BaseModel):
    id: str
    type: str
    severity: str
    title: str
    message: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    created_at: Optional[datetime] = None
    acknowledged: bool = False
    model_config = {"from_attributes": True}


# ─── Simulation ─────────────────────────────────────────────────────────────

class SimulationRequest(BaseModel):
    scenario_type: str  # cargo_delay, vehicle_failure, inventory_shortage, personnel_unavailable
    entity_id: str
    parameters: dict = {}

class SimulationResult(BaseModel):
    scenario_type: str
    entity_id: str
    before_state: dict
    after_state: dict
    affected_entities: List[dict] = []
    mission_continuity_before: float
    mission_continuity_after: float
    impact_chain: List[dict] = []
    recovery_options: List[dict] = []


# ─── Dashboard ──────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    active_expeditions: int = 1
    total_personnel: int = 0
    total_cargo: int = 0
    critical_assets: int = 0
    low_inventory: int = 0
    active_alerts: int = 0
    mission_continuity: float = 0.0
    resource_readiness: float = 0.0
    asset_readiness: float = 0.0
    personnel_readiness: float = 0.0


# ─── Audit ──────────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: str
    timestamp: Optional[datetime] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    description: Optional[str] = None
    user_role: Optional[str] = None
    model_config = {"from_attributes": True}
