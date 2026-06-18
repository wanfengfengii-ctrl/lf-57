import { Card, Group, Text, Stack, Box, Progress, Badge, Tabs, Divider } from '@mantine/core';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  BarChart,
  Bar,
} from 'recharts';
import type {
  EquipmentState,
  EquipmentPartId,
  EquipmentEfficiencyPoint,
  MaintenanceStrategy,
} from '../types';
import {
  EQUIPMENT_PARTS,
  getPartStatusLevel,
  getStatusColor,
  calculateEquipmentModifiers,
} from '../utils/equipment';

interface EquipmentPanelProps {
  equipment: EquipmentState;
  equipmentHistory: EquipmentEfficiencyPoint[];
  isRunning?: boolean;
  isPaused?: boolean;
}

export function EquipmentPanel({
  equipment,
  equipmentHistory,
  isRunning = false,
  isPaused = false,
}: EquipmentPanelProps) {
  const partIds = Object.keys(EQUIPMENT_PARTS) as EquipmentPartId[];
  const mods = calculateEquipmentModifiers(equipment);
  const recentHistory = equipmentHistory.slice(-30);

  const wearData = partIds.map((id) => {
    const part = equipment.parts[id];
    const config = EQUIPMENT_PARTS[id];
    const level = getPartStatusLevel(part.wear, part.looseness);
    return {
      id,
      name: config.name,
      icon: config.icon,
      wear: part.wear,
      looseness: part.looseness,
      efficiency: part.efficiencyFactor * 100,
      status: level,
      color: getStatusColor(level),
      strikes: part.totalStrikes,
      maintenanceCount: part.maintenanceCount,
    };
  });

  const efficiencyCurveData = recentHistory.map((point) => ({
    time: point.time,
    overallEfficiency: point.overallEfficiency * 100,
    maintenanceCost: point.maintenanceCost,
    maintenanceCount: point.maintenanceCount,
  }));

  const partsWearCurveData = recentHistory.map((point) => {
    const data: any = { time: point.time };
    partIds.forEach((id) => {
      if (point.parts[id]) {
        data[`${EQUIPMENT_PARTS[id].name}磨损`] = point.parts[id].wear;
      }
    });
    return data;
  });

  const partColors: Record<EquipmentPartId, string> = {
    pedal: '#8B5A2B',
    pivot: '#4169E1',
    connectingRod: '#2E8B57',
    pestleHead: '#CD5C5C',
  };

  return (
    <Card padding="lg" radius="md" h="100%">
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <Text size="lg" fw={600} c="wood.7">
              ⚙️ 器具状态
            </Text>
          </Group>
          <Group gap="xs">
            <Badge
              color={equipment.maintenanceStrategy === 'withMaintenance' ? 'bamboo' : 'terracotta'}
              variant="light"
              size="sm"
            >
              {equipment.maintenanceStrategy === 'withMaintenance' ? '带维护' : '无维护'}
            </Badge>
            <Badge color="wood" variant="light" size="sm">
              总成本: {equipment.totalMaintenanceCost}
            </Badge>
          </Group>
        </Group>

        <Divider c="wood.2" />

        <Group grow>
          <Box p="xs" style={{ backgroundColor: '#F5E6CC', borderRadius: '6px' }}>
            <Text size="xs" c="wood.5" ta="center">
              整体效率
            </Text>
            <Text
              size="lg"
              fw={700}
              c={equipment.overallEfficiency >= 0.9 ? 'bamboo.7' : equipment.overallEfficiency >= 0.7 ? 'wood.7' : 'terracotta.7'}
              ta="center"
            >
              {(equipment.overallEfficiency * 100).toFixed(1)}
              <Text size="xs" span c="wood.5"> %</Text>
            </Text>
          </Box>
          <Box p="xs" style={{ backgroundColor: '#D4EFDF', borderRadius: '6px' }}>
            <Text size="xs" c="wood.5" ta="center">
              累计维护
            </Text>
            <Text size="lg" fw={700} c="bamboo.7" ta="center">
              {equipment.maintenanceHistory.length}
              <Text size="xs" span c="wood.5"> 次</Text>
            </Text>
          </Box>
          <Box p="xs" style={{ backgroundColor: '#FFE4D6', borderRadius: '6px' }}>
            <Text size="xs" c="wood.5" ta="center">
              维护成本
            </Text>
            <Text size="lg" fw={700} c="terracotta.7" ta="center">
              {equipment.totalMaintenanceCost}
              <Text size="xs" span c="wood.5"> 币</Text>
            </Text>
          </Box>
        </Group>

        <Tabs defaultValue="status" variant="pills">
          <Tabs.List grow>
            <Tabs.Tab value="status" size="sm">部件状态</Tabs.Tab>
            <Tabs.Tab value="modifiers" size="sm">影响倍率</Tabs.Tab>
            <Tabs.Tab value="history" size="sm">磨损曲线</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="status" pt="md">
            <Stack gap="sm">
              {wearData.map((item) => (
                <Box
                  key={item.id}
                  p="sm"
                  style={{
                    backgroundColor: `${item.color}11`,
                    borderRadius: '8px',
                    border: `1px solid ${item.color}33`,
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <Text size="lg">{item.icon}</Text>
                      <Text size="sm" fw={600} c="wood.7">
                        {item.name}
                      </Text>
                      <Badge size="xs" color={item.color === '#2E8B57' ? 'bamboo' : item.color === '#DAA520' ? 'yellow' : item.color === '#CD5C5C' ? 'terracotta' : 'red'} variant="light">
                        {item.status === 'good' ? '良好' : item.status === 'fair' ? '一般' : item.status === 'poor' ? '较差' : '危险'}
                      </Badge>
                    </Group>
                    <Text size="xs" c="wood.5">
                      效率: {item.efficiency.toFixed(1)}%
                    </Text>
                  </Group>

                  <Group grow mb="xs">
                    <Box>
                      <Group justify="space-between" mb={4}>
                        <Text size="xs" c="wood.6">磨损</Text>
                        <Text size="xs" fw={500} c={item.wear > 70 ? 'terracotta.7' : 'wood.7'}>
                          {item.wear.toFixed(1)}%
                        </Text>
                      </Group>
                      <Progress
                        value={item.wear}
                        color={item.wear > 70 ? 'red' : item.wear > 40 ? 'yellow' : 'green'}
                        size="sm"
                        radius="sm"
                      />
                    </Box>
                    <Box>
                      <Group justify="space-between" mb={4}>
                        <Text size="xs" c="wood.6">松动</Text>
                        <Text size="xs" fw={500} c={item.looseness > 70 ? 'terracotta.7' : 'wood.7'}>
                          {item.looseness.toFixed(1)}%
                        </Text>
                      </Group>
                      <Progress
                        value={item.looseness}
                        color={item.looseness > 70 ? 'red' : item.looseness > 40 ? 'orange' : 'blue'}
                        size="sm"
                        radius="sm"
                      />
                    </Box>
                  </Group>

                  <Group justify="space-between">
                    <Text size="xs" c="wood.5">
                      累计冲击: {item.strikes} 次
                    </Text>
                    <Text size="xs" c="wood.5">
                      维护次数: {item.maintenanceCount} 次
                    </Text>
                  </Group>
                </Box>
              ))}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="modifiers" pt="md">
            <Stack gap="sm">
              <Box
                p="sm"
                style={{
                  backgroundColor: '#FAF6E8',
                  borderRadius: '6px',
                  border: '1px solid #D4B88C',
                }}
              >
                <Text size="xs" fw={500} c="wood.7" mb="sm">
                  📊 器具影响倍率
                </Text>
                <Stack gap={4}>
                  <Group justify="space-between">
                    <Text size="xs" c="wood.6">冲击高度</Text>
                    <Text
                      size="xs"
                      fw={600}
                      c={mods.impactHeightMultiplier >= 0.9 ? 'bamboo.7' : mods.impactHeightMultiplier >= 0.7 ? 'wood.7' : 'terracotta.7'}
                    >
                      ×{mods.impactHeightMultiplier.toFixed(2)}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="wood.6">脱壳效率</Text>
                    <Text
                      size="xs"
                      fw={600}
                      c={mods.efficiencyMultiplier >= 0.9 ? 'bamboo.7' : mods.efficiencyMultiplier >= 0.7 ? 'wood.7' : 'terracotta.7'}
                    >
                      ×{mods.efficiencyMultiplier.toFixed(2)}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="wood.6">破损率</Text>
                    <Text
                      size="xs"
                      fw={600}
                      c={mods.breakageRateMultiplier <= 1.1 ? 'bamboo.7' : mods.breakageRateMultiplier <= 1.5 ? 'wood.7' : 'terracotta.7'}
                    >
                      ×{mods.breakageRateMultiplier.toFixed(2)}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="wood.6">体力消耗</Text>
                    <Text
                      size="xs"
                      fw={600}
                      c={mods.staminaConsumptionMultiplier <= 1.1 ? 'bamboo.7' : mods.staminaConsumptionMultiplier <= 1.4 ? 'wood.7' : 'terracotta.7'}
                    >
                      ×{mods.staminaConsumptionMultiplier.toFixed(2)}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="wood.6">冲击质量</Text>
                    <Text
                      size="xs"
                      fw={600}
                      c={mods.strikeQualityMultiplier >= 0.9 ? 'bamboo.7' : mods.strikeQualityMultiplier >= 0.7 ? 'wood.7' : 'terracotta.7'}
                    >
                      ×{mods.strikeQualityMultiplier.toFixed(2)}
                    </Text>
                  </Group>
                </Stack>
              </Box>

              <Box h={140}>
                {recentHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={efficiencyCurveData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#8B5A2B' }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FBF5E6',
                          border: '1px solid #D4B88C',
                          borderRadius: '6px',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '9px' }} />
                      <Line
                        type="monotone"
                        dataKey="overallEfficiency"
                        name="整体效率(%)"
                        stroke="#2E8B57"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Stack h="100%" align="center" justify="center">
                    <Text size="xs" c="wood.5">
                      启动模拟后显示效率曲线
                    </Text>
                  </Stack>
                )}
              </Box>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="md">
            <Stack gap="sm">
              <Box h={180}>
                {partsWearCurveData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={partsWearCurveData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#8B5A2B' }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FBF5E6',
                          border: '1px solid #D4B88C',
                          borderRadius: '6px',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '9px' }} />
                      {partIds.map((id) => (
                        <Line
                          key={id}
                          type="monotone"
                          dataKey={`${EQUIPMENT_PARTS[id].name}磨损`}
                          name={`${EQUIPMENT_PARTS[id].name}磨损`}
                          stroke={partColors[id]}
                          strokeWidth={2}
                          dot={{ r: 1 }}
                        />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <Stack h="100%" align="center" justify="center">
                    <Text size="xs" c="wood.5">
                      启动模拟后显示磨损曲线
                    </Text>
                  </Stack>
                )}
              </Box>

              <Box h={140}>
                {efficiencyCurveData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={efficiencyCurveData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FBF5E6',
                          border: '1px solid #D4B88C',
                          borderRadius: '6px',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '9px' }} />
                      <Area
                        type="monotone"
                        dataKey="maintenanceCost"
                        name="累计维护成本"
                        stroke="#CD5C5C"
                        fill="#CD5C5C33"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Stack h="100%" align="center" justify="center">
                    <Text size="xs" c="wood.5">
                      启动模拟后显示成本曲线
                    </Text>
                  </Stack>
                )}
              </Box>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Card>
  );
}
