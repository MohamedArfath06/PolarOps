import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Compass, Layers, MapPin, Radio, Shield, Users, Fuel } from 'lucide-react';
import { Station } from '../types';

// Create SVG-based custom DivIcons to avoid image 404s
const createStationIcon = (name: string, status: string, isSelected: boolean) => {
  const color = status === 'Operational' ? '#10b981' : status === 'Limited' ? '#f59e0b' : '#ef4444';

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
      <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: ${color}33; border: 2px solid ${color}; ${isSelected ? 'box-shadow: 0 0 15px ' + color + ';' : ''}"></div>
      <div style="position: absolute; width: 12px; height: 12px; border-radius: 50%; background: ${color};"></div>
      <div style="position: absolute; top: -20px; white-space: nowrap; font-size: 10px; font-weight: bold; color: #fff; background: rgba(8,18,37,0.85); padding: 1px 6px; border-radius: 4px; border: 1px solid ${color}88;">
        ${name}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-polar-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

interface PolarMapProps {
  stations?: Station[];
  selectedStationId?: string | null;
  onSelectStation?: (stationId: string) => void;
  height?: string;
}

export const PolarMap: React.FC<PolarMapProps> = ({
  stations = [],
  selectedStationId,
  onSelectStation,
  height = '420px',
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'radar'>('map');

  // Coordinates mapping
  const stationCoords: Record<string, [number, number]> = {
    'STA-01': [-69.4075, 76.1872], // Bharati
    'STA-02': [-70.7656, 11.7317], // Maitri
    'STA-03': [-71.2000, 12.5000], // Field Camp Alpha
  };

  const defaultCoords: [number, number] = [-70.5, 45.0];

  // Traverse corridor between Maitri and Field Camp Alpha
  const traverseRoute: [number, number][] = [
    [-70.7656, 11.7317],
    [-70.9800, 12.1000],
    [-71.2000, 12.5000],
  ];

  // Air logistics corridor between Maitri and Bharati
  const airCorridor: [number, number][] = [
    [-70.7656, 11.7317],
    [-70.1000, 42.0000],
    [-69.4075, 76.1872],
  ];

  return (
    <div className="card p-0 overflow-hidden border border-navy-600 bg-navy-950 relative flex flex-col" style={{ height }}>
      {/* Map Control Bar */}
      <div className="bg-navy-900/90 border-b border-navy-700 px-4 py-2.5 flex items-center justify-between z-[400]">
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-ice-400" />
          <span className="text-xs font-semibold text-white tracking-wide uppercase">Antarctic Operational Theater</span>
          <span className="text-[10px] text-ice-400 font-mono bg-ice-900/40 border border-ice-700/50 px-2 py-0.5 rounded">
            EPSG:4326 · South Polar Sector
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'map' ? 'radar' : 'map')}
            className="flex items-center gap-1.5 text-xs bg-navy-800 hover:bg-navy-700 text-gray-300 border border-navy-600 px-2.5 py-1 rounded transition-colors"
          >
            <Layers size={13} className="text-ice-400" />
            <span>{viewMode === 'map' ? 'Switch to Radar Grid' : 'Switch to Geographic Map'}</span>
          </button>
        </div>
      </div>

      {/* Map Body */}
      <div className="relative flex-1 w-full h-full min-h-[300px]">
        {viewMode === 'map' ? (
          <MapContainer
            center={defaultCoords}
            zoom={3}
            minZoom={2}
            maxZoom={8}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', background: '#071124' }}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
            />

            {/* Flight Corridor */}
            <Polyline
              positions={airCorridor}
              pathOptions={{
                color: '#38bdf8',
                weight: 2,
                dashArray: '4, 8',
                opacity: 0.6,
              }}
            />

            {/* Ground Traverse Corridor */}
            <Polyline
              positions={traverseRoute}
              pathOptions={{
                color: '#f59e0b',
                weight: 3,
                dashArray: '2, 6',
                opacity: 0.8,
              }}
            />

            {/* Station Markers */}
            {stations.map((station) => {
              const coords = stationCoords[station.id] || [station.latitude || -70.0, station.longitude || 40.0];
              const isSelected = selectedStationId === station.id;

              return (
                <Marker
                  key={station.id}
                  position={coords}
                  icon={createStationIcon(station.code, station.status, isSelected)}
                  eventHandlers={{
                    click: () => onSelectStation && onSelectStation(station.id),
                  }}
                >
                  <Popup className="polar-map-popup">
                    <div className="bg-navy-900 text-white p-2 rounded text-xs border border-navy-700 min-w-[180px]">
                      <div className="font-bold text-ice-400 text-sm">{station.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mb-2">Code: {station.code}</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className={`font-semibold ${station.status === 'Operational' ? 'text-green-400' : 'text-amber-400'}`}>
                            {station.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Personnel:</span>
                          <span className="font-medium text-white">{station.personnel_count} / {station.capacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fuel Reserves:</span>
                          <span className="font-medium text-ice-300">{station.fuel_level}%</span>
                        </div>
                      </div>
                      {onSelectStation && (
                        <button
                          type="button"
                          onClick={() => onSelectStation(station.id)}
                          className="w-full mt-2 py-1 bg-ice-600 hover:bg-ice-500 text-white rounded text-[10px] font-semibold transition-colors"
                        >
                          Select Station Details
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        ) : (
          /* High-Tech Antarctic Radar Grid Mode (Offline Resilient) */
          <div className="w-full h-full bg-[#040d1a] relative flex items-center justify-center overflow-hidden select-none">
            {/* Radar Concentric Rings */}
            <svg className="w-full h-full absolute inset-0 opacity-40" viewBox="0 0 600 600">
              <defs>
                <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#040d1a" stopOpacity="0.6" />
                </radialGradient>
              </defs>
              <rect width="600" height="600" fill="url(#radarGlow)" />
              {/* Concentric rings */}
              <circle cx="300" cy="300" r="80" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="300" cy="300" r="160" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="4,4" />
              <circle cx="300" cy="300" r="240" fill="none" stroke="#0284c7" strokeWidth="1" />
              {/* Crosshairs */}
              <line x1="300" y1="40" x2="300" y2="560" stroke="#0284c7" strokeWidth="1" opacity="0.4" />
              <line x1="40" y1="300" x2="560" y2="300" stroke="#0284c7" strokeWidth="1" opacity="0.4" />
              <line x1="120" y1="120" x2="480" y2="480" stroke="#0284c7" strokeWidth="1" opacity="0.2" />
              <line x1="120" y1="480" x2="480" y2="120" stroke="#0284c7" strokeWidth="1" opacity="0.2" />
              {/* Route lines */}
              <path d="M 230,220 L 460,260" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6,4" opacity="0.7" />
              <path d="M 230,220 L 205,300" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4,4" opacity="0.8" />
            </svg>

            {/* Radar Coordinates Overlay Labels */}
            <div className="absolute top-4 left-4 text-[11px] font-mono text-gray-400 space-y-0.5">
              <div className="text-ice-400 font-bold">RADAR SWEEP: 360° ACTIVE</div>
              <div>ANTARCTIC CONTINENTAL GRID</div>
              <div>POLAR COORDINATE: 90°00'S REFERENCE</div>
            </div>

            <div className="absolute bottom-4 right-4 text-[10px] font-mono text-gray-500 text-right">
              <div>CORRIDOR A: MAITRI ⇄ FIELD CAMP ALPHA (TRAVERSE)</div>
              <div>CORRIDOR B: MAITRI ⇄ BHARATI (AIR RELAY)</div>
            </div>

            {/* Radar Station Nodes */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-[500px] h-[500px]">
                {/* Maitri (STA-02) */}
                <div
                  onClick={() => onSelectStation && onSelectStation('STA-02')}
                  className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '38%', top: '36%' }}
                >
                  <div className={`p-2.5 rounded-lg border backdrop-blur-md transition-all ${
                    selectedStationId === 'STA-02'
                      ? 'bg-navy-800/90 border-ice-400 shadow-lg shadow-ice-500/20'
                      : 'bg-navy-900/80 border-navy-700 hover:border-ice-500'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="font-bold text-xs text-white">MAITRI</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">70.76°S 11.73°E</div>
                    <div className="text-[10px] text-ice-300">Schirmacher Oasis</div>
                  </div>
                </div>

                {/* Field Camp Alpha (STA-03) */}
                <div
                  onClick={() => onSelectStation && onSelectStation('STA-03')}
                  className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '34%', top: '50%' }}
                >
                  <div className={`p-2.5 rounded-lg border backdrop-blur-md transition-all ${
                    selectedStationId === 'STA-03'
                      ? 'bg-navy-800/90 border-amber-400 shadow-lg shadow-amber-500/20'
                      : 'bg-navy-900/80 border-navy-700 hover:border-amber-500'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <span className="font-bold text-xs text-white">CAMP ALPHA</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">71.20°S 12.50°E</div>
                    <div className="text-[10px] text-amber-300">Traverse Outpost · Limited</div>
                  </div>
                </div>

                {/* Bharati (STA-01) */}
                <div
                  onClick={() => onSelectStation && onSelectStation('STA-01')}
                  className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '76%', top: '43%' }}
                >
                  <div className={`p-2.5 rounded-lg border backdrop-blur-md transition-all ${
                    selectedStationId === 'STA-01'
                      ? 'bg-navy-800/90 border-ice-400 shadow-lg shadow-ice-500/20'
                      : 'bg-navy-900/80 border-navy-700 hover:border-ice-500'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="font-bold text-xs text-white">BHARATI</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">69.41°S 76.19°E</div>
                    <div className="text-[10px] text-ice-300">Larsemann Hills · Primary Hub</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="bg-navy-900/90 border-t border-navy-700 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-gray-400 z-[400]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span>Operational Station</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span>Limited Station</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-sky-400 border-dashed" />
            <span>Air Corridor (3,000 km)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-amber-400" />
            <span>Ground Traverse (100 km)</span>
          </div>
        </div>
        <div className="font-mono text-gray-500 text-[11px]">
          POLAR TELEMETRY · NCPOR / MoES
        </div>
      </div>
    </div>
  );
};
