import type { SimulationParams, ValidationResult } from '../types';

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

export function getDefaultParams(): SimulationParams {
  const ranges = getParamRanges();
  return {
    pedalLength: ranges.pedalLength.default,
    pivotPosition: ranges.pivotPosition.default,
    stepFrequency: ranges.stepFrequency.default,
    grainWeight: ranges.grainWeight.default,
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
