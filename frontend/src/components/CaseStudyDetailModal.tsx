import React, { useState } from 'react';
import { CaseStudy } from '../data/caseStudiesData';
import { OperationalGraph } from './OperationalGraph';
import { ScoreRing } from './ui';
import {
  FileText,
  AlertTriangle,
  Zap,
  Shield,
  Clock,
  DollarSign,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Info,
  Package,
  Wrench,
  Navigation,
  Compass
} from 'lucide-react';

interface CaseStudyDetailModalProps {
  caseStudy: CaseStudy;
  onClose: () => void;
  onRunSimulation: (caseStudy: CaseStudy) => void;
}

export const CaseStudyDetailModal: React.FC<CaseStudyDetailModalProps> = ({
  caseStudy,
  onClose,
  onRunSimulation
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'options' | 'simulation'>('overview');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(caseStudy.recoveryOptions[0]?.id || '');
  const [approvedPlan, setApprovedPlan] = useState<boolean>(false);

  const selectedPlan = caseStudy.recoveryOptions.find(o => o.id === selectedPlanId) || caseStudy.recoveryOptions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#050a15] border border-navy-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header Bar */}
        <div className="p-5 border-b border-navy-800 bg-navy-950 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="badge badge-critical flex items-center gap-1 text-xs">
                <AlertTriangle size={12} /> {caseStudy.disruptionType}
              </span>
              <span className="text-xs bg-navy-800 text-ice-300 px-2 py-0.5 rounded border border-navy-700 font-mono">
                📍 {caseStudy.location} ({caseStudy.coordinates})
              </span>
              <span className="text-xs bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded border border-amber-700/40">
                Source: {caseStudy.source} ({caseStudy.sourceYear})
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{caseStudy.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-navy-900 text-gray-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Educational Disclaimer Banner */}
        <div className="bg-amber-950/40 border-b border-amber-700/30 px-5 py-2 flex items-center gap-2 text-xs text-amber-300">
          <Info size={14} className="flex-shrink-0 text-amber-400" />
          <span>
            <strong>Educational prototype using documented case studies and simulated operational data.</strong> Historical incident facts are strictly separated from simulated system benchmarks.
          </span>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-navy-800 bg-navy-900/40 px-5 gap-2">
          {[
            { id: 'overview', label: '📘 Documented Case & Facts' },
            { id: 'graph', label: '⚡ Causal Dependency Graph' },
            { id: 'options', label: '⚖️ 5-Pillar Recovery Options' },
            { id: 'simulation', label: '📊 PolarOps Impact & Simulation' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-ice-400 text-ice-300 bg-navy-900/60'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: OVERVIEW & FACTS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Documented Incident vs Simulation Assumptions split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Documented Facts */}
                <div className="card bg-navy-950/80 border-cyan-800/40 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm border-b border-navy-800 pb-2">
                    <FileText size={16} /> 1. Documented Historical Facts
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Documented Background</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">{caseStudy.documentedBackground}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Documented Incident Situation</h4>
                    <p className="text-xs text-white bg-navy-900/80 p-3 rounded-lg border border-navy-700 leading-relaxed">
                      "{caseStudy.documentedSituation}"
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Primary Operational Challenge</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">{caseStudy.operationalChallenge}</p>
                  </div>
                </div>

                {/* Simulation Assumptions */}
                <div className="card bg-navy-950/80 border-amber-800/40 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm border-b border-navy-800 pb-2">
                    <Zap size={16} /> 2. Prototype Simulation Assumptions
                  </div>
                  <p className="text-xs text-amber-300/90 leading-relaxed bg-amber-950/30 p-2.5 rounded border border-amber-700/30">
                    {caseStudy.prototypeDisclaimer}
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Features Demonstrated</h4>
                    <ul className="space-y-1">
                      {caseStudy.featuresDemonstrated.map((feat, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-ice-400 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Case Specific Display Box */}
              <div className="card space-y-4">
                <h3 className="section-title flex items-center gap-2">
                  <Package size={16} className="text-ice-400" /> Operational Details & Resource Breakdown
                </h3>

                {/* Case 1 Displays */}
                {caseStudy.displays.unloadedCargo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-navy-900/60 p-3.5 rounded-xl border border-navy-700">
                      <h4 className="text-xs font-bold text-green-400 uppercase mb-2">Unloaded Cargo (Landed)</h4>
                      <div className="space-y-1.5">
                        {caseStudy.displays.unloadedCargo.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs bg-navy-950 p-2 rounded border border-navy-800">
                            <span className="text-gray-200">{item.item}</span>
                            <span className="font-mono text-green-300 font-bold">{item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-navy-900/60 p-3.5 rounded-xl border border-navy-700">
                      <h4 className="text-xs font-bold text-red-400 uppercase mb-2">Pending Cargo (Trapped)</h4>
                      <div className="space-y-1.5">
                        {caseStudy.displays.pendingCargo?.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs bg-navy-950 p-2 rounded border border-navy-800">
                            <span className="text-gray-200">{item.item}</span>
                            <span className="font-mono text-red-300 font-bold">{item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Case 2 Displays */}
                {caseStudy.displays.requiredSupplies && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-navy-900/60 p-3.5 rounded-xl border border-navy-700">
                      <h4 className="text-xs font-bold text-ice-400 uppercase mb-2">Required Season Allocations</h4>
                      {caseStudy.displays.requiredSupplies.map((s, i) => (
                        <div key={i} className="text-xs text-gray-300 mb-1 flex justify-between">
                          <span>{s.category}</span>
                          <span className="font-mono font-bold text-white">{s.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-navy-900/60 p-3.5 rounded-xl border border-navy-700">
                      <h4 className="text-xs font-bold text-green-400 uppercase mb-2">Delivered Before Lockout</h4>
                      {caseStudy.displays.deliveredSupplies?.map((s, i) => (
                        <div key={i} className="text-xs text-gray-300 mb-1 flex justify-between">
                          <span>{s.category}</span>
                          <span className="font-mono font-bold text-green-300">{s.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-navy-900/60 p-3.5 rounded-xl border border-navy-700">
                      <h4 className="text-xs font-bold text-red-400 uppercase mb-2">Pending Offshore (40km)</h4>
                      {caseStudy.displays.pendingSupplies?.map((s, i) => (
                        <div key={i} className="text-xs text-gray-300 mb-1 flex justify-between">
                          <span>{s.category}</span>
                          <span className="font-mono font-bold text-red-300">{s.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Case 3 Displays */}
                {caseStudy.displays.originalRoute && (
                  <div className="bg-navy-900/60 p-4 rounded-xl border border-navy-700 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Original Maritime Route</span>
                        <p className="text-xs font-mono text-green-300 bg-navy-950 p-2 rounded border border-navy-800">
                          {caseStudy.displays.originalRoute.path}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-red-400 uppercase font-bold block mb-1">Disrupted Blockage Point</span>
                        <p className="text-xs font-mono text-red-300 bg-navy-950 p-2 rounded border border-navy-800">
                          {caseStudy.displays.disruptedRoute?.path} ({caseStudy.displays.disruptedRoute?.cause})
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Case 4 Displays */}
                {caseStudy.displays.failedSled && (
                  <div className="bg-red-950/30 p-4 rounded-xl border border-red-800/40 space-y-2">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase">
                      <Wrench size={14} /> Failed Asset Detail
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400">Failed Vehicle: </span>
                        <span className="font-mono text-white font-bold">{caseStudy.displays.failedSled.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Failure Point: </span>
                        <span className="font-mono text-amber-300 font-bold">{caseStudy.displays.failedSled.failurePoint}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Failure Cause: </span>
                        <span className="font-mono text-red-300">{caseStudy.displays.failedSled.impactReason}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: OPERATIONAL GRAPH */}
          {activeTab === 'graph' && (
            <div className="space-y-4">
              <OperationalGraph nodes={caseStudy.graphNodes} title={`OPERATIONAL GRAPH — ${caseStudy.shortTitle}`} />
              <div className="p-3 bg-navy-900/60 rounded-xl border border-navy-700 text-xs text-gray-400 flex items-center justify-between">
                <span>Interactive BFS traversal automatically cascades disruption from failed root node to target mission.</span>
                <button
                  onClick={() => onRunSimulation(caseStudy)}
                  className="btn-primary text-xs py-1 px-3"
                >
                  Simulate in Scenario Lab
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 5-PILLAR RECOVERY OPTIONS */}
          {activeTab === 'options' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="section-title">Evaluated Recovery Options</h3>
                <span className="text-xs text-gray-400">Scored using 5-Pillar Algorithm</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {caseStudy.recoveryOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedPlanId(opt.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      opt.id === selectedPlanId
                        ? 'border-ice-400 bg-navy-900/80 shadow-lg shadow-ice-500/10'
                        : 'border-navy-700 bg-navy-950/60 hover:border-navy-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {opt.isRecommended && (
                            <span className="text-xs bg-green-900/40 text-green-300 border border-green-700/40 rounded px-2 py-0.5 font-bold">
                              ⭐ RECOMMENDED PLAN
                            </span>
                          )}
                          <span className="text-xs font-mono text-gray-500">Rank #{opt.rank}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{opt.optionName}</h4>
                        <p className="text-xs text-gray-300 mt-1">{opt.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-white font-mono">{opt.totalScore.toFixed(1)}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-mono">Total Score</div>
                        <div className="text-xs text-orange-400 font-mono mt-1">+{opt.estimatedDelayDays}d delay</div>
                      </div>
                    </div>

                    {/* 5-Pillar Score Breakdown */}
                    <div className="grid grid-cols-5 gap-2 mt-4 pt-3 border-t border-navy-800 text-center">
                      <div>
                        <div className="text-xs font-bold text-green-400 font-mono">{opt.missionContinuityScore}</div>
                        <div className="text-[10px] text-gray-400">Mission (35%)</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-400 font-mono">{opt.safetyScore}</div>
                        <div className="text-[10px] text-gray-400">Safety (25%)</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-400 font-mono">{opt.timeScore}</div>
                        <div className="text-[10px] text-gray-400">Time (20%)</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-400 font-mono">{opt.resourceScore}</div>
                        <div className="text-[10px] text-gray-400">Resource (10%)</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-400 font-mono">{opt.costScore}</div>
                        <div className="text-[10px] text-gray-400">Cost (10%)</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SIMULATION RESULTS & COMMANDER APPROVAL */}
          {activeTab === 'simulation' && (
            <div className="space-y-6">
              {/* Continuity comparison ring */}
              <div className="card bg-navy-950/90 border-navy-700">
                <h3 className="section-title mb-4">Mission Continuity Impact Benchmark</h3>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 uppercase mb-2">BEFORE DISRUPTION</div>
                    <ScoreRing score={caseStudy.metrics.continuityBefore} size={90} />
                    <div className="text-xs text-green-400 font-bold mt-2">Baseline Healthy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-red-400 uppercase mb-2">DISRUPTION IMPACT</div>
                    <div className="text-3xl text-red-400 font-bold">→</div>
                    <div className="text-xs text-red-300 bg-red-950/60 p-2 rounded border border-red-800 mt-2">
                      {caseStudy.disruptionType}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-green-400 uppercase mb-2">AFTER RECOVERY</div>
                    <ScoreRing score={caseStudy.metrics.continuityAfterRecovery} size={90} />
                    <div className="text-xs text-ice-300 font-bold mt-2">Restored ({selectedPlan.shortLabel})</div>
                  </div>
                </div>
              </div>

              {/* Action Plan steps */}
              <div className="card">
                <h4 className="text-xs font-bold text-ice-400 uppercase tracking-wider mb-2">
                  Action Steps — {selectedPlan.optionName}
                </h4>
                <div className="space-y-2">
                  {selectedPlan.actionSteps?.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-200 bg-navy-900/60 p-2.5 rounded border border-navy-700">
                      <span className="w-5 h-5 rounded-full bg-ice-900 text-ice-300 font-bold font-mono text-[11px] flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="p-4 border-t border-navy-800 bg-navy-950 flex items-center justify-between gap-4">
          <div className="text-xs text-gray-400 font-mono">
            Selected: <span className="text-white font-bold">{selectedPlan.shortLabel}</span> (Score: {selectedPlan.totalScore})
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Close Window
            </button>
            <button
              onClick={() => {
                onClose();
                onRunSimulation(caseStudy);
              }}
              className="btn-primary text-xs flex items-center gap-2"
            >
              <Zap size={14} /> Run PolarOps Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
