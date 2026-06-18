import { Card, Group, Text, Stack, Box, Divider, Tabs, Badge, Progress } from '@mantine/core';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { EfficiencyPoint, SimulationState, StepperState, ExperimentRecord, GrainType, ProcessingGoal, StepperConfig, EnvironmentParams } from '../types';
import { calculateEffectiveRate, calculateStaminaEfficiency, GRAIN_CONFIGS, GOAL_CONFIGS, ENVIRONMENT_PRESETS, calculateEnvironmentModifiers } from '../utils/physics';
import { getStrategyName } from '../utils/validation';

interface StatsPanelProps {
  efficiencyHistory: EfficiencyPoint[];
  state: SimulationState;
  effectiveRate: number;
  yieldPerHour: number;
  staminaEfficiency: number;
  participantCount: number;
  cooperationStrategy: string;
  grainType: GrainType;
  processingGoal: ProcessingGoal;
  steppers: StepperConfig[];
  allRecords?: ExperimentRecord[];
  environment?: EnvironmentParams;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <Box
        p="sm"
        style={{
          backgroundColor: '#FBF5E6',
          border: '1px solid #D4B88C',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(139, 90, 43, 0.15)',
        }}
      >
        <Text size="xs" fw={600} c="wood.7" mb="xs">
          时间: {label}s
        </Text>
        {payload.map((entry: any, index: number) => (
          <Text key={index} size="xs" c={entry.color} mb="xs">
            {entry.name}: {entry.value.toFixed(2)}
            {entry.name.includes('率') ? '%' : entry.name.includes('产量') ? 'kg/h' : entry.name.includes('体力') ? '' : ''}
          </Text>
        ))}
      </Box>
    );
  }
  return null;
}

export function StatsPanel({
  efficiencyHistory,
  state,
  effectiveRate,
  yieldPerHour,
  staminaEfficiency,
  participantCount,
  cooperationStrategy,
  grainType,
  processingGoal,
  steppers,
  allRecords = [],
  environment,
}: StatsPanelProps) {
  const grain = GRAIN_CONFIGS[grainType];
  const goal = GOAL_CONFIGS[processingGoal];
  const recentData = efficiencyHistory.slice(-30);

  const strikeData = [
    { name: '总舂击', value: state.totalStrikes, color: '#8B5A2B' },
    { name: '有效冲击', value: state.effectiveStrikes, color: '#2E8B57' },
    { name: '无效冲击', value: state.totalStrikes - state.effectiveStrikes, color: '#CD5C5C' },
  ];

  const cumulativeData = efficiencyHistory.map((point) => ({
    time: point.time,
    累计产量: (point.yieldPerHour * point.time) / 3600,
    理论产量: (yieldPerHour * point.time) / 3600,
  }));

  const staminaData = efficiencyHistory.map((point) => {
    const totalBudget = state.stepperStates.reduce((sum, s) => sum + s.maxStamina, 0) || 100;
    return {
      time: point.time,
      消耗体力: point.staminaUsed || 0,
      剩余预算: Math.max(0, totalBudget - (point.staminaUsed || 0)),
    };
  });

  const perPersonStaminaData = state.stepperStates.map((ss, i) => {
    const staminaHistory = ss.staminaHistory.slice(-30);
    return {
      id: i,
      data: staminaHistory,
    };
  });

  const perPersonContribution = state.stepperStates.map((ss, i) => {
    const config = steppers[i];
    const name = config?.name || `${i + 1}号`;
    const color = config?.color || '#8B5A2B';
    const contribution = state.effectiveStrikes > 0
      ? (ss.effectiveContributions / state.effectiveStrikes) * 100
      : 0;
    return {
      name,
      贡献占比: contribution,
      体力剩余: (ss.currentStamina / ss.maxStamina) * 100,
      color,
    };
  });

  const radarData = [
    { subject: '有效率', 当前: effectiveRate, 最优: 100, fullMark: 100 },
    { subject: '产量率', 当前: Math.min(100, (yieldPerHour / 100) * 100), 最优: 100, fullMark: 100 },
    { subject: '体力效率', 当前: Math.min(100, staminaEfficiency), 最优: 100, fullMark: 100 },
    { subject: '协同效率', 当前: participantCount > 1 ? 100 - Math.max(0, (participantCount - 1) * 10) : 60, 最优: 100, fullMark: 100 },
    { subject: '持续性', 当前: state.stepperStates.length > 0
      ? (state.stepperStates.reduce((s, ss) => s + (ss.currentStamina / ss.maxStamina), 0) / state.stepperStates.length) * 100
      : 100, 最优: 100, fullMark: 100 },
  ];

  const compareRecords = allRecords.slice(0, 5).map((r) => ({
    name: `${r.participantCount}人${getStrategyName(r.cooperationStrategy as any)}`,
    有效率: r.effectiveStrikes / Math.max(1, r.totalStrikes) * 100,
    时产量: (r.finalYield / Math.max(1, r.duration)) * 3600,
    体力效率: r.staminaEfficiency,
  }));

  return (
    <Card padding="lg" radius="md" h="100%">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600} c="wood.7">
            📊 统计分析
          </Text>
          <Group gap="xs" wrap="wrap">
            <Badge color="wood" variant="light" size="sm">
              {grain.emoji} {grain.name}
            </Badge>
            <Badge color="bamboo" variant="light" size="sm">
              {goal.icon} {goal.name}
            </Badge>
            <Badge color="wood" variant="light" size="sm">
              {participantCount}人
            </Badge>
            {participantCount > 1 && (
              <Badge color="bamboo" variant="light" size="sm">
                {getStrategyName(cooperationStrategy as any)}
              </Badge>
            )}
            {state.isRunning && (
              <Text size="xs" c="bamboo.6">
                ● 实时更新中
              </Text>
            )}
            {environment && (
              <Badge color="wood" variant="light" size="sm">
                {ENVIRONMENT_PRESETS[environment.presetId]?.icon} {ENVIRONMENT_PRESETS[environment.presetId]?.name}
              </Badge>
            )}
          </Group>
        </Group>

        <Divider c="wood.2" />

        <Tabs defaultValue="efficiency" variant="pills">
          <Tabs.List grow>
            <Tabs.Tab value="efficiency" size="sm">效率曲线</Tabs.Tab>
            <Tabs.Tab value="grain" size="sm">🌾 谷物加工</Tabs.Tab>
            <Tabs.Tab value="stamina" size="sm">体力曲线</Tabs.Tab>
            <Tabs.Tab value="strikes" size="sm">冲击统计</Tabs.Tab>
            <Tabs.Tab value="yield" size="sm">产量趋势</Tabs.Tab>
            <Tabs.Tab value="compare" size="sm">对比分析</Tabs.Tab>
            <Tabs.Tab value="environment" size="sm">🌍 环境</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="efficiency" pt="md">
            <Box h={200}>
              {recentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={recentData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: '#8B5A2B' }}
                      label={{ value: '时间(s)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#A67C52' }}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10, fill: '#8B5A2B' }}
                      domain={[0, 100]}
                      label={{ value: '有效率(%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#A67C52' }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10, fill: '#8B5A2B' }}
                      label={{ value: '产量(kg/h)', angle: 90, position: 'insideRight', fontSize: 10, fill: '#A67C52' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="effectiveRate"
                      name="有效冲击率"
                      fill="#2E8B5733"
                      stroke="#2E8B57"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="yieldPerHour"
                      name="时产量"
                      stroke="#8B5A2B"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <Stack h="100%" align="center" justify="center">
                  <Text size="sm" c="wood.5">
                    启动模拟后将显示效率曲线
                  </Text>
                </Stack>
              )}
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="grain" pt="md">
            <Stack gap="md">
              <Group grow>
                <Box p="xs" style={{ backgroundColor: '#F5E6CC', borderRadius: '6px' }}>
                  <Text size="xs" c="wood.5" ta="center">
                    成米产量
                  </Text>
                  <Text size="lg" fw={700} c="wood.7" ta="center">
                    {state.riceYield.toFixed(2)}
                    <Text size="xs" span c="wood.5"> kg</Text>
                  </Text>
                </Box>
                <Box p="xs" style={{ backgroundColor: '#D4EFDF', borderRadius: '6px' }}>
                  <Text size="xs" c="wood.5" ta="center">
                    完整率
                  </Text>
                  <Text
                    size="lg"
                    fw={700}
                    c={state.currentIntegrityRate >= 90 ? 'bamboo.7' : state.currentIntegrityRate >= 75 ? 'wood.7' : 'terracotta.7'}
                    ta="center"
                  >
                    {state.currentIntegrityRate.toFixed(1)}
                    <Text size="xs" span c="wood.5"> %</Text>
                  </Text>
                </Box>
                <Box p="xs" style={{ backgroundColor: '#FFE4D6', borderRadius: '6px' }}>
                  <Text size="xs" c="wood.5" ta="center">
                    破损率
                  </Text>
                  <Text
                    size="lg"
                    fw={700}
                    c={state.currentBreakageRate <= 5 ? 'bamboo.7' : state.currentBreakageRate <= 10 ? 'wood.7' : 'terracotta.7'}
                    ta="center"
                  >
                    {state.currentBreakageRate.toFixed(1)}
                    <Text size="xs" span c="wood.5"> %</Text>
                  </Text>
                </Box>
                <Box p="xs" style={{ backgroundColor: '#E6EEFA', borderRadius: '6px' }}>
                  <Text size="xs" c="wood.5" ta="center">
                    单位体力收益
                  </Text>
                  <Text size="lg" fw={700} c="blue.7" ta="center">
                    {state.staminaYieldRatio.toFixed(1)}
                    <Text size="xs" span c="wood.5"> g/千点</Text>
                  </Text>
                </Box>
              </Group>

              <Box h={160}>
                {recentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={recentData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: '#8B5A2B' }}
                        label={{ value: '时间(s)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#A67C52' }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 10, fill: '#8B5A2B' }}
                        domain={[0, 100]}
                        label={{ value: '完整率(%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#A67C52' }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: '#8B5A2B' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="integrityRate"
                        name="完整率"
                        fill="#2E8B5733"
                        stroke="#2E8B57"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="breakageRate"
                        name="破损率(%)"
                        stroke="#CD5C5C"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="staminaYieldRatio"
                        name="体力收益"
                        stroke="#4169E1"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        strokeDasharray="5 5"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <Stack h="100%" align="center" justify="center">
                    <Text size="sm" c="wood.5">
                      启动模拟后将显示谷物加工指标曲线
                    </Text>
                  </Stack>
                )}
              </Box>

              <Box
                p="sm"
                style={{
                  backgroundColor: '#FAF6E8',
                  borderRadius: '6px',
                  border: '1px solid #D4B88C',
                }}
              >
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={500} c="wood.7">
                    🎯 加工目标达成
                  </Text>
                  <Badge
                    size="xs"
                    color={
                      processingGoal === 'highYield'
                        ? yieldPerHour >= 50
                          ? 'bamboo'
                          : 'wood'
                        : processingGoal === 'lowBreakage'
                        ? state.currentIntegrityRate >= 90
                          ? 'bamboo'
                          : 'terracotta'
                        : processingGoal === 'energySaving'
                        ? state.staminaYieldRatio >= 30
                          ? 'bamboo'
                          : 'wood'
                        : state.currentIntegrityRate >= 80 && yieldPerHour >= 30
                        ? 'bamboo'
                        : 'wood'
                    }
                  >
                    {processingGoal === 'highYield'
                      ? yieldPerHour >= 50
                        ? '✓ 达标'
                        : `${(yieldPerHour / 50 * 100).toFixed(0)}%`
                      : processingGoal === 'lowBreakage'
                      ? state.currentIntegrityRate >= 90
                        ? '✓ 达标'
                        : `${(state.currentIntegrityRate / 90 * 100).toFixed(0)}%`
                      : processingGoal === 'energySaving'
                      ? state.staminaYieldRatio >= 30
                        ? '✓ 达标'
                        : `${(state.staminaYieldRatio / 30 * 100).toFixed(0)}%`
                      : state.currentIntegrityRate >= 80 && yieldPerHour >= 30
                      ? '✓ 达标'
                      : `${((Math.min(100, state.currentIntegrityRate / 90 * 50) + Math.min(100, yieldPerHour / 50 * 50))).toFixed(0)}%`}
                  </Badge>
                </Group>
                <Progress
                  value={
                    processingGoal === 'highYield'
                      ? Math.min(100, yieldPerHour / 50 * 100)
                      : processingGoal === 'lowBreakage'
                      ? Math.min(100, state.currentIntegrityRate / 90 * 100)
                      : processingGoal === 'energySaving'
                      ? Math.min(100, state.staminaYieldRatio / 30 * 100)
                      : Math.min(100, (Math.min(100, state.currentIntegrityRate / 90 * 50) + Math.min(100, yieldPerHour / 50 * 50)))
                  }
                  color={
                    processingGoal === 'highYield'
                      ? 'wood'
                      : processingGoal === 'lowBreakage'
                      ? 'bamboo'
                      : processingGoal === 'energySaving'
                      ? 'blue'
                      : 'wood'
                  }
                  size="sm"
                  radius="md"
                />
              </Box>

              <Box>
                <Text size="xs" fw={500} c="wood.7" mb="xs">
                  冲击区间匹配
                </Text>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="wood.6">
                    实际高度: {state.maxHeight.toFixed(2)}m
                  </Text>
                  <Text size="xs" c="wood.6">
                    最佳区间: [{grain.optimalImpactMin.toFixed(2)}-{grain.optimalImpactMax.toFixed(2)}]m
                  </Text>
                </Group>
                <Box
                  h={16}
                  style={{
                    position: 'relative',
                    backgroundColor: '#E8D4A8',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    h="100%"
                    style={{
                      position: 'absolute',
                      left: `${Math.max(0, (grain.optimalImpactMin / (grain.optimalImpactMax + 0.3)) * 100)}%`,
                      width: `${((grain.optimalImpactMax - grain.optimalImpactMin) / (grain.optimalImpactMax + 0.3)) * 100}%`,
                      backgroundColor: '#2E8B5766',
                    }}
                  />
                  <Box
                    h="100%"
                    w="4px"
                    style={{
                      position: 'absolute',
                      left: `${Math.min(100, Math.max(0, (state.maxHeight / (grain.optimalImpactMax + 0.3)) * 100))}%`,
                      backgroundColor: state.maxHeight >= grain.optimalImpactMin && state.maxHeight <= grain.optimalImpactMax ? '#2E8B57' : '#CD5C5C',
                      transform: 'translateX(-2px)',
                    }}
                  />
                </Box>
                <Group justify="space-between" mt="xs">
                  <Badge size="xs" color="wood" variant="light">
                    0m
                  </Badge>
                  <Badge size="xs" color="bamboo" variant="filled">
                    最佳区间
                  </Badge>
                  <Badge size="xs" color="wood" variant="light">
                    {(grain.optimalImpactMax + 0.3).toFixed(2)}m
                  </Badge>
                </Group>
              </Box>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="stamina" pt="md">
            <Stack gap="md">
              <Box h={160}>
                {staminaData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={staminaData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: '#8B5A2B' }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#8B5A2B' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Area
                        type="monotone"
                        dataKey="消耗体力"
                        stroke="#CD5C5C"
                        fill="#CD5C5C33"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="剩余预算"
                        stroke="#2E8B57"
                        fill="#2E8B5722"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Stack h="100%" align="center" justify="center">
                    <Text size="sm" c="wood.5">
                      启动模拟后将显示体力消耗曲线
                    </Text>
                  </Stack>
                )}
              </Box>

              {state.stepperStates.length > 0 && (
                <Group grow>
                  {state.stepperStates.map((ss, i) => {
                    const pct = (ss.currentStamina / ss.maxStamina) * 100;
                    const config = steppers[i];
                    const name = config?.name || `${i + 1}号`;
                    const color = config?.color || '#8B5A2B';
                    return (
                      <Box
                        key={ss.id}
                        p="xs"
                        style={{
                          backgroundColor: `${color}15`,
                          borderRadius: '6px',
                          border: `1px solid ${color}55`,
                        }}
                      >
                        <Group justify="space-between" mb="xs">
                          <Text size="xs" fw={600} c={color}>
                            {name}
                          </Text>
                          <Text size="xs" c="wood.6">
                            {Math.round(pct)}%
                          </Text>
                        </Group>
                        <Box
                          h={6}
                          style={{
                            backgroundColor: '#E8D4A8',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            h="100%"
                            style={{
                              backgroundColor: color,
                              width: `${pct}%`,
                              transition: 'width 0.3s',
                            }}
                          />
                        </Box>
                        <Text size="xs" c="wood.5" mt="xs" ta="center">
                          {ss.totalSteps}次 · {ss.effectiveContributions}有效
                        </Text>
                      </Box>
                    );
                  })}
                </Group>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="strikes" pt="md">
            <Stack gap="md">
              <Box h={140}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strikeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#8B5A2B' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#8B5A2B' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FBF5E6',
                        border: '1px solid #D4B88C',
                        borderRadius: '6px',
                      }}
                    />
                    <Bar dataKey="value" name="次数" radius={[4, 4, 0, 0]}>
                      {strikeData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Group grow>
                <Box p="xs" style={{ backgroundColor: '#F5E6CC', borderRadius: '6px' }}>
                  <Text size="xs" c="wood.5" ta="center">
                    有效冲击率
                  </Text>
                  <Text
                    size="lg"
                    fw={700}
                    c={effectiveRate >= 80 ? 'bamboo.7' : effectiveRate >= 50 ? 'wood.7' : 'terracotta.7'}
                    ta="center"
                  >
                    {effectiveRate.toFixed(1)}%
                  </Text>
                </Box>
                <Box p="xs" style={{ backgroundColor: '#D4EFDF', borderRadius: '6px' }}>
                  <Text size="xs" c="wood.5" ta="center">
                    平均脱壳率
                  </Text>
                  <Text size="lg" fw={700} c="bamboo.7" ta="center">
                    {(state.currentHuskRate * 100).toFixed(1)}%
                  </Text>
                </Box>
                <Box p="xs" style={{ backgroundColor: '#FFE4D6', borderRadius: '6px' }}>
                  <Text size="xs" c="wood.5" ta="center">
                    最大冲击高度
                  </Text>
                  <Text size="lg" fw={700} c="wood.7" ta="center">
                    {state.maxHeight.toFixed(2)}m
                  </Text>
                </Box>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="yield" pt="md">
            <Stack gap="md">
              <Box h={160}>
                {cumulativeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: '#8B5A2B' }}
                        label={{ value: '时间(s)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#A67C52' }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#8B5A2B' }}
                        label={{ value: '产量(kg)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#A67C52' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Area
                        type="monotone"
                        dataKey="累计产量"
                        stroke="#8B5A2B"
                        fill="#8B5A2B33"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="理论产量"
                        stroke="#CD5C5C"
                        fill="#CD5C5C11"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Stack h="100%" align="center" justify="center">
                    <Text size="sm" c="wood.5">
                      启动模拟后将显示产量趋势
                    </Text>
                  </Stack>
                )}
              </Box>

              <Group grow>
                <Box p="xs" style={{ backgroundColor: '#FAF6E8', borderRadius: '6px' }}>
                  <Text size="xs" c="wood.5" ta="center">
                    当前时产量
                  </Text>
                  <Text size="lg" fw={700} c="wood.7" ta="center">
                    {yieldPerHour.toFixed(1)}
                    <Text size="xs" span c="wood.5">
                      kg/h
                    </Text>
                  </Text>
                </Box>
                <Box p="xs" style={{ backgroundColor: '#F5E6CC', borderRadius: '6px' }}>
                  <Text size="xs" c="wood.5" ta="center">
                    累计产量
                  </Text>
                  <Text size="lg" fw={700} c="wood.8" ta="center">
                    {state.accumulatedYield.toFixed(2)}
                    <Text size="xs" span c="wood.5">
                      kg
                    </Text>
                  </Text>
                </Box>
                <Box p="xs" style={{ backgroundColor: '#D4EFDF', borderRadius: '6px' }}>
                  <Text size="xs" c="wood.5" ta="center">
                    体力效率
                  </Text>
                  <Text size="lg" fw={700} c="bamboo.7" ta="center">
                    {staminaEfficiency.toFixed(1)}
                    <Text size="xs" span c="wood.5">
                      g/千点
                    </Text>
                  </Text>
                </Box>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="compare" pt="md">
            <Stack gap="md">
              <Text size="sm" fw={500} c="wood.7">
                ⚡ 综合能力雷达图
              </Text>
              <Box h={180}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E8D4A8" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#A67C52' }} />
                    <Radar name="当前配置" dataKey="当前" stroke="#8B5A2B" fill="#8B5A2B" fillOpacity={0.5} />
                    <Radar name="理论最优" dataKey="最优" stroke="#2E8B57" fill="#2E8B57" fillOpacity={0.1} strokeDasharray="3 3" />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>

              {compareRecords.length > 0 && (
                <>
                  <Text size="sm" fw={500} c="wood.7">
                    📋 历史记录对比
                  </Text>
                  <Box h={140}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={compareRecords} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#8B5A2B' }} />
                        <YAxis tick={{ fontSize: 9, fill: '#8B5A2B' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FBF5E6',
                            border: '1px solid #D4B88C',
                            borderRadius: '6px',
                            fontSize: '11px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '9px' }} />
                        <Bar dataKey="有效率" name="有效率(%)" fill="#2E8B57" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="时产量" name="时产量(kg)" fill="#8B5A2B" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </>
              )}

              <Group grow>
                <Box p="xs" style={{ backgroundColor: '#F5E6CC', borderRadius: '6px' }}>
                  <Text size="xs" c="wood.5" ta="center">
                    冲击频率
                  </Text>
                  <Text size="lg" fw={700} c="wood.7" ta="center">
                    {state.elapsedTime > 0
                      ? (state.totalStrikes / state.elapsedTime).toFixed(2)
                      : '0.00'}
                    <Text size="xs" span c="wood.5">
                      次/秒
                    </Text>
                  </Text>
                </Box>
                <Box p="xs" style={{ backgroundColor: '#D4EFDF', borderRadius: '6px' }}>
                  <Text size="xs" c="wood.5" ta="center">
                    人均产量
                  </Text>
                  <Text size="lg" fw={700} c="bamboo.7" ta="center">
                    {participantCount > 0
                      ? (state.accumulatedYield / participantCount).toFixed(2)
                      : '0.00'}
                    <Text size="xs" span c="wood.5">
                      kg/人
                    </Text>
                  </Text>
                </Box>
                <Box p="xs" style={{ backgroundColor: '#FFE4D6', borderRadius: '6px' }}>
                  <Text size="xs" c="wood.5" ta="center">
                    协同增益
                  </Text>
                  <Text
                    size="lg"
                    fw={700}
                    c={participantCount > 1 ? 'bamboo.7' : 'wood.7'}
                    ta="center"
                  >
                    {participantCount > 1
                      ? `+${Math.round((participantCount - 1) * 15)}%`
                      : '基准'}
                  </Text>
                </Box>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="environment" pt="md">
            <Stack gap="md">
              {environment ? (
                <>
                  <Box
                    p="sm"
                    style={{
                      backgroundColor: '#FAF6E8',
                      borderRadius: '6px',
                      border: '1px solid #D4B88C',
                    }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Text size="xs" fw={600} c="wood.7">
                        🌍 当前环境条件
                      </Text>
                      <Badge color="bamboo" variant="light" size="xs">
                        {ENVIRONMENT_PRESETS[environment.presetId]?.icon} {ENVIRONMENT_PRESETS[environment.presetId]?.name}
                      </Badge>
                    </Group>
                    <Group grow>
                      <Box p="xs" style={{ backgroundColor: '#E6EEFA', borderRadius: '4px' }}>
                        <Text size="xs" c="wood.5" ta="center">湿度</Text>
                        <Text size="sm" fw={600} c="#4169E1" ta="center">{environment.humidity}%</Text>
                      </Box>
                      <Box p="xs" style={{ backgroundColor: '#F5E6CC', borderRadius: '4px' }}>
                        <Text size="xs" c="wood.5" ta="center">含水率</Text>
                        <Text size="sm" fw={600} c="#DAA520" ta="center">{environment.grainMoisture}%</Text>
                      </Box>
                      <Box p="xs" style={{ backgroundColor: '#FFE4D6', borderRadius: '4px' }}>
                        <Text size="xs" c="wood.5" ta="center">磨损</Text>
                        <Text size="sm" fw={600} c="#CD5C5C" ta="center">{environment.pedalWear}%</Text>
                      </Box>
                      <Box p="xs" style={{ backgroundColor: '#D4EFDF', borderRadius: '4px' }}>
                        <Text size="xs" c="wood.5" ta="center">稳定性</Text>
                        <Text size="sm" fw={600} c="#2E8B57" ta="center">{environment.groundStability}%</Text>
                      </Box>
                    </Group>
                  </Box>

                  {(() => {
                    const mods = calculateEnvironmentModifiers(environment);
                    const envCompareRecords = allRecords.filter((r) => r.environment);
                    const presetGroups: Record<string, ExperimentRecord[]> = {};
                    envCompareRecords.forEach((r) => {
                      const pid = r.environment!.presetId;
                      if (!presetGroups[pid]) presetGroups[pid] = [];
                      presetGroups[pid].push(r);
                    });

                    const presetAvg = Object.entries(presetGroups).map(([pid, recs]) => {
                      const avgEffRate = recs.reduce((s, r) => s + (r.effectiveStrikes / Math.max(1, r.totalStrikes)) * 100, 0) / recs.length;
                      const avgYield = recs.reduce((s, r) => s + (r.finalYield / Math.max(1, r.duration)) * 3600, 0) / recs.length;
                      const avgIntegrity = recs.reduce((s, r) => s + (r.finalIntegrityRate || 100), 0) / recs.length;
                      const avgStaminaRatio = recs.reduce((s, r) => s + (r.staminaYieldRatio || 0), 0) / recs.length;
                      const avgBreakage = recs.reduce((s, r) => s + (r.finalBreakageRate || 0), 0) / recs.length;
                      const avgRiceYield = recs.reduce((s, r) => s + (r.riceYield || 0), 0) / recs.length;
                      const avgStaminaUsed = recs.reduce((s, r) => s + (r.totalStaminaUsed || 0), 0) / recs.length;
                      const preset = ENVIRONMENT_PRESETS[pid as keyof typeof ENVIRONMENT_PRESETS];
                      return {
                        name: preset ? `${preset.icon}${preset.name}` : pid,
                        有效率: avgEffRate,
                        时产量: avgYield,
                        完整率: avgIntegrity,
                        体力收益: avgStaminaRatio,
                        破损率: avgBreakage,
                        成米产量: avgRiceYield,
                        体力消耗: avgStaminaUsed,
                      };
                    });

                    const envPresetColors: Record<string, string> = {
                      sunny: '#DAA520',
                      postRain: '#4169E1',
                      highIntensity: '#CD5C5C',
                      dusty: '#8B5A2B',
                      custom: '#8B5A2B',
                    };

                    const presetEfficiencyCurves = (() => {
                      const curves: any[] = [];
                      Object.entries(presetGroups).forEach(([pid, recs]) => {
                        const allPoints: { time: number; effectiveRate: number; yieldPerHour: number; integrityRate: number; breakageRate: number; staminaYieldRatio: number }[] = [];
                        recs.forEach((r) => {
                          if (r.efficiencyHistory) {
                            r.efficiencyHistory.forEach((p) => {
                              allPoints.push({
                                time: p.time,
                                effectiveRate: p.effectiveRate,
                                yieldPerHour: p.yieldPerHour,
                                integrityRate: p.integrityRate ?? 100,
                                breakageRate: p.breakageRate ?? 0,
                                staminaYieldRatio: p.staminaYieldRatio ?? 0,
                              });
                            });
                          }
                        });
                        const sorted = allPoints.sort((a, b) => a.time - b.time);
                        const sampled = sorted.filter((_, idx) => idx % Math.max(1, Math.floor(sorted.length / 20)) === 0 || idx === sorted.length - 1);
                        const preset = ENVIRONMENT_PRESETS[pid as keyof typeof ENVIRONMENT_PRESETS];
                        const color = envPresetColors[pid] || '#8B5A2B';
                        const label = preset ? preset.name : pid;
                        curves.push({ pid, label, color, points: sampled });
                      });
                      return curves;
                    })();

                    const maxCurveLen = Math.max(...presetEfficiencyCurves.map((c) => c.points.length), 0);
                    const overlayData: any[] = [];
                    for (let idx = 0; idx < maxCurveLen; idx++) {
                      const point: any = {};
                      presetEfficiencyCurves.forEach((curve) => {
                        const p = curve.points[idx];
                        if (p) {
                          point[`${curve.label}_eff`] = p.effectiveRate;
                          point[`${curve.label}_integrity`] = p.integrityRate;
                          point[`${curve.label}_stamina`] = p.staminaYieldRatio;
                        }
                      });
                      const refPoint = presetEfficiencyCurves[0]?.points[idx];
                      if (refPoint) point.time = refPoint.time;
                      if (Object.keys(point).length > 0) overlayData.push(point);
                    }

                    return (
                      <>
                        <Box>
                          <Text size="xs" fw={500} c="wood.7" mb="xs">
                            📊 环境影响倍率
                          </Text>
                          <Group grow>
                            <Box p="xs" style={{ backgroundColor: '#F5E6CC', borderRadius: '4px' }}>
                              <Text size="xs" c="wood.5" ta="center">冲击高度</Text>
                              <Text size="sm" fw={600} c={mods.impactHeightMultiplier >= 0.9 ? 'bamboo.7' : mods.impactHeightMultiplier >= 0.7 ? 'wood.7' : 'terracotta.7'} ta="center">
                                ×{mods.impactHeightMultiplier.toFixed(2)}
                              </Text>
                            </Box>
                            <Box p="xs" style={{ backgroundColor: '#D4EFDF', borderRadius: '4px' }}>
                              <Text size="xs" c="wood.5" ta="center">脱壳效率</Text>
                              <Text size="sm" fw={600} c={mods.hullingEfficiencyMultiplier >= 0.9 ? 'bamboo.7' : mods.hullingEfficiencyMultiplier >= 0.7 ? 'wood.7' : 'terracotta.7'} ta="center">
                                ×{mods.hullingEfficiencyMultiplier.toFixed(2)}
                              </Text>
                            </Box>
                            <Box p="xs" style={{ backgroundColor: '#FFE4D6', borderRadius: '4px' }}>
                              <Text size="xs" c="wood.5" ta="center">破损率</Text>
                              <Text size="sm" fw={600} c={mods.breakageRateMultiplier <= 1.1 ? 'bamboo.7' : mods.breakageRateMultiplier <= 1.3 ? 'wood.7' : 'terracotta.7'} ta="center">
                                ×{mods.breakageRateMultiplier.toFixed(2)}
                              </Text>
                            </Box>
                            <Box p="xs" style={{ backgroundColor: '#E6EEFA', borderRadius: '4px' }}>
                              <Text size="xs" c="wood.5" ta="center">体力消耗</Text>
                              <Text size="sm" fw={600} c={mods.staminaConsumptionMultiplier <= 1.1 ? 'bamboo.7' : mods.staminaConsumptionMultiplier <= 1.3 ? 'wood.7' : 'terracotta.7'} ta="center">
                                ×{mods.staminaConsumptionMultiplier.toFixed(2)}
                              </Text>
                            </Box>
                          </Group>
                        </Box>

                        {presetAvg.length >= 2 && (
                          <Box>
                            <Text size="xs" fw={500} c="wood.7" mb="xs">
                              📋 不同环境场景效率对比
                            </Text>
                            <Box h={160}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={presetAvg} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#8B5A2B' }} />
                                  <YAxis tick={{ fontSize: 9, fill: '#8B5A2B' }} />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#FBF5E6',
                                      border: '1px solid #D4B88C',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                    }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: '9px' }} />
                                  <Bar dataKey="有效率" name="有效率(%)" fill="#2E8B57" radius={[2, 2, 0, 0]} />
                                  <Bar dataKey="时产量" name="时产量(kg/h)" fill="#8B5A2B" radius={[2, 2, 0, 0]} />
                                  <Bar dataKey="完整率" name="完整率(%)" fill="#228B22" radius={[2, 2, 0, 0]} />
                                  <Bar dataKey="体力收益" name="体力收益" fill="#4169E1" radius={[2, 2, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </Box>
                          </Box>
                        )}

                        {presetAvg.length >= 2 && (
                          <Group grow>
                            <Box>
                              <Text size="xs" fw={500} c="wood.7" mb="xs">
                                💎 加工质量差异
                              </Text>
                              <Box h={140}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={presetAvg} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#8B5A2B' }} />
                                    <YAxis tick={{ fontSize: 9, fill: '#8B5A2B' }} domain={[0, 100]} />
                                    <Tooltip contentStyle={{ backgroundColor: '#FBF5E6', border: '1px solid #D4B88C', borderRadius: '6px', fontSize: '11px' }} />
                                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                                    <Bar dataKey="完整率" name="完整率(%)" fill="#2E8B57" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="破损率" name="破损率(%)" fill="#CD5C5C" radius={[2, 2, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </Box>
                            </Box>
                            <Box>
                              <Text size="xs" fw={500} c="wood.7" mb="xs">
                                ⚡ 单位体力收益差异
                              </Text>
                              <Box h={140}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={presetAvg} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#8B5A2B' }} />
                                    <YAxis tick={{ fontSize: 9, fill: '#8B5A2B' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#FBF5E6', border: '1px solid #D4B88C', borderRadius: '6px', fontSize: '11px' }} />
                                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                                    <Bar dataKey="体力收益" name="体力收益(g/千点)" fill="#4169E1" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="体力消耗" name="体力消耗" fill="#CD5C5C" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="成米产量" name="成米产量(kg)" fill="#2E8B57" radius={[2, 2, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </Box>
                            </Box>
                          </Group>
                        )}

                        {overlayData.length > 0 && presetEfficiencyCurves.length >= 2 && (
                          <Box>
                            <Text size="xs" fw={500} c="wood.7" mb="xs">
                              📈 跨环境效率曲线叠加
                            </Text>
                            <Box h={160}>
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={overlayData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#8B5A2B' }} domain={[0, 100]} />
                                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                                  <Tooltip content={<CustomTooltip />} />
                                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                                  {presetEfficiencyCurves.map((curve) => (
                                    <Line
                                      key={`${curve.pid}_eff`}
                                      yAxisId="left"
                                      type="monotone"
                                      dataKey={`${curve.label}_eff`}
                                      name={`${curve.label} 有效率(%)`}
                                      stroke={curve.color}
                                      strokeWidth={2}
                                      dot={{ r: 2 }}
                                    />
                                  ))}
                                </ComposedChart>
                              </ResponsiveContainer>
                            </Box>
                          </Box>
                        )}

                        {overlayData.length > 0 && presetEfficiencyCurves.length >= 2 && (
                          <Box>
                            <Text size="xs" fw={500} c="wood.7" mb="xs">
                              📈 跨环境完整率与体力收益对比
                            </Text>
                            <Box h={160}>
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={overlayData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#8B5A2B' }} domain={[0, 100]} />
                                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                                  <Tooltip content={<CustomTooltip />} />
                                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                                  {presetEfficiencyCurves.map((curve) => (
                                    <Line
                                      key={`${curve.pid}_integrity`}
                                      yAxisId="left"
                                      type="monotone"
                                      dataKey={`${curve.label}_integrity`}
                                      name={`${curve.label} 完整率(%)`}
                                      stroke={curve.color}
                                      strokeWidth={2}
                                      dot={false}
                                      strokeDasharray="4 2"
                                    />
                                  ))}
                                  {presetEfficiencyCurves.map((curve) => (
                                    <Line
                                      key={`${curve.pid}_stamina`}
                                      yAxisId="right"
                                      type="monotone"
                                      dataKey={`${curve.label}_stamina`}
                                      name={`${curve.label} 体力收益`}
                                      stroke={curve.color}
                                      strokeWidth={2}
                                      dot={{ r: 2 }}
                                    />
                                  ))}
                                </ComposedChart>
                              </ResponsiveContainer>
                            </Box>
                          </Box>
                        )}

                        {recentData.length > 0 && (
                          <Box>
                            <Text size="xs" fw={500} c="wood.7" mb="xs">
                              📈 效率-环境关联曲线
                            </Text>
                            <Box h={140}>
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={recentData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                                  <XAxis
                                    dataKey="time"
                                    tick={{ fontSize: 10, fill: '#8B5A2B' }}
                                    label={{ value: '时间(s)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#A67C52' }}
                                  />
                                  <YAxis
                                    yAxisId="left"
                                    tick={{ fontSize: 10, fill: '#8B5A2B' }}
                                    domain={[0, 100]}
                                    label={{ value: '有效率(%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#A67C52' }}
                                  />
                                  <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fontSize: 10, fill: '#8B5A2B' }}
                                    label={{ value: '体力收益', angle: 90, position: 'insideRight', fontSize: 10, fill: '#A67C52' }}
                                  />
                                  <Tooltip content={<CustomTooltip />} />
                                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                                  <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="effectiveRate"
                                    name="有效冲击率"
                                    fill="#2E8B5733"
                                    stroke="#2E8B57"
                                    strokeWidth={2}
                                  />
                                  <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="staminaYieldRatio"
                                    name="单位体力收益"
                                    stroke="#4169E1"
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                  />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </Box>
                          </Box>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : (
                <Stack h="100%" align="center" justify="center">
                  <Text size="sm" c="wood.5">
                    设置环境条件后将显示环境分析
                  </Text>
                </Stack>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Divider c="wood.2" />

        <Box>
          <Text size="sm" fw={500} c="wood.7" mb="xs">
            📈 效率评估
          </Text>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="xs" c="wood.6">
                综合效率评分
              </Text>
              <Text
                size="sm"
                fw={600}
                c={
                  effectiveRate >= 80 && state.effectiveStrikes > 10
                    ? 'bamboo.7'
                    : effectiveRate >= 50
                    ? 'wood.7'
                    : 'terracotta.7'
                }
              >
                {Math.round((effectiveRate / 100) * 80 + Math.min(staminaEfficiency, 20))} 分
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="wood.6">
                冲击频率
              </Text>
              <Text size="xs" fw={600} c="wood.8">
                {state.elapsedTime > 0
                  ? (state.totalStrikes / state.elapsedTime).toFixed(2)
                  : '0.00'}{' '}
                次/秒
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="wood.6">
                平均每次产量
              </Text>
              <Text size="xs" fw={600} c="wood.8">
                {state.effectiveStrikes > 0
                  ? ((state.accumulatedYield / state.effectiveStrikes) * 1000).toFixed(1)
                  : '0.0'}{' '}
                g
              </Text>
            </Group>
            {perPersonContribution.length > 0 && (
              <Group justify="space-between">
                <Text size="xs" c="wood.6">
                  贡献分布
                </Text>
                <Group gap="xs">
                  {perPersonContribution.map((p, i) => (
                    <Badge key={i} size="xs" color="wood" variant="light" style={{ backgroundColor: `${p.color}22`, color: p.color, borderColor: `${p.color}55` }}>
                      {p.name} {p.贡献占比.toFixed(0)}%
                    </Badge>
                  ))}
                </Group>
              </Group>
            )}
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}
