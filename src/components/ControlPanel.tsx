import { Card, Slider, Group, Text, Badge, Stack, Box, Divider, SegmentedControl, Accordion } from '@mantine/core';
import { Ruler, Gauge, Footprints, Package, Users, Zap, Heart } from 'lucide-react';
import type { SimulationParams, ParticipantCount, CooperationStrategy, StepperConfig, StepperState } from '../types';
import { getParamRanges, getStepperParamRanges, getStrategyDescription, getStrategyName } from '../utils/validation';
import { getLeverageMultiplier, calculateTheoreticalMaxHeight, DEFAULT_PHYSICS_CONFIG, calculateStaminaEfficiency } from '../utils/physics';

interface ControlPanelProps {
  params: SimulationParams;
  stepperStates: StepperState[];
  onChange: (params: Partial<SimulationParams>) => void;
  onParticipantCountChange: (count: ParticipantCount) => void;
  onStrategyChange: (strategy: CooperationStrategy) => void;
  onStepperChange: (id: number, updates: Partial<StepperConfig>) => void;
  onStaminaBudgetChange: (budget: number) => void;
  totalStaminaUsed: number;
  errors: Record<string, string>;
  disabled?: boolean;
}

export function ControlPanel({
  params,
  stepperStates,
  onChange,
  onParticipantCountChange,
  onStrategyChange,
  onStepperChange,
  onStaminaBudgetChange,
  totalStaminaUsed,
  errors,
  disabled,
}: ControlPanelProps) {
  const ranges = getParamRanges();
  const stepperRanges = getStepperParamRanges();
  const leverage = getLeverageMultiplier(params.pedalLength, params.pivotPosition);
  const theoreticalHeight = calculateTheoreticalMaxHeight(params);
  const isHeightSufficient = theoreticalHeight >= DEFAULT_PHYSICS_CONFIG.MIN_EFFECTIVE_HEIGHT;
  const mp = params.multiPerson;
  const participantCount = mp?.participantCount || 1;
  const cooperationStrategy = mp?.cooperationStrategy || 'alternating';
  const totalBudget = mp?.totalStaminaBudget || 100;
  const budgetRemaining = Math.max(0, totalBudget - totalStaminaUsed);
  const staminaEfficiency = calculateStaminaEfficiency(
    1,
    Math.max(1, totalStaminaUsed)
  );

  const paramConfig = [
    {
      key: 'pedalLength' as const,
      label: '踏板长度',
      unit: '米',
      icon: Ruler,
      description: '踏板总长度，越长可能提供更大的杠杆作用',
      value: params.pedalLength,
      range: ranges.pedalLength,
    },
    {
      key: 'pivotPosition' as const,
      label: '支点位置',
      unit: '米',
      icon: Gauge,
      description: `距离踏板左端 ${params.pivotPosition.toFixed(2)}m，杠杆比 ${leverage.toFixed(2)}:1`,
      value: params.pivotPosition,
      range: {
        ...ranges.pivotPosition,
        max: params.pedalLength - 0.05,
      },
    },
    {
      key: 'stepFrequency' as const,
      label: '踩踏频率(单人)',
      unit: '次/秒',
      icon: Footprints,
      description: '单人模式下的踩踏频率，多人模式下每人单独设置',
      value: params.stepFrequency,
      range: ranges.stepFrequency,
    },
    {
      key: 'grainWeight' as const,
      label: '谷物重量',
      unit: '公斤',
      icon: Package,
      description: '谷臼中谷物总重量，影响每次舂击的处理量',
      value: params.grainWeight,
      range: ranges.grainWeight,
    },
  ];

  return (
    <Card padding="lg" radius="md" h="100%">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600} c="wood.7">
            ⚙️ 参数控制
          </Text>
          <Badge
            color={isHeightSufficient ? 'bamboo' : 'terracotta'}
            variant="light"
            size="sm"
          >
            理论冲击高度: {theoreticalHeight.toFixed(2)}m
            {isHeightSufficient ? ' ✓' : ' ✗'}
          </Badge>
        </Group>

        <Divider c="wood.2" />

        {paramConfig.map((config) => {
          const Icon = config.icon;
          const error = errors[config.key];

          return (
            <Box key={config.key}>
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <Icon size={16} color="#8B5A2B" />
                  <Text size="sm" fw={500} c="wood.8">
                    {config.label}
                  </Text>
                </Group>
                <Text size="sm" fw={600} c={error ? 'terracotta.6' : 'wood.7'}>
                  {config.value.toFixed(2)} {config.unit}
                </Text>
              </Group>

              <Slider
                value={config.value}
                onChange={(value) => onChange({ [config.key]: value })}
                min={config.range.min}
                max={config.range.max}
                step={config.range.step}
                disabled={disabled}
                color={error ? 'terracotta' : 'wood'}
                size="md"
              />

              <Text size="xs" c={error ? 'terracotta.6' : 'wood.5'} mt="xs">
                {error || config.description}
              </Text>
            </Box>
          );
        })}

        <Divider c="wood.2" />

        <Box>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <Users size={16} color="#8B5A2B" />
              <Text size="sm" fw={500} c="wood.8">
                参与人数
              </Text>
            </Group>
            <Text size="xs" c="wood.5">
              支持1-3人协同踩踏
            </Text>
          </Group>
          <SegmentedControl
            value={String(participantCount)}
            onChange={(val) => onParticipantCountChange(Number(val) as ParticipantCount)}
            data={[
              { label: '1人', value: '1' },
              { label: '2人', value: '2' },
              { label: '3人', value: '3' },
            ]}
            disabled={disabled}
            color="wood"
            size="sm"
            fullWidth
          />
        </Box>

        {participantCount > 1 && (
          <Box>
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <Zap size={16} color="#8B5A2B" />
                <Text size="sm" fw={500} c="wood.8">
                  协同策略
                </Text>
              </Group>
              <Badge color="bamboo" variant="light" size="xs">
                {getStrategyName(cooperationStrategy)}
              </Badge>
            </Group>
            <SegmentedControl
              value={cooperationStrategy}
              onChange={(val) => onStrategyChange(val as CooperationStrategy)}
              data={[
                { label: '同步', value: 'synchronized' },
                { label: '交替', value: 'alternating' },
                { label: '独立', value: 'independent' },
                { label: '波浪', value: 'wave' },
              ]}
              disabled={disabled}
              color="bamboo"
              size="sm"
              fullWidth
            />
            <Text size="xs" c="wood.5" mt="xs">
              {getStrategyDescription(cooperationStrategy)}
            </Text>
          </Box>
        )}

        {mp && mp.steppers.length > 0 && (
          <Accordion variant="separated" radius="md">
            {mp.steppers.map((stepper, index) => {
              const state = stepperStates[index];
              const staminaPct = state
                ? (state.currentStamina / state.maxStamina) * 100
                : 100;
              return (
                <Accordion.Item key={stepper.id} value={`stepper-${stepper.id}`}>
                  <Accordion.Control>
                    <Group gap="xs">
                      <Box
                        w={12}
                        h={12}
                        style={{
                          backgroundColor: stepper.color,
                          borderRadius: '50%',
                        }}
                      />
                      <Text size="sm" fw={600} c="wood.8">
                        {stepper.name}踩踏者
                      </Text>
                      {state && (
                        <Badge
                          color={staminaPct > 50 ? 'bamboo' : staminaPct > 20 ? 'wood' : 'terracotta'}
                          size="xs"
                          variant="light"
                        >
                          {Math.round(state.currentStamina)}/{Math.round(state.maxStamina)}
                        </Badge>
                      )}
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="sm">
                      <Box>
                        <Group justify="space-between" mb="xs">
                          <Group gap="xs">
                            <Footprints size={14} color={stepper.color} />
                            <Text size="xs" fw={500} c="wood.7">
                              踩踏频率
                            </Text>
                          </Group>
                          <Text size="xs" fw={600} c="wood.8">
                            {stepper.stepFrequency.toFixed(1)} 次/秒
                          </Text>
                        </Group>
                        <Slider
                          value={stepper.stepFrequency}
                          onChange={(v) => onStepperChange(stepper.id, { stepFrequency: v })}
                          min={stepperRanges.stepFrequency.min}
                          max={stepperRanges.stepFrequency.max}
                          step={stepperRanges.stepFrequency.step}
                          disabled={disabled}
                          color="wood"
                          size="sm"
                        />
                      </Box>
                      <Box>
                        <Group justify="space-between" mb="xs">
                          <Group gap="xs">
                            <Zap size={14} color={stepper.color} />
                            <Text size="xs" fw={500} c="wood.7">
                              力度系数
                            </Text>
                          </Group>
                          <Text size="xs" fw={600} c="wood.8">
                            {stepper.forceMultiplier.toFixed(2)}x
                          </Text>
                        </Group>
                        <Slider
                          value={stepper.forceMultiplier}
                          onChange={(v) => onStepperChange(stepper.id, { forceMultiplier: v })}
                          min={stepperRanges.forceMultiplier.min}
                          max={stepperRanges.forceMultiplier.max}
                          step={stepperRanges.forceMultiplier.step}
                          disabled={disabled}
                          color="wood"
                          size="sm"
                        />
                      </Box>
                      <Box>
                        <Group justify="space-between" mb="xs">
                          <Group gap="xs">
                            <Heart size={14} color={stepper.color} />
                            <Text size="xs" fw={500} c="wood.7">
                              体力消耗率
                            </Text>
                          </Group>
                          <Text size="xs" fw={600} c="wood.8">
                            {stepper.staminaUsageRate.toFixed(1)}x
                          </Text>
                        </Group>
                        <Slider
                          value={stepper.staminaUsageRate}
                          onChange={(v) => onStepperChange(stepper.id, { staminaUsageRate: v })}
                          min={stepperRanges.staminaUsageRate.min}
                          max={stepperRanges.staminaUsageRate.max}
                          step={stepperRanges.staminaUsageRate.step}
                          disabled={disabled}
                          color="wood"
                          size="sm"
                        />
                      </Box>
                      {state && (
                        <Text size="xs" c="wood.5">
                          已踩踏 {state.totalSteps} 次 | 有效贡献 {state.effectiveContributions} 次
                        </Text>
                      )}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        )}

        <Divider c="wood.2" />

        <Box>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <Heart size={16} color="#CD5C5C" />
              <Text size="sm" fw={500} c="wood.8">
                总体力预算
              </Text>
            </Group>
            <Group gap="xs">
              <Badge
                color={budgetRemaining > totalBudget * 0.3 ? 'bamboo' : 'terracotta'}
                variant="light"
              >
                {Math.round(budgetRemaining)} / {Math.round(totalBudget)}
              </Badge>
            </Group>
          </Group>
          <Slider
            value={totalBudget}
            onChange={onStaminaBudgetChange}
            min={50}
            max={1000}
            step={10}
            disabled={disabled}
            color="terracotta"
            size="md"
          />
          <Group justify="space-between" mt="xs">
            <Text size="xs" c="wood.5">
              已消耗: {totalStaminaUsed.toFixed(1)}
            </Text>
            <Text size="xs" c="wood.5">
              体力效率: {staminaEfficiency.toFixed(1)} g/千点
            </Text>
          </Group>
        </Box>

        <Divider c="wood.2" />

        <Box>
          <Text size="sm" fw={500} c="wood.7" mb="xs">
            📊 当前配置分析
          </Text>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="xs" c="wood.6">
                杠杆倍率
              </Text>
              <Text size="xs" fw={600} c="wood.8">
                {leverage.toFixed(2)}x
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="wood.6">
                理论最大高度
              </Text>
              <Text
                size="xs"
                fw={600}
                c={isHeightSufficient ? 'bamboo.6' : 'terracotta.6'}
              >
                {theoreticalHeight.toFixed(2)}m
                {theoreticalHeight < DEFAULT_PHYSICS_CONFIG.MIN_EFFECTIVE_HEIGHT && (
                  <span> (需≥{DEFAULT_PHYSICS_CONFIG.MIN_EFFECTIVE_HEIGHT}m)</span>
                )}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="wood.6">
                支点占比
              </Text>
              <Text size="xs" fw={600} c="wood.8">
                {((params.pivotPosition / params.pedalLength) * 100).toFixed(1)}%
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="wood.6">
                协同人数
              </Text>
              <Text size="xs" fw={600} c="bamboo.7">
                {participantCount}人 · {getStrategyName(cooperationStrategy)}
              </Text>
            </Group>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}
