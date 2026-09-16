import React, { useEffect, useState } from 'react';
import { Bell, AlertTriangle, CheckCircle2, ShieldAlert, History, User } from 'lucide-react';
import { getAlerts, acknowledgeAlert, getAuditLog } from '../services/api';
import { Alert } from '../types';
import { PageHeader, LoadingPage, ErrorState, EmptyState } from '../components/ui';
import { getSeverityBadge, formatDateTime } from '../utils/helpers';

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Critical' | 'High' | 'Unacknowledged'>('Unacknowledged');
  const [ackLoading, setAckLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [alertsData, logsData] = await Promise.all([
        getAlerts(),
        getAuditLog(),
      ]);
      setAlerts(alertsData);
      setAuditLogs(logsData);
    } catch (err) {
      setError('Failed to fetch system alerts and audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcknowledge = async (id: string) => {
    setAckLoading(id);
    try {
      await acknowledgeAlert(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setAckLoading(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'Critical') return a.severity === 'Critical';
    if (filter === 'High') return a.severity === 'High';
    if (filter === 'Unacknowledged') return !a.acknowledged;
    return true;
  });

  if (loading) return <LoadingPage label="Scanning active telemetric warnings..." />;

  const unackCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Alerts & System Incident Logs"
        subtitle="Active anomaly detection, critical warnings, and operational action audit trail"
        icon={<Bell size={22} />}
      />

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['Unacknowledged', 'Critical', 'High', 'All'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === tab
                  ? 'bg-ice-600 text-white'
                  : 'bg-navy-800 text-gray-400 hover:bg-navy-700 hover:text-white border border-navy-600'
              }`}
            >
              {tab}
              {tab === 'Unacknowledged' && unackCount > 0 && (
                <span className="ml-1.5 bg-red-600 text-white rounded-full px-1.5 text-xs">
                  {unackCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500">
          Showing {filteredAlerts.length} of {alerts.length} registered notifications
        </div>
      </div>

      {/* Alerts Stream */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 && (
          <EmptyState message={`No alerts in "${filter}" category.`} />
        )}
        {filteredAlerts.map((a) => {
          const isCritical = a.severity === 'Critical';
          const isHigh = a.severity === 'High';

          return (
            <div
              key={a.id}
              className={`card transition-all duration-200 border ${
                a.acknowledged
                  ? 'opacity-60 border-navy-700 bg-navy-900/40'
                  : isCritical
                  ? 'border-red-600/70 bg-red-950/20 shadow-sm shadow-red-900/20'
                  : isHigh
                  ? 'border-orange-600/60 bg-orange-950/20'
                  : 'border-yellow-600/50 bg-navy-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isCritical ? (
                      <AlertTriangle className="text-red-400 w-5 h-5 animate-pulse" />
                    ) : isHigh ? (
                      <ShieldAlert className="text-orange-400 w-5 h-5" />
                    ) : (
                      <Bell className="text-yellow-400 w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${getSeverityBadge(a.severity)}`}>
                        {a.severity}
                      </span>
                      <span className="text-xs font-mono text-gray-400">{a.type}</span>
                      {a.entity_id && (
                        <span className="text-xs font-mono bg-navy-900/80 px-1.5 py-0.5 rounded text-ice-300 border border-navy-700">
                          {a.entity_type ? `${a.entity_type}: ` : ''}{a.entity_id}
                        </span>
                      )}
                    </div>
                    <h4 className="text-white font-semibold text-sm mt-1">{a.title}</h4>
                    {a.message && <p className="text-xs text-gray-300 mt-0.5">{a.message}</p>}
                    <p className="text-[11px] text-gray-500 mt-1">{formatDateTime(a.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {a.acknowledged ? (
                    <span className="text-xs text-green-400/80 flex items-center gap-1 font-medium">
                      <CheckCircle2 size={13} /> Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(a.id)}
                      disabled={ackLoading === a.id}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      {ackLoading === a.id ? 'Saving...' : 'Acknowledge'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit Trail Section */}
      <div className="card border border-navy-700 space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-ice-400" />
            <h3 className="section-title">Expedition Action Audit Trail</h3>
          </div>
          <span className="text-xs text-gray-500 font-mono">Immutable System Log</span>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-lg bg-navy-900/70 border border-navy-700 text-xs flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-gray-500">{log.timestamp ? formatDateTime(log.timestamp) : '—'}</span>
                <span className="font-mono text-ice-400 font-semibold px-2 py-0.5 rounded bg-navy-800 border border-navy-600">
                  {log.action}
                </span>
                <span className="text-gray-300">{log.description}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400 font-mono flex-shrink-0">
                <User size={12} />
                <span>{log.user_role || 'System'}</span>
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <p className="text-xs text-gray-500 py-4 text-center">No audit records generated yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
