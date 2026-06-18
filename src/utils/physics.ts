import type { PhysicsConfig, SimulationParams } from '../types';

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  PESTLE_WEIGHT: 15,
  MIN_EFFECTIVE_HEIGHT: 0.15,
  MIN_EFFECTIVE_MOMENTUM: 25,
  MAX_STEP_FORCE: 500,
  GRAVITY: 9.8,
  SCALE: 200,
};

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
  strikeCount: number
): number {
  if (grainWeight <= 0) return 0;

  const baseRate = Math.min(0.8, impactEnergy / (grainWeight * 10));
  const cumulativeFactor = 1 - Math.exp(-strikeCount / 5);

  return Math.max(0, Math.min(1, baseRate * cumulativeFactor * 0.95));
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
  avgHuskRemovalRate: number
): number {
  if (effectiveStrikes <= 0 || grainWeight <= 0) return 0;

  const processedPerStrike = grainWeight * 0.1;
  return effectiveStrikes * processedPerStrike * avgHuskRemovalRate * 0.7;
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

export function calculateTheoreticalMaxHeight(
  params: SimulationParams,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG
): number {
  const leverage = getLeverageMultiplier(params.pedalLength, params.pivotPosition);
  const effectiveForce = config.MAX_STEP_FORCE * leverage;
  const acceleration = effectiveForce / config.PESTLE_WEIGHT - config.GRAVITY;

  if (acceleration <= 0) return 0.05;

  const period = 1 / params.stepFrequency;
  const pushTime = period * 0.35;
  const velocity = acceleration * pushTime;

  return (velocity * velocity) / (2 * config.GRAVITY);
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
