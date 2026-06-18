export interface SimulationParams {
  pedalLength: number;
  pivotPosition: number;
  stepFrequency: number;
  grainWeight: number;
}

export interface EfficiencyPoint {
  time: number;
  effectiveRate: number;
  yieldPerHour: number;
  totalStrikes: number;
  effectiveStrikes: number;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  elapsedTime: number;
  totalStrikes: number;
  effectiveStrikes: number;
  currentHeight: number;
  maxHeight: number;
  accumulatedYield: number;
  currentHuskRate: number;
  efficiencyHistory: EfficiencyPoint[];
}

export type SimulationMode = 'free' | 'challenge';

export interface ChallengeConfig {
  id: string;
  name: string;
  targetYield: number;
  timeLimit: number;
  description: string;
  hint: string;
}

export interface ExperimentRecord {
  id: string;
  timestamp: number;
  params: SimulationParams;
  mode: SimulationMode;
  duration: number;
  totalStrikes: number;
  effectiveStrikes: number;
  finalYield: number;
  avgEfficiency: number;
  maxHeight: number;
  challengeId?: string;
  challengeSuccess?: boolean;
  efficiencyHistory: EfficiencyPoint[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface PhysicsConfig {
  PESTLE_WEIGHT: number;
  MIN_EFFECTIVE_HEIGHT: number;
  MIN_EFFECTIVE_MOMENTUM: number;
  MAX_STEP_FORCE: number;
  GRAVITY: number;
  SCALE: number;
}

export interface StrikeEvent {
  timestamp: number;
  height: number;
  velocity: number;
  momentum: number;
  isEffective: boolean;
  huskRemovalRate: number;
}
