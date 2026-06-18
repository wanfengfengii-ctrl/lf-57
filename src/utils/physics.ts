import type {
  PhysicsConfig,
  SimulationParams,
  StepperConfig,
  StepperState,
  MultiPersonParams,
  GrainConfig,
  GoalConfig,
  GrainType,
  ProcessingGoal,
  EnvironmentParams,
  EnvironmentPresetId,
  EnvironmentPreset,
  EnvironmentModifiers,
} from '../types';

export const GRAIN_CONFIGS: Record<GrainType, GrainConfig> = {
  rice: {
    id: 'rice',
    name: '稻谷',
    emoji: '🌾',
    shellingDifficulty: 1.0,
    optimalImpactMin: 0.2,
    optimalImpactMax: 0.45,
    baseRiceYieldRate: 0.72,
    baseBreakageRate: 0.08,
    description: '最常见的主食谷物，外壳较脆，需精准控制冲击力度',
  },
  millet: {
    id: 'millet',
    name: '黍（黄米）',
    emoji: '🌱',
    shellingDifficulty: 1.3,
    optimalImpactMin: 0.25,
    optimalImpactMax: 0.5,
    baseRiceYieldRate: 0.78,
    baseBreakageRate: 0.05,
    description: '颗粒较小，外壳坚硬，成米率高但需更大力度',
  },
  sorghum: {
    id: 'sorghum',
    name: '粟（小米）',
    emoji: '🪴',
    shellingDifficulty: 1.5,
    optimalImpactMin: 0.22,
    optimalImpactMax: 0.48,
    baseRiceYieldRate: 0.75,
    baseBreakageRate: 0.06,
    description: '颗粒细小，外壳坚韧，需耐心反复舂击',
  },
  wheat: {
    id: 'wheat',
    name: '小麦',
    emoji: '🌿',
    shellingDifficulty: 0.8,
    optimalImpactMin: 0.18,
    optimalImpactMax: 0.4,
    baseRiceYieldRate: 0.82,
    baseBreakageRate: 0.04,
    description: '麸皮较软，容易脱壳，破损率低',
  },
  buckwheat: {
    id: 'buckwheat',
    name: '荞麦',
    emoji: '🍀',
    shellingDifficulty: 1.8,
    optimalImpactMin: 0.28,
    optimalImpactMax: 0.55,
    baseRiceYieldRate: 0.65,
    baseBreakageRate: 0.12,
    description: '外壳极难脱壳的三棱形种子，需大力冲击易破损',
  },
};

export const GOAL_CONFIGS: Record<ProcessingGoal, GoalConfig> = {
  highYield: {
    id: 'highYield',
    name: '高产优先',
    icon: '📦',
    description: '追求最大产量，允许较高破损率',
    yieldMultiplier: 1.25,
    breakageMultiplier: 1.4,
    energyMultiplier: 1.15,
    huskRateMultiplier: 1.1,
  },
  lowBreakage: {
    id: 'lowBreakage',
    name: '低破损优先',
    icon: '💎',
    description: '保持米粒完整，优先品质',
    yieldMultiplier: 0.85,
    breakageMultiplier: 0.5,
    energyMultiplier: 1.0,
    huskRateMultiplier: 0.9,
  },
  energySaving: {
    id: 'energySaving',
    name: '节能优先',
    icon: '💚',
    description: '节省体力，延长作业时间',
    yieldMultiplier: 0.95,
    breakageMultiplier: 0.9,
    energyMultiplier: 0.7,
    huskRateMultiplier: 0.95,
  },
  balanced: {
    id: 'balanced',
    name: '均衡模式',
    icon: '⚖️',
    description: '综合平衡各项指标',
    yieldMultiplier: 1.0,
    breakageMultiplier: 1.0,
    energyMultiplier: 1.0,
    huskRateMultiplier: 1.0,
  },
};

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  PESTLE_WEIGHT: 15,
  MIN_EFFECTIVE_HEIGHT: 0.15,
  MIN_EFFECTIVE_MOMENTUM: 25,
  MAX_STEP_FORCE: 500,
  GRAVITY: 9.8,
  SCALE: 200,
};

export const STAMINA_RECOVERY_RATE = 0.2;
export const EFFECTIVE_STRIKE_STAMINA_BONUS = 0.5;

export function generateSingleStepForce(
  time: number,
  stepper: StepperConfig,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): { force: number; isActive: boolean } {
  if (stepper.stepFrequency <= 0) return { force: 0, isActive: false };

  const period = 1 / stepper.stepFrequency;
  const adjustedTime = time + stepper.phaseOffset * period;
  const phase = (adjustedTime % period) / period;

  let force = 0;
  let isActive = false;

  if (phase < 0.3) {
    force = Math.sin((phase / 0.3) * Math.PI * 0.5) * config.MAX_STEP_FORCE;
    isActive = true;
  } else if (phase < 0.4) {
    force = config.MAX_STEP_FORCE;
    isActive = true;
  } else {
    const releasePhase = (phase - 0.4) / 0.6;
    force = Math.sin((1 - releasePhase) * Math.PI * 0.5) * config.MAX_STEP_FORCE * 0.3;
    isActive = force > config.MAX_STEP_FORCE * 0.05;
  }

  return {
    force: force * stepper.forceMultiplier,
    isActive,
  };
}

export interface CompositeForceResult {
  totalForce: number;
  activeSteppers: number[];
  perStepperForce: number[];
}

export function generateCompositeForce(
  time: number,
  steppers: StepperConfig[],
  stepperStates: StepperState[],
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): CompositeForceResult {
  const perStepperForce: number[] = [];
  const activeSteppers: number[] = [];
  let totalForce = 0;

  steppers.forEach((stepper, index) => {
    const state = stepperStates[index];
    if (state && state.currentStamina <= 0) {
      perStepperForce.push(0);
      return;
    }

    const { force, isActive } = generateSingleStepForce(time, stepper, config);
    perStepperForce.push(force);

    if (isActive && force > 0) {
      activeSteppers.push(stepper.id);
    }

    totalForce += force;
  });

  return {
    totalForce: Math.min(totalForce, config.MAX_STEP_FORCE * 3),
    activeSteppers,
    perStepperForce,
  };
}

export function updateStepperStamina(
  stepper: StepperConfig,
  state: StepperState,
  deltaTime: number,
  forceApplied: number,
  strikeOccurred: boolean,
  strikeEffective: boolean
): StepperState {
  const newState = { ...state };
  const staminaHistory = [...state.staminaHistory];

  let staminaDelta = -forceApplied * stepper.staminaUsageRate * deltaTime * 0.001;

  if (!strikeOccurred) {
    staminaDelta += STAMINA_RECOVERY_RATE * deltaTime;
  }

  if (strikeEffective) {
    staminaDelta += EFFECTIVE_STRIKE_STAMINA_BONUS;
  }

  newState.currentStamina = Math.max(0, Math.min(newState.maxStamina, newState.currentStamina + staminaDelta));

  const lastHistory = staminaHistory[staminaHistory.length - 1];
  if (!lastHistory || (strikeOccurred || staminaHistory.length < 60)) {
    staminaHistory.push({
      time: state.staminaHistory.length > 0 ? state.staminaHistory[state.staminaHistory.length - 1].time + deltaTime : 0,
      stamina: newState.currentStamina,
    });
    if (staminaHistory.length > 120) {
      staminaHistory.shift();
    }
  }

  newState.staminaHistory = staminaHistory;
  return newState;
}

export function generateStepForce(
  time: number,
  frequency: number,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): number {
  if (frequency <= 0) return 0;

  const period = 1 / frequency;
  const phase = (time % period) / period;

  if (phase < 0.3) {
    return Math.sin((phase / 0.3) * Math.PI * 0.5) * config.MAX_STEP_FORCE;
  } else if (phase < 0.4) {
    return config.MAX_STEP_FORCE;
  } else {
    const releasePhase = (phase - 0.4) / 0.6;
    return Math.sin((1 - releasePhase) * Math.PI * 0.5) * config.MAX_STEP_FORCE * 0.3;
  }
}

export function isEffectiveStrike(
  impactVelocity: number,
  dropHeight: number,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): boolean {
  if (dropHeight < config.MIN_EFFECTIVE_HEIGHT) return false;

  const momentum = config.PESTLE_WEIGHT * Math.abs(impactVelocity);
  return momentum > config.MIN_EFFECTIVE_MOMENTUM;
}

export function isImpactInOptimalRange(
  dropHeight: number,
  grainType: GrainType = 'rice'
): number {
  const grain = GRAIN_CONFIGS[grainType];
  if (dropHeight < grain.optimalImpactMin) {
    return dropHeight / grain.optimalImpactMin;
  }
  if (dropHeight > grain.optimalImpactMax) {
    const overRange = dropHeight - grain.optimalImpactMax;
    const maxPenaltyRange = grain.optimalImpactMax * 0.5;
    return Math.max(0.3, 1 - (overRange / maxPenaltyRange) * 0.7);
  }
  return 1;
}

export function calculateHuskRemovalRate(
  impactEnergy: number,
  grainWeight: number,
  strikeCount: number,
  participantBoost: number = 1,
  grainType: GrainType = 'rice',
  processingGoal: ProcessingGoal = 'balanced',
  dropHeight: number = 0.3
): number {
  if (grainWeight <= 0) return 0;

  const grain = GRAIN_CONFIGS[grainType];
  const goal = GOAL_CONFIGS[processingGoal];

  const difficultyFactor = 1 / grain.shellingDifficulty;
  const optimalFactor = isImpactInOptimalRange(dropHeight, grainType);

  const baseRate = Math.min(0.85, (impactEnergy / (grainWeight * 10)) * difficultyFactor);
  const cumulativeFactor = 1 - Math.exp(-strikeCount / (5 * grain.shellingDifficulty));
  const boostFactor = 1 + (participantBoost - 1) * 0.15;

  return Math.max(0, Math.min(1, baseRate * cumulativeFactor * 0.95 * boostFactor * optimalFactor * goal.huskRateMultiplier));
}

export function calculateBreakageRate(
  impactEnergy: number,
  grainWeight: number,
  strikeCount: number,
  grainType: GrainType = 'rice',
  processingGoal: ProcessingGoal = 'balanced',
  dropHeight: number = 0.3
): number {
  if (grainWeight <= 0) return 0;

  const grain = GRAIN_CONFIGS[grainType];
  const goal = GOAL_CONFIGS[processingGoal];

  const optimalFactor = isImpactInOptimalRange(dropHeight, grainType);
  const heightPenalty = dropHeight > grain.optimalImpactMax
    ? Math.min(0.5, (dropHeight - grain.optimalImpactMax) * 2)
    : 0;

  const energyFactor = Math.min(0.6, impactEnergy / (grainWeight * 20));
  const cumulativeFactor = Math.min(0.3, strikeCount / 50);

  const baseBreakage = (grain.baseBreakageRate + energyFactor * 0.15 + cumulativeFactor * 0.1) * goal.breakageMultiplier;
  const adjustedBreakage = baseBreakage * (1 + heightPenalty) * (2 - optimalFactor);

  return Math.max(0, Math.min(1, adjustedBreakage));
}

export function calculateRiceYield(
  accumulatedYield: number,
  huskRemovalRate: number,
  grainType: GrainType = 'rice',
  processingGoal: ProcessingGoal = 'balanced',
  breakageRate: number = 0
): number {
  if (accumulatedYield <= 0) return 0;

  const grain = GRAIN_CONFIGS[grainType];
  const goal = GOAL_CONFIGS[processingGoal];

  const intactRatio = Math.max(0, 1 - breakageRate);
  return accumulatedYield * huskRemovalRate * grain.baseRiceYieldRate * goal.yieldMultiplier * intactRatio;
}

export function calculateIntegrityRate(
  breakageRate: number,
  totalProcessed: number
): number {
  if (totalProcessed <= 0) return 100;
  return Math.max(0, Math.min(100, (1 - breakageRate) * 100));
}

export function calculateStaminaYieldRatio(
  riceYield: number,
  totalStaminaUsed: number
): number {
  if (totalStaminaUsed <= 0) return 0;
  return (riceYield * 1000) / totalStaminaUsed;
}

export function calculateImpactEnergy(
  velocity: number,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): number {
  return 0.5 * config.PESTLE_WEIGHT * velocity * velocity;
}

export function estimateYield(
  effectiveStrikes: number,
  grainWeight: number,
  avgHuskRemovalRate: number,
  participantCount: number = 1,
  grainType: GrainType = 'rice',
  processingGoal: ProcessingGoal = 'balanced'
): number {
  if (effectiveStrikes <= 0 || grainWeight <= 0) return 0;

  const grain = GRAIN_CONFIGS[grainType];
  const goal = GOAL_CONFIGS[processingGoal];

  const processedPerStrike = grainWeight * 0.1;
  const participantEfficiency = participantCount === 1 ? 1 : participantCount === 2 ? 0.9 : 0.82;
  const difficultyFactor = 1 / (grain.shellingDifficulty * 0.8 + 0.2);

  return effectiveStrikes * processedPerStrike * avgHuskRemovalRate * 0.7 * participantEfficiency * difficultyFactor * goal.yieldMultiplier;
}

export function calculateYieldPerHour(
  accumulatedYield: number,
  elapsedTime: number
): number {
  if (elapsedTime <= 0) return 0;
  return (accumulatedYield / elapsedTime) * 3600;
}

export function calculateEffectiveRate(
  totalStrikes: number,
  effectiveStrikes: number
): number {
  if (totalStrikes <= 0) return 0;
  return (effectiveStrikes / totalStrikes) * 100;
}

export function getLeverageMultiplier(
  pedalLength: number,
  pivotPosition: number
): number {
  if (pivotPosition <= 0 || pivotPosition >= pedalLength) return 1;

  const leftLength = pivotPosition;
  const rightLength = pedalLength - pivotPosition;

  return rightLength / leftLength;
}

export function calculateStaminaEfficiency(
  totalYield: number,
  totalStaminaUsed: number,
  processingGoal: ProcessingGoal = 'balanced'
): number {
  if (totalStaminaUsed <= 0) return 0;
  const goal = GOAL_CONFIGS[processingGoal];
  return (totalYield / totalStaminaUsed) * 1000 * (1 / goal.energyMultiplier);
}

export function calculateTheoreticalMaxHeight(
  params: SimulationParams,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): number {
  const leverage = getLeverageMultiplier(params.pedalLength, params.pivotPosition);
  const participantCount = params.multiPerson?.participantCount || 1;
  const avgForceMultiplier = params.multiPerson
    ? params.multiPerson.steppers.reduce((sum, s) => sum + s.forceMultiplier, 0) / participantCount
    : 1;

  const effectiveForce = config.MAX_STEP_FORCE * leverage * avgForceMultiplier * Math.min(participantCount * 0.8, 1.5);
  const acceleration = effectiveForce / config.PESTLE_WEIGHT - config.GRAVITY;

  if (acceleration <= 0) return 0.05;

  const baseFrequency = params.multiPerson
    ? Math.max(...params.multiPerson.steppers.map(s => s.stepFrequency))
    : params.stepFrequency;

  const period = 1 / baseFrequency;
  const pushTime = period * 0.35;
  const velocity = acceleration * pushTime;

  return (velocity * velocity) / (2 * config.GRAVITY);
}

export function estimateStaminaConsumption(
  steppers: StepperConfig[],
  duration: number
): number {
  let total = 0;
  steppers.forEach((stepper) => {
    const stepsPerSecond = stepper.stepFrequency * 0.5;
    const forcePerStep = DEFAULT_PHYSICS_CONFIG.MAX_STEP_FORCE * stepper.forceMultiplier * 0.0005;
    total += stepsPerSecond * forcePerStep * stepper.staminaUsageRate * duration;
  });
  return total;
}

export function validatePhysicsParams(
  params: SimulationParams
): { valid: boolean; message?: string } {
  if (params.pedalLength <= 0) {
    return { valid: false, message: '踏板长度必须大于0' };
  }
  if (params.stepFrequency <= 0) {
    return { valid: false, message: '踩踏频率必须大于0' };
  }
  if (params.grainWeight <= 0) {
    return { valid: false, message: '谷物重量必须大于0' };
  }
  if (params.pivotPosition <= 0 || params.pivotPosition >= params.pedalLength) {
    return {
      valid: false,
      message: `支点位置必须在0到${params.pedalLength.toFixed(2)}m之间`,
    };
  }

  return { valid: true };
}

export const DEFAULT_ENVIRONMENT: EnvironmentParams = {
  humidity: 50,
  grainMoisture: 14,
  pedalWear: 0,
  groundStability: 100,
  presetId: 'sunny',
};

export const ENVIRONMENT_PRESETS: Record<EnvironmentPresetId, EnvironmentPreset> = {
  sunny: {
    id: 'sunny',
    name: '晴天晾晒',
    icon: '☀️',
    description: '干燥晴朗，谷物含水率低，踏板和地面状态良好',
    params: { humidity: 30, grainMoisture: 12, pedalWear: 5, groundStability: 95 },
  },
  postRain: {
    id: 'postRain',
    name: '雨后潮湿',
    icon: '🌧️',
    description: '空气与谷物含水量高，踏板湿滑，地面松软不稳',
    params: { humidity: 85, grainMoisture: 22, pedalWear: 10, groundStability: 55 },
  },
  highIntensity: {
    id: 'highIntensity',
    name: '高强度连续作业',
    icon: '🔥',
    description: '长时间作业导致踏板严重磨损，地面被反复踩踏后不稳',
    params: { humidity: 55, grainMoisture: 16, pedalWear: 65, groundStability: 40 },
  },
  dusty: {
    id: 'dusty',
    name: '干燥扬尘',
    icon: '💨',
    description: '极度干燥环境，谷物过干易碎，踏板干涩摩擦大',
    params: { humidity: 15, grainMoisture: 8, pedalWear: 25, groundStability: 80 },
  },
  custom: {
    id: 'custom',
    name: '自定义',
    icon: '🔧',
    description: '自由调整各项环境参数',
    params: { humidity: 50, grainMoisture: 14, pedalWear: 0, groundStability: 100 },
  },
};

export function calculateEnvironmentModifiers(env: EnvironmentParams): EnvironmentModifiers {
  const humidityFactor = env.humidity / 100;
  const moistureFactor = env.grainMoisture / 30;
  const wearFactor = env.pedalWear / 100;
  const stabilityFactor = env.groundStability / 100;

  const impactHeightMultiplier =
    1.0
    - humidityFactor * 0.08
    - wearFactor * 0.20
    - (1 - stabilityFactor) * 0.12;

  const hullingEfficiencyMultiplier =
    1.0
    - humidityFactor * 0.12
    - moistureFactor * 0.15
    - wearFactor * 0.10
    - (1 - stabilityFactor) * 0.08;

  const breakageRateMultiplier =
    1.0
    + moistureFactor * 0.25
    + (1 - stabilityFactor) * 0.15
    + Math.max(0, (env.grainMoisture - 20) / 10) * 0.20;

  const staminaConsumptionMultiplier =
    1.0
    + humidityFactor * 0.15
    + wearFactor * 0.20
    + (1 - stabilityFactor) * 0.18;

  return {
    impactHeightMultiplier: Math.max(0.3, impactHeightMultiplier),
    hullingEfficiencyMultiplier: Math.max(0.3, hullingEfficiencyMultiplier),
    breakageRateMultiplier: Math.max(0.5, breakageRateMultiplier),
    staminaConsumptionMultiplier: Math.max(0.5, staminaConsumptionMultiplier),
  };
}

export function applyEnvironmentToHuskRate(
  baseHuskRate: number,
  env: EnvironmentParams
): number {
  const mods = calculateEnvironmentModifiers(env);
  return Math.max(0, Math.min(1, baseHuskRate * mods.hullingEfficiencyMultiplier));
}

export function applyEnvironmentToBreakageRate(
  baseBreakageRate: number,
  env: EnvironmentParams
): number {
  const mods = calculateEnvironmentModifiers(env);
  return Math.max(0, Math.min(1, baseBreakageRate * mods.breakageRateMultiplier));
}

export function applyEnvironmentToImpactHeight(
  baseHeight: number,
  env: EnvironmentParams
): number {
  const mods = calculateEnvironmentModifiers(env);
  return Math.max(0, baseHeight * mods.impactHeightMultiplier);
}

export function applyEnvironmentToStaminaCost(
  baseStaminaCost: number,
  env: EnvironmentParams
): number {
  const mods = calculateEnvironmentModifiers(env);
  return baseStaminaCost * mods.staminaConsumptionMultiplier;
}
