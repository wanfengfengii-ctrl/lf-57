import { Card, Slider, Group, Text, Badge, Stack, Box, Divider } from '@mantine/core';
import { Ruler, Gauge, Footprints, Package } from 'lucide-react';
import type { SimulationParams } from '../types';
import { getParamRanges } from '../utils/validation';
import { getLeverageMultiplier, calculateTheoreticalMaxHeight, DEFAULT_PHYSICS_CONFIG } from '../utils/physics';

interface ControlPanelProps {
  params: SimulationParams;
  onChange: (params: Partial<SimulationParams>) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

export function ControlPanel({ params, onChange, errors, disabled }: ControlPanelProps) {
  const ranges = getParamRanges();
  const leverage = getLeverageMultiplier(params.pedalLength, params.pivotPosition);
  const theoreticalHeight = calculateTheoreticalMaxHeight(params);
  const isHeightSufficient = theoreticalHeight >= DEFAULT_PHYSICS_CONFIG.MIN_EFFECTIVE_HEIGHT;

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
      label: '踩踏频率',
      unit: '次/秒',
      icon: Footprints,
      description: '每秒踩踏次数，过高可能导致冲击高度不足',
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
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}
