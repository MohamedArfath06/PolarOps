import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Printer, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { getRecoveryPlans, getDisruptions } from '../services/api';
import { PageHeader, LoadingPage, ErrorState, EmptyState, ScoreRing } from '../components/ui';
import { formatDateTime } from '../utils/helpers';

const ReportsPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [disruptions, setDisruptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setError(null);
      const [plansData, disruptionsData] = await Promise.all([
        getRecoveryPlans(),
        getDisruptions(false),
      ]);
      setPlans(plansData);
      setDisruptions(disruptionsData);
    } catch (err) {
      setError('Failed to load incident reports data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingPage label="Generating incident & post-action reports..." />;

  const approvedPlans = plans.filter((p) => p.status === 'Approved');

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Post-Action & Incident Reports"
        subtitle="Formal mission debriefs, approved recovery interventions, and operational impact audits"
        icon={<BarChart3 size={22} />}
        actions={
          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-secondary text-xs">
              <Printer size={14} /> Print Report Dossier
            </button>
          </div>
        }
      />

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {/* Synthetic Data Disclaimer Banner */}
      <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="text-amber-400 w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200">
          <strong>SIMULATED PROTOTYPE DOSSIER · SIH26062:</strong> The reports below summarize
          hypothetical polar logistical disruptions and algorithmically scored recovery actions for
          demonstration and evaluation purposes.
        </div>
      </div>

      {approvedPlans.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={48} className="text-gray-600 mx-auto mb-3" />
          <h3 className="text-white font-semibold text-lg mb-1">No Approved Incidents on Record</h3>
          <p className="text-gray-400 text-xs max-w-md mx-auto mb-5">
            Run a scenario in the Scenario Lab or approve an automated recovery plan to generate a
            comprehensive incident debrief.
          </p>
          <button onClick={() => navigate('/scenario-lab')} className="btn-primary mx-auto">
            <Zap size={14} /> Launch Scenario Simulation
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {approvedPlans.map((p, idx) => (
            <div
              key={p.id}
              className="card border border-navy-600 p-6 space-y-4 print:bg-white print:text-black print:border-black"
            >
              <div className="flex items-start justify-between border-b border-navy-700 pb-4 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-green-900/40 text-green-300 border border-green-700/50 px-2 py-0.5 rounded">
                      INCIDENT #{idx + 101}
                    </span>
                    <span className="text-xs text-gray-400">Plan ID: {p.id.slice(0, 8)}...</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Expedition Disruption Recovery &amp; State Restoral
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-400 bg-green-950/40 border border-green-700/50 px-3 py-1.5 rounded-lg font-medium">
                  <ShieldCheck size={16} /> Intervened &amp; Executed
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-navy-900/60 p-3 rounded-lg border border-navy-700">
                  <span className="text-gray-400 block mb-1">Disruption Target</span>
                  <span className="font-mono text-white font-semibold">{p.disruption_id?.slice(0, 12)}...</span>
                </div>
                <div className="bg-navy-900/60 p-3 rounded-lg border border-navy-700">
                  <span className="text-gray-400 block mb-1">Authorization</span>
                  <span className="text-white font-semibold">{p.approved_by || 'Station Commander'}</span>
                </div>
                <div className="bg-navy-900/60 p-3 rounded-lg border border-navy-700">
                  <span className="text-gray-400 block mb-1">Approved Timestamp</span>
                  <span className="text-white font-semibold">{formatDateTime(p.approved_at)}</span>
                </div>
                <div className="bg-navy-900/60 p-3 rounded-lg border border-navy-700">
                  <span className="text-gray-400 block mb-1">Operational State</span>
                  <span className="text-green-400 font-semibold">Normalized / Restored</span>
                </div>
              </div>

              {p.notes && (
                <div className="bg-navy-900/40 p-3 rounded-lg border border-navy-700/60 text-xs">
                  <strong className="text-gray-300">Commander Directives:</strong>
                  <p className="text-gray-400 mt-1">{p.notes}</p>
                </div>
              )}

              <div className="text-[11px] text-gray-500 pt-2 flex justify-between items-center">
                <span>National Centre for Polar and Ocean Research (NCPOR)</span>
                <span>Verification: POLAROPS-SIG-{p.id.slice(0, 6)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
