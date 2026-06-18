import { Card, Slider, Group, Text, Badge, Stack, Box, Divider, SegmentedControl } from '@mantine/core';
import { Droplets, Wheat, Wrench, Mountain, Sun, CloudRain, Flame, Wind } from 'lucide-react';
import type { EnvironmentParams, EnvironmentPresetId, EnvironmentModifiers, SimulationParams } from '../types';
import { ENVIRONMENT_PRESETS, calculateEnvironmentModifiers, calculateTheoreticalMaxHeight, DEFAULT_PHYSICS_CONFIG } from '../utils/physics';

interface EnvironmentPanelProps {
  environment: EnvironmentParams;
  params: SimulationParams;
  onEnvironmentChange: (env: Partial<EnvironmentParams>) => void;
  onPresetChange: (presetId: EnvironmentPresetId) => void;
  disabled?: boolean;
}

const presetIcons: Record<EnvironmentPresetId, React.ReactNode> = {
  sunny: <Sun size={14} />,
  postRain: <CloudRain size={14} />,
  highIntensity: <Flame size={14} />,
  dusty: <Wind size={14} />,
  custom: <Wrench size={14} />,
};

export function EnvironmentPanel({
  environment,
  params,
  onEnvironmentChange,
  onPresetChange,
  disabled,
}: EnvironmentPanelProps) {
  const mods = calculateEnvironmentModifiers(environment);
  const theoreticalHeight = calculateTheoreticalMaxHeight(params);
  const envAdjustedHeight = theoreticalHeight * mods.impactHeightMultiplier;

  const envConfig = [
    {
      key: 'humidity' as const,
      label: '环境湿度',
      unit: '%',
      icon: Droplets,
      description: '高湿度使踏板湿滑、谷物潮湿，降低脱壳效率并增加体力消耗',
      value: environment.humidity,
      range: { min: 0, max: 100, step: 5 },
      color: '#4169E1',
    },
    {
      key: 'grainMoisture' as const,
      label: '谷物含水率',
      unit: '%',
      icon: Wheat,
      description: '含水率高的谷物外壳韧性增加，脱壳更困难且易破损',
      value: environment.grainMoisture,
      range: { min: 5, max: 30, step: 1 },
      color: '#DAA520',
    },
    {
      key: 'pedalWear' as const,
      label: '踏板磨损程度',
      unit: '%',
      icon: Wrench,
      description: '磨损的踏板力传导效率降低，踩踏者需要更大力量',
      value: environment.pedalWear,
      range: { min: 0, max: 100, step: 5 },
      color: '#CD5C5C',
    },
    {
      key: 'groundStability' as const,
      label: '地面稳定性',
      unit: '%',
      icon: Mountain,
      description: '松软的地面会吸收冲击力，降低有效冲击高度和脱壳效率',
      value: environment.groundStability,
      range: { min: 10, max: 100, step: 5 },
      color: '#2E8B57',
    },
  ];

  const formatMod = (val: number, inverse?: boolean) => {
    const pct = ((val - 1) * 100).toFixed(0);
    if (inverse) {
      return Number(pct) > 0
        ? { text: `+${pct}%`, color: '#CD5C5C' }
        : Number(pct) < 0
        ? { text: `${pct}%`, color: '#2E8B57' }
        : { text: '0%', color: '#8B5A2B' };
    }
    return Number(pct) > 0
      ? { text: `+${pct}%`, color: '#2E8B57' }
      : Number(pct) < 0
      ? { text: `${pct}%`, color: '#CD5C5C' }
      : { text: '0%', color: '#8B5A2B' };
  };

  const impactMod = formatMod(mods.impactHeightMultiplier);
  const hullingMod = formatMod(mods.hullingEfficiencyMultiplier);
  const breakageMod = formatMod(mods.breakageRateMultiplier, true);
  const staminaMod = formatMod(mods.staminaConsumptionMultiplier, true);

  return (
    <Card padding="lg" radius="md" h="100%">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600} c="wood.7">
            🌍 环境与作业条件
          </Text>
          <Badge
            color={environment.presetId === 'custom' ? 'wood' : 'bamboo'}
            variant="light"
            size="sm"
          >
            {ENVIRONMENT_PRESETS[environment.presetId]?.icon} {ENVIRONMENT_PRESETS[environment.presetId]?.name}
          </Badge>
        </Group>

        <Divider c="wood.2" />

        <Box>
          <Text size="xs" fw={500} c="wood.7" mb="xs">
            预设场景
          </Text>
          <SegmentedControl
            value={environment.presetId}
            onChange={(val) => onPresetChange(val as EnvironmentPresetId)}
            data={Object.values(ENVIRONMENT_PRESETS)
              .filter((p) => p.id !== 'custom')
              .map((p) => ({
                label: `${p.icon} ${p.name}`,
                value: p.id,
              }))}
            disabled={disabled}
            color="wood"
            size="xs"
            fullWidth
          />
          <Text size="xs" c="wood.5" mt="xs">
            {ENVIRONMENT_PRESETS[environment.presetId]?.description}
          </Text>
        </Box>

        <Divider c="wood.2" />

        {envConfig.map((config) => {
          const Icon = config.icon;
          return (
            <Box key={config.key}>
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <Icon size={16} color={config.color} />
                  <Text size="sm" fw={500} c="wood.8">
                    {config.label}
                  </Text>
                </Group>
                <Text size="sm" fw={600} c={config.color}>
                  {config.value}{config.unit}
                </Text>
              </Group>

              <Slider
                value={config.value}
                onChange={(value) => onEnvironmentChange({ [config.key]: value })}
                min={config.range.min}
                max={config.range.max}
                step={config.range.step}
                disabled={disabled}
                color="wood"
                size="md"
              />

              <Text size="xs" c="wood.5" mt="xs">
                {config.description}
              </Text>
            </Box>
          );
        })}

        <Divider c="wood.2" />

        <Box>
          <Text size="sm" fw={500} c="wood.7" mb="xs">
            📊 环境影响分析
          </Text>
          <Stack gap="xs">
            <Box
              p="xs"
              style={{
                backgroundColor: '#F5E6CC',
                borderRadius: '6px',
              }}
            >
              <Group justify="space-between">
                <Group gap="xs">
                  <Mountain size={14} color="#8B5A2B" />
                  <Text size="xs" fw={500} c="wood.7">
                    冲击高度
                  </Text>
                </Group>
                <Group gap="xs">
                  <Text size="xs" c="wood.5">
                    {theoreticalHeight.toFixed(2)}m →
                  </Text>
                  <Text size="xs" fw={600} c={envAdjustedHeight >= DEFAULT_PHYSICS_CONFIG.MIN_EFFECTIVE_HEIGHT ? 'bamboo.7' : 'terracotta.7'}>
                    {envAdjustedHeight.toFixed(2)}m
                  </Text>
                  <Badge size="xs" color={impactMod.color === '#2E8B57' ? 'bamboo' : impactMod.color === '#CD5C5C' ? 'terracotta' : 'wood'} variant="light">
                    {impactMod.text}
                  </Badge>
                </Group>
              </Group>
            </Box>

            <Box
              p="xs"
              style={{
                backgroundColor: '#D4EFDF',
                borderRadius: '6px',
              }}
            >
              <Group justify="space-between">
                <Group gap="xs">
                  <Wheat size={14} color="#2E8B57" />
                  <Text size="xs" fw={500} c="wood.7">
                    脱壳效率
                  </Text>
                </Group>
                <Badge size="xs" color={hullingMod.color === '#2E8B57' ? 'bamboo' : hullingMod.color === '#CD5C5C' ? 'terracotta' : 'wood'} variant="light">
                  {hullingMod.text}
                </Badge>
              </Group>
            </Box>

            <Box
              p="xs"
              style={{
                backgroundColor: '#FFE4D6',
                borderRadius: '6px',
              }}
            >
              <Group justify="space-between">
                <Group gap="xs">
                  <Droplets size={14} color="#CD5C5C" />
                  <Text size="xs" fw={500} c="wood.7">
                    破损率
                  </Text>
                </Group>
                <Badge size="xs" color={breakageMod.color === '#2E8B57' ? 'bamboo' : breakageMod.color === '#CD5C5C' ? 'terracotta' : 'wood'} variant="light">
                  {breakageMod.text}
                </Badge>
              </Group>
            </Box>

            <Box
              p="xs"
              style={{
                backgroundColor: '#E6EEFA',
                borderRadius: '6px',
              }}
            >
              <Group justify="space-between">
                <Group gap="xs">
                  <Flame size={14} color="#4169E1" />
                  <Text size="xs" fw={500} c="wood.7">
                    体力消耗
                  </Text>
                </Group>
                <Badge size="xs" color={staminaMod.color === '#2E8B57' ? 'bamboo' : staminaMod.color === '#CD5C5C' ? 'terracotta' : 'wood'} variant="light">
                  {staminaMod.text}
                </Badge>
              </Group>
            </Box>
          </Stack>
        </Box>

        <Box
          p="sm"
          style={{
            backgroundColor: '#FAF6E8',
            borderRadius: '6px',
            border: '1px solid #D4B88C',
          }}
        >
          <Text size="xs" fw={500} c="wood.7" mb="xs">
            🌡️ 环境综合评估
          </Text>
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="wood.6">
              综合环境系数
            </Text>
            <Text
              size="sm"
              fw={600}
              c={
                mods.impactHeightMultiplier >= 0.85 &&
                mods.hullingEfficiencyMultiplier >= 0.85 &&
                mods.breakageRateMultiplier <= 1.15 &&
                mods.staminaConsumptionMultiplier <= 1.15
                  ? 'bamboo.7'
                  : mods.impactHeightMultiplier >= 0.6 &&
                    mods.hullingEfficiencyMultiplier >= 0.6
                  ? 'wood.7'
                  : 'terracotta.7'
              }
            >
              {(
                (mods.impactHeightMultiplier +
                  mods.hullingEfficiencyMultiplier +
                  (2 - mods.breakageRateMultiplier) +
                  (2 - mods.staminaConsumptionMultiplier)) /
                4
              ).toFixed(2)}
            </Text>
          </Group>
          <Box
            h={8}
            style={{
              backgroundColor: '#E8D4A8',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <Box
              h="100%"
              style={{
                backgroundColor:
                  mods.impactHeightMultiplier >= 0.85 &&
                  mods.hullingEfficiencyMultiplier >= 0.85
                    ? '#2E8B57'
                    : mods.impactHeightMultiplier >= 0.6
                    ? '#DAA520'
                    : '#CD5C5C',
                width: `${Math.min(
                  100,
                  ((mods.impactHeightMultiplier +
                    mods.hullingEfficiencyMultiplier +
                    (2 - mods.breakageRateMultiplier) +
                    (2 - mods.staminaConsumptionMultiplier)) /
                    4) *
                    100
                )}%`,
                transition: 'width 0.3s',
              }}
            />
          </Box>
          <Text size="xs" c="wood.5" mt="xs">
            {mods.impactHeightMultiplier >= 0.85 &&
            mods.hullingEfficiencyMultiplier >= 0.85 &&
            mods.breakageRateMultiplier <= 1.15 &&
            mods.staminaConsumptionMultiplier <= 1.15
              ? '✓ 当前环境条件良好，作业效率较高'
              : mods.impactHeightMultiplier >= 0.6 &&
                mods.hullingEfficiencyMultiplier >= 0.6
              ? '⚠ 环境条件一般，部分指标受到影响'
              : '✗ 环境条件恶劣，建议调整作业参数'}
          </Text>
        </Box>
      </Stack>
    </Card>
  );
}
