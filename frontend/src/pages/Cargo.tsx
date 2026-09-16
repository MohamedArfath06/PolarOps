import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, AlertTriangle, GitBranch, Clock, ChevronRight, Filter } from 'lucide-react';
import { getCargo, getCargoItem, updateCargo, analyzeImpact } from '../services/api';
import { CargoItem } from '../types';
import {
  LoadingPage, ErrorState, PageHeader, EmptyState, InfoLabel
} from '../components/ui';
import { getStatusBadge, getPriorityBadge, formatDate } from '../utils/helpers';

const statusFilters = ['All', 'Critical', 'Delayed', 'In Transit', 'At Station', 'Delivered'];

const CargoPage: React.FC = () => {
  const [cargo, setCargo] = useState<CargoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CargoItem | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();

  const fetchCargo = async () => {
    try {
      setError(null);
      const data = await getCargo();
      setCargo(data);
    } catch (e) {
      setError('Failed to load cargo data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCargo(); }, []);

  const filtered = cargo.filter(c => {
    const matchSearch = !search ||
      c.cargo_code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' ||
      (activeFilter === 'Critical' && c.priority === 'Critical') ||
      (activeFilter === 'Delayed' && c.status === 'Delayed') ||
      (activeFilter === 'In Transit' && c.status === 'In Transit') ||
      (activeFilter === 'At Station' && c.status === 'At Station') ||
      (activeFilter === 'Delivered' && c.status === 'Delivered');
    return matchSearch && matchFilter;
  });

  const handleAnalyzeImpact = async (item: CargoItem) => {
    setAnalyzing(true);
    try {
      const result = await analyzeImpact({
        type: 'cargo_delay',
        entity_id: item.id,
        delay_days: item.delay_days || 5,
        is_simulation: false,
      });
      navigate('/impact', { state: { result, cargo: item } });
    } catch (e) {
      alert('Analysis failed. Is the backend running?');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSetDelay = async (cargoItem: CargoItem, days: number) => {
    setAnalyzing(true);
    try {
      await updateCargo(cargoItem.id, {
        status: days > 0 ? 'Delayed' : 'In Transit',
        delay_days: days
      });
      await fetchCargo();
      const updated = await getCargoItem(cargoItem.id);
      setSelected(updated);
    } catch (e) {
      alert('Failed to update cargo delay state');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <LoadingPage label="Loading cargo manifest..." />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Cargo Management"
        subtitle="Track all expedition cargo consignments and dependencies"
        icon={<Package size={22} />}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="input pl-8 w-48"
                placeholder="Search cargo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        }
      />

      {error && <ErrorState message={error} onRetry={fetchCargo} />}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === f
                ? 'bg-ice-600 text-white'
                : 'bg-navy-800 text-gray-400 hover:bg-navy-700 hover:text-white border border-navy-600'
            }`}
          >
            {f}
            {f === 'Delayed' && cargo.filter(c => c.status === 'Delayed').length > 0 && (
              <span className="ml-1.5 bg-red-600 text-white rounded-full px-1.5 text-xs">
                {cargo.filter(c => c.status === 'Delayed').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cargo Table + Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className={`${selected ? 'lg:col-span-2' : 'lg:col-span-3'} card p-0 overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Cargo ID</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Origin → Dest.</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Transport</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">ETA / Arrived</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8}><EmptyState message="No cargo matching filter" /></td></tr>
              )}
              {filtered.map(c => (
                <tr
                  key={c.id}
                  className={`table-row cursor-pointer ${selected?.id === c.id ? 'bg-ice-600/10' : ''} ${c.status === 'Delayed' ? 'border-l-2 border-red-500' : ''}`}
                  onClick={() => setSelected(selected?.id === c.id ? null : c)}
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm text-ice-400 font-semibold">{c.cargo_code}</div>
                    {c.container_id && <div className="text-xs text-gray-600">{c.container_id}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-white max-w-[200px] truncate">{c.description}</div>
                    <div className="text-xs text-gray-500">{c.category}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-xs text-gray-400">{c.origin}</div>
                    <div className="text-xs text-white">→ {c.destination}</div>
                    {c.current_location && <div className="text-xs text-gray-600 mt-0.5 italic">{c.current_location}</div>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-xs text-gray-400">{c.transport_mode}</div>
                    <div className="text-xs text-gray-500">{c.weight} kg</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getPriorityBadge(c.priority)}`}>{c.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    {c.status === 'Delayed' ? (
                      <div>
                        <div className="text-red-400 text-xs font-bold flex items-center gap-1">
                          <AlertTriangle size={10} /> +{c.delay_days}d delay
                        </div>
                        <div className="text-xs text-gray-500">{formatDate(c.planned_arrival)}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">
                        {c.actual_arrival ? formatDate(c.actual_arrival) : formatDate(c.planned_arrival)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getStatusBadge(c.status)}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight size={16} className={`text-gray-600 transition-transform ${selected?.id === c.id ? 'rotate-90' : ''}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-ice-400 font-bold text-lg">{selected.cargo_code}</h3>
                <span className={`badge ${getStatusBadge(selected.status)}`}>{selected.status}</span>
              </div>
              <p className="text-sm text-white mb-4">{selected.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <InfoLabel label="Category" value={selected.category} />
                <InfoLabel label="Priority" value={
                  <span className={`badge ${getPriorityBadge(selected.priority)}`}>{selected.priority}</span>
                } />
                <InfoLabel label="Weight" value={`${selected.weight} kg`} />
                <InfoLabel label="Qty" value={`${selected.quantity} unit(s)`} />
                <InfoLabel label="Transport" value={selected.transport_mode} />
                <InfoLabel label="Container" value={selected.container_id} />
              </div>

              <div className="space-y-2 mb-4">
                <InfoLabel label="Origin" value={selected.origin} />
                <InfoLabel label="Current Location" value={selected.current_location} />
                <InfoLabel label="Destination" value={selected.destination} />
              </div>

              {selected.delay_days > 0 && (
                <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-red-300 text-sm font-semibold">
                    <AlertTriangle size={14} />
                    {selected.delay_days} Day Delay
                  </div>
                  <p className="text-xs text-red-400 mt-1">
                    Original ETA: {formatDate(selected.planned_arrival)}
                  </p>
                </div>
              )}

              {/* Dependencies */}
              {selected.linked_mission_id && (
                <div className="bg-navy-900/60 rounded-lg p-3 mb-4 border border-navy-700">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Dependencies</div>
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch size={12} className="text-ice-400" />
                    <span className="text-gray-300">Required by</span>
                    <span className="font-mono text-ice-400 font-semibold">{selected.linked_mission_id}</span>
                  </div>
                  {selected.linked_asset_id && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <GitBranch size={12} className="text-orange-400" />
                      <span className="text-gray-300">Supports asset</span>
                      <span className="font-mono text-orange-400 font-semibold">{selected.linked_asset_id}</span>
                    </div>
                  )}
                  {selected.linked_inventory_id && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <GitBranch size={12} className="text-yellow-400" />
                      <span className="text-gray-300">Delivers</span>
                      <span className="font-mono text-yellow-400 font-semibold">{selected.linked_inventory_id}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">Timeline</div>
                <div className="relative">
                  {(['Planned', 'Packed', 'Dispatched', 'In Transit', selected.status === 'Delayed' ? 'Delayed' : 'Delivered']).map((stage, i) => {
                    const isCompleted = i < ['Planned', 'Packed', 'Dispatched', 'In Transit', 'Delayed', 'Delivered'].indexOf(selected.status) + 1;
                    const isAlert = stage === 'Delayed' && selected.status === 'Delayed';
                    return (
                      <div key={stage} className="flex items-center gap-3 mb-3">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          isAlert ? 'bg-red-500 animate-pulse' :
                          isCompleted ? 'bg-ice-500' : 'bg-navy-600'
                        }`} />
                        <span className={`text-xs ${isAlert ? 'text-red-400 font-semibold' : isCompleted ? 'text-white' : 'text-gray-600'}`}>
                          {stage}
                        </span>
                        {isAlert && <span className="text-xs text-red-400">+{selected.delay_days} days</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-4">
                {selected.status === 'Delayed' ? (
                  <>
                    <button
                      onClick={() => handleAnalyzeImpact(selected)}
                      disabled={analyzing}
                      className="btn-danger w-full justify-center"
                    >
                      <AlertTriangle size={14} />
                      {analyzing ? 'Analyzing...' : 'Analyze Disruption Impact'}
                    </button>
                    <button
                      onClick={() => handleSetDelay(selected, 0)}
                      disabled={analyzing}
                      className="btn-secondary w-full justify-center text-xs text-green-400 border-green-700/40 hover:bg-green-900/20"
                    >
                      ✓ Resolve Delay (Restore Normal Status)
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleSetDelay(selected, 5)}
                    disabled={analyzing}
                    className="btn-danger w-full justify-center text-xs"
                  >
                    <AlertTriangle size={14} />
                    Simulate 5-Day Delivery Delay
                  </button>
                )}
                <button
                  onClick={() => navigate('/scenario-lab', { state: { cargo: selected } })}
                  className="btn-secondary w-full justify-center text-xs"
                >
                  Open in Scenario Lab Sandbox
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CargoPage;
