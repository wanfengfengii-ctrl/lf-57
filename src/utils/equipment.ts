import type {
  EquipmentPart,
  EquipmentPartId,
  EquipmentPartState,
  EquipmentState,
  MaintenanceAction,
  MaintenanceActionType,
  MaintenanceStrategy,
  EquipmentModifiers,
  MaintenanceRecord,
  MaintenanceChallenge,
} from '../types';

export const EQUIPMENT_PARTS: Record<EquipmentPartId, EquipmentPart> = {
  pedal: {
    id: 'pedal',
    name: '踏板',
    icon: '🪵',
    description: '踩踏施力的木质踏板，长期使用会磨损和松动',
    baseWearRate: 0.08,
    baseLoosenRate: 0.06,
    maxWear: 100,
    maxLooseness: 100,
    replaceCost: 50,
    reinforceCost: 20,
    lubricateCost: 10,
  },
  pivot: {
    id: 'pivot',
    name: '支点',
    icon: '⚙️',
    description: '杠杆转动的支点轴，磨损会导致能量传递效率下降',
    baseWearRate: 0.05,
    baseLoosenRate: 0.04,
    maxWear: 100,
    maxLooseness: 100,
    replaceCost: 80,
    reinforceCost: 30,
    lubricateCost: 15,
  },
  connectingRod: {
    id: 'connectingRod',
    name: '连接杆',
    icon: '🔗',
    description: '连接踏板与碓头的杆件，松动会造成冲击偏移',
    baseWearRate: 0.06,
    baseLoosenRate: 0.08,
    maxWear: 100,
    maxLooseness: 100,
    replaceCost: 60,
    reinforceCost: 25,
    lubricateCost: 12,
  },
  pestleHead: {
    id: 'pestleHead',
    name: '碓头',
    icon: '🔨',
    description: '直接冲击谷物的碓头，磨损会降低冲击质量',
    baseWearRate: 0.1,
    baseLoosenRate: 0.03,
    maxWear: 100,
    maxLooseness: 100,
    replaceCost: 100,
    reinforceCost: 35,
    lubricateCost: 8,
  },
};

export const MAINTENANCE_CHALLENGES: MaintenanceChallenge[] = [
  {
    id: 'mc_easy_1',
    name: '初学者维护',
    description: '在有限预算内保持器具基本运转，完成基础产量目标',
    targetYield: 5,
    budgetLimit: 100,
    timeLimit: 120,
    difficulty: 'easy',
  },
  {
    id: 'mc_medium_1',
    name: '高效维护师',
    description: '平衡维护成本与生产效率，在中等预算下实现高产',
    targetYield: 15,
    budgetLimit: 200,
    timeLimit: 180,
    difficulty: 'medium',
  },
  {
    id: 'mc_hard_1',
    name: '极致优化',
    description: '在紧张预算下最大化产出，考验维护时机判断',
    targetYield: 25,
    budgetLimit: 250,
    timeLimit: 240,
    difficulty: 'hard',
  },
];

export function getDefaultEquipmentState(strategy: MaintenanceStrategy = 'withMaintenance'): EquipmentState {
  const parts: Record<EquipmentPartId, EquipmentPartState> = {} as Record<EquipmentPartId, EquipmentPartState>;
  
  (Object.keys(EQUIPMENT_PARTS) as EquipmentPartId[]).forEach((id) => {
    parts[id] = {
      id,
      wear: 0,
      looseness: 0,
      efficiencyFactor: 1.0,
      totalStrikes: 0,
      lastMaintenanceTime: 0,
      maintenanceCount: 0,
    };
  });

  return {
    parts,
    overallEfficiency: 1.0,
    totalMaintenanceCost: 0,
    maintenanceHistory: [],
    maintenanceStrategy: strategy,
    lastUpdateTime: 0,
  };
}

export function calculatePartEfficiency(
  wear: number,
  looseness: number,
  partId: EquipmentPartId
): number {
  const part = EQUIPMENT_PARTS[partId];
  const wearFactor = 1 - (wear / part.maxWear) * 0.4;
  const loosenessFactor = 1 - (looseness / part.maxLooseness) * 0.35;
  return Math.max(0.3, wearFactor * loosenessFactor);
}

export function updateEquipmentWear(
  state: EquipmentState,
  strikeCount: number,
  intensity: number = 1.0,
  deltaTime: number = 1
): EquipmentState {
  const newParts = { ...state.parts };
  
  (Object.keys(EQUIPMENT_PARTS) as EquipmentPartId[]).forEach((id) => {
    const part = EQUIPMENT_PARTS[id];
    const currentPart = state.parts[id];
    
    const wearIncrease = part.baseWearRate * strikeCount * intensity * 0.1;
    const loosenIncrease = part.baseLoosenRate * strikeCount * intensity * 0.08;
    
    const newWear = Math.min(part.maxWear, currentPart.wear + wearIncrease);
    const newLooseness = Math.min(part.maxLooseness, currentPart.looseness + loosenIncrease);
    
    newParts[id] = {
      ...currentPart,
      wear: newWear,
      looseness: newLooseness,
      efficiencyFactor: calculatePartEfficiency(newWear, newLooseness, id),
      totalStrikes: currentPart.totalStrikes + strikeCount,
    };
  });

  const overallEfficiency = calculateOverallEfficiency(newParts);

  return {
    ...state,
    parts: newParts,
    overallEfficiency,
    lastUpdateTime: state.lastUpdateTime + deltaTime,
  };
}

export function calculateOverallEfficiency(
  parts: Record<EquipmentPartId, EquipmentPartState>
): number {
  const partIds = Object.keys(parts) as EquipmentPartId[];
  const total = partIds.reduce((sum, id) => sum + parts[id].efficiencyFactor, 0);
  return total / partIds.length;
}

export function calculateEquipmentModifiers(
  state: EquipmentState
): EquipmentModifiers {
  const { pedal, pivot, connectingRod, pestleHead } = state.parts;

  const impactHeightMultiplier =
    pedal.efficiencyFactor * 0.25 +
    pivot.efficiencyFactor * 0.3 +
    connectingRod.efficiencyFactor * 0.25 +
    pestleHead.efficiencyFactor * 0.2;

  const efficiencyMultiplier =
    pedal.efficiencyFactor * 0.2 +
    pivot.efficiencyFactor * 0.25 +
    connectingRod.efficiencyFactor * 0.2 +
    pestleHead.efficiencyFactor * 0.35;

  const avgWear = Object.values(state.parts).reduce((sum, p) => sum + p.wear, 0) / 4;
  const avgLooseness = Object.values(state.parts).reduce((sum, p) => sum + p.looseness, 0) / 4;

  const breakageRateMultiplier = 1 + avgWear * 0.003 + avgLooseness * 0.002;
  const staminaConsumptionMultiplier = 1 + avgWear * 0.0025 + avgLooseness * 0.003;
  const strikeQualityMultiplier = pestleHead.efficiencyFactor * 0.6 + connectingRod.efficiencyFactor * 0.4;

  return {
    impactHeightMultiplier: Math.max(0.4, impactHeightMultiplier),
    efficiencyMultiplier: Math.max(0.4, efficiencyMultiplier),
    breakageRateMultiplier: Math.max(1.0, Math.min(2.5, breakageRateMultiplier)),
    staminaConsumptionMultiplier: Math.max(1.0, Math.min(2.0, staminaConsumptionMultiplier)),
    strikeQualityMultiplier: Math.max(0.4, strikeQualityMultiplier),
  };
}

export function getMaintenanceActions(partId: EquipmentPartId): MaintenanceAction[] {
  const part = EQUIPMENT_PARTS[partId];
  
  return [
    {
      type: 'reinforce',
      targetPart: partId,
      cost: part.reinforceCost,
      description: '加固部件，减少松动',
      wearReduction: 5,
      loosenessReduction: 25,
      staminaCost: 8,
    },
    {
      type: 'lubricate',
      targetPart: partId,
      cost: part.lubricateCost,
      description: '润滑部件，减少磨损',
      wearReduction: 15,
      loosenessReduction: 8,
      staminaCost: 5,
    },
    {
      type: 'replace',
      targetPart: partId,
      cost: part.replaceCost,
      description: '更换新部件，完全恢复',
      wearReduction: 100,
      loosenessReduction: 100,
      staminaCost: 15,
    },
  ];
}

export function performMaintenance(
  state: EquipmentState,
  action: MaintenanceAction,
  currentTime: number
): { state: EquipmentState; record: MaintenanceRecord; success: boolean } {
  const part = EQUIPMENT_PARTS[action.targetPart];
  const currentPart = state.parts[action.targetPart];

  const wearBefore = currentPart.wear;
  const loosenessBefore = currentPart.looseness;

  const newWear = Math.max(0, currentPart.wear - action.wearReduction);
  const newLooseness = Math.max(0, currentPart.looseness - action.loosenessReduction);

  const record: MaintenanceRecord = {
    id: `maint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: currentTime,
    action: action.type,
    targetPart: action.targetPart,
    cost: action.cost,
    staminaUsed: action.staminaCost,
    wearBefore,
    wearAfter: newWear,
    loosenessBefore,
    loosenessAfter: newLooseness,
  };

  const newParts = {
    ...state.parts,
    [action.targetPart]: {
      ...currentPart,
      wear: newWear,
      looseness: newLooseness,
      efficiencyFactor: calculatePartEfficiency(newWear, newLooseness, action.targetPart),
      lastMaintenanceTime: currentTime,
      maintenanceCount: currentPart.maintenanceCount + 1,
    },
  };

  const newState: EquipmentState = {
    ...state,
    parts: newParts,
    overallEfficiency: calculateOverallEfficiency(newParts),
    totalMaintenanceCost: state.totalMaintenanceCost + action.cost,
    maintenanceHistory: [...state.maintenanceHistory, record],
  };

  return {
    state: newState,
    record,
    success: true,
  };
}

export function getPartStatusLevel(wear: number, looseness: number): 'good' | 'fair' | 'poor' | 'critical' {
  const avg = (wear + looseness) / 2;
  if (avg < 20) return 'good';
  if (avg < 50) return 'fair';
  if (avg < 80) return 'poor';
  return 'critical';
}

export function getStatusColor(level: 'good' | 'fair' | 'poor' | 'critical'): string {
  switch (level) {
    case 'good': return '#2E8B57';
    case 'fair': return '#DAA520';
    case 'poor': return '#CD5C5C';
    case 'critical': return '#8B0000';
  }
}

export function getMaintenanceActionName(type: MaintenanceActionType): string {
  switch (type) {
    case 'reinforce': return '加固';
    case 'lubricate': return '润滑';
    case 'replace': return '更换';
  }
}

export function estimateMaintenanceCost(
  initialState: EquipmentState,
  duration: number,
  strikeFrequency: number
): number {
  const totalStrikes = duration * strikeFrequency;
  let estimatedCost = 0;

  (Object.keys(EQUIPMENT_PARTS) as EquipmentPartId[]).forEach((id) => {
    const part = EQUIPMENT_PARTS[id];
    const wearIncrease = part.baseWearRate * totalStrikes * 0.1;
    const loosenIncrease = part.baseLoosenRate * totalStrikes * 0.08;
    
    const lubrications = Math.floor(wearIncrease / 15);
    const reinforcements = Math.floor(loosenIncrease / 25);
    const replacements = Math.floor((wearIncrease + loosenIncrease) / 150);
    
    estimatedCost += lubrications * part.lubricateCost;
    estimatedCost += reinforcements * part.reinforceCost;
    estimatedCost += replacements * part.replaceCost;
  });

  return Math.round(estimatedCost);
}

export function calculateNetYield(
  grossYield: number,
  maintenanceCost: number,
  costPerUnit: number = 10
): number {
  const yieldValue = grossYield * costPerUnit;
  return yieldValue - maintenanceCost;
}

export function getOptimalMaintenanceInterval(
  partId: EquipmentPartId,
  strikeFrequency: number
): number {
  const part = EQUIPMENT_PARTS[partId];
  const wearThreshold = 30;
  const strikesToWear = wearThreshold / (part.baseWearRate * 0.1);
  return Math.round(strikesToWear / strikeFrequency);
}
