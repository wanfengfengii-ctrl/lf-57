import { Card, Group, Text, Stack, Box, Divider, Tabs } from '@mantine/core';
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
} from 'recharts';
import type { EfficiencyPoint, SimulationState } from '../types';
import { calculateEffectiveRate } from '../utils/physics';

interface StatsPanelProps {
  efficiencyHistory: EfficiencyPoint[];
  state: SimulationState;
  effectiveRate: number;
  yieldPerHour: number;
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
            {entry.name.includes('率') ? '%' : entry.name.includes('产量') ? 'kg/h' : ''}
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

  return (
    <Card padding="lg" radius="md" h="100%">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600} c="wood.7">
            📊 统计分析
          </Text>
          {state.isRunning && (
            <Text size="xs" c="bamboo.6">
              ● 实时更新中
            </Text>
          )}
        </Group>

        <Divider c="wood.2" />

        <Tabs defaultValue="efficiency" variant="pills">
          <Tabs.List grow>
            <Tabs.Tab value="efficiency" size="sm">效率曲线</Tabs.Tab>
            <Tabs.Tab value="strikes" size="sm">冲击统计</Tabs.Tab>
            <Tabs.Tab value="yield" size="sm">产量趋势</Tabs.Tab>
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

          <Tabs.Panel value="strikes" pt="md">
            <Stack gap="md">
              <Box h={160}>
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
                    预计1小时产量
                  </Text>
                  <Text size="lg" fw={700} c="bamboo.7" ta="center">
                    {yieldPerHour.toFixed(1)}
                    <Text size="xs" span c="wood.5">
                      kg
                    </Text>
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
                {Math.round((effectiveRate / 100) * 100)} 分
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
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}
