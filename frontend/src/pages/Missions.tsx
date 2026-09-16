import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, AlertTriangle, GitBranch, ChevronDown, ChevronRight } from 'lucide-react';
import { getMissions, getMission } from '../services/api';
import { Mission } from '../types';
import { LoadingPage, ErrorState, PageHeader, EmptyState } from '../components/ui';
import { getStatusBadge, getPriorityBadge, formatDate } from '../utils/helpers';

const MissionsPage: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const navigate = useNavigate();

  const fetchMissions = async () => {
    try {
      setError(null);
      const data = await getMissions();
      setMissions(data);
    } catch (e) {
      setError('Failed to load missions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMissions(); }, []);

  const handleExpand = async (missionId: string) => {
    if (expanded === missionId) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(missionId);
    setDetailLoading(true);
    try {
      const d = await getMission(missionId);
      setDetail(d);
    } catch (e) {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const statusFilters = ['All', 'Active', 'At Risk', 'Planned', 'Delayed', 'Completed'];
  const filtered = statusFilter === 'All' ? missions : missions.filter(m => m.status === statusFilter);

  const atRisk = missions.filter(m => m.status === 'At Risk');

  if (loading) return <LoadingPage label="Loading mission roster..." />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Mission Management"
        subtitle="Expedition missions, dependencies, and operational status"
        icon={<Target size={22} />}
      />

      {error && <ErrorState message={error} onRetry={fetchMissions} />}

      {/* At Risk Banner */}
      {atRisk.length > 0 && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-red-300 font-semibold">
              {atRisk.length} Mission{atRisk.length > 1 ? 's' : ''} At Risk
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {atRisk.map(m => (
              <button
                key={m.id}
                onClick={() => navigate('/scenario-lab')}
                className="bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2 text-xs hover:bg-red-900/50 transition-colors"
              >
                <div className="font-mono text-red-300 font-bold">{m.mission_code}</div>
                <div className="text-red-400 mt-0.5">{m.mission_name}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/scenario-lab')}
            className="mt-3 btn-danger text-xs"
          >
            Analyze Recovery Options
          </button>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f
                ? 'bg-ice-600 text-white'
                : 'bg-navy-800 text-gray-400 hover:bg-navy-700 border border-navy-600'
            }`}
          >
            {f}
            {f === 'At Risk' && atRisk.length > 0 && (
              <span className="ml-1.5 bg-red-600 text-white rounded-full px-1 text-xs">{atRisk.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Mission List */}
      <div className="space-y-3">
        {filtered.length === 0 && <EmptyState message="No missions matching filter" />}
        {filtered.map(mission => (
          <div
            key={mission.id}
            className={`card border transition-all ${
              mission.status === 'At Risk' ? 'border-red-700/50' :
              mission.status === 'Active' ? 'border-ice-600/30' : 'border-navy-600'
            }`}
          >
            {/* Mission Header */}
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => handleExpand(mission.id)}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="font-mono text-ice-400 font-bold text-sm flex-shrink-0">{mission.mission_code}</div>
                <div className="min-w-0">
                  <div className="text-white font-medium truncate">{mission.mission_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {mission.station_id} · Team {mission.team} · {formatDate(mission.start_date)} – {formatDate(mission.end_date)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`badge ${getPriorityBadge(mission.priority)}`}>{mission.priority}</span>
                <span className={`badge ${getStatusBadge(mission.status)}`}>{mission.status}</span>
                {expanded === mission.id ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
              </div>
            </div>

            {/* Expanded Detail */}
            {expanded === mission.id && (
              <div className="mt-4 pt-4 border-t border-navy-700">
                {detailLoading ? (
                  <div className="text-sm text-gray-400">Loading mission details...</div>
                ) : detail && detail.id === mission.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Objective */}
                    <div>
                      <h4 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Objective</h4>
                      <p className="text-sm text-gray-300">{detail.objective || detail.description || '—'}</p>
                    </div>

                    {/* Personnel */}
                    <div>
                      <h4 className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                        Personnel ({detail.assigned_personnel?.length || 0})
                      </h4>
                      <div className="space-y-1">
                        {(detail.assigned_personnel || []).map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between text-xs">
                            <span className="text-white">{p.name}</span>
                            <span className="text-gray-500">{p.role}</span>
                          </div>
                        ))}
                        {!detail.assigned_personnel?.length && <p className="text-xs text-gray-600">No personnel data</p>}
                      </div>
                    </div>

                    {/* Assets & Cargo */}
                    <div>
                      <h4 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Assets & Cargo</h4>
                      <div className="space-y-1">
                        {(detail.assigned_assets || []).map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between text-xs">
                            <span className="font-mono text-ice-400">{a.asset_code}</span>
                            <span className={`badge ${getStatusBadge(a.status)} text-xs`}>{a.status}</span>
                          </div>
                        ))}
                        {(detail.linked_cargo || []).map((c: any) => (
                          <div key={c.id} className={`flex items-center justify-between text-xs ${c.status === 'Delayed' ? 'bg-red-900/20 rounded px-1' : ''}`}>
                            <span className="font-mono text-yellow-400">{c.cargo_code}</span>
                            <span className={`badge ${getStatusBadge(c.status)} text-xs`}>{c.status}</span>
                          </div>
                        ))}
                        {!detail.assigned_assets?.length && !detail.linked_cargo?.length && (
                          <p className="text-xs text-gray-600">No asset/cargo data</p>
                        )}
                      </div>
                    </div>

                    {/* Why at risk */}
                    {(mission.status === 'At Risk' || detail.risk_analysis?.has_risk) && (
                      <div className="md:col-span-2 lg:col-span-3 bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                        <h4 className="text-xs text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <AlertTriangle size={12} /> Why Is This Mission At Risk? (Dynamic Cross-Domain Causal Chain)
                        </h4>
                        {detail.risk_analysis?.risk_steps?.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
                            {detail.risk_analysis.risk_steps.map((step: any, idx: number) => (
                              <React.Fragment key={idx}>
                                <span className={`px-2 py-1 rounded font-mono text-xs ${
                                  idx === 0 ? 'bg-red-900/50 text-red-300 border border-red-600/50' :
                                  idx === detail.risk_analysis.risk_steps.length - 1 ? 'bg-amber-900/40 text-amber-300 border border-amber-600/50' :
                                  'bg-navy-800 text-gray-200 border border-navy-600'
                                }`}>
                                  {step.label}
                                </span>
                                {idx < detail.risk_analysis.risk_steps.length - 1 && (
                                  <span className="text-gray-500 font-bold">→</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-red-300">
                            {detail.risk_analysis?.risk_summary || 'Mission operational schedule is compromised by upstream dependencies.'}
                          </p>
                        )}
                        {detail.risk_analysis?.risk_summary && (
                          <p className="text-[11px] text-gray-400 mt-2 italic">
                            Analysis: {detail.risk_analysis.risk_summary}
                          </p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => navigate('/impact')}
                            className="btn-secondary text-xs py-1"
                          >
                            <GitBranch size={12} /> Impact Analysis
                          </button>
                          <button
                            onClick={() => navigate('/scenario-lab')}
                            className="btn-primary text-xs py-1"
                          >
                            Find Recovery
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Dependency information incomplete. Manual review required.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissionsPage;
