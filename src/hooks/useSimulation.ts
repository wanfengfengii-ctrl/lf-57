import { useCallback, useEffect, useRef } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { useMatterEngine, StrikeData } from './useMatterEngine';
import {
  calculateEffectiveRate,
  calculateYieldPerHour,
  calculateStaminaEfficiency,
} from '../utils/physics';
import type {
  ParticipantCount,
  CooperationStrategy,
  StepperConfig,
} from '../types';

export function useSimulation(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const {
    params,
    state,
    mode,
    currentChallenge,
    challengeTimeRemaining,
    challengeStaminaRemaining,
    setParams,
    resetParams,
    start,
    pause,
    resume,
    reset,
    setMode,
    setChallenge,
    updateSimulationState,
    recordEfficiencyPoint,
    addStrike,
    saveCurrentRecord,
    tick,
    getValidationErrors,
    setParticipantCount,
    setCooperationStrategy,
    updateStepper,
    setTotalStaminaBudget,
  } = useSimulationStore();

  const lastRecordTimeRef = useRef<number>(0);

  const handleStrike = useCallback(
    (data: StrikeData) => {
      addStrike(
        data.isEffective,
        data.huskRate,
        data.contributingSteppers,
        data.perStepperDelta
      );
    },
    [addStrike]
  );

  const handleHeightUpdate = useCallback(
    (currentHeight: number, maxHeight: number) => {
      updateSimulationState({
        currentHeight,
        maxHeight: Math.max(state.maxHeight, maxHeight),
      });
    },
    [state.maxHeight, updateSimulationState]
  );

  const handlePhysicsTick = useCallback(
    (deltaTime: number, perStepperForce: number[]) => {
      if (!state.isRunning || state.isPaused) return;

      tick(deltaTime);

      const now = state.elapsedTime + deltaTime;
      if (now - lastRecordTimeRef.current >= 1) {
        recordEfficiencyPoint();
        lastRecordTimeRef.current = now;
      }
    },
    [state.isRunning, state.isPaused, state.elapsedTime, tick, recordEfficiencyPoint]
  );

  const { reset: resetEngine, rebuildScene, canvasWidth, canvasHeight } = useMatterEngine({
    canvasRef,
    params,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    stepperStates: state.stepperStates,
    onStrike: handleStrike,
    onHeightUpdate: handleHeightUpdate,
    onPhysicsTick: handlePhysicsTick,
  });

  useEffect(() => {
    if (!state.isRunning) {
      resetEngine();
    }
  }, [params, state.isRunning, resetEngine]);

  const handleStart = useCallback(() => {
    const errors = getValidationErrors();
    if (Object.keys(errors).length > 0) return;

    rebuildScene();
    lastRecordTimeRef.current = 0;
    start();
  }, [getValidationErrors, rebuildScene, start]);

  const handleReset = useCallback(() => {
    reset();
    resetEngine();
    lastRecordTimeRef.current = 0;
  }, [reset, resetEngine]);

  const effectiveRate = calculateEffectiveRate(state.totalStrikes, state.effectiveStrikes);
  const yieldPerHour = calculateYieldPerHour(state.accumulatedYield, state.elapsedTime);
  const staminaEfficiency = calculateStaminaEfficiency(
    state.accumulatedYield,
    state.totalStaminaUsed
  );

  const handleSetParticipantCount = useCallback(
    (count: ParticipantCount) => {
      setParticipantCount(count);
      setTimeout(() => {
        rebuildScene();
      }, 0);
    },
    [setParticipantCount, rebuildScene]
  );

  const handleSetCooperationStrategy = useCallback(
    (strategy: CooperationStrategy) => {
      setCooperationStrategy(strategy);
      setTimeout(() => {
        rebuildScene();
      }, 0);
    },
    [setCooperationStrategy, rebuildScene]
  );

  const handleUpdateStepper = useCallback(
    (id: number, updates: Partial<StepperConfig>) => {
      updateStepper(id, updates);
    },
    [updateStepper]
  );

  return {
    params,
    state,
    mode,
    currentChallenge,
    challengeTimeRemaining,
    challengeStaminaRemaining,
    effectiveRate,
    yieldPerHour,
    staminaEfficiency,
    canvasWidth,
    canvasHeight,
    setParams,
    resetParams,
    start: handleStart,
    pause,
    resume,
    reset: handleReset,
    setMode,
    setChallenge,
    saveCurrentRecord,
    getValidationErrors,
    setParticipantCount: handleSetParticipantCount,
    setCooperationStrategy: handleSetCooperationStrategy,
    updateStepper: handleUpdateStepper,
    setTotalStaminaBudget,
  };
}
