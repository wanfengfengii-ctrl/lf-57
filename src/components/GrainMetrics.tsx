import { Card, Group, Text, Stack, Box, Divider, Progress, Badge } from '@mantine/core';
import { Package, ShieldCheck, AlertTriangle, BatteryCharging, TrendingUp, Target } from 'lucide-react';
import type { GrainType, ProcessingGoal, SimulationState } from '../types';
import { GRAIN_CONFIGS, GOAL_CONFIGS, calculateYieldPerHour } from '../utils/physics';

interface GrainMetricsProps {
  state: SimulationState;
  grainType: GrainType;
  processingGoal: ProcessingGoal;
  elapsedTime: number;
}

export function GrainMetrics({
  state,
  grainType,
  processingGoal,
  elapsedTime,
}: GrainMetricsProps) {
  const grain = GRAIN_CONFIGS[grainType];
  const goal = GOAL_CONFIGS[processingGoal];

  const riceYieldPerHour = calculateYieldPerHour(state.riceYield, elapsedTime);

  const getGoalTarget = () => {
    switch (processingGoal) {
      case 'highYield':
        return { label: '目标产量', value: riceYieldPerHour, target: 80, unit: 'kg/h' };
      case 'lowBreakage':
        return { label: '完整率目标', value: state.currentIntegrityRate, target: 95, unit: '%' };
      case 'energySaving':
        return { label: '单位体力收益', value: state.staminaYieldRatio, target: 50, unit: 'g/千点' };
      default:
        return { label: '综合评分', value: (state.currentIntegrityRate + Math.min(100, riceYieldPerHour)) / 2, target: 80, unit: '分' };
    }
  };

  const goalTarget = getGoalTarget();
  const goalProgress = Math.min(100, (goalTarget.value / Math.max(1, goalTarget.target)) * 100);
  const goalProgressColor = goalProgress >= 90 ? 'bamboo' : goalProgress >= 60 ? 'wood' : 'terracotta';

  const metricCards = [
    {
      icon: Package,
      label: '成米产量',
      value: state.riceYield.toFixed(2),
      unit: 'kg',
      subValue: `${riceYieldPerHour.toFixed(1)} kg/h`,
      color: '#8B5A2B',
      bgColor: '#F5E6CC',
      progress: Math.min(100, (state.riceYield / (grain.baseRiceYieldRate * 50)) * 100),
      progressColor: 'wood',
    },
    {
      icon: ShieldCheck,
      label: '完整率',
      value: state.currentIntegrityRate.toFixed(1),
      unit: '%',
      subValue: `完整 ${state.totalIntact.toFixed(2)}kg`,
      color: '#2E8B57',
      bgColor: '#D4EFDF',
      progress: state.currentIntegrityRate,
      progressColor: state.currentIntegrityRate >= 90 ? 'bamboo' : state.currentIntegrityRate >= 75 ? 'wood' : 'terracotta',
    },
    {
      icon: AlertTriangle,
      label: '破损率',
      value: state.currentBreakageRate.toFixed(1),
      unit: '%',
      subValue: `破损 ${state.totalBroken.toFixed(2)}kg`,
      color: '#CD5C5C',
      bgColor: '#FFE4D6',
      progress: Math.min(100, state.currentBreakageRate * 5),
      progressColor: state.currentBreakageRate <= 5 ? 'bamboo' : state.currentBreakageRate <= 10 ? 'wood' : 'terracotta',
      inverse: true,
    },
    {
      icon: BatteryCharging,
      label: '单位体力收益',
      value: state.staminaYieldRatio.toFixed(1),
      unit: 'g/千点',
      subValue: `产出/投入比`,
      color: '#4169E1',
      bgColor: '#E6EEFA',
      progress: Math.min(100, state.staminaYieldRatio * 2),
      progressColor: state.staminaYieldRatio >= 40 ? 'bamboo' : state.staminaYieldRatio >= 20 ? 'wood' : 'terracotta',
    },
  ];

  return (
    <Card padding="lg" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <TrendingUp size={18} color="#8B5A2B" />
            <Text size="lg" fw={600} c="wood.7">
              📈 加工指标面板
            </Text>
          </Group>
          <Group gap="xs">
            <Badge color="wood" variant="light" size="sm">
              {grain.emoji} {grain.name}
            </Badge>
            <Badge color="bamboo" variant="light" size="sm">
              {goal.icon} {goal.name}
            </Badge>
          </Group>
        </Group>

        <Divider c="wood.2" />

        <Box
          p="md"
          style={{
            backgroundColor: '#FAF6E8',
            borderRadius: '8px',
            border: '1px solid #D4B88C',
          }}
        >
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <Target size={16} color={goalProgress >= 80 ? '#2E8B57' : '#8B5A2B'} />
              <Text size="sm" fw={500} c="wood.8">
                {goalTarget.label}达成度
              </Text>
            </Group>
            <Group gap="xs">
              <Text size="sm" fw={700} c={goalProgressColor === 'bamboo' ? 'bamboo.7' : goalProgressColor === 'wood' ? 'wood.7' : 'terracotta.7'}>
                {goalTarget.value.toFixed(1)}{goalTarget.unit}
              </Text>
              <Text size="xs" c="wood.5">
                / 目标 {goalTarget.target}{goalTarget.unit}
              </Text>
            </Group>
          </Group>
          <Progress
            value={goalProgress}
            color={goalProgressColor}
            size="lg"
            radius="md"
            striped
            animated
          />
          <Group justify="space-between" mt="xs">
            <Badge size="xs" color={goalProgressColor} variant="light">
              {goalProgress.toFixed(0)}% 达成
            </Badge>
            <Text size="xs" c="wood.5">
              {goal.description}
            </Text>
          </Group>
        </Box>

        <Group grow>
          {metricCards.map((card, index) => (
            <Box
              key={index}
              p="sm"
              style={{
                backgroundColor: card.bgColor,
                borderRadius: '8px',
                border: `1px solid ${card.color}33`,
              }}
            >
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <card.icon size={14} color={card.color} />
                  <Text size="xs" fw={500} c="wood.7">
                    {card.label}
                  </Text>
                </Group>
              </Group>
              <Group align="flex-end" mb="xs" gap={2}>
                <Text size="xl" fw={700} c={card.color}>
                  {card.value}
                </Text>
                <Text size="xs" c="wood.5" pb={4}>
                  {card.unit}
                </Text>
              </Group>
              <Progress
                value={card.progress}
                color={card.progressColor}
                size="xs"
                radius="sm"
              />
              <Text size="xs" c="wood.5" mt="xs">
                {card.subValue}
              </Text>
            </Box>
          ))}
        </Group>

        <Divider c="wood.2" />

        <Box>
          <Text size="sm" fw={500} c="wood.7" mb="xs">
            📊 加工效率分析
          </Text>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="xs" c="wood.6">
                理论最大成米量
              </Text>
              <Text size="xs" fw={600} c="wood.8">
                {(state.accumulatedYield * grain.baseRiceYieldRate * goal.yieldMultiplier).toFixed(2)} kg
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="wood.6">
                实际成米转化率
              </Text>
              <Text
                size="xs"
                fw={600}
                c={state.accumulatedYield > 0 && (state.riceYield / (state.accumulatedYield * grain.baseRiceYieldRate * goal.yieldMultiplier)) * 100 >= 80 ? 'bamboo.7' : 'wood.7'}
              >
                {state.accumulatedYield > 0
                  ? ((state.riceYield / (state.accumulatedYield * grain.baseRiceYieldRate * goal.yieldMultiplier)) * 100).toFixed(1)
                  : 0}%
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="wood.6">
                冲击高度匹配度
              </Text>
              <Text
                size="xs"
                fw={600}
                c={state.maxHeight >= grain.optimalImpactMin && state.maxHeight <= grain.optimalImpactMax ? 'bamboo.7' : 'terracotta.7'}
              >
                {state.maxHeight >= grain.optimalImpactMin && state.maxHeight <= grain.optimalImpactMax
                  ? '✓ 最佳区间'
                  : state.maxHeight < grain.optimalImpactMin
                    ? `⚠ 偏低 (需≥${grain.optimalImpactMin.toFixed(2)}m)`
                    : `⚠ 偏高 (需≤${grain.optimalImpactMax.toFixed(2)}m)`}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="wood.6">
                冲击高度/最佳范围
              </Text>
              <Text size="xs" fw={600} c="wood.8">
                {state.maxHeight.toFixed(2)}m / [{grain.optimalImpactMin.toFixed(2)}-{grain.optimalImpactMax.toFixed(2)}]m
              </Text>
            </Group>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}
