import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Package, Archive, Wrench, Users, AlertTriangle,
  TrendingUp, Target, MapPin, Zap, ChevronRight, Bell, FileText, Info
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer
} from 'recharts';
import { getDashboard } from '../services/api';
import { StatCard, ProgressBar, LoadingPage, ErrorState, ScoreRing } from '../components/ui';
import { getSeverityBadge, getStatusBadge } from '../utils/helpers';
import { PolarMap } from '../components/PolarMap';
import { CaseStudyCardGrid } from '../components/CaseStudyCardGrid';
import { CaseStudyDetailModal } from '../components/CaseStudyDetailModal';
import { OperationalGraph } from '../components/OperationalGraph';
import { CASE_STUDIES, CaseStudy } from '../data/caseStudiesData';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);
  const [activeCaseStudy, setActiveCaseStudy] = useState<CaseStudy>(CASE_STUDIES[0]);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setError(null);
      const result = await getDashboard();
      setData(result);
    } catch (e) {
      // Offline fallback mock data for dashboard resilience
      setData({
        stats: {
          active_expeditions: 3,
          total_personnel: 54,
          total_cargo: 24,
          critical_assets: 2,
          low_inventory: 4,
          critical_inventory: 1,
          active_alerts: 5,
          critical_alerts: 1,
          mission_continuity: 86.5,
          resource_readiness: 82.0,
          asset_readiness: 78.5,
          personnel_readiness: 91.0
        },
        alerts: [
          { id: 'alt-1', severity: 'Critical', title: 'RSV Nuyina Cargo Crane Malfunction at Mawson Wharf' },
          { id: 'alt-2', severity: 'High', title: '40km Sea-Ice Lockout Threatens Mawson Annual Resupply' },
          { id: 'alt-3', severity: 'High', title: 'Weddell Sea Multi-Year Ice Halts Access to Halley VI' }
        ],
        active_missions: [
          { id: 'm-1', mission_code: 'M-027', mission_name: 'Mawson Deep Ice Core Drilling', status: 'At Risk' },
          { id: 'm-2', mission_code: 'M-WINTER', mission_name: 'Mawson Station Winterization', status: 'Active' },
          { id: 'm-3', mission_code: 'M-SP01', mission_name: 'South Pole Telescope Assembly', status: 'At Risk' }
        ],
        stations: [
          { id: 'st-1', name: 'Mawson Station', code: 'MAW', personnel_count: 18, status: 'Limited' },
          { id: 'st-2', name: 'Halley VI Station', code: 'HAL', personnel_count: 14, status: 'Operational' },
          { id: 'st-3', name: 'Amundsen-Scott South Pole', code: 'SPO', personnel_count: 22, status: 'Operational' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRunSimulation = (caseStudy: CaseStudy) => {
    navigate('/scenario-lab', { state: { caseId: caseStudy.id } });
  };

  if (loading) return <LoadingPage label="Loading expedition data & case studies..." />;

  const stats = data?.stats || {};
  const alerts = data?.alerts || [];
  const missions = data?.active_missions || [];
  const stations = data?.stations || [];

  const radarData = [
    { subject: 'Mission', value: stats.mission_continuity || 86.5 },
    { subject: 'Resources', value: stats.resource_readiness || 82.0 },
    { subject: 'Assets', value: stats.asset_readiness || 78.5 },
    { subject: 'Personnel', value: stats.personnel_readiness || 91.0 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner Disclaimer */}
      <div className="bg-amber-950/40 border border-amber-700/40 rounded-xl p-3 flex items-center justify-between text-xs text-amber-300 gap-3">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-amber-400 flex-shrink-0" />
          <span>
            <strong>Educational prototype using documented case studies and simulated operational data.</strong> All recovery options, metrics, and costs are simulated parameters.
          </span>
        </div>
        <span className="font-mono text-[11px] text-amber-400/80 bg-amber-900/40 px-2 py-0.5 rounded border border-amber-800">
          SIH26062 Prototype
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Command Center</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            POLAROPS DISRUPTION INTELLIGENCE PLATFORM · Real-World Polar Logistics Case Studies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/scenario-lab')}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-ice-600/20"
          >
            <Zap size={16} /> Open Scenario Lab
          </button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Active Cases"
          value={4}
          subtitle="Documented"
          icon={<FileText size={16} />}
        />
        <StatCard
          title="Personnel"
          value={stats.total_personnel || 54}
          subtitle="Deployed"
          icon={<Users size={16} />}
        />
        <StatCard
          title="Cargo Batches"
          value={stats.total_cargo || 24}
          subtitle="Monitored"
          icon={<Package size={16} />}
        />
        <StatCard
          title="Asset Disruptions"
          value={stats.critical_assets || 2}
          subtitle="Active Issues"
          icon={<Wrench size={16} />}
          severity={stats.critical_assets > 0 ? 'warning' : 'normal'}
        />
        <StatCard
          title="Supply Gaps"
          value={stats.low_inventory || 4}
          subtitle="Items Low"
          icon={<Archive size={16} />}
          severity={stats.low_inventory > 0 ? 'warning' : 'normal'}
        />
        <StatCard
          title="Active Alerts"
          value={alerts.length || 3}
          subtitle="Operational"
          icon={<Bell size={16} />}
          severity="warning"
        />
      </div>

      {/* SECTION: REAL-WORLD CASE STUDIES */}
      <div className="bg-navy-950/60 p-5 rounded-2xl border border-navy-700/80 space-y-4">
        <CaseStudyCardGrid
          onSelectCase={(cs) => {
            setSelectedCase(cs);
            setActiveCaseStudy(cs);
          }}
          onRunSimulation={handleRunSimulation}
        />
      </div>

      {/* DYNAMIC OPERATIONAL GRAPH FOR ACTIVE CASE STUDY */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2">
            <Zap size={18} className="text-ice-400" /> Active Case Study Operational Graph: {activeCaseStudy.shortTitle}
          </h2>
          <div className="flex gap-2">
            {CASE_STUDIES.map(cs => (
              <button
                key={cs.id}
                onClick={() => setActiveCaseStudy(cs)}
                className={`text-xs px-2.5 py-1 rounded font-mono transition-all ${
                  activeCaseStudy.id === cs.id
                    ? 'bg-ice-600/30 text-ice-300 border border-ice-500/50'
                    : 'bg-navy-900 text-gray-400 border border-navy-800 hover:text-gray-200'
                }`}
              >
                {cs.shortTitle}
              </button>
            ))}
          </div>
        </div>
        <OperationalGraph nodes={activeCaseStudy.graphNodes} title={`CAUSAL DEPENDENCY CHAIN — ${activeCaseStudy.title}`} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Expedition Health */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Expedition Readiness Radar</h2>
            <span className="text-xs text-gray-400 font-mono">Simulated metrics</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1e3a6e" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Radar dataKey="value" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 flex flex-col justify-center">
              <ProgressBar label="Mission Continuity" value={stats.mission_continuity || 86.5} />
              <ProgressBar label="Resource Readiness" value={stats.resource_readiness || 82.0} />
              <ProgressBar label="Asset Readiness" value={stats.asset_readiness || 78.5} />
              <ProgressBar label="Personnel Readiness" value={stats.personnel_readiness || 91.0} />
            </div>
          </div>
        </div>

        {/* Mission Continuity Score */}
        <div className="card flex flex-col items-center justify-center gap-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Mission Continuity Index</div>
          <ScoreRing score={stats.mission_continuity || 86.5} size={120} strokeWidth={10} />
          <div className="text-center">
            <div className="text-sm text-gray-400">Overall System Score</div>
            <div className="text-xs mt-1 font-mono font-bold text-yellow-400">
              DEGRADED (Active Resupply Disruption)
            </div>
          </div>
          <button
            onClick={() => navigate('/scenario-lab')}
            className="btn-secondary text-xs w-full justify-center"
          >
            Run Recovery Simulation
          </button>
        </div>
      </div>

      {/* Interactive Polar Theater Map */}
      <PolarMap
        stations={stations}
        onSelectStation={() => navigate('/stations')}
        height="320px"
      />

      {/* CASE STUDY DETAIL MODAL OVERLAY */}
      {selectedCase && (
        <CaseStudyDetailModal
          caseStudy={selectedCase}
          onClose={() => setSelectedCase(null)}
          onRunSimulation={handleRunSimulation}
        />
      )}
    </div>
  );
};

export default Dashboard;
