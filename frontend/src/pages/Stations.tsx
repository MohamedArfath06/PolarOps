import React, { useEffect, useState } from 'react';
import { MapPin, Users, Wrench, Archive, Activity, Radio } from 'lucide-react';
import { getStations, getStation } from '../services/api';
import { Station } from '../types';
import { PageHeader, ProgressBar, LoadingPage, ErrorState, InfoLabel, ScoreRing } from '../components/ui';
import { getStatusBadge } from '../utils/helpers';
import { PolarMap } from '../components/PolarMap';

const StationsPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [stationDetail, setStationDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchStationsData = async () => {
    try {
      setError(null);
      const data = await getStations();
      setStations(data);
      if (data.length > 0 && !selectedStationId) {
        handleSelectStation(data[0].id);
      }
    } catch (err: any) {
      setError('Failed to load stations data. Ensure backend is active.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStationsData();
  }, []);

  const handleSelectStation = async (id: string) => {
    setSelectedStationId(id);
    setDetailLoading(true);
    try {
      const detail = await getStation(id);
      setStationDetail(detail);
    } catch (err) {
      setStationDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <LoadingPage label="Loading polar station telemetry..." />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Research Stations & Camps"
        subtitle="Operational telemetry, habitat capacity, resources, and communication status"
        icon={<MapPin size={22} />}
      />

      {error && <ErrorState message={error} onRetry={fetchStationsData} />}

      {/* Interactive Map & Radar Grid */}
      <PolarMap
        stations={stations}
        selectedStationId={selectedStationId}
        onSelectStation={handleSelectStation}
        height="380px"
      />

      {/* Station Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stations.map((s) => {
          const isSelected = selectedStationId === s.id;
          return (
            <div
              key={s.id}
              onClick={() => handleSelectStation(s.id)}
              className={`card cursor-pointer transition-all duration-200 border-2 ${
                isSelected
                  ? 'border-ice-500 bg-navy-800/90 shadow-lg shadow-ice-900/30'
                  : 'border-navy-600 hover:border-navy-500'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-mono text-ice-400 font-semibold">{s.code}</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{s.name}</h3>
                  <p className="text-xs text-gray-400">{s.location || 'Antarctic Region'}</p>
                </div>
                <span className={`badge ${getStatusBadge(s.status)}`}>{s.status}</span>
              </div>

              <div className="space-y-3 mt-4">
                <div className="text-xs text-gray-400 flex justify-between">
                  <span>Coordinates</span>
                  <span className="font-mono text-gray-300">
                    {s.latitude?.toFixed(4)}°S, {s.longitude?.toFixed(4)}°E
                  </span>
                </div>

                <ProgressBar
                  label="Fuel Reserves"
                  value={s.fuel_level}
                  size="sm"
                />

                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Occupancy</span>
                  <span className="font-medium text-white">
                    {s.personnel_count} / {s.capacity} personnel
                  </span>
                </div>
                <div className="w-full bg-navy-700 rounded-full h-1.5">
                  <div
                    className="bg-ice-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (s.personnel_count / s.capacity) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-navy-700/60 flex items-center justify-between text-xs">
                <span className="text-ice-400 font-medium">
                  {isSelected ? '● Telemetry Active' : 'Click to inspect telemetry'}
                </span>
                <Radio size={14} className={isSelected ? 'text-green-400 animate-pulse' : 'text-gray-500'} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Station Detailed telemetry */}
      {stationDetail && (
        <div className="card border border-navy-600 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-navy-700">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-ice-900/40 text-ice-400 border border-ice-700/50 px-2 py-0.5 rounded">
                  {stationDetail.code}
                </span>
                <h2 className="text-xl font-bold text-white">{stationDetail.name} Full Diagnostics</h2>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {stationDetail.location} · Lat: {stationDetail.latitude}° S, Lon: {stationDetail.longitude}° E
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-gray-400">Capacity Utilization</span>
                <p className="text-sm font-bold text-white">
                  {((stationDetail.personnel_count / stationDetail.capacity) * 100).toFixed(0)}%
                </p>
              </div>
              <ScoreRing
                score={((stationDetail.personnel_count / stationDetail.capacity) * 100)}
                size={48}
                strokeWidth={5}
              />
            </div>
          </div>

          {detailLoading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Refreshing station nodes...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Personnel at station */}
              <div className="bg-navy-900/60 rounded-xl p-4 border border-navy-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Users size={16} className="text-ice-400" /> Station Personnel
                  </h4>
                  <span className="text-xs text-gray-400 font-mono">
                    {stationDetail.personnel?.length || 0} stationed
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(stationDetail.personnel || []).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded bg-navy-800/80 text-xs">
                      <div>
                        <span className="text-white font-medium">{p.name}</span>
                        <div className="text-gray-400">{p.role} · Team {p.team || 'None'}</div>
                      </div>
                      <span className={`badge ${getStatusBadge(p.status)} text-[10px]`}>{p.status}</span>
                    </div>
                  ))}
                  {(!stationDetail.personnel || stationDetail.personnel.length === 0) && (
                    <p className="text-xs text-gray-500 py-2">No personnel stationed</p>
                  )}
                </div>
              </div>

              {/* Assets at station */}
              <div className="bg-navy-900/60 rounded-xl p-4 border border-navy-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Wrench size={16} className="text-ice-400" /> Assigned Assets
                  </h4>
                  <span className="text-xs text-gray-400 font-mono">
                    {stationDetail.assets?.length || 0} units
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(stationDetail.assets || []).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded bg-navy-800/80 text-xs">
                      <div>
                        <span className="font-mono text-ice-400 font-bold">{a.asset_code}</span>
                        <div className="text-white">{a.name}</div>
                        <div className="text-[10px] text-gray-400">Condition: {a.condition_score}%</div>
                      </div>
                      <span className={`badge ${getStatusBadge(a.status)} text-[10px]`}>{a.status}</span>
                    </div>
                  ))}
                  {(!stationDetail.assets || stationDetail.assets.length === 0) && (
                    <p className="text-xs text-gray-500 py-2">No heavy assets at this station</p>
                  )}
                </div>
              </div>

              {/* Critical Inventory at station */}
              <div className="bg-navy-900/60 rounded-xl p-4 border border-navy-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Archive size={16} className="text-ice-400" /> Critical Stock
                  </h4>
                  <span className="text-xs text-gray-400 font-mono">
                    {stationDetail.inventory?.length || 0} items
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(stationDetail.inventory || []).slice(0, 6).map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between p-2 rounded bg-navy-800/80 text-xs">
                      <div>
                        <span className="text-white font-medium">{inv.item_name}</span>
                        <div className="text-[10px] text-gray-400 font-mono">{inv.item_code}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-bold">{inv.quantity} {inv.unit}</span>
                        <div className="text-[10px] text-gray-400">Min: {inv.minimum_stock}</div>
                      </div>
                    </div>
                  ))}
                  {(!stationDetail.inventory || stationDetail.inventory.length === 0) && (
                    <p className="text-xs text-gray-500 py-2">No inventory tracked</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StationsPage;
