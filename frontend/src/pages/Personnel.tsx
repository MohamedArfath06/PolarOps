import React, { useEffect, useState } from 'react';
import { Users, Search, Shield, UserCheck, AlertCircle, HeartPulse, MapPin } from 'lucide-react';
import { getPersonnel, getTeamSummary } from '../services/api';
import { Personnel } from '../types';
import { PageHeader, LoadingPage, ErrorState, EmptyState, ProgressBar, ScoreRing } from '../components/ui';
import { getStatusBadge } from '../utils/helpers';

const filterOptions = ['All', 'Available', 'Assigned', 'In Transit', 'Medical', 'Unavailable'];

const PersonnelPage: React.FC = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [teamSummary, setTeamSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');

  const fetchData = async () => {
    try {
      setError(null);
      const [pList, tList] = await Promise.all([
        getPersonnel(),
        getTeamSummary(),
      ]);
      setPersonnel(pList);
      setTeamSummary(tList);
    } catch (err) {
      setError('Failed to load personnel roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const teams = ['All', ...Array.from(new Set(personnel.map((p) => p.team).filter(Boolean)))];

  const filtered = personnel.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase()) ||
      (p.specialization || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesTeam = teamFilter === 'All' || p.team === teamFilter;

    return matchesSearch && matchesStatus && matchesTeam;
  });

  if (loading) return <LoadingPage label="Loading expedition personnel roster..." />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Personnel & Expedition Teams"
        subtitle="Operational roster, specialized skillsets, deployment readiness, and team allocation"
        icon={<Users size={22} />}
        actions={
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="input pl-8 w-52"
              placeholder="Search member or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {/* Team Readiness Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {teamSummary.map((t) => (
          <div
            key={t.team}
            onClick={() => setTeamFilter(teamFilter === t.team ? 'All' : t.team)}
            className={`card cursor-pointer transition-all duration-200 border ${
              teamFilter === t.team
                ? 'border-ice-500 bg-navy-800'
                : 'border-navy-600 hover:border-navy-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ice-400">
                Team {t.team}
              </span>
              <ScoreRing score={t.readiness_percentage} size={36} strokeWidth={4} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{t.readiness_percentage}%</span>
              <span className="text-xs text-gray-400">Readiness</span>
            </div>
            <div className="mt-3 text-xs text-gray-400 flex justify-between">
              <span>Members: <strong className="text-white">{t.total_members}</strong></span>
              <span>Available: <strong className="text-green-400">{t.available_members}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setStatusFilter(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === opt
                  ? 'bg-ice-600 text-white'
                  : 'bg-navy-800 text-gray-400 hover:bg-navy-700 hover:text-white border border-navy-600'
              }`}
            >
              {opt}
              {opt === 'Medical' && personnel.filter((p) => p.status === 'Medical').length > 0 && (
                <span className="ml-1.5 bg-red-600 text-white rounded-full px-1.5 text-xs">
                  {personnel.filter((p) => p.status === 'Medical').length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Team Filter:</span>
          <div className="flex gap-1">
            {teams.map((t) => (
              <button
                key={t}
                onClick={() => setTeamFilter(t || 'All')}
                className={`px-2.5 py-1 rounded text-xs ${
                  teamFilter === t
                    ? 'bg-navy-700 text-ice-300 font-semibold border border-ice-500'
                    : 'bg-navy-900 text-gray-500 hover:text-gray-300 border border-navy-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Personnel Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-left">Member ID / Name</th>
              <th className="px-4 py-3 text-left">Role / Specialty</th>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-4 py-3 text-left">Station / Location</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Assigned Mission</th>
              <th className="px-4 py-3 text-right">Availability</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState message="No personnel matching selected criteria" />
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr
                key={p.id}
                className={`table-row ${
                  p.status === 'Medical'
                    ? 'border-l-2 border-red-500 bg-red-950/10'
                    : p.status === 'Unavailable'
                    ? 'border-l-2 border-amber-500'
                    : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-white text-sm">{p.name}</div>
                  <div className="font-mono text-xs text-gray-500">{p.id}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-300">{p.role}</div>
                  {p.specialization && (
                    <div className="text-xs text-ice-400 font-mono">{p.specialization}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-navy-700/80 text-xs font-medium text-gray-300 border border-navy-600">
                    Team {p.team || 'None'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-gray-300 flex items-center gap-1">
                    <MapPin size={11} className="text-gray-500" />
                    {p.current_location || p.station_id || 'Deployed'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${getStatusBadge(p.status)}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3">
                  {p.assigned_mission_id ? (
                    <span className="font-mono text-xs text-ice-400 bg-navy-900/60 border border-navy-700 px-2 py-1 rounded">
                      {p.assigned_mission_id}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  <span
                    className={
                      p.availability >= 80
                        ? 'text-green-400'
                        : p.availability >= 50
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }
                  >
                    {p.availability}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PersonnelPage;
