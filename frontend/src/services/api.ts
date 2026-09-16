// POLAROPS — API Service Layer with Resilient Offline Cache
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Helper for caching GET requests to localStorage for basic offline resilience
async function cachedGet<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const cacheKey = `px_cache_${endpoint}_${JSON.stringify(params || {})}`;
  try {
    const res = await api.get<T>(endpoint, { params });
    try {
      localStorage.setItem(cacheKey, JSON.stringify(res.data));
    } catch {}
    return res.data;
  } catch (err) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      console.warn(`[POLAROPS] Network failed for ${endpoint}. Serving from offline cache.`);
      return JSON.parse(cached);
    }
    throw err;
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────
export const getDashboard = () => cachedGet<any>('/dashboard');

// ─── Stations ─────────────────────────────────────────────────────────────
export const getStations = () => cachedGet<any>('/stations');
export const getStation = (id: string) => cachedGet<any>(`/stations/${id}`);

// ─── Personnel ────────────────────────────────────────────────────────────
export const getPersonnel = (params?: Record<string, string>) =>
  cachedGet<any>('/personnel', params);
export const getTeamSummary = () => cachedGet<any>('/personnel/teams');
export const getPersonnelById = (id: string) => cachedGet<any>(`/personnel/${id}`);
export const updatePersonnel = (id: string, data: any) =>
  api.patch(`/personnel/${id}`, data).then(r => r.data);

// ─── Assets ───────────────────────────────────────────────────────────────
export const getAssets = (params?: Record<string, string>) =>
  cachedGet<any>('/assets', params);
export const getAsset = (id: string) => cachedGet<any>(`/assets/${id}`);
export const updateAsset = (id: string, data: any) =>
  api.patch(`/assets/${id}`, data).then(r => r.data);

// ─── Inventory ────────────────────────────────────────────────────────────
export const getInventory = (params?: Record<string, string>) =>
  cachedGet<any>('/inventory', params);
export const getInventoryForecast = () => cachedGet<any>('/inventory/forecast');
export const getInventoryItem = (id: string) => cachedGet<any>(`/inventory/${id}`);
export const updateInventory = (id: string, data: any) =>
  api.patch(`/inventory/${id}`, data).then(r => r.data);

// ─── Cargo ────────────────────────────────────────────────────────────────
export const getCargo = (params?: Record<string, string>) =>
  cachedGet<any>('/cargo', params);
export const getCargoItem = (id: string) => cachedGet<any>(`/cargo/${id}`);
export const updateCargo = (id: string, data: any) =>
  api.patch(`/cargo/${id}`, data).then(r => r.data);

// ─── Missions ─────────────────────────────────────────────────────────────
export const getMissions = (params?: Record<string, string>) =>
  cachedGet<any>('/missions', params);
export const getMission = (id: string) => cachedGet<any>(`/missions/${id}`);
export const updateMission = (id: string, data: any) =>
  api.patch(`/missions/${id}`, data).then(r => r.data);

// ─── Impact ───────────────────────────────────────────────────────────────
export const analyzeImpact = (data: {
  type: string;
  entity_id: string;
  delay_days?: number;
  parameters?: Record<string, any>;
  is_simulation?: boolean;
}) => api.post('/impact/analyze', data).then(r => r.data);

export const getDisruptions = (is_simulation = false) =>
  cachedGet<any>('/impact/disruptions', { is_simulation });
export const getDisruption = (id: string) =>
  cachedGet<any>(`/impact/disruptions/${id}`);

// ─── Recovery ─────────────────────────────────────────────────────────────
export const generateRecovery = (disruption_id: string) =>
  api.post('/recovery/generate', { disruption_id }).then(r => r.data);
export const getRecoveryOptions = (disruption_id: string) =>
  cachedGet<any>(`/recovery/options/${disruption_id}`);
export const createRecoveryPlan = (data: {
  disruption_id: string;
  selected_option_id: string;
  notes?: string;
}) => api.post('/recovery/plans', data).then(r => r.data);
export const getRecoveryPlans = () => cachedGet<any>('/recovery/plans');
export const approveRecoveryPlan = (plan_id: string, data: { approved_by: string; notes?: string }) =>
  api.post(`/recovery/plans/${plan_id}/approve`, data).then(r => r.data);

// ─── Simulation ───────────────────────────────────────────────────────────
export const runSimulation = (data: {
  scenario_type: string;
  entity_id: string;
  parameters?: Record<string, any>;
}) => api.post('/simulation/run', data).then(r => r.data);

// ─── Alerts ───────────────────────────────────────────────────────────────
export const getAlerts = () => cachedGet<any>('/alerts');
export const acknowledgeAlert = (id: string) =>
  api.post(`/alerts/${id}/acknowledge`).then(r => r.data);

// ─── Audit ────────────────────────────────────────────────────────────────
export const getAuditLog = () => cachedGet<any>('/audit');

// ─── Demo ─────────────────────────────────────────────────────────────────
export const resetDemo = () => api.post('/demo/reset').then(r => r.data);

export default api;
