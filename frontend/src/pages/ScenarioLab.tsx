import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FlaskConical,
  Play,
  ChevronDown,
  AlertTriangle,
  Zap,
  ArrowRight,
  Info,
  CheckCircle2,
  FileText,
  Clock,
  Shield,
  MapPin,
  HelpCircle,
  BarChart3,
  CheckSquare
} from 'lucide-react';
import { CASE_STUDIES, CaseStudy, CaseStudyRecoveryOption } from '../data/caseStudiesData';
import { OperationalGraph } from '../components/OperationalGraph';
import { PageHeader, ScoreRing, LoadingPage, ErrorState } from '../components/ui';

const ScenarioLab: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Selected Case Study State
  const initialCaseId = (location.state as any)?.caseId || CASE_STUDIES[0].id;
  const [selectedCase, setSelectedCase] = useState<CaseStudy>(
    CASE_STUDIES.find(c => c.id === initialCaseId) || CASE_STUDIES[0]
  );

  const [step, setStep] = useState<'setup' | 'disrupted' | 'options' | 'approved'>('setup');
  const [selectedOption, setSelectedOption] = useState<CaseStudyRecoveryOption>(selectedCase.recoveryOptions[0]);
  const [running, setRunning] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Handle case study selection change
  const handleCaseChange = (caseId: string) => {
    const cs = CASE_STUDIES.find(c => c.id === caseId) || CASE_STUDIES[0];
    setSelectedCase(cs);
    setSelectedOption(cs.recoveryOptions[0]);
    setStep('setup');
    setApprovalNotes('');
  };

  useEffect(() => {
    setSelectedOption(selectedCase.recoveryOptions[0]);
  }, [selectedCase]);

  // Step 1: Trigger Disruption Simulation
  const handleSimulateDisruption = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setStep('disrupted');
    }, 600);
  };

  // Step 2: Evaluate Recovery Options
  const handleEvaluateRecovery = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setStep('options');
    }, 500);
  };

  // Step 3: Approve & Commit Recovery Plan
  const handleApprovePlan = (opt: CaseStudyRecoveryOption) => {
    setSelectedOption(opt);
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setStep('approved');
    }, 500);
  };

  const continuityBefore = selectedCase.metrics.continuityBefore;
  const continuityDisrupted = selectedCase.metrics.continuityDisrupted;
  const continuityAfterRecovery = selectedCase.metrics.continuityAfterRecovery;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Real-World Polar Scenario Lab"
        subtitle="Dynamic case-study simulator testing documented historical disruptions & non-destructive recovery models."
        icon={<FlaskConical size={22} />}
        actions={
          <div className="flex items-center gap-2">
            <div className="text-xs bg-amber-950/40 border border-amber-700/40 rounded px-2.5 py-1 text-amber-300 flex items-center gap-1.5 font-mono">
              <Info size={12} className="text-amber-400" />
              <span>SIMULATION MODE — Live database unchanged</span>
            </div>
          </div>
        }
      />

      {/* Global Disclaimer Banner */}
      <div className="bg-amber-950/30 border border-amber-700/30 rounded-xl p-3 flex items-center justify-between text-xs text-amber-300 gap-2">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-amber-400 flex-shrink-0" />
          <span>
            <strong>Educational prototype using documented case studies and simulated operational data.</strong> Historical incident facts are strictly separated from simulated system benchmarks.
          </span>
        </div>
      </div>

      {/* Workflow Step Progress Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'setup', label: '1. Select Case Study' },
          { key: 'disrupted', label: '2. Trigger Disruption' },
          { key: 'options', label: '3. 5-Pillar Recovery Engine' },
          { key: 'approved', label: '4. Commander Authorization' }
        ].map((s, i) => {
          const stepIndexMap: Record<string, number> = { setup: 0, disrupted: 1, options: 2, approved: 3 };
          const currentIndex = stepIndexMap[step];
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          return (
            <React.Fragment key={s.key}>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
                  isDone
                    ? 'bg-green-950/50 text-green-300 border border-green-700/50'
                    : isActive
                    ? 'bg-ice-600/20 text-ice-300 border border-ice-500/50 shadow-md shadow-ice-500/10'
                    : 'text-gray-500 border border-navy-800 bg-navy-950/40'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                    isDone
                      ? 'border-green-500 bg-green-900 text-green-300'
                      : isActive
                      ? 'border-ice-400 text-ice-300'
                      : 'border-gray-700 text-gray-500'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
                </span>
                {s.label}
              </div>
              {i < 3 && <ArrowRight size={12} className="text-gray-700 mx-0.5 flex-shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Main Grid: Left Config Panel, Right Simulator Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Case Selection Panel */}
        <div className="card bg-navy-950/90 border-navy-700 space-y-4">
          <h3 className="section-title flex items-center gap-2 text-white">
            <FileText size={16} className="text-ice-400" /> Case Study Selector
          </h3>

          {/* Selectable Real-World Case Dropdown */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wide font-mono">
              Select Real-World Incident
            </label>
            <select
              value={selectedCase.id}
              onChange={e => handleCaseChange(e.target.value)}
              className="select w-full bg-navy-900 border-navy-700 text-white font-medium text-xs py-2"
            >
              {CASE_STUDIES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.shortTitle} ({c.sourceYear})
                </option>
              ))}
            </select>
          </div>

          {/* Case Metadata Box */}
          <div className="bg-navy-900/80 p-3 rounded-xl border border-navy-700/80 space-y-2 text-xs">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Incident Title</span>
              <p className="font-bold text-white mt-0.5 leading-snug">{selectedCase.title}</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Location</span>
              <p className="text-ice-400 font-mono flex items-center gap-1">
                <MapPin size={11} /> {selectedCase.location} ({selectedCase.coordinates})
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Source Document</span>
              <p className="text-amber-300 font-mono text-[11px]">{selectedCase.source} ({selectedCase.sourceYear})</p>
            </div>
          </div>

          {/* Documented Fact vs Prototype Assumption Badge split */}
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-navy-900/60 border border-cyan-800/40">
              <span className="font-bold text-cyan-400 text-[11px] flex items-center gap-1 mb-1">
                <FileText size={12} /> Documented Fact
              </span>
              <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-3">
                {selectedCase.documentedSituation}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40">
              <span className="font-bold text-amber-400 text-[11px] flex items-center gap-1 mb-1">
                <Zap size={12} /> Prototype Simulation Assumption
              </span>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                {selectedCase.prototypeDisclaimer}
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          {step === 'setup' && (
            <button
              onClick={handleSimulateDisruption}
              disabled={running}
              className="btn-primary w-full justify-center py-2.5 text-xs shadow-lg shadow-ice-600/20"
            >
              <Play size={14} />
              {running ? 'Simulating...' : 'Trigger Documented Disruption'}
            </button>
          )}

          {step !== 'setup' && (
            <button
              onClick={() => handleCaseChange(selectedCase.id)}
              className="btn-secondary w-full justify-center text-xs py-2"
            >
              Reset Simulation State
            </button>
          )}
        </div>

        {/* Right Stage: Interactive Case Simulation Workspace */}
        <div className="lg:col-span-2 space-y-5">

          {/* LOADING STATE */}
          {running && (
            <div className="card bg-navy-950/90 flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-2 border-ice-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-300 font-medium text-sm">Executing PolarOps Disruption Engine...</p>
              <p className="text-xs text-amber-400 mt-1">Non-destructive sandbox simulation active</p>
            </div>
          )}

          {/* STAGE 1: SETUP OVERVIEW */}
          {!running && step === 'setup' && (
            <div className="space-y-4">
              <div className="card bg-navy-950/90 border-navy-700 space-y-4">
                <div className="flex items-center justify-between border-b border-navy-800 pb-3">
                  <h3 className="section-title text-base">Incident Overview & Workflow</h3>
                  <span className="text-xs bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                    Ready to Simulate
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Documented Workflow Sequence</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedCase.workflow.map(w => (
                      <div key={w.step} className="p-2.5 rounded-lg bg-navy-900/60 border border-navy-800 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-ice-950 text-ice-300 font-bold font-mono text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {w.step}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white">{w.label}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">{w.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Graph preview */}
                <OperationalGraph nodes={selectedCase.graphNodes} title={`PREVIEW OPERATIONAL GRAPH — ${selectedCase.shortTitle}`} />
              </div>
            </div>
          )}

          {/* STAGE 2: DISRUPTED STATE & IMPACT */}
          {!running && (step === 'disrupted' || step === 'options' || step === 'approved') && (
            <div className="space-y-4 animate-fadeIn">

              {/* Before vs Disrupted Continuity Ring */}
              <div className="card bg-navy-950/90 border-navy-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title">Mission Continuity Impact</h3>
                  <span className="text-xs text-red-400 font-mono bg-red-950/40 border border-red-800 px-2 py-0.5 rounded">
                    DISRUPTION TRIGGERED
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <div className="text-[10px] text-gray-400 uppercase font-mono mb-2">BEFORE DISRUPTION</div>
                    <ScoreRing score={continuityBefore} size={85} />
                    <div className="text-xs text-green-400 font-bold mt-2 font-mono">{continuityBefore.toFixed(1)}% Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-red-400 uppercase font-mono mb-2">DISRUPTION BLAST</div>
                    <div className="text-3xl text-red-400 font-bold">→</div>
                    <div className="text-xs text-red-300 bg-red-950/60 p-2 rounded border border-red-800/80 mt-2 font-mono">
                      {selectedCase.disruptionType}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-red-400 uppercase font-mono mb-2">
                      {step === 'approved' ? 'AFTER RECOVERY' : 'DISRUPTED STATE'}
                    </div>
                    <ScoreRing
                      score={step === 'approved' ? continuityAfterRecovery : continuityDisrupted}
                      size={85}
                    />
                    <div className={`text-xs font-bold mt-2 font-mono ${step === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                      {(step === 'approved' ? continuityAfterRecovery : continuityDisrupted).toFixed(1)}% Score
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Operational Graph */}
              <OperationalGraph nodes={selectedCase.graphNodes} title={`CAUSAL DEPENDENCY GRAPH — ${selectedCase.title}`} />

              {/* Action Trigger for Step 3 Options */}
              {step === 'disrupted' && (
                <div className="card bg-navy-900/60 border-ice-600/30 flex items-center justify-between p-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">BFS Impact Analysis Complete</h4>
                    <p className="text-xs text-gray-400 mt-0.5">3 potential recovery alternatives identified by PolarOps Recovery Engine.</p>
                  </div>
                  <button
                    onClick={handleEvaluateRecovery}
                    className="btn-success text-xs py-2 px-4 shadow-lg shadow-green-600/20 flex items-center gap-1.5"
                  >
                    <Zap size={14} /> Evaluate 5-Pillar Recovery Options
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STAGE 3 & 4: 5-PILLAR RECOVERY OPTIONS & AUTHORIZATION */}
          {!running && (step === 'options' || step === 'approved') && (
            <div className="space-y-4 animate-fadeIn">
              <div className="card bg-navy-950/90 border-navy-700 space-y-4">
                <div className="flex items-center justify-between border-b border-navy-800 pb-3">
                  <div>
                    <h3 className="section-title text-base">5-Pillar Recovery Option Ranking</h3>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                      Score = 0.35 × Mission + 0.25 × Safety + 0.20 × Time + 0.10 × Resource + 0.10 × Cost
                    </p>
                  </div>
                  <span className="text-xs bg-green-950 text-green-300 px-2 py-0.5 rounded border border-green-800 font-mono">
                    3 Ranked Options
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedCase.recoveryOptions.map(opt => (
                    <div
                      key={opt.id}
                      className={`p-4 rounded-xl border transition-all ${
                        selectedOption.id === opt.id
                          ? 'border-ice-400 bg-navy-900/90 shadow-lg shadow-ice-500/10 ring-1 ring-ice-500/30'
                          : 'border-navy-700 bg-navy-950/60 hover:border-navy-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {opt.isRecommended && (
                              <span className="text-[10px] bg-green-900/40 text-green-300 border border-green-700/50 rounded px-2 py-0.5 font-bold font-mono">
                                ⭐ RECOMMENDED RECOVERY PLAN
                              </span>
                            )}
                            <span className="text-xs text-gray-500 font-mono">Rank #{opt.rank}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{opt.optionName}</h4>
                          <p className="text-xs text-gray-300 mt-1 leading-relaxed">{opt.description}</p>
                          <p className="text-xs text-gray-400 mt-1 bg-navy-900/60 p-2 rounded border border-navy-800">
                            <strong className="text-ice-300">Why: </strong>{opt.explanation}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-white font-mono">{opt.totalScore.toFixed(1)}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-mono">Total Score</div>
                          <div className="text-xs text-amber-400 font-mono mt-1">+{opt.estimatedDelayDays}d delay</div>
                        </div>
                      </div>

                      {/* 5-Pillar Score Breakdown */}
                      <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-navy-800 text-center text-xs">
                        <div>
                          <div className="font-bold text-green-400 font-mono">{opt.missionContinuityScore}</div>
                          <div className="text-[10px] text-gray-400">Mission (35%)</div>
                        </div>
                        <div>
                          <div className="font-bold text-blue-400 font-mono">{opt.safetyScore}</div>
                          <div className="text-[10px] text-gray-400">Safety (25%)</div>
                        </div>
                        <div>
                          <div className="font-bold text-yellow-400 font-mono">{opt.timeScore}</div>
                          <div className="text-[10px] text-gray-400">Time (20%)</div>
                        </div>
                        <div>
                          <div className="font-bold text-cyan-400 font-mono">{opt.resourceScore}</div>
                          <div className="text-[10px] text-gray-400">Resource (10%)</div>
                        </div>
                        <div>
                          <div className="font-bold text-purple-400 font-mono">{opt.costScore}</div>
                          <div className="text-[10px] text-gray-400">Cost (10%)</div>
                        </div>
                      </div>

                      {step !== 'approved' && (
                        <button
                          onClick={() => handleApprovePlan(opt)}
                          className={`mt-3 w-full justify-center ${opt.isRecommended ? 'btn-success' : 'btn-secondary'} text-xs py-2`}
                        >
                          {opt.isRecommended ? 'Authorize This Recommended Plan' : 'Select This Option'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* STAGE 4: COMMANDER AUTHORIZATION RESULT */}
              {step === 'approved' && (
                <div className="card bg-green-950/30 border-green-600/50 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-green-800/40 pb-3">
                    <CheckCircle2 size={24} className="text-green-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-green-300">Commander Authorization Committed</h3>
                      <p className="text-xs text-gray-300">
                        Recovery Intervention authorized: <strong className="text-white">{selectedOption.optionName}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="bg-navy-950 p-4 rounded-xl border border-navy-800 space-y-2 text-xs">
                    <h4 className="font-bold text-ice-300 uppercase tracking-wide">Operational Execution Steps</h4>
                    <div className="space-y-1.5">
                      {selectedOption.actionSteps?.map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-gray-200">
                          <span className="w-4 h-4 rounded-full bg-green-900 text-green-300 font-bold font-mono text-[10px] flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-gray-400">
                      Simulated Mission Continuity restored from{' '}
                      <span className="text-red-400 font-mono font-bold">{continuityDisrupted}%</span> →{' '}
                      <span className="text-green-400 font-mono font-bold">{continuityAfterRecovery}%</span>.
                    </span>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="btn-primary text-xs py-1.5 px-4"
                    >
                      Return to Command Center
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioLab;
