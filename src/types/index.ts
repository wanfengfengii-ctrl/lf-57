export type GrainType = 'rice' | 'millet' | 'sorghum' | 'wheat' | 'buckwheat';

export type ProcessingGoal = 'highYield' | 'lowBreakage' | 'energySaving' | 'balanced';

export interface GrainConfig {
  id: GrainType;
  name: string;
  emoji: string;
  shellingDifficulty: number;
  optimalImpactMin: number;
  optimalImpactMax: number;
  baseRiceYieldRate: number;
  baseBreakageRate: number;
  description: string;
}

export interface GoalConfig {
  id: ProcessingGoal;
  name: string;
  icon: string;
  description: string;
  yieldMultiplier: number;
  breakageMultiplier: number;
  energyMultiplier: number;
  huskRateMultiplier: number;
}

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
  grainType: GrainType;
  processingGoal: ProcessingGoal;
  multiPerson?: MultiPersonParams;
  environment?: EnvironmentParams;
}

export interface EfficiencyPoint {
  time: number;
  effectiveRate: number;
  yieldPerHour: number;
  totalStrikes: number;
  effectiveStrikes: number;
  staminaUsed: number;
  perPersonYield?: number[];
  riceYield?: number;
  breakageRate?: number;
  integrityRate?: number;
  staminaYieldRatio?: number;
  environment?: EnvironmentParams;
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
  riceYield: number;
  totalBroken: number;
  totalIntact: number;
  currentBreakageRate: number;
  currentIntegrityRate: number;
  staminaYieldRatio: number;
}

export type EnvironmentPresetId = 'sunny' | 'postRain' | 'highIntensity' | 'dusty' | 'custom';

export interface EnvironmentParams {
  humidity: number;
  grainMoisture: number;
  pedalWear: number;
  groundStability: number;
  presetId: EnvironmentPresetId;
}

export interface EnvironmentPreset {
  id: EnvironmentPresetId;
  name: string;
  icon: string;
  description: string;
  params: Omit<EnvironmentParams, 'presetId'>;
}

export interface EnvironmentModifiers {
  impactHeightMultiplier: number;
  hullingEfficiencyMultiplier: number;
  breakageRateMultiplier: number;
  staminaConsumptionMultiplier: number;
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
  grainType: GrainType;
  processingGoal: ProcessingGoal;
  riceYield: number;
  finalBreakageRate: number;
  finalIntegrityRate: number;
  staminaYieldRatio: number;
  perPersonStats?: {
    id: number;
    name: string;
    steps: number;
    staminaUsed: number;
    contributionRate: number;
  }[];
  environment?: EnvironmentParams;
  maintenanceStrategy?: MaintenanceStrategy;
  totalMaintenanceCost?: number;
  maintenanceCount?: number;
  finalEquipmentState?: EquipmentState;
  equipmentHistory?: EquipmentEfficiencyPoint[];
  maintenanceChallengeId?: string;
  maintenanceChallengeSuccess?: boolean;
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

export type EquipmentPartId = 'pedal' | 'pivot' | 'connectingRod' | 'pestleHead';

export interface EquipmentPart {
  id: EquipmentPartId;
  name: string;
  icon: string;
  description: string;
  baseWearRate: number;
  baseLoosenRate: number;
  maxWear: number;
  maxLooseness: number;
  replaceCost: number;
  reinforceCost: number;
  lubricateCost: number;
}

export interface EquipmentPartState {
  id: EquipmentPartId;
  wear: number;
  looseness: number;
  efficiencyFactor: number;
  totalStrikes: number;
  lastMaintenanceTime: number;
  maintenanceCount: number;
}

export type MaintenanceActionType = 'reinforce' | 'lubricate' | 'replace';

export interface MaintenanceAction {
  type: MaintenanceActionType;
  targetPart: EquipmentPartId;
  cost: number;
  description: string;
  wearReduction: number;
  loosenessReduction: number;
  staminaCost: number;
}

export type MaintenanceStrategy = 'withMaintenance' | 'withoutMaintenance';

export interface MaintenanceRecord {
  id: string;
  timestamp: number;
  action: MaintenanceActionType;
  targetPart: EquipmentPartId;
  cost: number;
  staminaUsed: number;
  wearBefore: number;
  wearAfter: number;
  loosenessBefore: number;
  loosenessAfter: number;
}

export interface EquipmentState {
  parts: Record<EquipmentPartId, EquipmentPartState>;
  overallEfficiency: number;
  totalMaintenanceCost: number;
  maintenanceHistory: MaintenanceRecord[];
  maintenanceStrategy: MaintenanceStrategy;
  lastUpdateTime: number;
}

export interface MaintenanceChallenge {
  id: string;
  name: string;
  description: string;
  targetYield: number;
  budgetLimit: number;
  timeLimit?: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface EquipmentModifiers {
  impactHeightMultiplier: number;
  efficiencyMultiplier: number;
  breakageRateMultiplier: number;
  staminaConsumptionMultiplier: number;
  strikeQualityMultiplier: number;
}

export interface EquipmentEfficiencyPoint {
  time: number;
  overallEfficiency: number;
  parts: Record<EquipmentPartId, {
    wear: number;
    looseness: number;
    efficiency: number;
  }>;
  maintenanceCost: number;
  maintenanceCount: number;
}
