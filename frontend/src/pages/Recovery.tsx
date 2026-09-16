import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckSquare, Zap, Check, X, AlertTriangle } from 'lucide-react';
import { getRecoveryPlans, getRecoveryOptions, createRecoveryPlan, approveRecoveryPlan } from '../services/api';
import { LoadingPage, ErrorState, PageHeader, EmptyState, ScoreRing } from '../components/ui';
import { formatDateTime } from '../utils/helpers';

const RecoveryPlans: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If navigated from scenario lab with disruption_id
  const disruptionId = location.state?.disruption_id;
  const [pendingOptions, setPendingOptions] = useState<any[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);

  const fetchPlans = async () => {
    try {
      setError(null);
      const data = await getRecoveryPlans();
      setPlans(data);
    } catch (e) {
      setError('Failed to load recovery plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    if (!disruptionId) return;
    setOptionsLoading(true);
    try {
      const opts = await getRecoveryOptions(disruptionId);
      setPendingOptions(opts);
    } catch {}
    setOptionsLoading(false);
  };

  useEffect(() => {
    fetchPlans();
    fetchOptions();
  }, [disruptionId]);

  const handleSelectOption = async (optionId: string) => {
    if (!disruptionId) return;
    setCreatingPlan(true);
    try {
      const plan = await createRecoveryPlan({
        disruption_id: disruptionId,
        selected_option_id: optionId,
        notes: 'Commander selected via Scenario Lab'
      });
      await fetchPlans();
      navigate('/recovery', { replace: true, state: {} });
    } catch (e) {
      setError('Failed to create recovery plan');
    } finally {
      setCreatingPlan(false);
    }
  };

  const handleApprove = async (planId: string) => {
    setApproving(planId);
    try {
      await approveRecoveryPlan(planId, {
        approved_by: 'Commander',
        notes: 'Approved via POLAROPS command interface'
      });
      setSuccessMsg('Recovery plan approved. Operational state updated.');
      await fetchPlans();
    } catch (e) {
      setError('Approval failed');
    } finally {
      setApproving(null);
    }
  };

  if (loading) return <LoadingPage label="Loading recovery plans..." />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Recovery Plans"
        subtitle="Commander-approved disruption recovery plans and their operational status"
        icon={<CheckSquare size={22} />}
        actions={
          <button onClick={() => navigate('/scenario-lab')} className="btn-secondary text-xs">
            <Zap size={14} /> Generate New Recovery
          </button>
        }
      />

      {error && <ErrorState message={error} onRetry={fetchPlans} />}

      {successMsg && (
        <div className="bg-green-900/20 border border-green-600/40 rounded-xl p-4 flex items-center gap-3">
          <Check size={18} className="text-green-400" />
          <div>
            <div className="text-green-300 font-semibold text-sm">Recovery Plan Approved</div>
            <p className="text-xs text-gray-400 mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Pending options from Scenario Lab */}
      {pendingOptions.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-ice-400" />
            <h3 className="section-title">Recovery Options — Select to Create Plan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pendingOptions.map((opt: any) => (
              <div
                key={opt.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  opt.rank === 1
                    ? 'border-green-600/50 bg-green-900/10 hover:bg-green-900/20'
                    : 'border-navy-600 bg-navy-900/40 hover:border-ice-600/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  {opt.rank === 1 && (
                    <span className="text-xs bg-green-900/40 text-green-300 border border-green-700/40 rounded px-1.5 py-0.5 font-bold">
                      ⭐ RECOMMENDED
                    </span>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">Rank #{opt.rank}</span>
                </div>

                <ScoreRing score={opt.total_score} size={56} strokeWidth={5} />
                <div className="mt-2">
                  <div className="text-sm font-semibold text-white">{opt.option_name}</div>
                  <p className="text-xs text-gray-400 mt-1">{opt.description}</p>
                  {opt.estimated_delay_days > 0 && (
                    <div className="text-xs text-orange-400 mt-1">Mission delay: +{opt.estimated_delay_days}d</div>
                  )}
                </div>

                <button
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={creatingPlan}
                  className={`mt-3 w-full justify-center text-xs ${opt.rank === 1 ? 'btn-success' : 'btn-secondary'}`}
                >
                  {creatingPlan ? 'Creating...' : 'Select This Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Plans */}
      {plans.length === 0 && pendingOptions.length === 0 && (
        <div className="card text-center py-12">
          <CheckSquare size={40} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-gray-400 font-medium mb-2">No Recovery Plans Yet</h3>
          <p className="text-gray-600 text-sm mb-4">
            Run a scenario simulation to generate and approve recovery plans.
          </p>
          <button onClick={() => navigate('/scenario-lab')} className="btn-primary mx-auto">
            <Zap size={14} /> Open Scenario Lab
          </button>
        </div>
      )}

      {plans.length > 0 && (
        <div className="space-y-4">
          <h3 className="section-title">All Recovery Plans</h3>
          {plans.map((plan: any) => (
            <div key={plan.id} className={`card border ${
              plan.status === 'Approved' ? 'border-green-700/40' :
              plan.status === 'Pending Approval' ? 'border-amber-700/40' : 'border-navy-600'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-ice-400">{plan.id?.slice(0, 8)}...</span>
                    <span className={`badge ${
                      plan.status === 'Approved' ? 'badge-ok' :
                      plan.status === 'Pending Approval' ? 'badge-medium' : 'badge-info'
                    }`}>{plan.status}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500 mb-0.5">Disruption ID</div>
                      <div className="font-mono text-gray-300">{plan.disruption_id?.slice(0, 8)}...</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Created</div>
                      <div className="text-gray-300">{formatDateTime(plan.created_at)}</div>
                    </div>
                    {plan.approved_by && (
                      <div>
                        <div className="text-gray-500 mb-0.5">Approved By</div>
                        <div className="text-gray-300">{plan.approved_by}</div>
                      </div>
                    )}
                    {plan.approved_at && (
                      <div>
                        <div className="text-gray-500 mb-0.5">Approved At</div>
                        <div className="text-gray-300">{formatDateTime(plan.approved_at)}</div>
                      </div>
                    )}
                  </div>

                  {plan.notes && (
                    <div className="mt-2 text-xs text-gray-400 bg-navy-900/60 rounded p-2">
                      {plan.notes}
                    </div>
                  )}
                </div>

                {plan.status === 'Pending Approval' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(plan.id)}
                      disabled={approving === plan.id}
                      className="btn-success text-xs"
                    >
                      <Check size={12} />
                      {approving === plan.id ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                )}

                {plan.status === 'Approved' && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                      <Check size={14} /> Approved
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecoveryPlans;
