export interface StepperConfig {
  id: number;
  name: string;
  stepFrequency: number;
  forceMultiplier: number;
  phaseOffset: number;
  color: string;
  staminaUsageRate: number;
}

export interface StepperState {
  id: number;
  currentStamina: number;
  maxStamina: number;
  totalSteps: number;
  effectiveContributions: number;
  staminaHistory: { time: number; stamina: number }[];
}

export type CooperationStrategy = 'synchronized' | 'alternating' | 'independent' | 'wave';

export type ParticipantCount = 1 | 2 | 3;

export interface MultiPersonParams {
  participantCount: ParticipantCount;
  steppers: StepperConfig[];
  cooperationStrategy: CooperationStrategy;
  totalStaminaBudget: number;
}

export interface SimulationParams {
  pedalLength: number;
  pivotPosition: number;
  stepFrequency: number;
  grainWeight: number;
  multiPerson?: MultiPersonParams;
}

export interface EfficiencyPoint {
  time: number;
  effectiveRate: number;
  yieldPerHour: number;
  totalStrikes: number;
  effectiveStrikes: number;
  staminaUsed: number;
  perPersonYield?: number[];
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
  stepperStates: StepperState[];
  totalStaminaUsed: number;
  staminaBudgetRemaining: number;
}

export type SimulationMode = 'free' | 'challenge';

export type ChallengeType = 'timeLimit' | 'staminaLimit';

export interface ChallengeConfig {
  id: string;
  name: string;
  type: ChallengeType;
  targetYield: number;
  timeLimit?: number;
  staminaLimit?: number;
  description: string;
  hint: string;
}

export interface ComparisonRecord {
  recordId: string;
  participantCount: ParticipantCount;
  strategy: CooperationStrategy;
  effectiveRate: number;
  yieldPerHour: number;
  staminaEfficiency: number;
  totalStaminaUsed: number;
  duration: number;
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
  participantCount: ParticipantCount;
  cooperationStrategy: CooperationStrategy;
  totalStaminaUsed: number;
  staminaEfficiency: number;
  perPersonStats?: {
    id: number;
    name: string;
    steps: number;
    staminaUsed: number;
    contributionRate: number;
  }[];
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
  contributingSteppers: number[];
}
