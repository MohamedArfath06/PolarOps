import React, { useState } from 'react';
import { CaseStudyGraphNode } from '../data/caseStudiesData';
import {
  Package,
  Wrench,
  Cpu,
  Building2,
  Compass,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ChevronRight,
  Zap,
  MapPin,
  Navigation
} from 'lucide-react';

interface OperationalGraphProps {
  nodes: CaseStudyGraphNode[];
  onNodeClick?: (node: CaseStudyGraphNode) => void;
  title?: string;
}

export const OperationalGraph: React.FC<OperationalGraphProps> = ({ nodes, onNodeClick, title }) => {
  const [selectedNode, setSelectedNode] = useState<CaseStudyGraphNode | null>(nodes[0] || null);

  // Sync selectedNode when nodes prop changes
  React.useEffect(() => {
    if (nodes && nodes.length > 0) {
      setSelectedNode(nodes[0]);
    }
  }, [nodes]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'CARGO':
        return Package;
      case 'ASSET':
        return Cpu;
      case 'INVENTORY':
        return Wrench;
      case 'STATION':
        return Building2;
      case 'MISSION':
        return Compass;
      case 'TEAM':
        return Users;
      case 'ROUTE':
        return Navigation;
      default:
        return Info;
    }
  };

  const handleSelectNode = (node: CaseStudyGraphNode) => {
    setSelectedNode(node);
    if (onNodeClick) onNodeClick(node);
  };

  return (
    <div className="bg-[#080d1a] border border-navy-700/80 rounded-xl p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-navy-800 pb-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-ice-400 animate-pulse" />
          <h3 className="text-sm font-bold text-white font-mono tracking-wide uppercase">
            {title || 'EXPEDITION OPERATIONAL GRAPH — CAUSAL DEPENDENCY CHAIN'}
          </h3>
        </div>
        <span className="text-xs text-ice-400/80 font-mono bg-ice-900/30 px-2 py-0.5 rounded border border-ice-700/30">
          Click any node to inspect dependency metadata
        </span>
      </div>

      {/* Node Chain Layout */}
      <div className="relative overflow-x-auto py-4 px-1 scrollbar-thin">
        <div className="flex items-center justify-between min-w-[780px] space-x-3">
          {nodes.map((node, index) => {
            const Icon = getNodeIcon(node.type);
            const isSelected = selectedNode?.id === node.id;
            const isDisrupted = node.status === 'FAILED' || node.status === 'RESTRICTED' || node.status === 'AT_RISK';

            return (
              <React.Fragment key={node.id}>
                {/* Node Box */}
                <div
                  onClick={() => handleSelectNode(node)}
                  className={`flex-1 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 relative group ${
                    isSelected
                      ? 'bg-navy-900 border-ice-400 shadow-lg shadow-ice-500/20 ring-2 ring-ice-500/40 scale-105 z-10'
                      : isDisrupted
                      ? 'bg-navy-950/90 border-red-500/50 hover:border-red-400 shadow-md shadow-red-950/50'
                      : 'bg-navy-900/60 border-navy-700 hover:border-navy-500'
                  }`}
                >
                  {/* Type Badge & Status Indicator */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase font-mono tracking-wider bg-navy-800 text-ice-300 border-navy-700">
                      {node.type}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        node.status === 'FAILED'
                          ? 'bg-red-500 animate-ping ring-2 ring-red-500/40'
                          : node.status === 'RESTRICTED'
                          ? 'bg-amber-500 ring-2 ring-amber-500/40'
                          : node.status === 'AT_RISK'
                          ? 'bg-orange-500 ring-2 ring-orange-500/40'
                          : 'bg-green-400'
                      }`}
                      title={`Status: ${node.status}`}
                    />
                  </div>

                  {/* Icon & Name */}
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isDisrupted ? 'bg-red-950/80 text-red-400 border border-red-800/40' : 'bg-navy-800 text-ice-400 border border-navy-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate font-mono">{node.label}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{node.sublabel}</p>
                    </div>
                  </div>
                </div>

                {/* Connector Arrow */}
                {index < nodes.length - 1 && (
                  <div className="flex flex-col items-center shrink-0 text-navy-500">
                    <div className="w-5 h-0.5 bg-gradient-to-r from-red-500/80 via-amber-500/80 to-ice-500/80" />
                    <ChevronRight className="w-4 h-4 text-ice-400 -mt-2.5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Node Metadata Inspector */}
      {selectedNode && (
        <div className="bg-navy-950/90 border border-navy-700/80 rounded-xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-navy-800 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-ice-400 font-mono uppercase tracking-wider">
                NODE INSPECTOR: {selectedNode.label}
              </span>
              <span className="text-[11px] text-gray-400 font-mono">({selectedNode.type})</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                selectedNode.status === 'FAILED'
                  ? 'bg-red-950 text-red-300 border-red-800'
                  : selectedNode.status === 'RESTRICTED' || selectedNode.status === 'AT_RISK'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-green-950 text-green-300 border-green-800'
              }`}
            >
              STATUS: {selectedNode.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-navy-900/80 p-2.5 rounded-lg border border-navy-700">
              <p className="text-[10px] text-gray-400 uppercase font-mono tracking-wide">Impact Description</p>
              <p className="font-semibold text-red-300 mt-1 leading-snug">{selectedNode.metadata.statusText}</p>
            </div>
            <div className="bg-navy-900/80 p-2.5 rounded-lg border border-navy-700">
              <p className="text-[10px] text-gray-400 uppercase font-mono tracking-wide">Key Metric 1</p>
              <p className="font-semibold text-white mt-1">{selectedNode.metadata.detail1}</p>
            </div>
            <div className="bg-navy-900/80 p-2.5 rounded-lg border border-navy-700">
              <p className="text-[10px] text-gray-400 uppercase font-mono tracking-wide">Key Metric 2</p>
              <p className="font-semibold text-white mt-1">{selectedNode.metadata.detail2}</p>
            </div>
            <div className="bg-navy-900/80 p-2.5 rounded-lg border border-navy-700">
              <p className="text-[10px] text-gray-400 uppercase font-mono tracking-wide">Key Metric 3</p>
              <p className="font-semibold text-white mt-1">{selectedNode.metadata.detail3}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
