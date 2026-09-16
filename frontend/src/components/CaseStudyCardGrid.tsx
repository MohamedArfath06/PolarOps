import React from 'react';
import { CASE_STUDIES, CaseStudy } from '../data/caseStudiesData';
import {
  FileText,
  AlertTriangle,
  Zap,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Info
} from 'lucide-react';

interface CaseStudyCardGridProps {
  onSelectCase: (caseStudy: CaseStudy) => void;
  onRunSimulation: (caseStudy: CaseStudy) => void;
}

export const CaseStudyCardGrid: React.FC<CaseStudyCardGridProps> = ({
  onSelectCase,
  onRunSimulation
}) => {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title text-lg flex items-center gap-2 text-white">
            <FileText className="text-ice-400" size={20} /> Real-World Polar Case Studies
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Four documented Antarctic resupply incidents & disruption recovery simulations.
          </p>
        </div>
        <div className="text-xs bg-amber-950/40 border border-amber-700/40 text-amber-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono">
          <Info size={14} className="text-amber-400" />
          <span>Educational prototype using documented case studies and simulated operational data.</span>
        </div>
      </div>

      {/* 4 Selectable Case Study Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {CASE_STUDIES.map(c => (
          <div
            key={c.id}
            className="card bg-navy-950/90 border-navy-700/80 hover:border-ice-500/50 hover:shadow-xl hover:shadow-ice-500/5 transition-all flex flex-col justify-between group cursor-pointer"
            onClick={() => onSelectCase(c)}
          >
            <div className="space-y-3">
              {/* Header Badges */}
              <div className="flex items-start justify-between gap-2">
                <span className="badge badge-critical text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
                  <AlertTriangle size={10} /> {c.disruptionType.split('&')[0]}
                </span>
                <span className="text-[10px] font-mono text-gray-500 bg-navy-900 px-1.5 py-0.5 rounded border border-navy-800">
                  {c.sourceYear}
                </span>
              </div>

              {/* Title & Location */}
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-ice-300 transition-colors line-clamp-2 leading-snug">
                  {c.title}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-ice-400 font-mono mt-1">
                  <MapPin size={12} className="flex-shrink-0" />
                  <span className="truncate">{c.location}</span>
                </div>
              </div>

              {/* Documented Short Background */}
              <div className="bg-navy-900/60 p-2.5 rounded-lg border border-navy-800/80">
                <p className="text-[11px] text-gray-300 line-clamp-3 leading-relaxed">
                  {c.documentedBackground}
                </p>
              </div>

              {/* Source Reference */}
              <div className="text-[10px] text-amber-400/90 font-mono border-t border-navy-800/80 pt-2 flex items-center justify-between">
                <span className="truncate">Source: {c.source}</span>
                <ExternalLink size={10} className="flex-shrink-0 opacity-70" />
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-4 pt-3 border-t border-navy-800/80 flex items-center justify-between gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCase(c);
                }}
                className="text-xs text-gray-400 hover:text-white font-medium transition-colors"
              >
                Inspect Facts
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRunSimulation(c);
                }}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-md shadow-ice-600/20"
              >
                <Zap size={13} /> Run Simulation
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
