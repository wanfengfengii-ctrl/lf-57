import { useCallback, useEffect, useRef } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { useMatterEngine } from './useMatterEngine';
import { calculateEffectiveRate, calculateYieldPerHour } from '../utils/physics';

export function useSimulation(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const {
    params,
    state,
    mode,
    currentChallenge,
    challengeTimeRemaining,
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
  } = useSimulationStore();

  const lastRecordTimeRef = useRef<number>(0);

  const handleStrike = useCallback(
    (isEffective: boolean, huskRate: number) => {
      addStrike(isEffective, huskRate);
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
    (deltaTime: number) => {
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

  return {
    params,
    state,
    mode,
    currentChallenge,
    challengeTimeRemaining,
    effectiveRate,
    yieldPerHour,
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
  };
}
