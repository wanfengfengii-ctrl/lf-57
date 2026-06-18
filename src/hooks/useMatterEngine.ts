import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import type { SimulationParams, StepperState } from '../types';
import {
  DEFAULT_PHYSICS_CONFIG,
  generateStepForce,
  generateCompositeForce,
  isEffectiveStrike,
  calculateImpactEnergy,
  calculateHuskRemovalRate,
  getLeverageMultiplier,
  updateStepperStamina,
  GRAIN_CONFIGS,
} from '../utils/physics';

export interface StrikeData {
  isEffective: boolean;
  huskRate: number;
  contributingSteppers: number[];
  perStepperDelta: {
    id: number;
    steps: number;
    stamina: number;
  }[];
  impactVelocity: number;
  dropHeight: number;
}

interface UseMatterEngineOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  params: SimulationParams;
  isRunning: boolean;
  isPaused: boolean;
  stepperStates: StepperState[];
  onStrike: (data: StrikeData) => void;
  onHeightUpdate: (currentHeight: number, maxHeight: number) => void;
  onPhysicsTick: (deltaTime: number, perStepperForce: number[]) => void;
}

interface MatterObjects {
  pedal: Matter.Body;
  pivot: Matter.Body;
  pestle: Matter.Body;
  connectingRod: Matter.Body;
  mortar: Matter.Body;
  ground: Matter.Body;
  leftSupport: Matter.Body;
  rightSupport: Matter.Body;
  pivotConstraint: Matter.Constraint;
  rodToPedalConstraint: Matter.Constraint;
  rodToPestleConstraint: Matter.Constraint;
  pestleGuideTop: Matter.Body;
  pestleGuideBottom: Matter.Body;
  stepperIndicators: Matter.Body[];
}

const SCALE = DEFAULT_PHYSICS_CONFIG.SCALE;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const GROUND_Y = CANVAS_HEIGHT - 80;
const PESTLE_REST_Y = GROUND_Y - 40;
const PIVOT_Y = GROUND_Y - 60;

export function useMatterEngine(options: UseMatterEngineOptions) {
  const {
    canvasRef,
    params,
    isRunning,
    isPaused,
    stepperStates,
    onStrike,
    onHeightUpdate,
    onPhysicsTick,
  } = options;

  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const objectsRef = useRef<MatterObjects | null>(null);
  const lastStrikeTimeRef = useRef<number>(0);
  const strikeCooldownRef = useRef<boolean>(false);
  const maxHeightRef = useRef<number>(0);
  const lastPestleYRef = useRef<number>(PESTLE_REST_Y);
  const strikeCountRef = useRef<number>(0);
  const simulationTimeRef = useRef<number>(0);
  const paramsRef = useRef<SimulationParams>(params);
  const isRunningRef = useRef<boolean>(isRunning);
  const isPausedRef = useRef<boolean>(isPaused);
  const stepperStatesRef = useRef<StepperState[]>(stepperStates);
  const stepperStepCountRef = useRef<number[]>([]);
  const stepperForceAccumRef = useRef<number[]>([]);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    isRunningRef.current = isRunning;
    isPausedRef.current = isPaused;
  }, [isRunning, isPaused]);

  useEffect(() => {
    stepperStatesRef.current = stepperStates;
  }, [stepperStates]);

  const createObjects = useCallback(
    (engine: Matter.Engine, currentParams: SimulationParams): MatterObjects => {
      const { Bodies, Constraint, Composite } = Matter;

      const pivotX = CANVAS_WIDTH * 0.35;
      const pedalHalfLength = (currentParams.pedalLength * SCALE) / 2;
      const leverage = getLeverageMultiplier(
        currentParams.pedalLength,
        currentParams.pivotPosition
      );

      const ground = Bodies.rectangle(
        CANVAS_WIDTH / 2,
        GROUND_Y + 40,
        CANVAS_WIDTH,
        80,
        {
          isStatic: true,
          render: { fillStyle: '#8B7355' },
          label: 'ground',
        }
      );

      const leftSupport = Bodies.rectangle(
        pivotX - 20,
        GROUND_Y - 30,
        15,
        60,
        {
          isStatic: true,
          render: { fillStyle: '#A0522D' },
          label: 'leftSupport',
        }
      );

      const rightSupport = Bodies.rectangle(
        pivotX + 20,
        GROUND_Y - 30,
        15,
        60,
        {
          isStatic: true,
          render: { fillStyle: '#A0522D' },
          label: 'rightSupport',
        }
      );

      const pivot = Bodies.circle(pivotX, PIVOT_Y, 8, {
        isStatic: true,
        render: { fillStyle: '#4A4A4A' },
        label: 'pivot',
      });

      const pedal = Bodies.rectangle(pivotX, PIVOT_Y, pedalHalfLength * 2, 12, {
        density: 0.001,
        friction: 0.8,
        render: { fillStyle: '#DEB887' },
        label: 'pedal',
        chamfer: { radius: 3 },
      });

      const pestleX = pivotX + leverage * 150 + 50;
      const pestle = Bodies.rectangle(pestleX, PESTLE_REST_Y, 40, 80, {
        density: 0.008,
        friction: 0.5,
        render: { fillStyle: '#696969' },
        label: 'pestle',
        chamfer: { radius: 8 },
      });

      const pestleHead = Bodies.circle(pestleX, PESTLE_REST_Y + 35, 25, {
        density: 0.01,
        friction: 0.3,
        render: { fillStyle: '#4A4A4A' },
        label: 'pestleHead',
      });

      const pestleCompound = Matter.Body.create({
        parts: [pestle, pestleHead],
        label: 'pestle',
      });

      const rodLength = Math.max(
        100,
        PESTLE_REST_Y - PIVOT_Y - 20
      );
      const rodStartX = pivotX + (currentParams.pedalLength - currentParams.pivotPosition) * SCALE * 0.8;
      const rodEndX = pestleX;

      const connectingRod = Bodies.rectangle(
        (rodStartX + rodEndX) / 2,
        (PIVOT_Y + PESTLE_REST_Y) / 2,
        8,
        rodLength,
        {
          density: 0.0005,
          render: { fillStyle: '#CD853F' },
          label: 'connectingRod',
        }
      );

      const mortar = Bodies.rectangle(pestleX, GROUND_Y - 15, 80, 50, {
        isStatic: true,
        render: { fillStyle: '#8B4513' },
        label: 'mortar',
      });

      const pestleGuideTop = Bodies.rectangle(pestleX, PESTLE_REST_Y - 100, 60, 10, {
        isStatic: true,
        isSensor: true,
        render: { visible: false },
        label: 'pestleGuideTop',
      });

      const pestleGuideBottom = Bodies.rectangle(pestleX, PESTLE_REST_Y + 20, 60, 10, {
        isStatic: true,
        isSensor: true,
        render: { visible: false },
        label: 'pestleGuideBottom',
      });

      const stepperIndicators: Matter.Body[] = [];
      const stepperCount = currentParams.multiPerson?.participantCount || 1;
      for (let i = 0; i < stepperCount; i++) {
        const stepperColor = currentParams.multiPerson?.steppers[i]?.color || '#8B5A2B';
        const indicatorX = pivotX - pedalHalfLength + (pedalHalfLength / stepperCount) * i + 15;
        const indicator = Bodies.circle(indicatorX, PIVOT_Y - 30, 6, {
          isStatic: true,
          isSensor: true,
          render: { fillStyle: stepperColor },
          label: `stepper_${i}`,
        });
        stepperIndicators.push(indicator);
      }

      const pivotConstraint = Constraint.create({
        bodyA: pedal,
        pointA: {
          x: (currentParams.pivotPosition - currentParams.pedalLength / 2) * SCALE,
          y: 0,
        },
        bodyB: pivot,
        stiffness: 0.98,
        length: 0,
        render: { visible: false },
      });

      const rodToPedalConstraint = Constraint.create({
        bodyA: pedal,
        pointA: {
          x: (currentParams.pedalLength / 2 - currentParams.pivotPosition) * SCALE * 0.9,
          y: 0,
        },
        bodyB: connectingRod,
        pointB: { x: 0, y: -rodLength / 2 + 10 },
        stiffness: 0.95,
        length: 0,
        render: { visible: false },
      });

      const rodToPestleConstraint = Constraint.create({
        bodyA: connectingRod,
        pointB: { x: 0, y: rodLength / 2 - 10 },
        bodyB: pestleCompound,
        pointA: { x: 0, y: -40 },
        stiffness: 0.95,
        length: 0,
        render: { visible: false },
      });

      const allBodies = [
        ground,
        leftSupport,
        rightSupport,
        pivot,
        pedal,
        pestleCompound,
        connectingRod,
        mortar,
        pestleGuideTop,
        pestleGuideBottom,
        ...stepperIndicators,
      ];

      const allConstraints = [
        pivotConstraint,
        rodToPedalConstraint,
        rodToPestleConstraint,
      ];

      Composite.add(engine.world, allBodies);
      Composite.add(engine.world, allConstraints);

      return {
        pedal,
        pivot,
        pestle: pestleCompound,
        connectingRod,
        mortar,
        ground,
        leftSupport,
        rightSupport,
        pivotConstraint,
        rodToPedalConstraint,
        rodToPestleConstraint,
        pestleGuideTop,
        pestleGuideBottom,
        stepperIndicators,
      };
    },
    []
  );

  const rebuildScene = useCallback(() => {
    if (!engineRef.current) return;

    Matter.Composite.clear(engineRef.current.world, false);

    objectsRef.current = createObjects(engineRef.current, paramsRef.current);
    maxHeightRef.current = 0;
    lastPestleYRef.current = PESTLE_REST_Y;
    strikeCountRef.current = 0;
    simulationTimeRef.current = 0;

    const stepperCount = paramsRef.current.multiPerson?.participantCount || 1;
    stepperStepCountRef.current = new Array(stepperCount).fill(0);
    stepperForceAccumRef.current = new Array(stepperCount).fill(0);
  }, [createObjects]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const { Engine, Render, Runner, Events } = Matter;

    const engine = Engine.create({
      gravity: { x: 0, y: 1, scale: 0.001 },
      enableSleeping: false,
    });
    engineRef.current = engine;

    const render = Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        wireframes: false,
        background: '#FDF5E6',
        showAngleIndicator: false,
        pixelRatio: window.devicePixelRatio || 1,
      },
    });
    renderRef.current = render;

    const runner = Runner.create({
      delta: 1000 / 60,
      isFixed: true,
    });
    runnerRef.current = runner;

    objectsRef.current = createObjects(engine, params);

    Events.on(engine, 'beforeUpdate', () => {
      if (!isRunningRef.current || isPausedRef.current) return;
      if (!objectsRef.current) return;

      const { pedal } = objectsRef.current;
      const currentParams = paramsRef.current;
      const mp = currentParams.multiPerson;
      const currentStepperStates = stepperStatesRef.current;

      simulationTimeRef.current += 1 / 60;

      let totalForce = 0;
      let perStepperForce: number[] = [];

      if (mp && mp.steppers.length > 0) {
        const composite = generateCompositeForce(
          simulationTimeRef.current,
          mp.steppers,
          currentStepperStates
        );
        totalForce = composite.totalForce;
        perStepperForce = composite.perStepperForce;

        perStepperForce.forEach((f, i) => {
          stepperForceAccumRef.current[i] = (stepperForceAccumRef.current[i] || 0) + f;
          if (f > DEFAULT_PHYSICS_CONFIG.MAX_STEP_FORCE * 0.1) {
            stepperStepCountRef.current[i] = (stepperStepCountRef.current[i] || 0) + 1 / 60;
          }
        });
      } else {
        totalForce = generateStepForce(
          simulationTimeRef.current,
          currentParams.stepFrequency
        );
        perStepperForce = [totalForce];
      }

      const forceX = 0;
      const forceY = -totalForce / 10000;

      const pedalLeftX =
        -currentParams.pedalLength * SCALE / 2 + currentParams.pivotPosition * SCALE * 0.1;

      Matter.Body.applyForce(pedal, { x: pedalLeftX, y: 0 }, { x: forceX, y: forceY });
    });

    Events.on(engine, 'afterUpdate', () => {
      if (!objectsRef.current) return;

      const { pestle, stepperIndicators } = objectsRef.current;
      const currentHeight = Math.max(0, (PESTLE_REST_Y - pestle.position.y) / SCALE);

      if (currentHeight > maxHeightRef.current) {
        maxHeightRef.current = currentHeight;
      }

      onHeightUpdate(currentHeight, maxHeightRef.current);

      const currentParams = paramsRef.current;
      const mp = currentParams.multiPerson;
      let currentActive: boolean[] = [];
      if (mp && mp.steppers.length > 0) {
        const composite = generateCompositeForce(
          simulationTimeRef.current,
          mp.steppers,
          stepperStatesRef.current
        );
        currentActive = mp.steppers.map((s, i) => composite.activeSteppers.includes(s.id));
      }

      stepperIndicators.forEach((indicator, i) => {
        if (currentActive[i]) {
          Matter.Body.setPosition(indicator, {
            x: indicator.position.x,
            y: PIVOT_Y - 45,
          });
        } else {
          Matter.Body.setPosition(indicator, {
            x: indicator.position.x,
            y: PIVOT_Y - 30,
          });
        }
      });

      const wasAbove = lastPestleYRef.current < PESTLE_REST_Y - 5;
      const isNowBelow = pestle.position.y >= PESTLE_REST_Y - 5;
      const isMovingDown = pestle.velocity.y > 0.5;

      if (wasAbove && isNowBelow && isMovingDown && !strikeCooldownRef.current) {
        const impactVelocity = Math.abs(pestle.velocity.y);
        const dropHeight = maxHeightRef.current;

        const effective = isEffectiveStrike(impactVelocity, dropHeight);
        const impactEnergy = calculateImpactEnergy(impactVelocity);
        const participantCount = mp?.participantCount || 1;
        const grainType = paramsRef.current.grainType || 'rice';
        const processingGoal = paramsRef.current.processingGoal || 'balanced';
        const huskRate = calculateHuskRemovalRate(
          impactEnergy,
          paramsRef.current.grainWeight,
          strikeCountRef.current + 1,
          participantCount,
          grainType,
          processingGoal,
          dropHeight
        );

        const contributingSteppers: number[] = [];
        const perStepperDelta: { id: number; steps: number; stamina: number }[] = [];

        if (mp && mp.steppers.length > 0) {
          const composite = generateCompositeForce(
            simulationTimeRef.current,
            mp.steppers,
            stepperStatesRef.current
          );
          contributingSteppers.push(...composite.activeSteppers);

          mp.steppers.forEach((stepper, i) => {
            const currentState = stepperStatesRef.current[i] || {
              id: stepper.id,
              currentStamina: 100,
              maxStamina: 100,
              totalSteps: 0,
              effectiveContributions: 0,
              staminaHistory: [],
            };
            const updatedState = updateStepperStamina(
              stepper,
              currentState,
              1 / 60,
              composite.perStepperForce[i] || 0,
              true,
              effective
            );

            const stepsDelta = Math.floor(stepperStepCountRef.current[i] || 0);
            stepperStepCountRef.current[i] = 0;

            perStepperDelta.push({
              id: stepper.id,
              steps: stepsDelta,
              stamina: updatedState.currentStamina,
            });
          });
        } else {
          perStepperDelta.push({
            id: 0,
            steps: 1,
            stamina: 100,
          });
          contributingSteppers.push(0);
        }

        strikeCountRef.current++;
        onStrike({
          isEffective: effective,
          huskRate,
          contributingSteppers,
          perStepperDelta,
          impactVelocity,
          dropHeight,
        });

        strikeCooldownRef.current = true;
        setTimeout(() => {
          strikeCooldownRef.current = false;
        }, 200);

        maxHeightRef.current = 0;
      }

      lastPestleYRef.current = pestle.position.y;

      const mp2 = paramsRef.current.multiPerson;
      let perStepperForceTick: number[] = [];
      if (mp2 && mp2.steppers.length > 0) {
        perStepperForceTick = mp2.steppers.map((s, i) => stepperForceAccumRef.current[i] || 0);
        stepperForceAccumRef.current = new Array(mp2.steppers.length).fill(0);
      }

      onPhysicsTick(1 / 60, perStepperForceTick);
    });

    Render.run(render);
    Runner.run(runner, engine);

    return () => {
      Events.off(engine, 'beforeUpdate');
      Events.off(engine, 'afterUpdate');
      Render.stop(render);
      Runner.stop(runner);
      Matter.Composite.clear(engine.world, false);
      Engine.clear(engine);
      const ctx = render.canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, render.canvas.width, render.canvas.height);
      }
    };
  }, [canvasRef, createObjects, onStrike, onHeightUpdate, onPhysicsTick]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      simulationTimeRef.current = 0;
      maxHeightRef.current = 0;
      strikeCountRef.current = 0;

      const stepperCount = paramsRef.current.multiPerson?.participantCount || 1;
      stepperStepCountRef.current = new Array(stepperCount).fill(0);
      stepperForceAccumRef.current = new Array(stepperCount).fill(0);
    }
  }, [isRunning]);

  const reset = useCallback(() => {
    rebuildScene();
    simulationTimeRef.current = 0;
    maxHeightRef.current = 0;
    lastPestleYRef.current = PESTLE_REST_Y;
    strikeCountRef.current = 0;
  }, [rebuildScene]);

  return {
    reset,
    rebuildScene,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
  };
}
