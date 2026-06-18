import type {
  SimulationParams,
  ValidationResult,
  StepperConfig,
  ParticipantCount,
  CooperationStrategy,
  MultiPersonParams,
} from '../types';

const STEPPER_COLORS = ['#8B5A2B', '#2E8B57', '#4169E1'];
const STEPPER_NAMES = ['一号', '二号', '三号'];

export function validateParams(params: SimulationParams): ValidationResult {
  const errors: Record<string, string> = {};

  if (params.pedalLength <= 0) {
    errors.pedalLength = '踏板长度必须大于0';
  } else if (params.pedalLength > 5) {
    errors.pedalLength = '踏板长度不能超过5米';
  }

  if (params.stepFrequency <= 0) {
    errors.stepFrequency = '踩踏频率必须大于0';
  } else if (params.stepFrequency > 5) {
    errors.stepFrequency = '踩踏频率不能超过5次/秒';
  }

  if (params.grainWeight <= 0) {
    errors.grainWeight = '谷物重量必须大于0';
  } else if (params.grainWeight > 50) {
    errors.grainWeight = '谷物重量不能超过50公斤';
  }

  if (params.pivotPosition <= 0) {
    errors.pivotPosition = '支点位置必须大于0';
  } else if (params.pivotPosition >= params.pedalLength) {
    errors.pivotPosition = `支点位置必须小于踏板长度(${params.pedalLength.toFixed(2)}m)`;
  }

  if (params.multiPerson) {
    const mpErrors = validateMultiPersonParams(params.multiPerson);
    Object.assign(errors, mpErrors.errors);
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateMultiPersonParams(
  mp: MultiPersonParams
): ValidationResult {
  const errors: Record<string, string> = {};

  if (mp.participantCount < 1 || mp.participantCount > 3) {
    errors.participantCount = '参与人数必须在1-3人';
  }

  if (mp.steppers.length !== mp.participantCount) {
    errors.stepperCount = `踩踏者配置数量(${mp.steppers.length})与参与人数(${mp.participantCount})不匹配`;
  }

  mp.steppers.forEach((stepper, index) => {
    if (stepper.stepFrequency <= 0) {
      errors[`stepper_${index}_freq`] = `${stepper.name}的踩踏频率必须大于0`;
    } else if (stepper.stepFrequency > 5) {
      errors[`stepper_${index}_freq`] = `${stepper.name}的踩踏频率不能超过5次/秒`;
    }
    if (stepper.forceMultiplier <= 0) {
      errors[`stepper_${index}_force`] = `${stepper.name}的力度系数必须大于0`;
    } else if (stepper.forceMultiplier > 2) {
      errors[`stepper_${index}_force`] = `${stepper.name}的力度系数不能超过2.0`;
    }
  });

  if (mp.totalStaminaBudget <= 0) {
    errors.totalStaminaBudget = '体力预算必须大于0';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getParamRanges() {
  return {
    pedalLength: { min: 0.5, max: 5, step: 0.1, default: 2 },
    pivotPosition: { min: 0.1, max: 4.9, step: 0.05, default: 0.8 },
    stepFrequency: { min: 0.2, max: 5, step: 0.1, default: 1.5 },
    grainWeight: { min: 1, max: 50, step: 0.5, default: 10 },
  };
}

export function getStepperParamRanges() {
  return {
    stepFrequency: { min: 0.2, max: 5, step: 0.1, default: 1.5 },
    forceMultiplier: { min: 0.3, max: 2, step: 0.05, default: 1.0 },
    staminaUsageRate: { min: 0.5, max: 5, step: 0.1, default: 1.5 },
  };
}

export function getDefaultStepperConfig(id: number, participantCount: ParticipantCount): StepperConfig {
  const ranges = getStepperParamRanges();
  const strategyPhaseOffsets: Record<ParticipantCount, number[]> = {
    1: [0],
    2: [0, 0.5],
    3: [0, 0.33, 0.67],
  };
  return {
    id,
    name: STEPPER_NAMES[id],
    stepFrequency: ranges.stepFrequency.default,
    forceMultiplier: ranges.forceMultiplier.default,
    phaseOffset: strategyPhaseOffsets[participantCount][id],
    color: STEPPER_COLORS[id],
    staminaUsageRate: ranges.staminaUsageRate.default,
  };
}

export function getDefaultMultiPersonParams(
  participantCount: ParticipantCount = 1,
  strategy: CooperationStrategy = 'alternating'
): MultiPersonParams {
  const steppers: StepperConfig[] = [];
  for (let i = 0; i < participantCount; i++) {
    steppers.push(getDefaultStepperConfig(i, participantCount));
  }
  applyStrategyPhaseOffsets(steppers, strategy);

  return {
    participantCount,
    steppers,
    cooperationStrategy: strategy,
    totalStaminaBudget: 100 * participantCount,
  };
}

export function applyStrategyPhaseOffsets(
  steppers: StepperConfig[], strategy: CooperationStrategy): void {
  const count = steppers.length as ParticipantCount;
  switch (strategy) {
    case 'synchronized':
      steppers.forEach((s) => {
        s.phaseOffset = 0;
      });
      break;
    case 'alternating':
      if (count === 2) {
        steppers[0].phaseOffset = 0;
        steppers[1].phaseOffset = 0.5;
      } else if (count === 3) {
        steppers[0].phaseOffset = 0;
        steppers[1].phaseOffset = 0.33;
        steppers[2].phaseOffset = 0.67;
      }
      break;
    case 'independent':
      for (let i = 0; i < count; i++) {
        steppers[i].phaseOffset = (i * 0.1);
      }
      break;
    case 'wave':
      if (count === 2) {
        steppers[0].phaseOffset = 0;
        steppers[1].phaseOffset = 0.25;
      } else if (count === 3) {
        steppers[0].phaseOffset = 0;
        steppers[1].phaseOffset = 0.2;
        steppers[2].phaseOffset = 0.4;
      }
      break;
  }
}

export function getStrategyDescription(strategy: CooperationStrategy): string {
  const descriptions: Record<CooperationStrategy, string> = {
    synchronized: '同步踩踏：所有人同时发力，冲击力最大',
    alternating: '交替踩踏：错开节奏，保持连续输出',
    independent: '独立节奏：每人各自节奏，自由度最高',
    wave: '波浪踩踏：依次发力，形成连续波浪',
  };
  return descriptions[strategy];
}

export function getStrategyName(strategy: CooperationStrategy): string {
  const names: Record<CooperationStrategy, string> = {
    synchronized: '同步',
    alternating: '交替',
    independent: '独立',
    wave: '波浪',
  };
  return names[strategy];
}

export function getDefaultParams(): SimulationParams {
  const ranges = getParamRanges();
  return {
    pedalLength: ranges.pedalLength.default,
    pivotPosition: ranges.pivotPosition.default,
    stepFrequency: ranges.stepFrequency.default,
    grainWeight: ranges.grainWeight.default,
    multiPerson: getDefaultMultiPersonParams(1, 'alternating'),
  };
}

export function clampParam(
  value: number,
  paramName: keyof SimulationParams
): number {
  const ranges = getParamRanges();
  const range = ranges[paramName];
  return Math.max(range.min, Math.min(range.max, value));
}
