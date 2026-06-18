import { create } from 'zustand';
import type {
  SimulationParams,
  SimulationState,
  SimulationMode,
  ExperimentRecord,
  EfficiencyPoint,
  ChallengeConfig,
} from '../types';
import { getDefaultParams, validateParams } from '../utils/validation';
import {
  calculateEffectiveRate,
  calculateYieldPerHour,
  estimateYield,
} from '../utils/physics';
import {
  addRecord,
  deleteRecord,
  loadRecords,
  generateRecordId,
} from '../utils/storage';

interface SimulationStore {
  params: SimulationParams;
  state: SimulationState;
  mode: SimulationMode;
  currentChallenge: ChallengeConfig | null;
  records: ExperimentRecord[];
  challengeTimeRemaining: number;

  setParams: (params: Partial<SimulationParams>) => void;
  resetParams: () => void;

  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;

  setMode: (mode: SimulationMode) => void;
  setChallenge: (challenge: ChallengeConfig | null) => void;

  updateSimulationState: (updates: Partial<SimulationState>) => void;
  recordEfficiencyPoint: () => void;
  addStrike: (isEffective: boolean, huskRate: number) => void;

  saveCurrentRecord: () => void;
  removeRecord: (id: string) => void;
  loadRecord: (id: string) => void;
  loadAllRecords: () => void;
  clearRecords: () => void;

  tick: (deltaTime: number) => void;
  getValidationErrors: () => Record<string, string>;
}

const getInitialState = (): SimulationState => ({
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
});

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  params: getDefaultParams(),
  state: getInitialState(),
  mode: 'free',
  currentChallenge: null,
  records: [],
  challengeTimeRemaining: 0,

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
        state: getInitialState(),
      });
    }
  },

  resetParams: () => {
    set({
      params: getDefaultParams(),
      state: getInitialState(),
    });
  },

  start: () => {
    const { currentChallenge } = get();
    const validation = validateParams(get().params);

    if (!validation.valid) return;

    set((state) => ({
      state: {
        ...getInitialState(),
        isRunning: true,
        isPaused: false,
      },
      challengeTimeRemaining: currentChallenge?.timeLimit || 0,
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
    const { currentChallenge } = get();
    set({
      state: getInitialState(),
      challengeTimeRemaining: currentChallenge?.timeLimit || 0,
    });
  },

  setMode: (mode) => {
    set({
      mode,
      state: getInitialState(),
      currentChallenge: null,
      challengeTimeRemaining: 0,
    });
  },

  setChallenge: (challenge) => {
    set({
      currentChallenge: challenge,
      challengeTimeRemaining: challenge?.timeLimit || 0,
      state: getInitialState(),
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

  recordEfficiencyPoint: () => {
    const { state, params } = get();
    const { elapsedTime, totalStrikes, effectiveStrikes, accumulatedYield } = state;

    if (elapsedTime <= 0) return;

    const point: EfficiencyPoint = {
      time: Math.round(elapsedTime * 10) / 10,
      effectiveRate: calculateEffectiveRate(totalStrikes, effectiveStrikes),
      yieldPerHour: calculateYieldPerHour(accumulatedYield, elapsedTime),
      totalStrikes,
      effectiveStrikes,
    };

    set((state) => ({
      state: {
        ...state.state,
        efficiencyHistory: [...state.state.efficiencyHistory, point],
      },
    }));
  },

  addStrike: (isEffective: boolean, huskRate: number) => {
    const { state, params } = get();

    const newTotal = state.totalStrikes + 1;
    const newEffective = state.effectiveStrikes + (isEffective ? 1 : 0);
    const newHuskRate = isEffective
      ? (state.currentHuskRate * state.effectiveStrikes + huskRate) / newEffective
      : state.currentHuskRate;

    const newYield = estimateYield(newEffective, params.grainWeight, newHuskRate);

    set((state) => ({
      state: {
        ...state.state,
        totalStrikes: newTotal,
        effectiveStrikes: newEffective,
        accumulatedYield: newYield,
        currentHuskRate: newHuskRate,
      },
    }));
  },

  saveCurrentRecord: () => {
    const { state, params, mode, currentChallenge, records } = get();

    if (state.elapsedTime < 1) return;

    const record: ExperimentRecord = {
      id: generateRecordId(),
      timestamp: Date.now(),
      params: { ...params },
      mode,
      duration: state.elapsedTime,
      totalStrikes: state.totalStrikes,
      effectiveStrikes: state.effectiveStrikes,
      finalYield: state.accumulatedYield,
      avgEfficiency: state.effectiveStrikes > 0
        ? state.accumulatedYield / state.elapsedTime
        : 0,
      maxHeight: state.maxHeight,
      challengeId: currentChallenge?.id,
      challengeSuccess: currentChallenge
        ? state.accumulatedYield >= currentChallenge.targetYield
        : undefined,
      efficiencyHistory: [...state.efficiencyHistory],
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
      const avgHuskRate = record.effectiveStrikes > 0
        ? (record.finalYield / (record.effectiveStrikes * record.params.grainWeight * 0.1 * 0.7))
        : 0;

      set({
        params: { ...record.params },
        state: {
          ...getInitialState(),
          elapsedTime: record.duration,
          totalStrikes: record.totalStrikes,
          effectiveStrikes: record.effectiveStrikes,
          accumulatedYield: record.finalYield,
          maxHeight: record.maxHeight,
          currentHuskRate: Math.max(0, Math.min(1, avgHuskRate)),
          efficiencyHistory: record.efficiencyHistory ? [...record.efficiencyHistory] : [],
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
    const { state, mode, currentChallenge, challengeTimeRemaining } = get();

    if (!state.isRunning || state.isPaused) return;

    const newElapsed = state.elapsedTime + deltaTime;
    let newTimeRemaining = challengeTimeRemaining - deltaTime;
    let shouldStop = false;

    if (mode === 'challenge' && currentChallenge) {
      if (newTimeRemaining <= 0) {
        newTimeRemaining = 0;
        shouldStop = true;
      }
      if (state.accumulatedYield >= currentChallenge.targetYield) {
        shouldStop = true;
      }
    }

    set((state) => ({
      state: {
        ...state.state,
        elapsedTime: newElapsed,
        isRunning: shouldStop ? false : state.state.isRunning,
      },
      challengeTimeRemaining: newTimeRemaining,
    }));
  },

  getValidationErrors: () => {
    const result = validateParams(get().params);
    return result.errors;
  },
}));
