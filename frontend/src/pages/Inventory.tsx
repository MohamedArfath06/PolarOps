import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, AlertTriangle, TrendingDown, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getInventory, analyzeImpact } from '../services/api';
import { InventoryItem } from '../types';
import { LoadingPage, ErrorState, PageHeader, ProgressBar, EmptyState } from '../components/ui';
import { getStatusBadge, formatDate } from '../utils/helpers';

const categories = ['All', 'Fuel', 'Food', 'Water', 'Medicine', 'Battery', 'Spare Parts', 'Equipment'];

const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStation, setActiveStation] = useState('All');
  const navigate = useNavigate();

  const fetchInventory = async () => {
    try {
      setError(null);
      const data = await getInventory();
      setItems(data);
    } catch (e) {
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const stations = ['All', ...Array.from(new Set(items.map(i => i.station_id).filter(Boolean)))];

  const filtered = items.filter(i => {
    const matchCat = activeCategory === 'All' || i.category === activeCategory;
    const matchSta = activeStation === 'All' || i.station_id === activeStation;
    return matchCat && matchSta;
  });

  const warnings = items.filter(i => i.state === 'Critical' || i.state === 'Out of Stock');
  const lowItems = items.filter(i => i.state === 'Low');

  const chartData = filtered
    .filter(i => i.daily_consumption && i.daily_consumption > 0 && i.days_remaining !== null)
    .slice(0, 8)
    .map(i => ({
      name: i.item_name.split(' ')[0],
      days: i.days_remaining || 0,
      resupply: i.next_resupply_days,
    }));

  const getStateClass = (state?: string) => {
    switch (state) {
      case 'Out of Stock': return 'badge-critical';
      case 'Critical': return 'badge-critical';
      case 'Low': return 'badge-medium';
      default: return 'badge-ok';
    }
  };

  if (loading) return <LoadingPage label="Loading inventory..." />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Inventory Management"
        subtitle="Resource levels, consumption tracking, and shortage forecasts"
        icon={<Archive size={22} />}
        actions={
          <div className="flex items-center gap-2">
            {warnings.length > 0 && (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-1.5">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-red-300 text-xs font-medium">{warnings.length} Critical</span>
              </div>
            )}
          </div>
        }
      />

      {error && <ErrorState message={error} onRetry={fetchInventory} />}

      {/* Warning Banner */}
      {warnings.length > 0 && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-red-300 font-semibold text-sm">Critical Inventory Warnings</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {warnings.map(w => (
              <div key={w.id} className="bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-1.5">
                <span className="text-red-300 text-xs font-semibold">{w.item_name}</span>
                <span className="text-gray-400 text-xs ml-2">@ {w.station_id}</span>
                <span className="text-red-400 text-xs ml-2">
                  {w.state === 'Out of Stock' ? 'OUT OF STOCK' : `${w.quantity.toFixed(0)} ${w.unit}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecast Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title flex items-center gap-2">
              <TrendingDown size={16} className="text-amber-400" /> Days Remaining vs Resupply
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><div className="w-3 h-1 bg-ice-500 rounded" /> Days Remaining</span>
              <span className="flex items-center gap-1"><div className="w-3 h-1 bg-orange-500 rounded" /> Resupply In</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0f2040', border: '1px solid #1e3a6e', color: '#fff', fontSize: 12 }}
                formatter={(value: any, name: any) => [`${value} days`, name === 'days' ? 'Days Remaining' : 'Resupply In']}
              />
              <Bar dataKey="days" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.days < entry.resupply ? '#ef4444' : '#0ea5e9'} />
                ))}
              </Bar>
              <Bar dataKey="resupply" radius={[3, 3, 0, 0]} fill="#f97316" opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-600 text-center mt-2">
            Red bars = shortage predicted before resupply. Prototype linear forecast model.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === c
                ? 'bg-ice-600 text-white'
                : 'bg-navy-800 text-gray-400 hover:bg-navy-700 border border-navy-600'
            }`}
          >
            {c}
          </button>
        ))}
        <div className="border-l border-navy-700 mx-1 h-6 self-center" />
        {stations.map(s => (
          <button
            key={s}
            onClick={() => setActiveStation(s || 'All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeStation === s
                ? 'bg-ice-600/80 text-white'
                : 'bg-navy-900 text-gray-500 hover:bg-navy-800 border border-navy-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Station</th>
              <th className="px-4 py-3 text-right">Available</th>
              <th className="px-4 py-3 text-right">Minimum</th>
              <th className="px-4 py-3 text-right">Daily Use</th>
              <th className="px-4 py-3 text-right">Days Left</th>
              <th className="px-4 py-3 text-left">Level</th>
              <th className="px-4 py-3 text-left">State</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9}><EmptyState message="No inventory items matching filter" /></td></tr>
            )}
            {filtered.map(item => {
              const availQty = item.available_quantity ?? (item.quantity - item.reserved_quantity);
              const levelPct = item.minimum_stock > 0
                ? Math.min(100, (availQty / item.minimum_stock) * 100)
                : 100;

              return (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                  className={`table-row cursor-pointer transition-colors ${
                    selectedItem?.id === item.id
                      ? 'bg-ice-900/30 border-l-4 border-ice-400'
                      : (item.state === 'Critical' || item.state === 'Out of Stock')
                        ? 'border-l-2 border-red-500 hover:bg-navy-800/70'
                        : item.state === 'Low'
                          ? 'border-l-2 border-yellow-500 hover:bg-navy-800/70'
                          : 'hover:bg-navy-800/70'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">{item.item_name}</div>
                    <div className="text-xs font-mono text-gray-500">{item.item_code}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{item.category}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{item.station_id}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-semibold ${
                      item.state === 'Out of Stock' ? 'text-red-400' :
                      item.state === 'Critical' ? 'text-red-300' :
                      item.state === 'Low' ? 'text-yellow-300' : 'text-white'
                    }`}>
                      {availQty.toFixed(1)} {item.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">{item.minimum_stock} {item.unit}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">
                    {item.daily_consumption > 0 ? `${item.daily_consumption} ${item.unit}/day` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.days_remaining !== null && item.days_remaining !== undefined ? (
                      <span className={`text-sm font-semibold ${
                        item.days_remaining < item.next_resupply_days ? 'text-red-400' :
                        item.days_remaining < item.next_resupply_days * 1.2 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {item.days_remaining.toFixed(1)}d
                      </span>
                    ) : <span className="text-gray-600">—</span>}
                    {item.next_resupply_days > 0 && (
                      <div className="text-xs text-gray-600">resupply: {item.next_resupply_days}d</div>
                    )}
                  </td>
                  <td className="px-4 py-3 w-28">
                    <ProgressBar value={levelPct} showValue={false} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getStateClass(item.state)}`}>{item.state || 'Normal'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Item Drawer / Panel */}
      {selectedItem && (
        <div className="card border-2 border-ice-500/40 bg-navy-900/90 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-ice-400 font-bold">{selectedItem.item_code}</span>
                <span className={`badge ${getStateClass(selectedItem.state)}`}>{selectedItem.state}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">{selectedItem.item_name}</h3>
              <p className="text-xs text-gray-400">{selectedItem.category} · Station: {selectedItem.station_id}</p>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-gray-500 hover:text-white text-xs px-2 py-1 rounded bg-navy-800"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-navy-800/80 p-2.5 rounded-lg border border-navy-700">
              <span className="text-gray-400 block mb-0.5">Available Quantity</span>
              <span className="text-base font-bold text-white">{selectedItem.available_quantity ?? selectedItem.quantity} {selectedItem.unit}</span>
            </div>
            <div className="bg-navy-800/80 p-2.5 rounded-lg border border-navy-700">
              <span className="text-gray-400 block mb-0.5">Minimum Stock</span>
              <span className="text-base font-bold text-gray-300">{selectedItem.minimum_stock} {selectedItem.unit}</span>
            </div>
            <div className="bg-navy-800/80 p-2.5 rounded-lg border border-navy-700">
              <span className="text-gray-400 block mb-0.5">Daily Burn Rate</span>
              <span className="text-base font-bold text-amber-400">{selectedItem.daily_consumption} {selectedItem.unit}/d</span>
            </div>
            <div className="bg-navy-800/80 p-2.5 rounded-lg border border-navy-700">
              <span className="text-gray-400 block mb-0.5">Projected Runway</span>
              <span className="text-base font-bold text-ice-400">
                {typeof selectedItem.days_remaining === 'number' ? `${selectedItem.days_remaining.toFixed(1)} days` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-navy-700/60">
            <button
              onClick={() => navigate('/scenario-lab', {
                state: { scenario_type: 'inventory_shortage', entity_id: selectedItem.id }
              })}
              className="btn-primary text-xs"
            >
              <TrendingDown size={14} /> Simulate Depletion in Scenario Lab
            </button>
            <button
              onClick={async () => {
                try {
                  const result = await analyzeImpact({
                    type: 'inventory_shortage',
                    entity_id: selectedItem.id,
                    is_simulation: false
                  });
                  navigate('/impact', { state: { result, item: selectedItem } });
                } catch {
                  alert('Impact analysis failed');
                }
              }}
              className="btn-danger text-xs"
            >
              <AlertTriangle size={14} /> Analyze Shortage Impact
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600 text-center">
        ⚠ Days remaining calculated using prototype linear model (available ÷ daily consumption). Not a certified forecast.
      </p>
    </div>
  );
};

export default InventoryPage;
