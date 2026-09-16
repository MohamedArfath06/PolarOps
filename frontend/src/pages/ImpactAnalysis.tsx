import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GitBranch, AlertTriangle, ChevronDown, Zap } from 'lucide-react';
import { analyzeImpact, getDisruptions, generateRecovery } from '../services/api';
import { ImpactResult } from '../types';
import { LoadingPage, ErrorState, PageHeader, EmptyState, ScoreRing } from '../components/ui';
import { getImpactLevelClass, getEntityIcon } from '../utils/helpers';

const impactTypeColors: Record<string, string> = {
  Critical: 'border-red-500 bg-red-900/20 text-red-300',
  High: 'border-orange-500 bg-orange-900/20 text-orange-300',
  Medium: 'border-yellow-500 bg-yellow-900/20 text-yellow-300',
  Low: 'border-blue-500 bg-blue-900/20 text-blue-300',
  Root: 'border-ice-500 bg-ice-900/20 text-ice-300',
};

const ImpactChainNode: React.FC<{ node: any; isLast: boolean }> = ({ node, isLast }) => (
  <div className="flex flex-col items-center">
    <div className={`rounded-xl border-2 px-4 py-2.5 text-center min-w-[140px] ${impactTypeColors[node.impact_level] || impactTypeColors.Low}`}>
      <div className="text-xs font-bold uppercase tracking-wide mb-0.5">{node.type}</div>
      <div className="text-sm font-mono font-bold">{node.id}</div>
      {node.name && node.name !== node.id && (
        <div className="text-xs opacity-80 mt-0.5 truncate max-w-[130px]">{node.name}</div>
      )}
      <div className="text-xs mt-1 opacity-70">{node.impact_level}</div>
    </div>
    {!isLast && (
      <div className="flex flex-col items-center">
        <div className="w-0.5 h-4 bg-navy-600" />
        <ChevronDown size={14} className="text-gray-600" />
        <div className="w-0.5 h-4 bg-navy-600" />
      </div>
    )}
  </div>
);

const ImpactAnalysis: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<ImpactResult | null>(location.state?.result || null);
  const [disruptions, setDisruptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<any>(null);

  useEffect(() => {
    const fetchDisruptions = async () => {
      try {
        const data = await getDisruptions(false);
        setDisruptions(data);
      } catch {}
    };
    fetchDisruptions();
  }, []);

  // Quick analyze preset
  const analyzePreset = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await analyzeImpact({
        type: 'cargo_delay',
        entity_id: 'C-1042',
        delay_days: 5,
        is_simulation: false,
      });
      setResult(r);
    } catch (e) {
      setError('Impact analysis failed. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecovery = async () => {
    if (!result) return;
    setGenerating(true);
    try {
      const r = await generateRecovery(result.disruption_id);
      setRecoveryResult(r);
    } catch (e) {
      setError('Recovery generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const impactSummaryItems = result ? [
    { label: 'Cargo Affected', count: result.affected_cargo.length, color: 'text-orange-400' },
    { label: 'Inventory Affected', count: result.affected_inventory.length, color: 'text-yellow-400' },
    { label: 'Assets Affected', count: result.affected_assets.length, color: 'text-red-400' },
    { label: 'Missions Affected', count: result.affected_missions.length, color: 'text-red-300' },
    { label: 'Teams Affected', count: result.affected_teams.length, color: 'text-orange-300' },
  ] : [];

  if (loading) return <LoadingPage label="Running impact analysis..." />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Disruption Impact Analysis"
        subtitle="Trace cross-domain impact across the expedition dependency graph"
        icon={<GitBranch size={22} />}
        actions={
          <button onClick={analyzePreset} className="btn-primary">
            <AlertTriangle size={14} /> Analyze C-1042 Delay
          </button>
        }
      />

      {error && <ErrorState message={error} onRetry={analyzePreset} />}

      {!result && !loading && (
        <div className="card text-center py-12">
          <GitBranch size={40} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">No Active Disruption Analysis</h3>
          <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
            Click "Analyze C-1042 Delay" to run the demo impact analysis, or use the Scenario Lab for full simulation.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={analyzePreset} className="btn-primary">
              <AlertTriangle size={14} /> Run Demo Analysis
            </button>
            <button onClick={() => navigate('/scenario-lab')} className="btn-secondary">
              <Zap size={14} /> Open Scenario Lab
            </button>
          </div>
        </div>
      )}

      {result && (
        <>
          {/* Disruption Banner */}
          <div className={`rounded-xl border-2 p-4 ${
            result.severity === 'Critical' ? 'bg-red-900/20 border-red-600' :
            result.severity === 'High' ? 'bg-orange-900/20 border-orange-600' : 'bg-yellow-900/20 border-yellow-600'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className={result.severity === 'Critical' ? 'text-red-400' : 'text-orange-400'} />
                <div>
                  <div className={`text-sm font-bold uppercase ${result.severity === 'Critical' ? 'text-red-300' : 'text-orange-300'}`}>
                    {result.severity} DISRUPTION
                  </div>
                  <div className="text-white font-semibold mt-0.5">
                    Cargo C-1042 delayed by {result.estimated_delay_days} days
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                ID: <span className="font-mono text-gray-300">{result.disruption_id.slice(0, 8)}</span>
              </div>
            </div>
          </div>

          {/* Impact Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {impactSummaryItems.map(item => (
              <div key={item.label} className="card-sm text-center">
                <div className={`text-2xl font-bold ${item.color}`}>{item.count}</div>
                <div className="text-xs text-gray-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Impact Chain */}
            <div className="card">
              <h3 className="section-title mb-6">Impact Chain</h3>
              <div className="flex flex-col items-center">
                {(result.impact_chain || []).slice(0, 8).map((node: any, i: number) => (
                  <ImpactChainNode
                    key={`${node.type}-${node.id}`}
                    node={node}
                    isLast={i === Math.min(result.impact_chain.length - 1, 7)}
                  />
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-navy-700">
                <div className="flex flex-wrap gap-2 justify-center text-xs">
                  {[
                    { label: 'Direct', color: 'border-red-500 text-red-400 bg-red-900/20' },
                    { label: 'Indirect', color: 'border-orange-500 text-orange-400 bg-orange-900/20' },
                    { label: 'Secondary', color: 'border-yellow-500 text-yellow-400 bg-yellow-900/20' },
                    { label: 'Low', color: 'border-blue-500 text-blue-400 bg-blue-900/20' },
                  ].map(l => (
                    <span key={l.label} className={`border rounded px-2 py-0.5 ${l.color}`}>{l.label}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Impact Records Table */}
            <div className="card">
              <h3 className="section-title mb-4">Affected Entities</h3>
              {result.records.length === 0 ? (
                <EmptyState message="No direct dependencies found" />
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {result.records.map(r => (
                    <div key={r.id} className={`p-3 rounded-lg border ${getImpactLevelClass(r.impact_level)}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs uppercase font-bold">{r.affected_type}</span>
                          <span className="font-mono text-sm font-bold ml-2">{r.affected_id}</span>
                          {r.affected_name && r.affected_name !== r.affected_id && (
                            <span className="text-xs ml-2 opacity-70">{r.affected_name}</span>
                          )}
                          <p className="text-xs mt-1 opacity-80">{r.impact_reason}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-xs font-bold">{r.impact_level}</span>
                          {r.estimated_delay > 0 && (
                            <span className="text-xs">+{r.estimated_delay}d</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-navy-700 bg-navy-900/40 rounded-lg p-3">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Summary</div>
                <p className="text-sm text-white">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Recovery Actions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Recovery</h3>
              {!recoveryResult && (
                <button
                  onClick={handleGenerateRecovery}
                  disabled={generating}
                  className="btn-primary"
                >
                  <Zap size={14} />
                  {generating ? 'Generating...' : 'Find Recovery Options'}
                </button>
              )}
            </div>

            {recoveryResult ? (
              <div>
                <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 mb-4">
                  <div className="text-green-300 text-sm font-semibold">
                    {recoveryResult.options?.length || 0} Recovery Options Generated
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Recommended: {recoveryResult.recommended_option_name}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/recovery', { state: { disruption_id: result.disruption_id } })}
                  className="btn-primary w-full justify-center"
                >
                  View Recovery Plans →
                </button>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                Generate recovery options to get feasible alternatives with ranked recommendations.
              </p>
            )}
          </div>
        </>
      )}

      {/* Past Disruptions */}
      {disruptions.length > 0 && !result && (
        <div className="card">
          <h3 className="section-title mb-4">Past Disruption Records</h3>
          <div className="space-y-2">
            {disruptions.slice(0, 5).map((d: any) => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-navy-900/60 rounded-lg border border-navy-700">
                <div>
                  <span className="font-mono text-xs text-ice-400">{d.disruption_code}</span>
                  <span className="text-xs text-gray-400 ml-3">{d.type.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-500 ml-2">· {d.entity_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${d.severity === 'Critical' ? 'badge-critical' : d.severity === 'High' ? 'badge-high' : 'badge-medium'}`}>
                    {d.severity}
                  </span>
                  <span className="text-xs text-gray-500">{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpactAnalysis;
