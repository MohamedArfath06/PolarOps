// POLAROPS — Shared Types

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
export type AssetStatus = 'Operational' | 'Maintenance' | 'Failed' | 'Reserved' | 'Transit';
export type PersonnelStatus = 'Available' | 'Assigned' | 'In Transit' | 'Medical' | 'Unavailable';
export type CargoStatus = 'Planned' | 'Packed' | 'In Transit' | 'At Station' | 'Delayed' | 'Delivered' | 'Cancelled';
export type MissionStatus = 'Planned' | 'Active' | 'At Risk' | 'Delayed' | 'Completed' | 'Cancelled';
export type InventoryState = 'Normal' | 'Low' | 'Critical' | 'Out of Stock';

export interface Station {
  id: string;
  code: string;
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  capacity: number;
  personnel_count: number;
  fuel_level: number;
}

export interface Personnel {
  id: string;
  name: string;
  role: string;
  team?: string;
  station_id?: string;
  status: PersonnelStatus;
  current_location?: string;
  assigned_mission_id?: string;
  availability: number;
  specialization?: string;
}

export interface Asset {
  id: string;
  asset_code: string;
  name: string;
  type?: string;
  station_id?: string;
  status: AssetStatus;
  condition_score: number;
  fuel_level: number;
  battery_level: number;
  maintenance_due?: string;
  assigned_mission_id?: string;
}

export interface InventoryItem {
  id: string;
  item_code: string;
  item_name: string;
  category?: string;
  station_id?: string;
  quantity: number;
  unit: string;
  available_quantity?: number;
  minimum_stock: number;
  critical_level: number;
  daily_consumption: number;
  reserved_quantity: number;
  next_resupply_days: number;
  days_remaining?: number | null;
  shortage_risk?: string;
  shortfall_days?: number;
  state?: InventoryState;
}

export interface CargoItem {
  id: string;
  cargo_code: string;
  description?: string;
  category?: string;
  origin?: string;
  destination?: string;
  current_location?: string;
  transport_mode?: string;
  weight: number;
  quantity: number;
  priority: string;
  status: CargoStatus;
  planned_departure?: string;
  planned_arrival?: string;
  actual_arrival?: string;
  delay_days: number;
  linked_mission_id?: string;
  linked_inventory_id?: string;
  linked_asset_id?: string;
  container_id?: string;
  timeline?: TimelineStage[];
  dependencies?: Dependency[];
  linked_mission?: { mission_code: string; mission_name: string; status: string; priority: string } | null;
}

export interface TimelineStage {
  stage: string;
  date?: string;
  completed: boolean;
  alert?: boolean;
}

export interface Mission {
  id: string;
  mission_code: string;
  mission_name: string;
  station_id?: string;
  priority: string;
  status: MissionStatus;
  start_date?: string;
  end_date?: string;
  team?: string;
  required_personnel: number;
  description?: string;
  objective?: string;
  dependencies?: Dependency[];
  assigned_personnel?: any[];
  assigned_assets?: any[];
  linked_cargo?: any[];
}

export interface Dependency {
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relationship_type?: string;
  criticality: string;
}

export interface Alert {
  id: string;
  type: string;
  severity: Severity;
  title: string;
  message?: string;
  entity_type?: string;
  entity_id?: string;
  created_at?: string;
  acknowledged: boolean;
}

export interface ImpactResult {
  disruption_id: string;
  severity: Severity;
  affected_cargo: string[];
  affected_inventory: string[];
  affected_assets: string[];
  affected_missions: string[];
  affected_teams: string[];
  affected_personnel: string[];
  estimated_delay_days: number;
  impact_chain: ImpactNode[];
  summary: string;
  records: ImpactRecord[];
}

export interface ImpactNode {
  type: string;
  id: string;
  name: string;
  depth: number;
  impact_level: string;
  relationship?: string;
  parent?: string;
}

export interface ImpactRecord {
  id: string;
  disruption_id: string;
  affected_type: string;
  affected_id: string;
  affected_name?: string;
  impact_level: string;
  impact_reason?: string;
  estimated_delay: number;
}

export interface RecoveryOption {
  id: string;
  disruption_id: string;
  option_name: string;
  description?: string;
  mission_continuity_score: number;
  safety_score: number;
  time_score: number;
  resource_score: number;
  cost_score: number;
  total_score: number;
  feasible: boolean;
  rank: number;
  action_steps?: string;
  estimated_delay_days: number;
  explanation?: string;
}

export interface SimulationResult {
  scenario_type: string;
  entity_id: string;
  entity_type: string;
  before_state: { snapshot: any; mission_continuity: number };
  after_state: { snapshot: any; mission_continuity: number };
  mission_continuity_before: number;
  mission_continuity_after: number;
  affected_entities: any[];
  impact_chain: any[];
  note: string;
}

export interface DashboardStats {
  active_expeditions: number;
  total_personnel: number;
  total_cargo: number;
  critical_assets: number;
  low_inventory: number;
  critical_inventory: number;
  active_alerts: number;
  critical_alerts: number;
  mission_continuity: number;
  resource_readiness: number;
  asset_readiness: number;
  personnel_readiness: number;
}
