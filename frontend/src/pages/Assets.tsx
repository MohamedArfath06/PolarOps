import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, AlertTriangle, Zap } from 'lucide-react';
import { getAssets, analyzeImpact } from '../services/api';
import { Asset } from '../types';
import { LoadingPage, ErrorState, PageHeader, ProgressBar, ScoreRing, EmptyState } from '../components/ui';
import { getStatusBadge } from '../utils/helpers';

const AssetTypes = ['All', 'Vehicle', 'Generator', 'Communication', 'Equipment'];

const AssetCard: React.FC<{ asset: Asset; onAnalyze: (a: Asset) => void }> = ({ asset, onAnalyze }) => {
  const isAtRisk = asset.status === 'Failed' || asset.condition_score < 50;
  const isMaint = asset.status === 'Maintenance';

  return (
    <div className={`card border transition-all duration-200 hover:border-ice-600/40 ${
      isAtRisk ? 'border-red-700/50' :
      isMaint ? 'border-yellow-700/50' :
      'border-navy-600'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono text-ice-400 font-bold">{asset.asset_code}</div>
          <div className="text-white text-sm font-medium">{asset.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">{asset.type} · {asset.station_id}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`badge ${getStatusBadge(asset.status)}`}>{asset.status}</span>
          {asset.assigned_mission_id && (
            <span className="text-xs text-ice-400 font-mono">{asset.assigned_mission_id}</span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <ProgressBar label="Condition" value={asset.condition_score} size="sm" />
        {(asset.type === 'Vehicle' || asset.type === 'Generator') && (
          <ProgressBar label="Fuel" value={asset.fuel_level} size="sm" />
        )}
        {(asset.type === 'Vehicle' || asset.type === 'Communication') && (
          <ProgressBar label="Battery" value={asset.battery_level} size="sm" />
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          Maint. due: <span className="text-gray-400">{asset.maintenance_due || '—'}</span>
        </span>
        {asset.status === 'Failed' && (
          <button
            onClick={() => onAnalyze(asset)}
            className="btn-danger text-xs py-1 px-2"
          >
            <AlertTriangle size={11} /> Analyze
          </button>
        )}
      </div>
    </div>
  );
};

const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState('All');
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAssets = async () => {
    try {
      setError(null);
      const data = await getAssets();
      setAssets(data);
    } catch (e) {
      setError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  const filtered = activeType === 'All' ? assets : assets.filter(a => a.type === activeType);

  const handleAnalyze = async (asset: Asset) => {
    setAnalyzing(asset.id);
    try {
      const result = await analyzeImpact({
        type: 'vehicle_failure',
        entity_id: asset.id,
        is_simulation: false,
      });
      navigate('/impact', { state: { result, asset } });
    } catch (e) {
      alert('Analysis failed');
    } finally {
      setAnalyzing(null);
    }
  };

  const operational = assets.filter(a => a.status === 'Operational').length;
  const failed = assets.filter(a => a.status === 'Failed').length;
  const maintenance = assets.filter(a => a.status === 'Maintenance').length;
  const avgCondition = assets.length > 0
    ? (assets.reduce((s, a) => s + a.condition_score, 0) / assets.length)
    : 0;

  if (loading) return <LoadingPage label="Loading asset registry..." />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Asset Management"
        subtitle="Equipment status, condition monitoring, and maintenance tracking"
        icon={<Wrench size={22} />}
        actions={
          <button onClick={() => navigate('/scenario-lab')} className="btn-secondary text-xs">
            <Zap size={14} /> Simulate Failure
          </button>
        }
      />

      {error && <ErrorState message={error} onRetry={fetchAssets} />}

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-sm text-center">
          <div className="text-2xl font-bold text-green-400">{operational}</div>
          <div className="text-xs text-gray-400 mt-1">Operational</div>
        </div>
        <div className={`card-sm text-center ${failed > 0 ? 'border-red-700/50' : ''}`}>
          <div className={`text-2xl font-bold ${failed > 0 ? 'text-red-400' : 'text-gray-500'}`}>{failed}</div>
          <div className="text-xs text-gray-400 mt-1">Failed</div>
        </div>
        <div className={`card-sm text-center ${maintenance > 0 ? 'border-yellow-700/50' : ''}`}>
          <div className={`text-2xl font-bold ${maintenance > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>{maintenance}</div>
          <div className="text-xs text-gray-400 mt-1">In Maintenance</div>
        </div>
        <div className="card-sm text-center">
          <div className={`text-2xl font-bold ${avgCondition >= 80 ? 'text-green-400' : avgCondition >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {avgCondition.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">Avg. Condition</div>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        {AssetTypes.map(t => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeType === t
                ? 'bg-ice-600 text-white'
                : 'bg-navy-800 text-gray-400 hover:bg-navy-700 border border-navy-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Asset Cards Grid */}
      {filtered.length === 0 ? (
        <EmptyState message="No assets matching filter" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(asset => (
            <AssetCard key={asset.id} asset={asset} onAnalyze={handleAnalyze} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AssetsPage;
