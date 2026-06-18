import { Card, Group, Text, Stack, Box, Divider, Tabs, Badge } from '@mantine/core';
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
import type { EfficiencyPoint, SimulationState, StepperState, ExperimentRecord } from '../types';
import { calculateEffectiveRate, calculateStaminaEfficiency } from '../utils/physics';
import { getStrategyName } from '../utils/validation';

interface StatsPanelProps {
  efficiencyHistory: EfficiencyPoint[];
  state: SimulationState;
  effectiveRate: number;
  yieldPerHour: number;
  staminaEfficiency: number;
  participantCount: number;
  cooperationStrategy: string;
  allRecords?: ExperimentRecord[];
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
  allRecords = [],
}: StatsPanelProps) {
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

  const staminaData = efficiencyHistory.map((point) => ({
    time: point.time,
    消耗体力: point.staminaUsed || 0,
    剩余预算: Math.max(0, (state.staminaBudgetRemaining || 0) + ((efficiencyHistory[efficiencyHistory.length - 1]?.staminaUsed || 0) - (point.staminaUsed || 0))),
  }));

  const perPersonStaminaData = state.stepperStates.map((ss, i) => {
    const staminaHistory = ss.staminaHistory.slice(-30);
    return {
      id: i,
      data: staminaHistory,
    };
  });

  const perPersonContribution = state.stepperStates.map((ss, i) => {
    const config = allRecords.length > 0 ? allRecords[0]?.params?.multiPerson?.steppers[i]?.name || `${i + 1}号` : `${i + 1}号`;
    const color = allRecords.length > 0 ? allRecords[0]?.params?.multiPerson?.steppers[i]?.color || '#8B5A2B' : '#8B5A2B';
    const contribution = state.effectiveStrikes > 0
      ? (ss.effectiveContributions / state.effectiveStrikes) * 100
      : 0;
    return {
      name: config,
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
          <Group gap="xs">
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
          </Group>
        </Group>

        <Divider c="wood.2" />

        <Tabs defaultValue="efficiency" variant="pills">
          <Tabs.List grow>
            <Tabs.Tab value="efficiency" size="sm">效率曲线</Tabs.Tab>
            <Tabs.Tab value="stamina" size="sm">体力曲线</Tabs.Tab>
            <Tabs.Tab value="strikes" size="sm">冲击统计</Tabs.Tab>
            <Tabs.Tab value="yield" size="sm">产量趋势</Tabs.Tab>
            <Tabs.Tab value="compare" size="sm">对比分析</Tabs.Tab>
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
                    const config = allRecords.length > 0 ? allRecords[0]?.params?.multiPerson?.steppers[i] : undefined;
                    return (
                      <Box
                        key={ss.id}
                        p="xs"
                        style={{
                          backgroundColor: `${config?.color || '#8B5A2B'}15`,
                          borderRadius: '6px',
                          border: `1px solid ${config?.color || '#8B5A2B'}55`,
                        }}
                      >
                        <Group justify="space-between" mb="xs">
                          <Text size="xs" fw={600} c={config?.color || '#8B5A2B'}>
                            {config?.name || `${i + 1}号`}
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
                              backgroundColor: config?.color || '#8B5A2B',
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
