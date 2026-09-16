import type { Severity, AssetStatus, CargoStatus, MissionStatus, PersonnelStatus, InventoryState } from '../types';

export const getSeverityColor = (severity: string): string => {
  const map: Record<string, string> = {
    Critical: 'text-red-400',
    High: 'text-orange-400',
    Medium: 'text-yellow-400',
    Low: 'text-blue-400',
    Info: 'text-gray-400',
    Normal: 'text-green-400',
  };
  return map[severity] || 'text-gray-400';
};

export const getSeverityBadge = (severity: string): string => {
  const map: Record<string, string> = {
    Critical: 'badge-critical',
    High: 'badge-high',
    Medium: 'badge-medium',
    Low: 'badge-low',
    Normal: 'badge-ok',
    Info: 'badge-info',
  };
  return map[severity] || 'badge-info';
};

export const getStatusBadge = (status: string): string => {
  const map: Record<string, string> = {
    // Asset
    Operational: 'badge-ok',
    Maintenance: 'badge-medium',
    Failed: 'badge-critical',
    Reserved: 'badge-low',
    Transit: 'badge-medium',
    // Personnel
    Available: 'badge-ok',
    Assigned: 'badge-low',
    Medical: 'badge-high',
    Unavailable: 'badge-critical',
    // Shared / Cargo / Mission
    Planned: 'badge-info',
    Packed: 'badge-info',
    'In Transit': 'badge-medium',
    'At Station': 'badge-ok',
    Delayed: 'badge-critical',
    Delivered: 'badge-ok',
    Cancelled: 'badge-high',
    // Mission
    Active: 'badge-ok',
    'At Risk': 'badge-critical',
    Completed: 'badge-ok',
    // Inventory
    Normal: 'badge-ok',
    Low: 'badge-medium',
    Critical: 'badge-critical',
    'Out of Stock': 'badge-critical',
  };
  return map[status] || 'badge-info';
};

export const getPriorityBadge = (priority: string): string => {
  const map: Record<string, string> = {
    Critical: 'badge-critical',
    High: 'badge-high',
    Normal: 'badge-info',
    Low: 'badge-low',
  };
  return map[priority] || 'badge-info';
};

export const getImpactLevelClass = (level: string): string => {
  const map: Record<string, string> = {
    Critical: 'impact-critical',
    High: 'impact-high',
    Medium: 'impact-medium',
    Low: 'impact-low',
    Root: 'bg-navy-700 border border-navy-500 text-white',
  };
  return map[level] || 'impact-low';
};

export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

export const scoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-400';
  if (score >= 65) return 'text-yellow-400';
  if (score >= 50) return 'text-orange-400';
  return 'text-red-400';
};

export const getEntityIcon = (type: string): string => {
  const map: Record<string, string> = {
    cargo: '📦',
    inventory: '🗃',
    asset: '⚙️',
    mission: '🎯',
    personnel: '👤',
    station: '🏔',
  };
  return map[type] || '◆';
};

export const truncate = (str: string, len: number): string =>
  str.length > len ? str.slice(0, len) + '…' : str;
