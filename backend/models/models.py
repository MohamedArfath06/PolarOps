from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Station(Base):
    __tablename__ = "stations"
    id = Column(String, primary_key=True)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    location = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="Operational")  # Operational, Limited, Offline
    capacity = Column(Integer, default=50)
    personnel_count = Column(Integer, default=0)
    fuel_level = Column(Float, default=100.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Personnel(Base):
    __tablename__ = "personnel"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    team = Column(String)
    station_id = Column(String, ForeignKey("stations.id"))
    status = Column(String, default="Available")  # Available, Assigned, In Transit, Medical, Unavailable
    current_location = Column(String)
    assigned_mission_id = Column(String)
    availability = Column(Float, default=1.0)
    specialization = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class Asset(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True)
    asset_code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    type = Column(String)  # Vehicle, Generator, Communication, Equipment
    station_id = Column(String, ForeignKey("stations.id"))
    status = Column(String, default="Operational")  # Operational, Maintenance, Failed, Reserved, Transit
    condition_score = Column(Float, default=100.0)
    fuel_level = Column(Float, default=100.0)
    battery_level = Column(Float, default=100.0)
    maintenance_due = Column(String)
    assigned_mission_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(String, primary_key=True)
    item_code = Column(String, unique=True, nullable=False)
    item_name = Column(String, nullable=False)
    category = Column(String)  # Fuel, Food, Water, Medicine, Battery, Spare Parts, Equipment
    station_id = Column(String, ForeignKey("stations.id"))
    quantity = Column(Float, default=0.0)
    unit = Column(String, default="units")
    minimum_stock = Column(Float, default=0.0)
    critical_level = Column(Float, default=0.0)
    daily_consumption = Column(Float, default=0.0)
    reserved_quantity = Column(Float, default=0.0)
    next_resupply_days = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Cargo(Base):
    __tablename__ = "cargo"
    id = Column(String, primary_key=True)
    cargo_code = Column(String, unique=True, nullable=False)
    description = Column(String)
    category = Column(String)
    origin = Column(String)
    destination = Column(String)
    current_location = Column(String)
    transport_mode = Column(String)  # Air, Sea, Land
    weight = Column(Float, default=0.0)
    quantity = Column(Integer, default=1)
    priority = Column(String, default="Normal")  # Critical, High, Normal, Low
    status = Column(String, default="Planned")  # Planned, Packed, In Transit, At Station, Delayed, Delivered, Cancelled
    planned_departure = Column(String)
    planned_arrival = Column(String)
    actual_arrival = Column(String)
    delay_days = Column(Integer, default=0)
    linked_mission_id = Column(String)
    linked_inventory_id = Column(String)
    linked_asset_id = Column(String)
    container_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class Mission(Base):
    __tablename__ = "missions"
    id = Column(String, primary_key=True)
    mission_code = Column(String, unique=True, nullable=False)
    mission_name = Column(String, nullable=False)
    station_id = Column(String, ForeignKey("stations.id"))
    priority = Column(String, default="Normal")  # Critical, High, Normal, Low
    status = Column(String, default="Planned")  # Planned, Active, At Risk, Delayed, Completed, Cancelled
    start_date = Column(String)
    end_date = Column(String)
    team = Column(String)
    required_personnel = Column(Integer, default=0)
    description = Column(Text)
    objective = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class Dependency(Base):
    __tablename__ = "dependencies"
    id = Column(String, primary_key=True)
    source_type = Column(String, nullable=False)  # cargo, inventory, asset, personnel, mission
    source_id = Column(String, nullable=False)
    target_type = Column(String, nullable=False)
    target_id = Column(String, nullable=False)
    relationship_type = Column(String)  # required_by, required_for, supports, assigned_to, blocks
    criticality = Column(String, default="High")  # Critical, High, Medium, Low
    created_at = Column(DateTime, default=datetime.utcnow)


class Disruption(Base):
    __tablename__ = "disruptions"
    id = Column(String, primary_key=True)
    disruption_code = Column(String, unique=True)
    type = Column(String)  # cargo_delay, vehicle_failure, inventory_shortage, personnel_unavailable, communication_loss
    entity_type = Column(String)
    entity_id = Column(String)
    severity = Column(String, default="Medium")  # Critical, High, Medium, Low
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Active")  # Active, Resolved, Monitoring
    parameters = Column(Text)  # JSON string
    is_simulation = Column(Boolean, default=False)


class ImpactRecord(Base):
    __tablename__ = "impact_records"
    id = Column(String, primary_key=True)
    disruption_id = Column(String, ForeignKey("disruptions.id"))
    affected_type = Column(String)
    affected_id = Column(String)
    affected_name = Column(String)
    impact_level = Column(String)  # Critical, High, Medium, Low
    impact_reason = Column(Text)
    estimated_delay = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class RecoveryOption(Base):
    __tablename__ = "recovery_options"
    id = Column(String, primary_key=True)
    disruption_id = Column(String, ForeignKey("disruptions.id"))
    option_name = Column(String)
    description = Column(Text)
    mission_continuity_score = Column(Float, default=0.0)
    safety_score = Column(Float, default=0.0)
    time_score = Column(Float, default=0.0)
    resource_score = Column(Float, default=0.0)
    cost_score = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    feasible = Column(Boolean, default=True)
    rank = Column(Integer, default=0)
    action_steps = Column(Text)  # JSON string
    estimated_delay_days = Column(Integer, default=0)
    explanation = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class RecoveryPlan(Base):
    __tablename__ = "recovery_plans"
    id = Column(String, primary_key=True)
    disruption_id = Column(String, ForeignKey("disruptions.id"))
    selected_option_id = Column(String, ForeignKey("recovery_options.id"))
    status = Column(String, default="Pending Approval")  # Pending Approval, Approved, Rejected, In Progress, Completed
    approved_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime)
    notes = Column(Text)


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True)
    type = Column(String)  # cargo_delay, asset_failure, inventory_critical, mission_risk, emergency
    severity = Column(String, default="Medium")  # Critical, High, Medium, Low, Info
    title = Column(String)
    message = Column(Text)
    entity_type = Column(String)
    entity_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged = Column(Boolean, default=False)
    is_simulation = Column(Boolean, default=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String)
    entity_type = Column(String)
    entity_id = Column(String)
    description = Column(Text)
    user_role = Column(String)
    is_simulation = Column(Boolean, default=False)
