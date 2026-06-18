import { Card, Group, Text, Stack, Box, Badge, Tooltip, Divider } from '@mantine/core';
import { Info } from 'lucide-react';
import type { GrainType, ProcessingGoal } from '../types';
import { GRAIN_CONFIGS, GOAL_CONFIGS } from '../utils/physics';

interface GrainSelectorProps {
  grainType: GrainType;
  processingGoal: ProcessingGoal;
  onGrainChange: (grain: GrainType) => void;
  onGoalChange: (goal: ProcessingGoal) => void;
  disabled?: boolean;
}

export function GrainSelector({
  grainType,
  processingGoal,
  onGrainChange,
  onGoalChange,
  disabled,
}: GrainSelectorProps) {
  const grainList = Object.values(GRAIN_CONFIGS);
  const goalList = Object.values(GOAL_CONFIGS);

  const currentGrain = GRAIN_CONFIGS[grainType];
  const currentGoal = GOAL_CONFIGS[processingGoal];

  return (
    <Card padding="lg" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600} c="wood.7">
            🌾 谷物品种与加工目标
          </Text>
        </Group>

        <Divider c="wood.2" />

        <Box>
          <Group justify="space-between" mb="sm">
            <Text size="sm" fw={500} c="wood.8">
              谷物品种
            </Text>
            <Badge color="wood" variant="light" size="sm">
              {currentGrain.emoji} {currentGrain.name}
            </Badge>
          </Group>

          <Group gap="xs" wrap="wrap">
            {grainList.map((grain) => {
              const isSelected = grain.id === grainType;
              return (
                <Tooltip
                  key={grain.id}
                  label={
                    <Stack gap={4} p="xs" style={{ maxWidth: 220 }}>
                      <Text size="xs" fw={600}>
                        {grain.emoji} {grain.name}
                      </Text>
                      <Text size="xs">{grain.description}</Text>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="xs" c="wood.5">
                          脱壳难度:
                        </Text>
                        <Text size="xs" fw={500}>
                          {grain.shellingDifficulty.toFixed(1)}x
                        </Text>
                      </Group>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="xs" c="wood.5">
                          最佳冲击:
                        </Text>
                        <Text size="xs" fw={500}>
                          {grain.optimalImpactMin.toFixed(2)}-{grain.optimalImpactMax.toFixed(2)}m
                        </Text>
                      </Group>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="xs" c="wood.5">
                          成米率:
                        </Text>
                        <Text size="xs" fw={500}>
                          {(grain.baseRiceYieldRate * 100).toFixed(0)}%
                        </Text>
                      </Group>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="xs" c="wood.5">
                          基础破损率:
                        </Text>
                        <Text size="xs" fw={500}>
                          {(grain.baseBreakageRate * 100).toFixed(1)}%
                        </Text>
                      </Group>
                    </Stack>
                  }
                  position="top"
                  withArrow
                >
                  <button
                    onClick={() => !disabled && onGrainChange(grain.id)}
                    disabled={disabled}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: isSelected ? '#8B5A2B' : '#FBF5E6',
                      color: isSelected ? 'white' : '#8B5A2B',
                      border: `2px solid ${isSelected ? '#8B5A2B' : '#D4B88C'}`,
                      borderRadius: '8px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      opacity: disabled ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{grain.emoji}</span>
                    <span>{grain.name}</span>
                  </button>
                </Tooltip>
              );
            })}
          </Group>

          <Box
            mt="sm"
            p="xs"
            style={{
              backgroundColor: '#F5E6CC',
              borderRadius: '6px',
              borderLeft: '3px solid #8B5A2B',
            }}
          >
            <Group gap="xs" wrap="wrap">
              <Group gap="xs">
                <Text size="xs" c="wood.6">
                  脱壳难度:
                </Text>
                <Badge size="xs" color={currentGrain.shellingDifficulty > 1.3 ? 'terracotta' : currentGrain.shellingDifficulty > 1 ? 'wood' : 'bamboo'}>
                  {currentGrain.shellingDifficulty.toFixed(1)}x
                </Badge>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="wood.6">
                  最佳冲击:
                </Text>
                <Badge size="xs" color="bamboo" variant="light">
                  {currentGrain.optimalImpactMin.toFixed(2)}-{currentGrain.optimalImpactMax.toFixed(2)}m
                </Badge>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="wood.6">
                  成米率:
                </Text>
                <Badge size="xs" color="wood">
                  {(currentGrain.baseRiceYieldRate * 100).toFixed(0)}%
                </Badge>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="wood.6">
                  破损率:
                </Text>
                <Badge size="xs" color={currentGrain.baseBreakageRate > 0.08 ? 'terracotta' : 'wood'} variant="light">
                  {(currentGrain.baseBreakageRate * 100).toFixed(1)}%
                </Badge>
              </Group>
            </Group>
          </Box>
        </Box>

        <Divider c="wood.2" />

        <Box>
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <Text size="sm" fw={500} c="wood.8">
                加工目标
              </Text>
              <Tooltip
                label="选择加工目标将调整各项指标的权重，达成不同的加工效果"
                position="top"
                withArrow
              >
                <Info size={14} color="#A67C52" style={{ cursor: 'help' }} />
              </Tooltip>
            </Group>
            <Badge color="bamboo" variant="light" size="sm">
              {currentGoal.icon} {currentGoal.name}
            </Badge>
          </Group>

          <Group gap="xs" wrap="wrap">
            {goalList.map((goal) => {
              const isSelected = goal.id === processingGoal;
              return (
                <Tooltip
                  key={goal.id}
                  label={
                    <Stack gap={4} p="xs" style={{ maxWidth: 200 }}>
                      <Text size="xs" fw={600}>
                        {goal.icon} {goal.name}
                      </Text>
                      <Text size="xs">{goal.description}</Text>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="xs" c="wood.5">
                          产量系数:
                        </Text>
                        <Text size="xs" fw={500} c={goal.yieldMultiplier > 1 ? 'bamboo' : 'wood'}>
                          {goal.yieldMultiplier.toFixed(2)}x
                        </Text>
                      </Group>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="xs" c="wood.5">
                          破损系数:
                        </Text>
                        <Text size="xs" fw={500} c={goal.breakageMultiplier < 1 ? 'bamboo' : 'terracotta'}>
                          {goal.breakageMultiplier.toFixed(2)}x
                        </Text>
                      </Group>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="xs" c="wood.5">
                          节能系数:
                        </Text>
                        <Text size="xs" fw={500} c={goal.energyMultiplier < 1 ? 'bamboo' : 'wood'}>
                          {goal.energyMultiplier.toFixed(2)}x
                        </Text>
                      </Group>
                    </Stack>
                  }
                  position="top"
                  withArrow
                >
                  <button
                    onClick={() => !disabled && onGoalChange(goal.id)}
                    disabled={disabled}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: isSelected ? '#2E8B57' : '#F0F9F4',
                      color: isSelected ? 'white' : '#2E8B57',
                      border: `2px solid ${isSelected ? '#2E8B57' : '#A8D5BA'}`,
                      borderRadius: '8px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      opacity: disabled ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{goal.icon}</span>
                    <span>{goal.name}</span>
                  </button>
                </Tooltip>
              );
            })}
          </Group>

          <Box
            mt="sm"
            p="xs"
            style={{
              backgroundColor: '#F0F9F4',
              borderRadius: '6px',
              borderLeft: '3px solid #2E8B57',
            }}
          >
            <Group gap="xs" wrap="wrap">
              <Group gap="xs">
                <Text size="xs" c="wood.6">
                  产量:
                </Text>
                <Badge
                  size="xs"
                  color={currentGoal.yieldMultiplier > 1 ? 'bamboo' : 'wood'}
                  variant={currentGoal.yieldMultiplier > 1 ? 'filled' : 'light'}
                >
                  {currentGoal.yieldMultiplier > 1 ? '+' : ''}{((currentGoal.yieldMultiplier - 1) * 100).toFixed(0)}%
                </Badge>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="wood.6">
                  破损:
                </Text>
                <Badge
                  size="xs"
                  color={currentGoal.breakageMultiplier < 1 ? 'bamboo' : 'terracotta'}
                  variant={currentGoal.breakageMultiplier >= 1 ? 'filled' : 'light'}
                >
                  {currentGoal.breakageMultiplier < 1 ? '-' : '+'}{Math.abs((currentGoal.breakageMultiplier - 1) * 100).toFixed(0)}%
                </Badge>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="wood.6">
                  能耗:
                </Text>
                <Badge
                  size="xs"
                  color={currentGoal.energyMultiplier < 1 ? 'bamboo' : 'wood'}
                  variant={currentGoal.energyMultiplier >= 1 ? 'light' : 'filled'}
                >
                  {currentGoal.energyMultiplier < 1 ? '-' : '+'}{Math.abs((currentGoal.energyMultiplier - 1) * 100).toFixed(0)}%
                </Badge>
              </Group>
            </Group>
            <Text size="xs" c="wood.5" mt="xs">
              {currentGoal.description}
            </Text>
          </Box>
        </Box>
      </Stack>
    </Card>
  );
}
