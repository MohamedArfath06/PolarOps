import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Radio, Phone, Navigation, Users, Wrench, Clock,
  Shield, CheckCircle, Flame, HeartPulse, Compass, ArrowRight, Zap
} from 'lucide-react';
import { getAssets, getPersonnel, createRecoveryPlan } from '../services/api';
import { Asset, Personnel } from '../types';
import { LoadingPage, ErrorState, PageHeader } from '../components/ui';

interface IncidentPreset {
  id: string;
  name: string;
  location: string;
  coordinates: string;
  distanceKm: number;
  severity: 'Critical' | 'High' | 'Medium';
  description: string;
  requiredGear: string[];
}

const INCIDENT_PRESETS: IncidentPreset[] = [
  {
    id: 'inc-1',
    name: 'Field Camp Alpha — Medical Casualty / Hypothermia',
    location: 'Field Camp Alpha Outpost',
    coordinates: '71.2000°S, 12.5000°E',
    distanceKm: 85,
    severity: 'Critical',
    description: 'Field researcher suffering acute severe hypothermia requiring immediate heated medevac to Maitri clinic.',
    requiredGear: ['Hypothermia Wrap Kit', 'Portable Oxygen Unit', 'Defibrillator', 'Cold-Weather Stretcher'],
  },
  {
    id: 'inc-2',
    name: 'Sector B-12 Traverse — Vehicle Breakdown in Blizzard',
    location: 'Traverse Corridor Sector B-12',
    coordinates: '70.9800°S, 12.1000°E',
    distanceKm: 42,
    severity: 'Critical',
    description: 'Snow vehicle mechanical drive failure amidst 45-knot winds. Cabin heater operating on backup battery.',
    requiredGear: ['Tow Cable & Winch Rig', 'Spare Track Pins', 'Emergency Blizzard Tent', 'Hot Ration Packs'],
  },
  {
    id: 'inc-3',
    name: 'Maitri Outskirts — Power Grid Generator Lockout',
    location: 'Maitri North Power Shed',
    coordinates: '70.7656°S, 11.7317°E',
    distanceKm: 6,
    severity: 'High',
    description: 'Exciter circuit breaker trip on auxiliary generator during sustained sub-zero gale.',
    requiredGear: ['Electrical Diagnostic Rig', 'Insulated Toolkit', 'Auxiliary Jumper Cables', 'Exciter Spares'],
  },
  {
    id: 'inc-4',
    name: 'Bharati Coastal Ridge — Crevasse Hazard Near Route',
    location: 'Larsemann Hills Coastal Traverse',
    coordinates: '69.4075°S, 76.1872°E',
    distanceKm: 18,
    severity: 'Medium',
    description: 'New surface snow bridge collapse detected across primary cargo trail. Marking and alternate route survey required.',
    requiredGear: ['Ground Penetrating Radar', 'Crevasse Rescue Ropes & Harnesses', 'Fluorescent Marker Poles'],
  },
];

const EmergencyPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected incident
  const [selectedIncident, setSelectedIncident] = useState<IncidentPreset>(INCIDENT_PRESETS[0]);
  const [customNotes, setCustomNotes] = useState('');

  // SOS state
  const [sosActivated, setSosActivated] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(false);

  // Dispatch state
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedTeamLeadId, setSelectedTeamLeadId] = useState<string>('');
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'dispatched'>('idle');
  const [dispatchTime, setDispatchTime] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [assetList, persList] = await Promise.all([
          getAssets(),
          getPersonnel(),
        ]);
        setAssets(assetList || []);
        setPersonnel(persList || []);

        // Auto-select best vehicle
        const operationalVehicles = (assetList || []).filter(
          (a: Asset) => (a.type === 'vehicle' || a.asset_code.startsWith('V') || a.name.toLowerCase().includes('vehicle')) && a.status === 'Operational'
        );
        if (operationalVehicles.length > 0) {
          setSelectedVehicleId(operationalVehicles[0].id);
        }

        // Auto-select doctor or commander
        const leaders = (persList || []).filter(
          (p: Personnel) => p.role.toLowerCase().includes('doctor') || p.role.toLowerCase().includes('commander') || p.team === 'Alpha'
        );
        if (leaders.length > 0) {
          setSelectedTeamLeadId(leaders[0].id);
        }
      } catch (err: any) {
        setError('Failed to fetch telemetry for emergency coordination.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTriggerSOS = () => {
    setIsCountingDown(true);
    let count = 3;
    setSosCountdown(3);
    const interval = setInterval(() => {
      count--;
      setSosCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        setIsCountingDown(false);
        setSosActivated(true);
      }
    }, 1000);
  };

  const handleCancelSOS = () => {
    setSosActivated(false);
    setIsCountingDown(false);
    setSosCountdown(3);
  };

  // Operational vehicles
  const operationalVehicles = assets.filter(
    (a) => (a.type === 'vehicle' || a.asset_code.startsWith('V') || a.name.toLowerCase().includes('vehicle')) && a.status === 'Operational'
  );

  // Available rescue personnel
  const rescuePersonnel = personnel.filter(
    (p) => p.status === 'Available' || (p.availability && p.availability > 0) || p.role.toLowerCase().includes('doctor')
  );

  // Chosen vehicle object
  const activeVehicle = assets.find((a) => a.id === selectedVehicleId) || operationalVehicles[0];
  const activeLeader = personnel.find((p) => p.id === selectedTeamLeadId) || rescuePersonnel[0];

  // Calculated speed & ETA
  const averageSpeedKmH = 28; // polar tracked vehicle convoy average speed in snow
  const etaHours = selectedIncident ? selectedIncident.distanceKm / averageSpeedKmH : 2;
  const etaMinutes = Math.round(etaHours * 60);

  const handleExecuteDispatch = () => {
    const now = new Date();
    setDispatchTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST');
    setDispatchStatus('dispatched');
  };

  if (loading) return <LoadingPage label="Initializing emergency telemetry systems..." />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Polar Emergency Response & Rapid SAR"
        subtitle="Search and Rescue (SAR) mission dispatch, distress beacon monitoring, and casualty evacuation protocols"
        icon={<AlertTriangle className="text-red-400" size={22} />}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-300 font-mono bg-red-900/30 border border-red-700/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Radio size={14} className="text-red-400 animate-pulse" />
              SAR MONITORING: FREQ 121.5 MHz & 406 MHz COSPAS-SARSAT
            </span>
          </div>
        }
      />

      {error && <ErrorState message={error} />}

      {/* SOS Activation Banner */}
      <div
        className={`rounded-2xl border-2 p-6 transition-all ${
          sosActivated
            ? 'border-red-500 bg-red-950/70 shadow-2xl shadow-red-950/60'
            : 'border-red-800/60 bg-gradient-to-r from-red-950/40 via-navy-900 to-navy-900'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className={`w-3 h-3 rounded-full ${sosActivated ? 'bg-red-400 animate-ping' : 'bg-red-500'}`} />
              <h2 className="text-lg font-bold text-white tracking-wide uppercase">
                {sosActivated ? 'CRITICAL SOS SIGNAL ACTIVE — DISTRESS TRANSMISSION ENGAGED' : 'Emergency SOS Distress Beacon'}
              </h2>
            </div>
            <p className="text-xs text-gray-400 max-w-xl">
              {sosActivated
                ? 'High-priority distress packet broadcasted across INMARSAT-C, IRIDIUM SBD, and VHF Marine Ch.16. NCPOR HQ and MRCC Mumbai acknowledged packet.'
                : 'Direct authorization trigger for immediate polar distress protocol. Alerts NCPOR Operations Center and initiates multi-station standby.'}
            </p>
            {sosActivated && (
              <div className="flex flex-wrap gap-2 pt-2">
                <div className="bg-red-900/40 border border-red-700/60 px-3 py-1.5 rounded-lg text-xs font-mono text-red-200">
                  BEACON ID: IND-NCPOR-406-SAR
                </div>
                <div className="bg-red-900/40 border border-red-700/60 px-3 py-1.5 rounded-lg text-xs font-mono text-red-200">
                  LAT: {selectedIncident.coordinates}
                </div>
                <div className="bg-green-900/30 border border-green-700/50 px-3 py-1.5 rounded-lg text-xs text-green-300 font-semibold">
                  STATUS: ACKNOWLEDGED BY NCPOR HQ
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isCountingDown ? (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full border-4 border-red-400 flex items-center justify-center text-xl font-black text-red-300 animate-pulse">
                  {sosCountdown}
                </div>
                <span className="text-[11px] text-gray-400 mt-1">Transmitting in...</span>
              </div>
            ) : sosActivated ? (
              <button
                type="button"
                onClick={handleCancelSOS}
                className="btn bg-navy-800 hover:bg-navy-700 text-white border border-navy-600 px-5 py-2.5 rounded-xl text-xs font-semibold"
              >
                Reset SOS (Stand Down)
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTriggerSOS}
                className="bg-red-600 hover:bg-red-500 text-white font-black text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-red-900/50 border border-red-400 flex items-center gap-2 animate-bounce"
              >
                <Radio size={16} /> TRIGGER DISTRESS SOS
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Incident Selection and Dispatch Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Select Card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="section-title flex items-center gap-2">
              <Compass size={16} className="text-ice-400" /> Active Incident Scenarios
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">SIMULATED CASES</span>
          </div>

          <div className="space-y-2.5">
            {INCIDENT_PRESETS.map((inc) => {
              const isSelected = selectedIncident.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncident(inc);
                    setDispatchStatus('idle');
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-navy-800 border-ice-500 shadow-md shadow-ice-950/40'
                      : 'bg-navy-900/60 border-navy-700 hover:border-navy-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-white leading-snug">{inc.name}</span>
                    <span
                      className={`badge text-[10px] ${
                        inc.severity === 'Critical' ? 'badge-critical' : inc.severity === 'High' ? 'badge-high' : 'badge-medium'
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-1">
                    <span className="font-mono text-ice-400">{inc.distanceKm} km</span>
                    <span>·</span>
                    <span className="truncate">{inc.location}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-navy-700">
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">Incident Field Notes</label>
            <textarea
              className="input w-full text-xs h-18 resize-none"
              placeholder="Enter real-time situational observations from weather or VHF reports..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Rapid Response Dispatch Calculator */}
        <div className="card lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-navy-700 pb-3">
            <div>
              <span className="text-xs font-mono text-ice-400 font-semibold">{selectedIncident.location}</span>
              <h3 className="text-base font-bold text-white mt-0.5">{selectedIncident.name}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400">Coordinates:</span>
              <div className="font-mono text-xs text-ice-300 font-semibold">{selectedIncident.coordinates}</div>
            </div>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed bg-navy-900/70 p-3 rounded-lg border border-navy-700/60">
            {selectedIncident.description}
          </p>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5 font-medium flex items-center gap-1.5">
                <Wrench size={13} className="text-ice-400" /> Operational Response Vehicle
              </label>
              <select
                className="select w-full text-xs"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
              >
                {operationalVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.asset_code} — {v.name} ({v.station_id}, Fuel: {v.fuel_level}%)
                  </option>
                ))}
              </select>
              {activeVehicle && (
                <div className="text-[11px] text-gray-400 mt-1 flex justify-between">
                  <span>Fuel: <strong className="text-ice-300">{activeVehicle.fuel_level}%</strong></span>
                  <span>Health: <strong className="text-green-400">{activeVehicle.condition_score ?? 95}%</strong></span>
                  <span>Base: <strong className="text-gray-300 font-mono">{activeVehicle.station_id}</strong></span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5 font-medium flex items-center gap-1.5">
                <Users size={13} className="text-ice-400" /> Response Team Lead / Medical Officer
              </label>
              <select
                className="select w-full text-xs"
                value={selectedTeamLeadId}
                onChange={(e) => setSelectedTeamLeadId(e.target.value)}
              >
                {rescuePersonnel.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role} ({p.station_id}, Team {p.team})
                  </option>
                ))}
              </select>
              {activeLeader && (
                <div className="text-[11px] text-gray-400 mt-1 flex justify-between">
                  <span>Role: <strong className="text-ice-300">{activeLeader.role}</strong></span>
                  <span>Team: <strong className="text-gray-300">{activeLeader.team}</strong></span>
                  <span>Location: <strong className="text-gray-300 font-mono">{activeLeader.station_id}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Tactical Assessment Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-navy-900/90 border border-navy-700 p-3 rounded-xl">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Traverse Distance</span>
              <span className="text-lg font-black text-white">{selectedIncident.distanceKm} km</span>
              <span className="text-[10px] text-gray-500 block">Ground Corridor</span>
            </div>

            <div className="bg-navy-900/90 border border-navy-700 p-3 rounded-xl">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Estimated Speed</span>
              <span className="text-lg font-black text-ice-400">{averageSpeedKmH} km/h</span>
              <span className="text-[10px] text-gray-500 block">Snow Tracked Limit</span>
            </div>

            <div className="bg-navy-900/90 border border-navy-700 p-3 rounded-xl">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Calculated ETA</span>
              <span className="text-lg font-black text-amber-400">{etaMinutes} mins</span>
              <span className="text-[10px] text-gray-500 block">~{etaHours.toFixed(1)} hours</span>
            </div>

            <div className="bg-navy-900/90 border border-navy-700 p-3 rounded-xl">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Fuel Runway</span>
              <span className="text-lg font-black text-green-400">
                {activeVehicle ? `${Math.round((activeVehicle.fuel_level || 60) * 4.5)} km` : '320 km'}
              </span>
              <span className="text-[10px] text-gray-500 block">Round-trip Safe</span>
            </div>
          </div>

          {/* Required Gear Manifest */}
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-2">
              Mandatory Gear Checklist for Deployment
            </span>
            <div className="grid grid-cols-2 gap-2">
              {selectedIncident.requiredGear.map((gear, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-navy-900/60 border border-navy-700/70 px-3 py-2 rounded-lg text-xs text-gray-200">
                  <CheckCircle size={14} className="text-ice-400 flex-shrink-0" />
                  <span>{gear}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dispatch Button & Status */}
          <div className="pt-2 border-t border-navy-700 flex items-center justify-between">
            {dispatchStatus === 'dispatched' ? (
              <div className="w-full bg-green-950/40 border border-green-700/60 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-400 flex items-center justify-center text-green-400">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">RAPID RESPONSE DISPATCHED AT {dispatchTime}</div>
                    <div className="text-xs text-green-300">
                      Convoy {activeVehicle?.asset_code} en route with Team Lead {activeLeader?.name}. Live tracking active on VHF Ch.16.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDispatchStatus('idle')}
                  className="btn-secondary text-xs"
                >
                  Recall / Reset
                </button>
              </div>
            ) : (
              <>
                <div className="text-xs text-gray-400">
                  Ready to mobilize rescue assets under SOP SIH26062-SAR.
                </div>
                <button
                  type="button"
                  onClick={handleExecuteDispatch}
                  className="btn-primary text-xs flex items-center gap-2 px-5 py-2.5 font-bold"
                >
                  <Zap size={14} /> AUTHORIZE &amp; DISPATCH RESCUE CONVOY
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contacts & Protocol Directory */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <Phone size={16} className="text-ice-400" /> Communications Matrix
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-navy-900/60 border border-navy-700 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">NCPOR HQ Command (Goa)</div>
                <div className="text-gray-400 font-mono text-[11px]">INMARSAT Primary: +91-832-2525600</div>
              </div>
              <span className="badge-ok">ACTIVE</span>
            </div>
            <div className="p-2.5 rounded-lg bg-navy-900/60 border border-navy-700 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">Station Medical Clinic</div>
                <div className="text-gray-400 font-mono text-[11px]">VHF Distress Ch. 16 / Sat Phone 02</div>
              </div>
              <span className="badge-ok">ACTIVE</span>
            </div>
            <div className="p-2.5 rounded-lg bg-navy-900/60 border border-navy-700 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">MRCC Mumbai Maritime Rescue</div>
                <div className="text-gray-400 font-mono text-[11px]">GMDSS / COSPAS-SARSAT Relay</div>
              </div>
              <span className="badge-ok">ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <Navigation size={16} className="text-ice-400" /> Polar Evacuation Corridors
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-navy-900/60 border border-navy-700">
              <div className="flex justify-between font-semibold text-white mb-0.5">
                <span>Corridor A: Maitri ⇄ Camp Alpha</span>
                <span className="text-green-400">Clear</span>
              </div>
              <p className="text-gray-400 text-[11px]">85 km snow trail · Tracked convoy safe</p>
            </div>
            <div className="p-2.5 rounded-lg bg-navy-900/60 border border-navy-700">
              <div className="flex justify-between font-semibold text-white mb-0.5">
                <span>Corridor B: Maitri ⇄ Air Strip LZ-01</span>
                <span className="text-green-400">Clear</span>
              </div>
              <p className="text-gray-400 text-[11px]">18 km blue ice strip · Ski plane rated</p>
            </div>
            <div className="p-2.5 rounded-lg bg-navy-900/60 border border-navy-700">
              <div className="flex justify-between font-semibold text-white mb-0.5">
                <span>Corridor C: Bharati Coastal Route</span>
                <span className="text-amber-400">Caution</span>
              </div>
              <p className="text-gray-400 text-[11px]">Crevasse hazard marked at waypoint KM-14</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <Shield size={16} className="text-ice-400" /> Standard Escalation Tier
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded bg-navy-900/60 border border-navy-700/60">
              <span className="text-ice-400 font-bold">Tier 1: Local Rapid Response</span>
              <p className="text-gray-400 text-[11px]">Immediate vehicle dispatch within 30 min of distress notification.</p>
            </div>
            <div className="p-2 rounded bg-navy-900/60 border border-navy-700/60">
              <span className="text-amber-400 font-bold">Tier 2: Station Evacuation Alert</span>
              <p className="text-gray-400 text-[11px]">Standby air evacuation request relayed to NCPOR HQ and ALCI air corridor.</p>
            </div>
            <div className="p-2 rounded bg-navy-900/60 border border-navy-700/60">
              <span className="text-red-400 font-bold">Tier 3: International Antarctic Rescue</span>
              <p className="text-gray-400 text-[11px]">Mobilization under Antarctic Treaty Search and Rescue Mutual Assistance.</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center">
        ⚠ SYNTHETIC / SIMULATED PROTOTYPE DATA · SIH26062 · Ministry of Earth Sciences / NCPOR
      </p>
    </div>
  );
};

export default EmergencyPage;
