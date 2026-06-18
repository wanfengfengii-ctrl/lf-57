import { create } from 'zustand';
import type {
  SimulationParams,
  SimulationState,
  SimulationMode,
  ExperimentRecord,
  EfficiencyPoint,
  ChallengeConfig,
  StepperState,
  StepperConfig,
  ParticipantCount,
  CooperationStrategy,
  GrainType,
  ProcessingGoal,
  EnvironmentParams,
  EnvironmentPresetId,
  EquipmentState,
  EquipmentPartId,
  MaintenanceAction,
  MaintenanceStrategy,
  MaintenanceChallenge,
  EquipmentEfficiencyPoint,
} from '../types';
import {
  getDefaultParams,
  validateParams,
  getDefaultMultiPersonParams,
  getDefaultStepperConfig,
  applyStrategyPhaseOffsets,
} from '../utils/validation';
import {
  calculateEffectiveRate,
  calculateYieldPerHour,
  estimateYield,
  calculateStaminaEfficiency,
  calculateBreakageRate,
  calculateRiceYield,
  calculateIntegrityRate,
  calculateStaminaYieldRatio,
  calculateImpactEnergy,
  calculateEnvironmentModifiers,
  applyEnvironmentToHuskRate,
  applyEnvironmentToBreakageRate,
  applyEnvironmentToStaminaCost,
  DEFAULT_ENVIRONMENT,
  ENVIRONMENT_PRESETS,
  GRAIN_CONFIGS,
  DEFAULT_PHYSICS_CONFIG,
} from '../utils/physics';
import {
  addRecord,
  deleteRecord,
  loadRecords,
  generateRecordId,
} from '../utils/storage';
import {
  getDefaultEquipmentState,
  updateEquipmentWear,
  performMaintenance,
  calculateEquipmentModifiers,
  EQUIPMENT_PARTS,
  MAINTENANCE_CHALLENGES,
  getMaintenanceActions,
} from '../utils/equipment';

interface SimulationStore {
  params: SimulationParams;
  state: SimulationState;
  mode: SimulationMode;
  currentChallenge: ChallengeConfig | null;
  records: ExperimentRecord[];
  challengeTimeRemaining: number;
  challengeStaminaRemaining: number;
  equipment: EquipmentState;
  equipmentHistory: EquipmentEfficiencyPoint[];
  maintenanceChallenge: MaintenanceChallenge | null;
  maintenanceBudgetRemaining: number;

  setParams: (params: Partial<SimulationParams>) => void;
  resetParams: () => void;
  setParticipantCount: (count: ParticipantCount) => void;
  setCooperationStrategy: (strategy: CooperationStrategy) => void;
  updateStepper: (id: number, updates: Partial<StepperConfig>) => void;
  setTotalStaminaBudget: (budget: number) => void;
  setGrainType: (grainType: GrainType) => void;
  setProcessingGoal: (goal: ProcessingGoal) => void;
  setEnvironment: (env: Partial<EnvironmentParams>) => void;
  setEnvironmentPreset: (presetId: EnvironmentPresetId) => void;

  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;

  setMode: (mode: SimulationMode) => void;
  setChallenge: (challenge: ChallengeConfig | null) => void;

  updateSimulationState: (updates: Partial<SimulationState>) => void;
  updateStepperStates: (states: StepperState[]) => void;
  recordEfficiencyPoint: () => void;
  addStrike: (
    isEffective: boolean,
    huskRate: number,
    contributingSteppers: number[],
    perStepperDelta: { id: number; steps: number; stamina: number }[],
    impactVelocity?: number,
    dropHeight?: number
  ) => void;
  consumeStamina: (amount: number) => void;

  saveCurrentRecord: () => void;
  removeRecord: (id: string) => void;
  loadRecord: (id: string) => void;
  loadAllRecords: () => void;
  clearRecords: () => void;

  tick: (deltaTime: number) => void;
  getValidationErrors: () => Record<string, string>;

  setMaintenanceStrategy: (strategy: MaintenanceStrategy) => void;
  performMaintenanceAction: (action: MaintenanceAction) => boolean;
  updateEquipmentOnStrike: (strikeCount: number, intensity: number) => void;
  recordEquipmentPoint: () => void;
  setMaintenanceChallenge: (challenge: MaintenanceChallenge | null) => void;
  resetEquipment: () => void;
}

const getInitialStepperStates = (params: SimulationParams): StepperState[] => {
  const mp = params.multiPerson;
  if (!mp) return [];

  const perPersonBudget = mp.totalStaminaBudget / mp.participantCount;
  return mp.steppers.map((stepper) => ({
    id: stepper.id,
    currentStamina: perPersonBudget,
    maxStamina: perPersonBudget,
    totalSteps: 0,
    effectiveContributions: 0,
    staminaHistory: [],
  }));
};

const getInitialState = (params?: SimulationParams): SimulationState => {
  const baseState: SimulationState = {
    isRunning: false,
    isPaused: false,
    elapsedTime: 0,
    totalStrikes: 0,
    effectiveStrikes: 0,
    currentHeight: 0,
    maxHeight: 0,
    accumulatedYield: 0,
    currentHuskRate: 0,
    efficiencyHistory: [],
    stepperStates: [],
    totalStaminaUsed: 0,
    staminaBudgetRemaining: params?.multiPerson?.totalStaminaBudget || 100,
    riceYield: 0,
    totalBroken: 0,
    totalIntact: 0,
    currentBreakageRate: 0,
    currentIntegrityRate: 100,
    staminaYieldRatio: 0,
  };

  if (params) {
    baseState.stepperStates = getInitialStepperStates(params);
    baseState.staminaBudgetRemaining = params.multiPerson?.totalStaminaBudget || 100;
  }

  return baseState;
};

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  params: getDefaultParams(),
  state: getInitialState(getDefaultParams()),
  mode: 'free',
  currentChallenge: null,
  records: [],
  challengeTimeRemaining: 0,
  challengeStaminaRemaining: 0,
  equipment: getDefaultEquipmentState('withMaintenance'),
  equipmentHistory: [],
  maintenanceChallenge: null,
  maintenanceBudgetRemaining: 0,

  setParams: (newParams) => {
    const current = get();
    const updatedParams = { ...current.params, ...newParams };

    if (newParams.pedalLength !== undefined) {
      if (updatedParams.pivotPosition >= updatedParams.pedalLength) {
        updatedParams.pivotPosition = updatedParams.pedalLength * 0.4;
      }
    }

    if (current.state.isRunning) {
      set({ params: updatedParams });
    } else {
      set({
        params: updatedParams,
        state: getInitialState(updatedParams),
      });
    }
  },

  resetParams: () => {
    const defaultParams = getDefaultParams();
    set({
      params: defaultParams,
      state: getInitialState(defaultParams),
    });
  },

  setParticipantCount: (count: ParticipantCount) => {
    const current = get();
    const currentMp = current.params.multiPerson || getDefaultMultiPersonParams(1, 'alternating');

    const newSteppers: StepperConfig[] = [];
    for (let i = 0; i < count; i++) {
      if (currentMp.steppers[i]) {
        newSteppers.push({ ...currentMp.steppers[i] });
      } else {
        newSteppers.push(getDefaultStepperConfig(i, count));
      }
    }

    applyStrategyPhaseOffsets(newSteppers, currentMp.cooperationStrategy);

    const totalBudget = 100 * count;
    const updatedMp = {
      ...currentMp,
      participantCount: count,
      steppers: newSteppers,
      totalStaminaBudget: totalBudget,
    };

    const updatedParams = {
      ...current.params,
      multiPerson: updatedMp,
    };

    set({
      params: updatedParams,
      state: {
        ...getInitialState(updatedParams),
        isRunning: false,
      },
    });
  },

  setCooperationStrategy: (strategy: CooperationStrategy) => {
    const current = get();
    if (!current.params.multiPerson) return;

    const newSteppers = current.params.multiPerson.steppers.map((s) => ({ ...s }));
    applyStrategyPhaseOffsets(newSteppers, strategy);

    const updatedMp = {
      ...current.params.multiPerson,
      cooperationStrategy: strategy,
      steppers: newSteppers,
    };

    const updatedParams = {
      ...current.params,
      multiPerson: updatedMp,
    };

    if (current.state.isRunning) {
      set({ params: updatedParams });
    } else {
      set({
        params: updatedParams,
        state: getInitialState(updatedParams),
      });
    }
  },

  updateStepper: (id: number, updates: Partial<StepperConfig>) => {
    const current = get();
    if (!current.params.multiPerson) return;

    const newSteppers = current.params.multiPerson.steppers.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );

    const updatedMp = {
      ...current.params.multiPerson,
      steppers: newSteppers,
    };

    const updatedParams = {
      ...current.params,
      multiPerson: updatedMp,
    };

    if (current.state.isRunning) {
      set({ params: updatedParams });
    } else {
      set({
        params: updatedParams,
        state: getInitialState(updatedParams),
      });
    }
  },

  setTotalStaminaBudget: (budget: number) => {
    const current = get();
    if (!current.params.multiPerson) return;

    const updatedMp = {
      ...current.params.multiPerson,
      totalStaminaBudget: budget,
    };

    const updatedParams = {
      ...current.params,
      multiPerson: updatedMp,
    };

    set({
      params: updatedParams,
      state: getInitialState(updatedParams),
    });
  },

  setGrainType: (grainType: GrainType) => {
    const current = get();
    const updatedParams = { ...current.params, grainType };

    if (current.state.isRunning) {
      set({ params: updatedParams });
    } else {
      set({
        params: updatedParams,
        state: getInitialState(updatedParams),
      });
    }
  },

  setProcessingGoal: (goal: ProcessingGoal) => {
    const current = get();
    const updatedParams = { ...current.params, processingGoal: goal };

    if (current.state.isRunning) {
      set({ params: updatedParams });
    } else {
      set({
        params: updatedParams,
        state: getInitialState(updatedParams),
      });
    }
  },

  setEnvironment: (env: Partial<EnvironmentParams>) => {
    const current = get();
    const currentEnv = current.params.environment || { ...DEFAULT_ENVIRONMENT };
    const updatedEnv = { ...currentEnv, ...env, presetId: 'custom' as EnvironmentPresetId };
    const updatedParams = { ...current.params, environment: updatedEnv };

    if (current.state.isRunning) {
      set({ params: updatedParams });
    } else {
      set({
        params: updatedParams,
        state: getInitialState(updatedParams),
      });
    }
  },

  setEnvironmentPreset: (presetId: EnvironmentPresetId) => {
    const current = get();
    const preset = ENVIRONMENT_PRESETS[presetId];
    if (!preset) return;

    const updatedEnv: EnvironmentParams = {
      ...preset.params,
      presetId,
    };
    const updatedParams = { ...current.params, environment: updatedEnv };

    if (current.state.isRunning) {
      set({ params: updatedParams });
    } else {
      set({
        params: updatedParams,
        state: getInitialState(updatedParams),
      });
    }
  },

  start: () => {
    const { currentChallenge, params, equipment, maintenanceChallenge } = get();
    const validation = validateParams(get().params);

    if (!validation.valid) return;

    set((state) => ({
      state: {
        ...getInitialState(params),
        isRunning: true,
        isPaused: false,
      },
      challengeTimeRemaining: currentChallenge?.timeLimit || 0,
      challengeStaminaRemaining: currentChallenge?.staminaLimit || 0,
      equipment: getDefaultEquipmentState(equipment.maintenanceStrategy),
      equipmentHistory: [],
      maintenanceBudgetRemaining: maintenanceChallenge?.budgetLimit || 0,
    }));
  },

  pause: () => {
    set((state) => ({
      state: {
        ...state.state,
        isPaused: true,
      },
    }));
  },

  resume: () => {
    set((state) => ({
      state: {
        ...state.state,
        isPaused: false,
      },
    }));
  },

  reset: () => {
    const { currentChallenge, params, equipment, maintenanceChallenge } = get();
    set({
      state: getInitialState(params),
      challengeTimeRemaining: currentChallenge?.timeLimit || 0,
      challengeStaminaRemaining: currentChallenge?.staminaLimit || 0,
      equipment: getDefaultEquipmentState(equipment.maintenanceStrategy),
      equipmentHistory: [],
      maintenanceBudgetRemaining: maintenanceChallenge?.budgetLimit || 0,
    });
  },

  setMode: (mode) => {
    const { params } = get();
    set({
      mode,
      state: getInitialState(params),
      currentChallenge: null,
      challengeTimeRemaining: 0,
      challengeStaminaRemaining: 0,
    });
  },

  setChallenge: (challenge) => {
    const current = get();
    let updatedParams = current.params;

    if (challenge && challenge.type === 'staminaLimit' && challenge.staminaLimit) {
      const mp = updatedParams.multiPerson || getDefaultMultiPersonParams(1, 'alternating');
      updatedParams = {
        ...updatedParams,
        multiPerson: {
          ...mp,
          totalStaminaBudget: challenge.staminaLimit,
        },
      };
    }

    set({
      currentChallenge: challenge,
      challengeTimeRemaining: challenge?.timeLimit || 0,
      challengeStaminaRemaining: challenge?.staminaLimit || 0,
      params: updatedParams,
      state: getInitialState(updatedParams),
    });
  },

  updateSimulationState: (updates) => {
    set((state) => ({
      state: {
        ...state.state,
        ...updates,
      },
    }));
  },

  updateStepperStates: (states: StepperState[]) => {
    set((state) => ({
      state: {
        ...state.state,
        stepperStates: states,
      },
    }));
  },

  recordEfficiencyPoint: () => {
    const { state, params } = get();
    const { elapsedTime, totalStrikes, effectiveStrikes, accumulatedYield, totalStaminaUsed, riceYield, currentBreakageRate, currentIntegrityRate, staminaYieldRatio } = state;

    if (elapsedTime <= 0) return;

    const participantCount = params.multiPerson?.participantCount || 1;

    const point: EfficiencyPoint = {
      time: Math.round(elapsedTime * 10) / 10,
      effectiveRate: calculateEffectiveRate(totalStrikes, effectiveStrikes),
      yieldPerHour: calculateYieldPerHour(accumulatedYield, elapsedTime),
      totalStrikes,
      effectiveStrikes,
      staminaUsed: totalStaminaUsed,
      perPersonYield: state.stepperStates.map((ss, i) =>
        (accumulatedYield * ss.effectiveContributions) /
        Math.max(1, effectiveStrikes)
      ),
      riceYield,
      breakageRate: currentBreakageRate,
      integrityRate: currentIntegrityRate,
      staminaYieldRatio,
      environment: params.environment ? { ...params.environment } : undefined,
    };

    set((state) => ({
      state: {
        ...state.state,
        efficiencyHistory: [...state.state.efficiencyHistory, point],
      },
    }));
  },

  addStrike: (
    isEffective: boolean,
    huskRate: number,
    contributingSteppers: number[],
    perStepperDelta: { id: number; steps: number; stamina: number }[],
    impactVelocity: number = 5,
    dropHeight: number = 0.3
  ) => {
    const { state, params, equipment } = get();
    const env = params.environment || DEFAULT_ENVIRONMENT;
    const envMods = calculateEnvironmentModifiers(env);
    const equipMods = calculateEquipmentModifiers(equipment);

    const adjustedHuskRate = applyEnvironmentToHuskRate(huskRate, env) * equipMods.efficiencyMultiplier;

    const adjustedImpactHeight = dropHeight * equipMods.impactHeightMultiplier;
    const effectiveIsEffective = isEffective && adjustedImpactHeight >= DEFAULT_PHYSICS_CONFIG.MIN_EFFECTIVE_HEIGHT;

    const newTotal = state.totalStrikes + 1;
    const newEffective = state.effectiveStrikes + (effectiveIsEffective ? 1 : 0);
    const newHuskRate = effectiveIsEffective
      ? (state.currentHuskRate * state.effectiveStrikes + Math.min(1, adjustedHuskRate)) / Math.max(1, newEffective)
      : state.currentHuskRate;

    const participantCount = params.multiPerson?.participantCount || 1;
    const newYield = estimateYield(newEffective, params.grainWeight, newHuskRate, participantCount, params.grainType, params.processingGoal) * equipMods.strikeQualityMultiplier;

    const impactEnergy = calculateImpactEnergy(impactVelocity) * equipMods.strikeQualityMultiplier;
    const baseStrikeBreakageRate = effectiveIsEffective
      ? calculateBreakageRate(impactEnergy, params.grainWeight, newEffective, params.grainType, params.processingGoal, adjustedImpactHeight)
      : state.currentBreakageRate / 100;

    const envBreakageRate = effectiveIsEffective
      ? applyEnvironmentToBreakageRate(baseStrikeBreakageRate, env)
      : baseStrikeBreakageRate;
    const strikeBreakageRate = envBreakageRate * equipMods.breakageRateMultiplier;

    const newBreakageRate = effectiveIsEffective
      ? (state.currentBreakageRate * state.effectiveStrikes + strikeBreakageRate * 100) / Math.max(1, newEffective)
      : state.currentBreakageRate;

    const newIntegrityRate = calculateIntegrityRate(newBreakageRate / 100, newEffective);
    const newRiceYield = calculateRiceYield(newYield, newHuskRate, params.grainType, params.processingGoal, newBreakageRate / 100);

    const processedPerStrike = effectiveIsEffective ? params.grainWeight * 0.1 * newHuskRate : 0;
    const newBroken = state.totalBroken + processedPerStrike * (newBreakageRate / 100);
    const newIntact = state.totalIntact + processedPerStrike * (1 - newBreakageRate / 100);

    let newTotalStaminaUsed = state.totalStaminaUsed;
    const newStepperStates = state.stepperStates.map((ss) => {
      const delta = perStepperDelta.find((d) => d.id === ss.id);
      if (!delta) return ss;

      const newSteps = ss.totalSteps + delta.steps;
      const newContributions = ss.effectiveContributions + (effectiveIsEffective && contributingSteppers.includes(ss.id) ? 1 : 0);
      const rawStamina = Math.max(0, Math.min(ss.maxStamina, delta.stamina));
      const staminaDelta = Math.max(0, ss.currentStamina - rawStamina);
      const envAdjustedStaminaDelta = applyEnvironmentToStaminaCost(staminaDelta, env);
      const equipAdjustedStaminaDelta = envAdjustedStaminaDelta * equipMods.staminaConsumptionMultiplier;
      const newCurrentStamina = Math.max(0, ss.currentStamina - equipAdjustedStaminaDelta);
      newTotalStaminaUsed += equipAdjustedStaminaDelta;

      return {
        ...ss,
        totalSteps: newSteps,
        currentStamina: newCurrentStamina,
        effectiveContributions: newContributions,
        staminaHistory: [
          ...ss.staminaHistory,
          { time: state.elapsedTime, stamina: newCurrentStamina },
        ].slice(-120),
      };
    });

    const totalBudget = params.multiPerson?.totalStaminaBudget || 100;
    const budgetRemaining = Math.max(0, totalBudget - newTotalStaminaUsed);
    const newStaminaYieldRatio = calculateStaminaYieldRatio(newRiceYield, newTotalStaminaUsed);

    const intensity = isEffective ? 1.0 : 0.5;
    const updatedEquipment = updateEquipmentWear(equipment, 1, intensity, 0);

    set((state) => ({
      state: {
        ...state.state,
        totalStrikes: newTotal,
        effectiveStrikes: newEffective,
        accumulatedYield: newYield,
        currentHuskRate: newHuskRate,
        riceYield: newRiceYield,
        totalBroken: newBroken,
        totalIntact: newIntact,
        currentBreakageRate: newBreakageRate,
        currentIntegrityRate: newIntegrityRate,
        staminaYieldRatio: newStaminaYieldRatio,
        stepperStates: newStepperStates,
        totalStaminaUsed: newTotalStaminaUsed,
        staminaBudgetRemaining: Math.max(0, budgetRemaining),
      },
      equipment: updatedEquipment,
      challengeStaminaRemaining: Math.max(0, budgetRemaining),
    }));
  },

  consumeStamina: (amount: number) => {
    set((state) => ({
      challengeStaminaRemaining: Math.max(0, state.challengeStaminaRemaining - amount),
    }));
  },

  saveCurrentRecord: () => {
    const { state, params, mode, currentChallenge, records, equipment, equipmentHistory, maintenanceChallenge } = get();

    if (state.elapsedTime < 1) return;

    const participantCount = params.multiPerson?.participantCount || 1;
    const strategy = params.multiPerson?.cooperationStrategy || 'independent';

    const perPersonStats = state.stepperStates.map((ss, i) => {
      const config = params.multiPerson?.steppers[i];
      const staminaUsed = Math.max(0, ss.maxStamina - ss.currentStamina);
      return {
        id: ss.id,
        name: config?.name || `${i + 1}号`,
        steps: ss.totalSteps,
        staminaUsed,
        contributionRate:
          state.effectiveStrikes > 0
            ? (ss.effectiveContributions / state.effectiveStrikes) * 100
            : 0,
      };
    });

    const record: ExperimentRecord = {
      id: generateRecordId(),
      timestamp: Date.now(),
      params: JSON.parse(JSON.stringify(params)),
      mode,
      duration: state.elapsedTime,
      totalStrikes: state.totalStrikes,
      effectiveStrikes: state.effectiveStrikes,
      finalYield: state.accumulatedYield,
      avgEfficiency:
        state.effectiveStrikes > 0 ? state.accumulatedYield / state.elapsedTime : 0,
      maxHeight: state.maxHeight,
      challengeId: currentChallenge?.id,
      challengeSuccess: currentChallenge
        ? currentChallenge.type === 'timeLimit'
          ? state.accumulatedYield >= currentChallenge.targetYield
          : state.accumulatedYield >= currentChallenge.targetYield &&
            state.totalStaminaUsed <= (currentChallenge.staminaLimit || Infinity)
        : undefined,
      efficiencyHistory: [...state.efficiencyHistory],
      participantCount: participantCount as ParticipantCount,
      cooperationStrategy: strategy,
      totalStaminaUsed: state.totalStaminaUsed,
      staminaEfficiency: calculateStaminaEfficiency(state.accumulatedYield, state.totalStaminaUsed, params.processingGoal),
      grainType: params.grainType,
      processingGoal: params.processingGoal,
      riceYield: state.riceYield,
      finalBreakageRate: state.currentBreakageRate,
      finalIntegrityRate: state.currentIntegrityRate,
      staminaYieldRatio: state.staminaYieldRatio,
      perPersonStats,
      environment: params.environment ? { ...params.environment } : undefined,
      maintenanceStrategy: equipment.maintenanceStrategy,
      totalMaintenanceCost: equipment.totalMaintenanceCost,
      maintenanceCount: equipment.maintenanceHistory.length,
      finalEquipmentState: JSON.parse(JSON.stringify(equipment)),
      equipmentHistory: [...equipmentHistory],
      maintenanceChallengeId: maintenanceChallenge?.id,
      maintenanceChallengeSuccess: maintenanceChallenge
        ? state.accumulatedYield >= maintenanceChallenge.targetYield &&
          equipment.totalMaintenanceCost <= maintenanceChallenge.budgetLimit
        : undefined,
    };

    const newRecords = addRecord(record);
    set({ records: newRecords });
  },

  removeRecord: (id: string) => {
    const newRecords = deleteRecord(id);
    set({ records: newRecords });
  },

  loadRecord: (id: string) => {
    const record = get().records.find((r) => r.id === id);
    if (record) {
      const avgHuskRate =
        record.effectiveStrikes > 0
          ? record.finalYield /
            (record.effectiveStrikes * record.params.grainWeight * 0.1 * 0.7)
          : 0;

      const mp = record.params.multiPerson || getDefaultMultiPersonParams(1, 'alternating');
      const perPersonBudget = mp.totalStaminaBudget / mp.participantCount;

      const loadedParams = JSON.parse(JSON.stringify(record.params));
      if (!loadedParams.grainType) loadedParams.grainType = 'rice';
      if (!loadedParams.processingGoal) loadedParams.processingGoal = 'balanced';
      if (!loadedParams.environment) loadedParams.environment = record.environment ? { ...record.environment } : { ...DEFAULT_ENVIRONMENT };

      set({
        params: loadedParams,
        state: {
          ...getInitialState(loadedParams),
          elapsedTime: record.duration,
          totalStrikes: record.totalStrikes,
          effectiveStrikes: record.effectiveStrikes,
          accumulatedYield: record.finalYield,
          maxHeight: record.maxHeight,
          currentHuskRate: Math.max(0, Math.min(1, avgHuskRate)),
          efficiencyHistory: record.efficiencyHistory
            ? [...record.efficiencyHistory]
            : [],
          stepperStates: record.perPersonStats?.map((ps, i) => ({
            id: ps.id,
            currentStamina: Math.max(0, perPersonBudget - ps.staminaUsed),
            maxStamina: perPersonBudget,
            totalSteps: ps.steps,
            effectiveContributions: Math.floor((ps.contributionRate / 100) * record.effectiveStrikes),
            staminaHistory: [],
          })) || getInitialStepperStates(loadedParams),
          totalStaminaUsed: record.totalStaminaUsed,
          staminaBudgetRemaining: Math.max(0, mp.totalStaminaBudget - record.totalStaminaUsed),
          riceYield: record.riceYield || 0,
          totalBroken: record.finalBreakageRate ? record.finalYield * (record.finalBreakageRate / 100) * 0.5 : 0,
          totalIntact: record.finalIntegrityRate ? record.finalYield * (record.finalIntegrityRate / 100) * 0.5 : 0,
          currentBreakageRate: record.finalBreakageRate || 0,
          currentIntegrityRate: record.finalIntegrityRate || 100,
          staminaYieldRatio: record.staminaYieldRatio || 0,
        },
        mode: record.mode,
      });
    }
  },

  loadAllRecords: () => {
    const records = loadRecords();
    set({ records });
  },

  clearRecords: () => {
    localStorage.removeItem('treadmill-experiments');
    set({ records: [] });
  },

  tick: (deltaTime: number) => {
    const {
      state,
      mode,
      currentChallenge,
      challengeTimeRemaining,
      challengeStaminaRemaining,
    } = get();

    if (!state.isRunning || state.isPaused) return;

    const newElapsed = state.elapsedTime + deltaTime;
    let newTimeRemaining = challengeTimeRemaining - deltaTime;
    let shouldStop = false;

    if (mode === 'challenge' && currentChallenge) {
      if (currentChallenge.type === 'timeLimit' && newTimeRemaining <= 0) {
        newTimeRemaining = 0;
        shouldStop = true;
      }
      if (
        currentChallenge.type === 'staminaLimit' &&
        state.staminaBudgetRemaining <= 0
      ) {
        shouldStop = true;
      }
      if (state.accumulatedYield >= currentChallenge.targetYield) {
        shouldStop = true;
      }
    }

    const allExhausted =
      state.stepperStates.length > 0 &&
      state.stepperStates.every((s) => s.currentStamina <= 0);
    if (allExhausted && state.stepperStates.length > 0) {
      shouldStop = true;
    }

    set((s) => ({
      state: {
        ...s.state,
        elapsedTime: newElapsed,
        isRunning: shouldStop ? false : s.state.isRunning,
      },
      challengeTimeRemaining: Math.max(0, newTimeRemaining),
    }));
  },

  getValidationErrors: () => {
    const result = validateParams(get().params);
    return result.errors;
  },

  setMaintenanceStrategy: (strategy) => {
    const current = get();
    if (current.state.isRunning) return;

    set({
      equipment: getDefaultEquipmentState(strategy),
      equipmentHistory: [],
    });
  },

  performMaintenanceAction: (action) => {
    const current = get();
    const { equipment, state, maintenanceChallenge, maintenanceBudgetRemaining } = current;

    if (state.isPaused && !state.isRunning) return false;

    if (maintenanceChallenge) {
      if (maintenanceBudgetRemaining < action.cost) return false;
    }

    const result = performMaintenance(equipment, action, state.elapsedTime);
    if (!result.success) return false;

    const newStepperStates = state.stepperStates.map((ss, i) => {
      const newStamina = Math.max(0, ss.currentStamina - action.staminaCost / (state.stepperStates.length || 1));
      return { ...ss, currentStamina: newStamina };
    });

    set((s) => ({
      equipment: result.state,
      maintenanceBudgetRemaining: maintenanceChallenge
        ? Math.max(0, maintenanceBudgetRemaining - action.cost)
        : maintenanceBudgetRemaining,
      state: {
        ...s.state,
        stepperStates: newStepperStates,
        totalStaminaUsed: s.state.totalStaminaUsed + action.staminaCost,
      },
    }));

    return true;
  },

  updateEquipmentOnStrike: (strikeCount, intensity) => {
    const current = get();
    const { equipment, state } = current;

    if (equipment.maintenanceStrategy === 'withoutMaintenance') {
      const updated = updateEquipmentWear(equipment, strikeCount, intensity, 0);
      set({ equipment: updated });
    } else {
      const updated = updateEquipmentWear(equipment, strikeCount, intensity * 0.8, 0);
      set({ equipment: updated });
    }
  },

  recordEquipmentPoint: () => {
    const current = get();
    const { equipment, state, equipmentHistory } = current;

    if (state.elapsedTime <= 0) return;

    const partsData: any = {};
    (Object.keys(equipment.parts) as EquipmentPartId[]).forEach((id) => {
      const part = equipment.parts[id];
      partsData[id] = {
        wear: part.wear,
        looseness: part.looseness,
        efficiency: part.efficiencyFactor,
      };
    });

    const point: EquipmentEfficiencyPoint = {
      time: Math.round(state.elapsedTime * 10) / 10,
      overallEfficiency: equipment.overallEfficiency,
      parts: partsData,
      maintenanceCost: equipment.totalMaintenanceCost,
      maintenanceCount: equipment.maintenanceHistory.length,
    };

    set({
      equipmentHistory: [...equipmentHistory, point],
    });
  },

  setMaintenanceChallenge: (challenge) => {
    const current = get();
    if (current.state.isRunning) return;

    set({
      maintenanceChallenge: challenge,
      maintenanceBudgetRemaining: challenge?.budgetLimit || 0,
      equipment: getDefaultEquipmentState('withMaintenance'),
      equipmentHistory: [],
    });
  },

  resetEquipment: () => {
    const current = get();
    set({
      equipment: getDefaultEquipmentState(current.equipment.maintenanceStrategy),
      equipmentHistory: [],
      maintenanceBudgetRemaining: current.maintenanceChallenge?.budgetLimit || 0,
    });
  },
}));
