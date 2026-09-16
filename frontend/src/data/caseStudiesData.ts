// POLAROPS — Real-World Polar Logistics Case Studies Data
// Documented incidents combined with Prototype Simulation Assumptions

export interface CaseStudyWorkflowStep {
  step: number;
  label: string;
  status: 'DISRUPTED' | 'RESTRICTED' | 'ANALYZED' | 'EVALUATED' | 'PROPOSED' | 'RECOVERED';
  detail: string;
}

export interface CaseStudyGraphNode {
  id: string;
  type: 'ASSET' | 'CARGO' | 'INVENTORY' | 'MISSION' | 'STATION' | 'ROUTE' | 'TEAM';
  label: string;
  sublabel: string;
  status: 'FAILED' | 'RESTRICTED' | 'AT_RISK' | 'OPERATIONAL' | 'RECOVERED';
  metadata: {
    statusText: string;
    detail1: string;
    detail2: string;
    detail3: string;
  };
}

export interface CaseStudyRecoveryOption {
  id: string;
  optionName: string;
  shortLabel: string;
  description: string;
  explanation: string;
  rank: number;
  isRecommended: boolean;
  missionContinuityScore: number;
  safetyScore: number;
  timeScore: number;
  resourceScore: number;
  costScore: number;
  totalScore: number;
  estimatedDelayDays: number;
  estimatedCostUSD: string;
  actionSteps: string[];
}

export interface CaseStudy {
  id: string;
  title: string;
  shortTitle: string;
  location: string;
  coordinates: string;
  disruptionType: string;
  source: string;
  sourceYear: string;
  documentedBackground: string;
  documentedSituation: string;
  operationalChallenge: string;
  prototypeDisclaimer: string;

  // Specific case displays
  displays: {
    unloadedCargo?: { item: string; qty: string; status: string }[];
    pendingCargo?: { item: string; qty: string; status: string }[];
    criticalSupplies?: { item: string; priority: string; daysRemaining: number }[];
    availableTransport?: { asset: string; capacity: string; status: string }[];
    
    // Case 2 specific
    requiredSupplies?: { category: string; qty: string; state: string }[];
    deliveredSupplies?: { category: string; qty: string; landedDate: string }[];
    pendingSupplies?: { category: string; qty: string; offshoreDistance: string }[];
    criticalInventoryItems?: { name: string; stockLeft: string; criticality: string }[];
    alternativeDeliveryMethods?: { method: string; capacity: string; speed: string }[];
    simulatedSupplyCoverage?: { withoutAction: string; withAction: string };

    // Case 3 specific
    originalRoute?: { path: string; status: string };
    disruptedRoute?: { path: string; cause: string };
    priorityCargo?: { item: string; weight: string; urgency: string }[];
    alternativeTransportOptions?: { name: string; range: string; payload: string }[];
    estimatedDeliveryImpact?: { routeDelayDays: number; priorityDeliveredPct: number };

    // Case 4 specific
    failedSled?: { id: string; name: string; failurePoint: string; impactReason: string };
    affectedCargo?: { code: string; name: string; weight: string; priority: string }[];
    availableReplacementAssets?: { name: string; location: string; status: string }[];
    estimatedResponseTime?: string;
    cargoDeliveryImpact?: string;
    alternativeRecoveryPlans?: string[];
  };

  workflow: CaseStudyWorkflowStep[];
  graphNodes: CaseStudyGraphNode[];
  recoveryOptions: CaseStudyRecoveryOption[];
  
  metrics: {
    continuityBefore: number;
    continuityDisrupted: number;
    continuityAfterRecovery: number;
    delayDaysBaseline: number;
    delayDaysMitigated: number;
  };

  featuresDemonstrated: string[];
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'case-1-mawson-crane',
    title: 'Mawson Resupply Disruption — Cargo Crane Failure',
    shortTitle: 'Mawson Crane Failure',
    location: 'Mawson Station, Mac. Robertson Land',
    coordinates: '67°36′S 62°53′E',
    disruptionType: 'Equipment Failure & Offloading Lockout',
    source: 'Australian Antarctic Resupply Operational Incident Report',
    sourceYear: '2024',
    documentedBackground:
      'During resupply operations at Mawson Station in 2024, RSV Nuyina experienced severe technical malfunctions with its main portside cargo cranes, halting heavy consignment offloading.',
    documentedSituation:
      'RSV Nuyina experienced technical problems with its cargo cranes during resupply operations at Mawson Station. Only part of the planned heavy cargo could be unloaded. Some critical supplies were subsequently transported to the station by helicopter.',
    operationalChallenge:
      'The failure left essential generator exciter modules and heavy scientific equipment trapped aboard the icebreaker offshore, putting station main power continuity at immediate risk as winter fast-ice set in.',
    prototypeDisclaimer:
      'This simulation combines documented RSV Nuyina incident reports with simulated PolarOps optimization parameters (costs, stock days, and multi-option scoring algorithm).',
    
    workflow: [
      { step: 1, label: 'Crane Failure', status: 'DISRUPTED', detail: 'Main portside crane hydraulically locked at 14:30 UTC during heavy container discharge.' },
      { step: 2, label: 'Cargo Offloading Restricted', status: 'RESTRICTED', detail: '12 tonnes of heavy generator spares and ice drills trapped in Ship Hold #2.' },
      { step: 3, label: 'Essential Supplies Identified', status: 'ANALYZED', detail: 'BFS Engine flagged Generator Exciter Module INV-017 as critical single point of failure.' },
      { step: 4, label: 'Affected Station Inventory Analysed', status: 'ANALYZED', detail: 'Mawson Station power grid projected at 10-day depletion without exciter replacement.' },
      { step: 5, label: 'Helicopter Transfer Evaluated', status: 'EVALUATED', detail: 'Sikorsky S-92 heavy-lift air-bridge evaluated against ice-traverse options.' },
      { step: 6, label: 'Recovery Plan Proposed', status: 'PROPOSED', detail: 'Plan A (Heavy-Lift Helicopter Sling Load) ranked #1 with 88.5 total continuity score.' }
    ],

    displays: {
      unloadedCargo: [
        { item: 'Dry Rations & Standard Provisions', qty: '35 Tonnes', status: 'Landed at Mawson Wharf' },
        { item: 'Station Clothing & General Field Kits', qty: '10 Tonnes', status: 'Landed at Mawson Wharf' }
      ],
      pendingCargo: [
        { item: 'C-1042: Generator Exciter Module & Spares', qty: '3.5 Tonnes', status: 'Trapped in Ship Hold #2' },
        { item: 'C-1038: Deep Core Thermal Ice Drill Rig', qty: '8.5 Tonnes', status: 'Trapped in Ship Hold #2' }
      ],
      criticalSupplies: [
        { item: 'INV-017 Generator Exciter Coil', priority: 'CRITICAL', daysRemaining: 10 },
        { item: 'A-G03 Main Generator G-03 Maintenance Kit', priority: 'HIGH', daysRemaining: 14 }
      ],
      availableTransport: [
        { asset: 'H-01 Sikorsky S-92 Heavy Lift Helicopter', capacity: '4.5 Tonnes Sling', status: 'Available at Davis Staging' },
        { asset: 'H-02 Airbus H145 Light Utility Chopper', capacity: '1.2 Tonnes Sling', status: 'Available onboard Nuyina' },
        { asset: 'V-04 PistenBully 300 Over-Snow Tractor', capacity: '12 Tonnes Tow', status: 'Standing by at Mawson' }
      ]
    },

    graphNodes: [
      {
        id: 'CRANE-01',
        type: 'ASSET',
        label: 'Nuyina Port Crane',
        sublabel: 'RSV Nuyina Heavy Crane',
        status: 'FAILED',
        metadata: {
          statusText: 'Hydraulic Valve Lockout & Cable Jam',
          detail1: 'Capacity: 50 Tonnes',
          detail2: 'Status: Out of Service',
          detail3: 'Est. Repair: 14 Days'
        }
      },
      {
        id: 'C-1042',
        type: 'CARGO',
        label: 'Consignment C-1042',
        sublabel: 'Generator Exciter Module',
        status: 'RESTRICTED',
        metadata: {
          statusText: 'Offloading Halt - Stored in Hold #2',
          detail1: 'Weight: 3.5 Tonnes',
          detail2: 'Priority: CRITICAL',
          detail3: 'Origin: RSV Nuyina'
        }
      },
      {
        id: 'INV-017',
        type: 'INVENTORY',
        label: 'Generator Exciter (INV-017)',
        sublabel: 'Mawson Power Stock',
        status: 'AT_RISK',
        metadata: {
          statusText: 'Zero On-Station Spare - Depletion imminent',
          detail1: 'Current Stock: 0 Units',
          detail2: 'Daily Use: 1 Duty Unit',
          detail3: 'Days Left: 10.0 Days'
        }
      },
      {
        id: 'A-G03',
        type: 'ASSET',
        label: 'Station Generator G-03',
        sublabel: 'Mawson Primary Power',
        status: 'AT_RISK',
        metadata: {
          statusText: 'Operating on Degraded Exciter Unit',
          detail1: 'Output: 450 kW',
          detail2: 'Condition: 62%',
          detail3: 'Maint. Overdue: 48 hrs'
        }
      },
      {
        id: 'M-027',
        type: 'MISSION',
        label: 'Mission M-027 (Deep Core)',
        sublabel: 'Mawson Ice Core Project',
        status: 'AT_RISK',
        metadata: {
          statusText: 'Mission At Risk - Power Disruption Cascade',
          detail1: 'Team: Team Alpha (6 Personnel)',
          detail2: 'Continuity: 54.0%',
          detail3: 'Target: Mawson Plateau'
        }
      }
    ],

    recoveryOptions: [
      {
        id: 'rec-c1-plan-a',
        optionName: 'Plan A — Heavy-Lift Helicopter Air-Bridge (S-92)',
        shortLabel: 'Helicopter Sling Load',
        description: 'Dispatch Sikorsky S-92 heavy-lift chopper from Davis Station staging to airlift C-1042 directly from ship deck to Mawson helipad.',
        explanation: 'Rapid 48-hour resolution with zero over-ice hazard, restoring full generator maintenance capability before fast-ice closure.',
        rank: 1,
        isRecommended: true,
        missionContinuityScore: 92.0,
        safetyScore: 95.0,
        timeScore: 90.0,
        resourceScore: 75.0,
        costScore: 70.0,
        totalScore: 88.5,
        estimatedDelayDays: 2,
        estimatedCostUSD: '$24,500 (Simulated)',
        actionSteps: [
          'Authorize S-92 heavy helicopter deployment from Davis Depot.',
          'Attach certified 4-tonne sling harness to Consignment C-1042 on Nuyina helideck.',
          'Execute 3-phase air transfer to Mawson Base Technical Hangar.',
          'Commence immediate G-03 generator exciter swap.'
        ]
      },
      {
        id: 'rec-c1-plan-b',
        optionName: 'Plan B — Over-Ice Traverse Transfer (PistenBully)',
        shortLabel: 'Over-Ice Tractor Sledge',
        description: 'Lower cargo onto sea ice using auxiliary manual davit and tow via PistenBully tractor across 8km fast ice.',
        explanation: 'Low monetary cost but carries significant risk if sea ice fractures near ship hull.',
        rank: 2,
        isRecommended: false,
        missionContinuityScore: 75.0,
        safetyScore: 52.0,
        timeScore: 65.0,
        resourceScore: 80.0,
        costScore: 85.0,
        totalScore: 68.2,
        estimatedDelayDays: 6,
        estimatedCostUSD: '$8,200 (Simulated)',
        actionSteps: [
          'Verify sea ice thickness along 8km offshore traverse line.',
          'Rig auxiliary emergency davit to lower 3.5T crate onto heavy sledge.',
          'Dispatch PistenBully V-04 with ice-penetrating radar escort.'
        ]
      },
      {
        id: 'rec-c1-plan-c',
        optionName: 'Plan C — Wait for Secondary Vessel Resupply',
        shortLabel: 'Wait Secondary Vessel',
        description: 'Retain cargo onboard Nuyina and await secondary vessel arrival during late-season window.',
        explanation: 'Extremely high risk of total mission failure and station power blackout during winter blackout period.',
        rank: 3,
        isRecommended: false,
        missionContinuityScore: 30.0,
        safetyScore: 60.0,
        timeScore: 20.0,
        resourceScore: 90.0,
        costScore: 90.0,
        totalScore: 42.0,
        estimatedDelayDays: 24,
        estimatedCostUSD: '$0 (Direct Cost)',
        actionSteps: [
          'Place Mission M-027 on formal standby protocol.',
          'Implement station power conservation mode (unplug non-essential labs).'
        ]
      }
    ],

    metrics: {
      continuityBefore: 88.5,
      continuityDisrupted: 54.0,
      continuityAfterRecovery: 86.0,
      delayDaysBaseline: 14,
      delayDaysMitigated: 2
    },

    featuresDemonstrated: [
      'Cargo tracking & hold inventory inspection',
      'Inventory priority & power single-point-of-failure analysis',
      'Asset availability & helicopter air-bridge planning',
      'BFS Disruption Impact Engine blast-radius calculation',
      'Non-destructive 5-pillar Scenario Lab comparison'
    ]
  },

  {
    id: 'case-2-mawson-seaice',
    title: 'Mawson Station — Incomplete Resupply Due to Sea Ice',
    shortTitle: 'Mawson Sea-Ice Resupply Disruption',
    location: 'Mawson Station & Offshore Fast Ice',
    coordinates: '67°36′S 62°53′E',
    disruptionType: 'Environmental / Marine Sea-Ice Lockout',
    source: 'Australian Antarctic Program Official Operational Report',
    sourceYear: '2021',
    documentedBackground:
      'In late 2021, fast ice extending over 40 kilometers from Mawson Station prevented the primary supply vessel from reaching the harbour wharf.',
    documentedSituation:
      'Thick sea ice prevented a complete resupply operation. An aerial delivery was later conducted to deliver essential supplies to Mawson Station.',
    operationalChallenge:
      'Only 48 tonnes out of 120 tonnes of annual fuel, food rations, and polar medical kits could be landed before ship berth window expired, threatening wintering station autonomy.',
    prototypeDisclaimer:
      'Documented AAP 2021 sea-ice lockout report augmented with simulated supply-depletion modeling and aerial drop risk scoring.',

    workflow: [
      { step: 1, label: 'Thick Sea Ice', status: 'DISRUPTED', detail: '40km unseasonable fast-ice pack blocked maritime approach to Horseshoe Harbour.' },
      { step: 2, label: 'Resupply Interrupted', status: 'RESTRICTED', detail: 'Ship departure forced after 48 of 120 tonnes landed; 72 tonnes retained onboard.' },
      { step: 3, label: 'Supply Shortages Identified', status: 'ANALYZED', detail: 'Winter fuel reserve projected to hit critical zero in 45 days.' },
      { step: 4, label: 'Critical Inventory Prioritised', status: 'ANALYZED', detail: 'Aviation fuel (Jet A-1) and winter ration packs flagged top priority.' },
      { step: 5, label: 'Aerial Resupply Evaluated', status: 'EVALUATED', detail: 'Basler BT-67 ski-plane air-drop from Wilkins Aerodrome calculated.' },
      { step: 6, label: 'Emergency Supply Plan', status: 'RECOVERED', detail: 'Plan A (BT-67 Air-Drop + Ski Landing) authorized; winter autonomy restored to 280 days.' }
    ],

    displays: {
      requiredSupplies: [
        { category: 'Aviation Fuel (Jet A-1)', qty: '60,000 Litres', state: 'REQUIRED' },
        { category: 'Winter Survival Food Rations', qty: '40 Tonnes', state: 'REQUIRED' },
        { category: 'Polar Emergency Medical Supplies', qty: '20 Crates', state: 'REQUIRED' }
      ],
      deliveredSupplies: [
        { category: 'Winter Survival Rations (Partial)', qty: '28 Tonnes', landedDate: 'Dec 12, 2021' },
        { category: 'General Hardware & Parts', qty: '20 Tonnes', landedDate: 'Dec 13, 2021' }
      ],
      pendingSupplies: [
        { category: 'Aviation Fuel (Jet A-1)', qty: '45,000 Litres', offshoreDistance: '40 km offshore' },
        { category: 'Polar Medical Emergency Kits', qty: '15 Crates', offshoreDistance: '40 km offshore' }
      ],
      criticalInventoryItems: [
        { name: 'INV-FUEL-JET', stockLeft: '12,000 L (45 Days)', criticality: 'CRITICAL' },
        { name: 'INV-MED-KIT', stockLeft: '3 Kits (30 Days)', criticality: 'HIGH' }
      ],
      alternativeDeliveryMethods: [
        { method: 'Basler BT-67 Ski-Plane Air-Drop', capacity: '3.2 Tonnes / Sortie', speed: '240 knots' },
        { method: 'C-17 Globemaster Heavy Parachute Drop', capacity: '14 Tonnes / Drop', speed: '400 knots' },
        { method: 'Over-Ice Heavy Caterpillar Traverse', capacity: '25 Tonnes / Trip', speed: '8 km/h' }
      ],
      simulatedSupplyCoverage: {
        withoutAction: '45 Days Autonomy (Critical Failure in Mid-Winter)',
        withAction: '280 Days Autonomy (Full Winterization Secured)'
      }
    },

    graphNodes: [
      {
        id: 'ICE-MAWSON-21',
        type: 'ROUTE',
        label: 'Mawson Fast-Ice Pack',
        sublabel: '40km Fast Ice Barrier',
        status: 'FAILED',
        metadata: {
          statusText: 'Navigation Impassable for Resupply Ship',
          detail1: 'Ice Thickness: 2.4 meters',
          detail2: 'Extent: 40 km offshore',
          detail3: 'Status: CLOSED'
        }
      },
      {
        id: 'CARGO-RES-21',
        type: 'CARGO',
        label: 'Mawson Annual Resupply',
        sublabel: 'Consignment Batch 2021-B',
        status: 'RESTRICTED',
        metadata: {
          statusText: '72 Tonnes Unfinished Delivery',
          detail1: 'Delivered: 48 Tonnes',
          detail2: 'Pending: 72 Tonnes',
          detail3: 'Priority: HIGH'
        }
      },
      {
        id: 'INV-FUEL-JET',
        type: 'INVENTORY',
        label: 'Jet A-1 Aviation Fuel',
        sublabel: 'Mawson Fuel Farm',
        status: 'AT_RISK',
        metadata: {
          statusText: 'Depletion Shortfall Alert - 45 Days Stock',
          detail1: 'Current: 12,000 L',
          detail2: 'Min Required: 50,000 L',
          detail3: 'Days Left: 45 Days'
        }
      },
      {
        id: 'TEAM-MAWSON-WINTER',
        type: 'TEAM',
        label: 'Mawson Wintering Expedition',
        sublabel: '18 Expedition Crew',
        status: 'AT_RISK',
        metadata: {
          statusText: 'Winter Autonomy Compromised',
          detail1: 'Crew Size: 18 Members',
          detail2: 'Location: Mawson Base',
          detail3: 'Status: AT RISK'
        }
      },
      {
        id: 'M-MAWSON-WINTER',
        type: 'MISSION',
        label: 'Mawson Station Winterization',
        sublabel: 'Annual Polar Research Ops',
        status: 'AT_RISK',
        metadata: {
          statusText: 'Mission Continuity Drop to 48.5%',
          detail1: 'Duration: 9 Months',
          detail2: 'Continuity: 48.5%',
          detail3: 'Target: Full Recovery'
        }
      }
    ],

    recoveryOptions: [
      {
        id: 'rec-c2-plan-a',
        optionName: 'Plan A — Basler BT-67 Ski-Plane Air-Bridge',
        shortLabel: 'BT-67 Aerial Delivery',
        description: 'Deploy Basler BT-67 ski-planes from Wilkins Aerodrome for multi-stage air drops and ski landings on Mawson ice-runway.',
        explanation: 'Delivers 100% of critical Jet A-1 fuel drums and medical kits within 4 days, securing 280-day winter autonomy.',
        rank: 1,
        isRecommended: true,
        missionContinuityScore: 90.0,
        safetyScore: 88.0,
        timeScore: 92.0,
        resourceScore: 80.0,
        costScore: 65.0,
        totalScore: 85.5,
        estimatedDelayDays: 4,
        estimatedCostUSD: '$42,000 (Simulated)',
        actionSteps: [
          'Stage 15 Jet A-1 fuel bladders at Wilkins Aerodrome.',
          'Execute 4 daily BT-67 shuttle flights to Mawson Sea-Ice Ski Runway.',
          'Transfer fuel to station main storage bank via heated pump line.'
        ]
      },
      {
        id: 'rec-c2-plan-b',
        optionName: 'Plan B — Sea-Ice Tractor Sledge Haulage (40km)',
        shortLabel: '40km Ice Tractor Haul',
        description: 'Rig heavy sledges to haul remaining 72 tonnes across 40km of fast ice using Caterpillar tractors.',
        explanation: 'High operational risk due to potential tidal sea-ice cracks and unpredictable pressure ridges.',
        rank: 2,
        isRecommended: false,
        missionContinuityScore: 70.0,
        safetyScore: 45.0,
        timeScore: 50.0,
        resourceScore: 75.0,
        costScore: 80.0,
        totalScore: 61.0,
        estimatedDelayDays: 12,
        estimatedCostUSD: '$18,500 (Simulated)',
        actionSteps: [
          'Deploy ice-thickness radar team along 40km sea-ice vector.',
          'Clear pressure ridges using snow-cats.',
          'Haul 3 tractor trains over 5-day weather window.'
        ]
      },
      {
        id: 'rec-c2-plan-c',
        optionName: 'Plan C — Station Fuel Rationing & Mission Reduction',
        shortLabel: 'Fuel Rationing Protocol',
        description: 'Shut down non-essential scientific experiments and reduce station heating to maintain baseline survival.',
        explanation: 'Avoids transport costs but severely impacts scientific data collection and personnel comfort.',
        rank: 3,
        isRecommended: false,
        missionContinuityScore: 25.0,
        safetyScore: 70.0,
        timeScore: 10.0,
        resourceScore: 95.0,
        costScore: 95.0,
        totalScore: 45.0,
        estimatedDelayDays: 180,
        estimatedCostUSD: '$0 (Direct Cost)',
        actionSteps: [
          'Issue Emergency Station Fuel Rationing Order #04.',
          'Power down atmospheric optics lab and secondary living quarters.'
        ]
      }
    ],

    metrics: {
      continuityBefore: 91.0,
      continuityDisrupted: 48.5,
      continuityAfterRecovery: 85.5,
      delayDaysBaseline: 30,
      delayDaysMitigated: 4
    },

    featuresDemonstrated: [
      'Real-time inventory depletion monitoring & shortfall prediction',
      'Critical resource prioritization (Jet A-1 fuel & medical kits)',
      'Multi-modal transport alternative comparison (Air drop vs Sea ice)',
      'Winterization emergency response planning',
      'Interactive operational graph causal chain tracking'
    ]
  },

  {
    id: 'case-3-halley-ice',
    title: 'Halley Station — Blocked Maritime Resupply Route',
    shortTitle: 'Halley Station Access Blockage',
    location: 'Brunt Ice Shelf / Weddell Sea',
    coordinates: '75°35′S 26°34′W',
    disruptionType: 'Maritime Route Blockage / Multi-Year Pack Ice',
    source: 'Australian & British Antarctic Historical Resupply Report',
    sourceYear: '2002',
    documentedBackground:
      'In 2002, impenetrable multi-year sea ice in the Weddell Sea halted resupply vessels 85 nautical miles short of Halley Station’s primary ice port (N9).',
    documentedSituation:
      'Heavy sea ice prevented the resupply ship from reaching Halley Station. Essential and priority cargo had to be transported by air from an alternative landing location on the ice edge.',
    operationalChallenge:
      'Direct ship-to-shelf crane unloading was impossible. Critical atmospheric science instruments and heating fuel had to be staged at an emergency ice-edge camp.',
    prototypeDisclaimer:
      'Historical 2002 Weddell Sea ice lockout modeled with PolarOps dynamic route rerouting and air-bridge trade-off algorithms.',

    workflow: [
      { step: 1, label: 'Heavy Sea Ice', status: 'DISRUPTED', detail: 'Weddell Sea multi-year pack ice blocked vessel 85 nautical miles from N9 Ice Port.' },
      { step: 2, label: 'Ship Access Blocked', status: 'RESTRICTED', detail: 'Direct maritime docking aborted; vessel anchored at outer ice edge staging camp.' },
      { step: 3, label: 'Cargo Delivery Route Interrupted', status: 'ANALYZED', detail: 'Primary sea route severed; 100% of priority cargo stranded offshore.' },
      { step: 4, label: 'Priority Cargo Identified', status: 'ANALYZED', detail: 'Ozone monitoring spectrophotometers & thermal fuel identified as critical.' },
      { step: 5, label: 'Alternative Air Transport Evaluated', status: 'EVALUATED', detail: 'Twin Otter ski-plane air-bridge from Ice Edge Camp to Halley VI skiway evaluated.' },
      { step: 6, label: 'Revised Delivery Plan', status: 'RECOVERED', detail: 'Plan A (Twin Otter Staging Airlift) committed; 100% priority cargo delivered in 3 days.' }
    ],

    displays: {
      originalRoute: { path: 'Cape Town → Weddell Sea → N9 Ice Port → Halley Station Wharf', status: 'BLOCKED' },
      disruptedRoute: { path: 'Weddell Sea Outer Pack Ice (85nm North of Halley)', cause: 'Impenetrable Multi-Year Fast Ice' },
      priorityCargo: [
        { item: 'C-301: Dobson Ozone Spectrophotometer Rig', weight: '1.8 Tonnes', urgency: 'CRITICAL' },
        { item: 'C-305: Station Heat Exchanger Modules', weight: '4.2 Tonnes', urgency: 'HIGH' },
        { item: 'C-309: Polar Survival Rations (Batch H)', weight: '6.0 Tonnes', urgency: 'HIGH' }
      ],
      alternativeTransportOptions: [
        { name: 'DHC-6 Twin Otter Ski-Plane', range: '1,200 km', payload: '1.4 Tonnes' },
        { name: 'Kässbohrer Snowcat Over-Snow Train', range: '300 km', payload: '15 Tonnes' },
        { name: 'Heavy Hovercraft Ice Shuttle', range: '80 km', payload: '5 Tonnes' }
      ],
      estimatedDeliveryImpact: {
        routeDelayDays: 7,
        priorityDeliveredPct: 100
      }
    },

    graphNodes: [
      {
        id: 'ROUTE-WEDDELL-02',
        type: 'ROUTE',
        label: 'Weddell Sea Maritime Approach',
        sublabel: 'Sea Route to N9 Port',
        status: 'FAILED',
        metadata: {
          statusText: 'Blocked by Multi-Year Pack Ice (85nm out)',
          detail1: 'Pack Ice: 10/10 concentration',
          detail2: 'Distance: 85 nm to Halley',
          detail3: 'Status: IMPASSABLE'
        }
      },
      {
        id: 'SHIP-AURORA-02',
        type: 'ASSET',
        label: 'RSV Polar Vessel',
        sublabel: 'Resupply Vessel at Ice Edge',
        status: 'RESTRICTED',
        metadata: {
          statusText: 'Anchored at Outer Ice Edge Staging Camp',
          detail1: 'Location: 74°10′S 28°15′W',
          detail2: 'Hold Cargo: 120 Tonnes',
          detail3: 'Status: STAGED'
        }
      },
      {
        id: 'CARGO-HALLEY-PRI',
        type: 'CARGO',
        label: 'Halley Priority Science Cargo',
        sublabel: 'Ozone Sensors & Heating Fuel',
        status: 'AT_RISK',
        metadata: {
          statusText: 'Rerouting Required via Air-Bridge',
          detail1: 'Weight: 12.0 Tonnes',
          detail2: 'Priority: CRITICAL',
          detail3: 'Destination: Halley VI'
        }
      },
      {
        id: 'MISSION-HALLEY-OZONE',
        type: 'MISSION',
        label: 'Halley Atmospheric Ozone Science',
        sublabel: 'Global Climate Record Project',
        status: 'AT_RISK',
        metadata: {
          statusText: 'Instrument Arrival Delayed - Continuity 52.0%',
          detail1: 'Lead: Dr. Elena Rostova',
          detail2: 'Continuity: 52.0%',
          detail3: 'Impact: High'
        }
      },
      {
        id: 'STATION-HALLEY-VI',
        type: 'STATION',
        label: 'Halley VI Research Station',
        sublabel: 'Brunt Ice Shelf',
        status: 'OPERATIONAL',
        metadata: {
          statusText: 'Awaiting Air-Bridge Delivery from Staging Camp',
          detail1: 'Personnel: 14 Crew',
          detail2: 'Fuel Level: 58%',
          detail3: 'Status: Operational'
        }
      }
    ],

    recoveryOptions: [
      {
        id: 'rec-c3-plan-a',
        optionName: 'Plan A — Ice-Edge Staging Camp & Twin Otter Air-Bridge',
        shortLabel: 'Twin Otter Air-Bridge',
        description: 'Establish temporary ice-edge staging airfield at 85nm and operate 9 Twin Otter ski-plane shuttle flights directly to Halley VI skiway.',
        explanation: 'Ensures 100% delivery of priority scientific sensors and emergency heating parts with minimal delay.',
        rank: 1,
        isRecommended: true,
        missionContinuityScore: 91.0,
        safetyScore: 90.0,
        timeScore: 88.0,
        resourceScore: 82.0,
        costScore: 72.0,
        totalScore: 86.5,
        estimatedDelayDays: 3,
        estimatedCostUSD: '$31,000 (Simulated)',
        actionSteps: [
          'Deploy ice safety team to clear 800m ice-edge ski landing strip.',
          'Offload priority crates C-301 & C-305 from ship to staging airfield.',
          'Run 9 DHC-6 Twin Otter shuttle sorties over 72 hours.',
          'Install Dobson Spectrophotometer at Halley Clean Air Sector.'
        ]
      },
      {
        id: 'rec-c3-plan-b',
        optionName: 'Plan B — Icebreaker Ramming & Escort Attempt',
        shortLabel: 'Icebreaker Escort Ram',
        description: 'Contract heavy icebreaker to ram through 85nm of multi-year pack ice to force a maritime channel.',
        explanation: 'High risk of ship hull structural strain and potential propeller ice damage in multi-year pressure ridges.',
        rank: 2,
        isRecommended: false,
        missionContinuityScore: 65.0,
        safetyScore: 35.0,
        timeScore: 40.0,
        resourceScore: 60.0,
        costScore: 45.0,
        totalScore: 49.0,
        estimatedDelayDays: 10,
        estimatedCostUSD: '$95,000 (Simulated)',
        actionSteps: [
          'Engage secondary heavy icebreaker escort.',
          'Attempt 85nm channel ramming in Weddell Sea ice pack.'
        ]
      },
      {
        id: 'rec-c3-plan-c',
        optionName: 'Plan C — Reroute to Neumayer Station & Long Traverse',
        shortLabel: 'Neumayer Long Traverse',
        description: 'Reroute ship to land cargo at Neumayer III Station and execute 650km over-snow sledge traverse to Halley.',
        explanation: 'Feasible but incurs a 14-day delay and heavy fuel burn across the Ekström Ice Shelf.',
        rank: 3,
        isRecommended: false,
        missionContinuityScore: 75.0,
        safetyScore: 70.0,
        timeScore: 45.0,
        resourceScore: 65.0,
        costScore: 60.0,
        totalScore: 65.0,
        estimatedDelayDays: 14,
        estimatedCostUSD: '$28,000 (Simulated)',
        actionSteps: [
          'Reroute vessel vector northeast to Atka Bay / Neumayer III.',
          'Assemble 4-cat Caterpillar traverse convoy for 650km transit.'
        ]
      }
    ],

    metrics: {
      continuityBefore: 85.0,
      continuityDisrupted: 52.0,
      continuityAfterRecovery: 84.0,
      delayDaysBaseline: 21,
      delayDaysMitigated: 3
    },

    featuresDemonstrated: [
      'Transport route monitoring & maritime ice barrier detection',
      'Cargo prioritization & dependency analysis',
      'Air-bridge route alternative planning (85nm Twin Otter shuttle)',
      'Delivery-impact simulation & priority cargo coverage',
      'Commander decision support multi-criteria score matrix'
    ]
  },

  {
    id: 'case-4-southpole-sled',
    title: 'South Pole Cargo Route — Sled Breakdown',
    shortTitle: 'South Pole Sled Breakdown',
    location: 'South Pole Overland Traverse Route',
    coordinates: '84°12′S 165°20′E (Mile 380)',
    disruptionType: 'Surface Transport Equipment Mechanical Breakdown',
    source: 'United States Antarctic Program (USAP) Published Research',
    sourceYear: '2003',
    documentedBackground:
      'During the 2003 trial over-snow cargo traverses between McMurdo Station and the South Pole, heavy tractor-sled fleets suffered severe mobility degradation and structural runner failures.',
    documentedSituation:
      'During 2003 cargo-transport trials between McMurdo Station and the South Pole, the tractor-sled fleet experienced poor mobility and multiple sled breakdowns. Design improvements were subsequently recommended and adopted.',
    operationalChallenge:
      'Sled TS-04 suffered a catastrophic structural runner shear at Mile 380 on the Leverett Glacier, stranding 18 tonnes of South Pole Telescope sub-assemblies in extreme cold (-40°C).',
    prototypeDisclaimer:
      'USAP 2003 South Pole traverse trial report combined with simulated PolarOps asset replacement and LC-130 air-support optimization.',

    workflow: [
      { step: 1, label: 'Sled Breakdown', status: 'DISRUPTED', detail: 'Heavy Traverse Sled TS-04 structural runner shear & tow bar fracture at Mile 380.' },
      { step: 2, label: 'Cargo Movement Interrupted', status: 'RESTRICTED', detail: '18 tonnes of South Pole Telescope sub-assemblies stranded on Leverett Glacier.' },
      { step: 3, label: 'Dependent Deliveries Identified', status: 'ANALYZED', detail: 'South Pole Astrophysics Mission M-SP01 installation window delayed by 14 days.' },
      { step: 4, label: 'Available Transport Assets Checked', status: 'ANALYZED', detail: 'Backup Sled TS-09 at Depot 3 & PistenBully 300 Tractor located.' },
      { step: 5, label: 'Alternative Transport Evaluated', status: 'EVALUATED', detail: 'Field sled swap at Mile 380 vs LC-130 Hercules airlift evaluated.' },
      { step: 6, label: 'Recovery Plan Simulated', status: 'RECOVERED', detail: 'Plan A (Field Sled Swap from Depot 3 + LC-130 Lift) approved; delay reduced to 36 hours.' }
    ],

    displays: {
      failedSled: {
        id: 'SLED-TS-04',
        name: 'Heavy Traverse Sled TS-04',
        failurePoint: 'Mile 380 (Leverett Glacier Ascent)',
        impactReason: 'Structural Runner Fatigue Shear under High Friction Sastrugi'
      },
      affectedCargo: [
        { code: 'C-409', name: 'South Pole Telescope Secondary Mirror Assembly', weight: '6.2 Tonnes', priority: 'CRITICAL' },
        { code: 'C-412', name: 'Cryogenic Liquid Helium Dewars', weight: '4.5 Tonnes', priority: 'CRITICAL' },
        { code: 'C-415', name: 'High-Altitude Solar Array Panels', weight: '7.3 Tonnes', priority: 'HIGH' }
      ],
      availableReplacementAssets: [
        { name: 'Sled TS-09 (Heavy Duty HDPE Runners)', location: 'Traverse Depot 3 (Mile 300)', status: 'READY' },
        { name: 'PistenBully 300 Polar Tractor (T-08)', location: 'Traverse Depot 3 (Mile 300)', status: 'OPERATIONAL' },
        { name: 'LC-130 Hercules Ski Aircraft (Flight NY-04)', location: 'McMurdo Airfield', status: 'STANDBY' }
      ],
      estimatedResponseTime: '36 Hours (Field Replacement & Rigging)',
      cargoDeliveryImpact: 'Schedule delay reduced from 14 days down to 36 hours; 100% telescope payload preserved.',
      alternativeRecoveryPlans: [
        'Plan A: Field Sled Swap from Depot 3 + Partial LC-130 Hercules Airlift (Score: 89.0)',
        'Plan B: Total Airlift via LC-130 Hercules Only (Score: 71.0 - High Aviation Fuel Cost)',
        'Plan C: On-Site Field Weld & Structural Plate Repair (Score: 54.0 - High Cold Fracture Risk)'
      ]
    },

    graphNodes: [
      {
        id: 'SLED-TS-04',
        type: 'ASSET',
        label: 'Traverse Sled TS-04',
        sublabel: 'Heavy Overland Sled',
        status: 'FAILED',
        metadata: {
          statusText: 'Catastrophic Structural Runner Shear at Mile 380',
          detail1: 'Payload: 18 Tonnes',
          detail2: 'Location: Leverett Glacier',
          detail3: 'Status: OUT OF SERVICE'
        }
      },
      {
        id: 'CARGO-TEL-SPT',
        type: 'CARGO',
        label: 'Telescope Sub-Assemblies (C-409)',
        sublabel: 'South Pole Telescope Parts',
        status: 'RESTRICTED',
        metadata: {
          statusText: 'Stranded on Leverett Glacier at -40°C',
          detail1: 'Weight: 18 Tonnes',
          detail2: 'Priority: CRITICAL',
          detail3: 'Risk: High Cold Soak'
        }
      },
      {
        id: 'ROUTE-SP-TRAVERSE',
        type: 'ROUTE',
        label: 'McMurdo-South Pole Highway',
        sublabel: '1,600km Overland Route',
        status: 'RESTRICTED',
        metadata: {
          statusText: 'Mile 380 Bottleneck - Single Lane Blockage',
          detail1: 'Elevation: 2,800 m',
          detail2: 'Temp: -40°C',
          detail3: 'Status: OBSTRUCTED'
        }
      },
      {
        id: 'MISSION-SPT-01',
        type: 'MISSION',
        label: 'South Pole Telescope Assembly (M-SP01)',
        sublabel: 'Amundsen-Scott Science',
        status: 'AT_RISK',
        metadata: {
          statusText: 'Installation Window Threatened - Continuity 61.0%',
          detail1: 'Station: South Pole',
          detail2: 'Continuity: 61.0%',
          detail3: 'Impact: High'
        }
      },
      {
        id: 'ASSET-LC130-NY04',
        type: 'ASSET',
        label: 'LC-130 Hercules Aircraft',
        sublabel: 'USAP Air Support',
        status: 'OPERATIONAL',
        metadata: {
          statusText: 'Standing By at McMurdo Airfield for Emergency Lift',
          detail1: 'Payload: 12 Tonnes',
          detail2: 'Range: 2,400 km',
          detail3: 'Status: READY'
        }
      }
    ],

    recoveryOptions: [
      {
        id: 'rec-c4-plan-a',
        optionName: 'Plan A — Field Sled Replacement (Depot 3) + LC-130 Lift',
        shortLabel: 'Depot 3 Sled Swap + Air Lift',
        description: 'Dispatch PistenBully T-08 towing spare heavy sled TS-09 from Depot 3 (Mile 300) to execute field cargo transfer at Mile 380, while LC-130 airlifts cryogenic dewars directly.',
        explanation: 'Clears the glacier bottleneck in 36 hours while keeping sensitive cryogenic mirrors safe from extreme temperature exposure.',
        rank: 1,
        isRecommended: true,
        missionContinuityScore: 94.0,
        safetyScore: 92.0,
        timeScore: 90.0,
        resourceScore: 80.0,
        costScore: 78.0,
        totalScore: 89.0,
        estimatedDelayDays: 1.5,
        estimatedCostUSD: '$29,000 (Simulated)',
        actionSteps: [
          'Dispatch PistenBully T-08 from Depot 3 with replacement Sled TS-09.',
          'Perform crane-to-sledge field transfer at Mile 380 Leverett Glacier site.',
          'Launch LC-130 flight NY-04 to airlift Cryogenic Liquid Helium directly to South Pole.',
          'Resume traverse for remaining structural steel.'
        ]
      },
      {
        id: 'rec-c4-plan-b',
        optionName: 'Plan B — Full Cargo Airlift via LC-130 Fleet',
        shortLabel: 'Full LC-130 Air Lift',
        description: 'Abandon overland traverse and fly all 18 tonnes of cargo to South Pole via 3 dedicated LC-130 Hercules flights.',
        explanation: 'Very fast execution but consumes a large portion of annual aviation fuel allocations for the South Pole season.',
        rank: 2,
        isRecommended: false,
        missionContinuityScore: 85.0,
        safetyScore: 85.0,
        timeScore: 95.0,
        resourceScore: 50.0,
        costScore: 40.0,
        totalScore: 71.0,
        estimatedDelayDays: 1,
        estimatedCostUSD: '$82,000 (Simulated)',
        actionSteps: [
          'Offload all cargo from TS-04 at Leverett ski strip.',
          'Execute 3 LC-130 shuttles from Leverett to South Pole Station.'
        ]
      },
      {
        id: 'rec-c4-plan-c',
        optionName: 'Plan C — On-Site Field Weld & Runner Plate Repair',
        shortLabel: 'On-Site Field Weld Repair',
        description: 'Dispatch mobile mechanics to attempt field welding of steel runner plates at -40°C.',
        explanation: 'High probability of secondary structural re-fracture under high-impact sastrugi bumps.',
        rank: 3,
        isRecommended: false,
        missionContinuityScore: 50.0,
        safetyScore: 60.0,
        timeScore: 40.0,
        resourceScore: 70.0,
        costScore: 85.0,
        totalScore: 54.0,
        estimatedDelayDays: 5,
        estimatedCostUSD: '$6,500 (Simulated)',
        actionSteps: [
          'Fly mobile welding generator to Mile 380.',
          'Attempt pre-heated structural arc weld on fractured runner beam.'
        ]
      }
    ],

    metrics: {
      continuityBefore: 93.0,
      continuityDisrupted: 61.0,
      continuityAfterRecovery: 88.0,
      delayDaysBaseline: 14,
      delayDaysMitigated: 1.5
    },

    featuresDemonstrated: [
      'Asset status monitoring & mechanical structural failure tracking',
      'Cargo-to-transport dependency mapping',
      'South Pole traverse mission-impact analysis',
      'Replacement asset selection & multi-modal routing (Traverse + LC-130)',
      'Time & cost recovery recommendation matrix'
    ]
  }
];
