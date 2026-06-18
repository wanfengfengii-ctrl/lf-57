import type {
  PhysicsConfig,
  SimulationParams,
  StepperConfig,
  StepperState,
  MultiPersonParams,
} from '../types';

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

export function calculateHuskRemovalRate(
  impactEnergy: number,
  grainWeight: number,
  strikeCount: number,
  participantBoost: number = 1
): number {
  if (grainWeight <= 0) return 0;

  const baseRate = Math.min(0.8, impactEnergy / (grainWeight * 10));
  const cumulativeFactor = 1 - Math.exp(-strikeCount / 5);
  const boostFactor = 1 + (participantBoost - 1) * 0.15;

  return Math.max(0, Math.min(1, baseRate * cumulativeFactor * 0.95 * boostFactor));
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
  participantCount: number = 1
): number {
  if (effectiveStrikes <= 0 || grainWeight <= 0) return 0;

  const processedPerStrike = grainWeight * 0.1;
  const participantEfficiency = participantCount === 1 ? 1 : participantCount === 2 ? 0.9 : 0.82;

  return effectiveStrikes * processedPerStrike * avgHuskRemovalRate * 0.7 * participantEfficiency;
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
  totalStaminaUsed: number
): number {
  if (totalStaminaUsed <= 0) return 0;
  return (totalYield / totalStaminaUsed) * 1000;
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
