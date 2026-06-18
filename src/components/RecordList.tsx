import { useState, useMemo } from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Stack,
  Box,
  ScrollArea,
  Modal,
  Button,
  Tabs,
  SegmentedControl,
  Checkbox,
  Divider,
} from '@mantine/core';
import { Trash2, Play, History, Users, Filter, GitCompare, Zap } from 'lucide-react';
import {
  ComposedChart,
  Area,
  AreaChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { ExperimentRecord, ParticipantCount, CooperationStrategy } from '../types';
import { getStrategyName } from '../utils/validation';

interface RecordListProps {
  records: ExperimentRecord[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const PARTICIPANT_COLORS: Record<number, string> = {
  1: '#8B5A2B',
  2: '#2E8B57',
  3: '#4169E1',
};

export function RecordList({ records, onLoad, onDelete }: RecordListProps) {
  const [selectedRecord, setSelectedRecord] = useState<ExperimentRecord | null>(null);
  const [filterParticipants, setFilterParticipants] = useState<ParticipantCount | 'all'>('all');
  const [filterStrategy, setFilterStrategy] = useState<CooperationStrategy | 'all'>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterParticipants !== 'all' && r.participantCount !== filterParticipants) {
        return false;
      }
      if (filterStrategy !== 'all' && r.cooperationStrategy !== filterStrategy) {
        return false;
      }
      return true;
    });
  }, [records, filterParticipants, filterStrategy]);

  const compareRecords = useMemo(() => {
    return records.filter((r) => compareIds.includes(r.id));
  }, [records, compareIds]);

  const compareData = useMemo(() => {
    return compareRecords.map((r) => {
      const effectiveRate = r.totalStrikes > 0 ? (r.effectiveStrikes / r.totalStrikes) * 100 : 0;
      const yieldPerHour = r.duration > 0 ? (r.finalYield / r.duration) * 3600 : 0;
      return {
        name: `${r.participantCount}人${getStrategyName(r.cooperationStrategy)}`,
        有效率: effectiveRate,
        时产量: yieldPerHour,
        体力效率: r.staminaEfficiency,
        最大高度: r.maxHeight * 100,
      };
    });
  }, [compareRecords]);

  const radarCompareData = useMemo(() => {
    if (compareRecords.length === 0) return [];
    const subjects = ['有效率', '时产量', '体力效率', '持续性', '协同度'];
    return subjects.map((subject) => {
      const obj: any = { subject };
      compareRecords.forEach((r, i) => {
        const effectiveRate = r.totalStrikes > 0 ? (r.effectiveStrikes / r.totalStrikes) * 100 : 0;
        const yieldPerHour = r.duration > 0 ? (r.finalYield / r.duration) * 3600 : 0;
        const key = `${r.participantCount}人${getStrategyName(r.cooperationStrategy)}(${i + 1})`;
        switch (subject) {
          case '有效率':
            obj[key] = effectiveRate;
            break;
          case '时产量':
            obj[key] = Math.min(100, yieldPerHour);
            break;
          case '体力效率':
            obj[key] = Math.min(100, r.staminaEfficiency);
            break;
          case '持续性':
            obj[key] = r.totalStaminaUsed > 0 ? Math.min(100, (r.finalYield / r.totalStaminaUsed) * 200) : 50;
            break;
          case '协同度':
            obj[key] = r.participantCount === 1 ? 50 : 60 + (r.participantCount - 1) * 15;
            break;
        }
      });
      obj['fullMark'] = 100;
      return obj;
    });
  }, [compareRecords]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const radarColors = ['#8B5A2B', '#2E8B57', '#4169E1', '#CD5C5C'];

  return (
    <>
      <Card padding="lg" radius="md" h="100%">
        <Stack gap="md" h="100%">
          <Group justify="space-between">
            <Group gap="xs">
              <History size={18} color="#8B5A2B" />
              <Text size="lg" fw={600} c="wood.7">
                实验记录
              </Text>
            </Group>
            <Group gap="xs">
              <Badge color="wood" variant="light">
                {filteredRecords.length}/{records.length} 条
              </Badge>
              <button
                onClick={() => {
                  setCompareMode(!compareMode);
                  if (compareMode) setCompareIds([]);
                }}
                style={{
                  padding: '4px 10px',
                  backgroundColor: compareMode ? '#4169E1' : '#FAF6E8',
                  color: compareMode ? 'white' : '#4169E1',
                  border: `1px solid ${compareMode ? '#4169E1' : '#D4B88C'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <GitCompare size={12} />
                {compareMode ? '退出对比' : '对比模式'}
              </button>
            </Group>
          </Group>

          <Stack gap="sm">
            <Group gap="xs">
              <Filter size={14} color="#8B5A2B" />
              <Text size="xs" fw={500} c="wood.7">
                筛选
              </Text>
            </Group>
            <Group gap="xs">
              <SegmentedControl
                value={String(filterParticipants)}
                onChange={(v) => setFilterParticipants(v === 'all' ? 'all' : (Number(v) as ParticipantCount))}
                data={[
                  { label: '全部', value: 'all' },
                  { label: '1人', value: '1' },
                  { label: '2人', value: '2' },
                  { label: '3人', value: '3' },
                ]}
                size="xs"
                color="wood"
              />
            </Group>
            <Group gap="xs">
              <SegmentedControl
                value={String(filterStrategy)}
                onChange={(v) => setFilterStrategy(v === 'all' ? 'all' : (v as CooperationStrategy))}
                data={[
                  { label: '全部策略', value: 'all' },
                  { label: '同步', value: 'synchronized' },
                  { label: '交替', value: 'alternating' },
                  { label: '独立', value: 'independent' },
                  { label: '波浪', value: 'wave' },
                ]}
                size="xs"
                color="bamboo"
              />
            </Group>
          </Stack>

          {compareMode && compareIds.length > 0 && (
            <Box
              p="sm"
              style={{
                backgroundColor: '#E6EEFA',
                border: '1px solid #4169E155',
                borderRadius: '8px',
              }}
            >
              <Group justify="space-between" mb="xs">
                <Text size="xs" fw={600} c="#4169E1">
                  已选择 {compareIds.length} 条记录对比
                </Text>
                <button
                  onClick={() => setSelectedRecord({ ...compareRecords[0], id: 'compare' } as any)}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: '#4169E1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  查看对比
                </button>
              </Group>
              <Group gap="xs">
                {compareIds.map((id, i) => {
                  const r = records.find((x) => x.id === id);
                  return (
                    <Badge key={id} size="xs" color={radarColors[i] || '#8B5A2B'} variant="light">
                      {r?.participantCount}人{getStrategyName(r?.cooperationStrategy as any)}
                    </Badge>
                  );
                })}
              </Group>
            </Box>
          )}

          <Divider c="wood.2" />

          {filteredRecords.length > 0 ? (
            <ScrollArea h={compareMode ? 340 : 400} type="auto">
              <Stack gap="sm">
                {filteredRecords.map((record) => {
                  const isInCompare = compareIds.includes(record.id);
                  return (
                    <Box
                      key={record.id}
                      p="sm"
                      style={{
                        backgroundColor: isInCompare ? '#E6EEFA' : '#FBF5E6',
                        border: `1px solid ${isInCompare ? '#4169E155' : '#E8D4A8'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => {
                        if (compareMode) {
                          toggleCompare(record.id);
                        } else {
                          setSelectedRecord(record);
                        }
                      }}
                    >
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          {compareMode && (
                            <Checkbox
                              checked={isInCompare}
                              onChange={() => toggleCompare(record.id)}
                              size="xs"
                              color="blue"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <Badge
                            color={record.mode === 'free' ? 'wood' : 'bamboo'}
                            size="xs"
                          >
                            {record.mode === 'free' ? '自由' : '挑战'}
                          </Badge>
                          <Badge
                            size="xs"
                            color={PARTICIPANT_COLORS[record.participantCount] || '#8B5A2B'}
                            variant="light"
                          >
                            <Group gap={4} style={{ display: 'inline-flex' }}>
                              <Users size={10} />
                              {record.participantCount}人{getStrategyName(record.cooperationStrategy)}
                            </Group>
                          </Badge>
                          {record.challengeSuccess !== undefined && (
                            <Badge
                              color={record.challengeSuccess ? 'bamboo' : 'terracotta'}
                              size="xs"
                              variant="light"
                            >
                              {record.challengeSuccess ? '✓' : '✗'}
                            </Badge>
                          )}
                        </Group>
                        <Text size="xs" c="wood.5">
                          {formatDate(record.timestamp)}
                        </Text>
                      </Group>

                      <Group grow mb="xs">
                        <Box>
                          <Text size="xs" c="wood.5">
                            产量
                          </Text>
                          <Text size="sm" fw={600} c="wood.8">
                            {record.finalYield.toFixed(2)}kg
                          </Text>
                        </Box>
                        <Box>
                          <Text size="xs" c="wood.5">
                            有效率
                          </Text>
                          <Text size="sm" fw={600} c="bamboo.7">
                            {record.totalStrikes > 0
                              ? ((record.effectiveStrikes / record.totalStrikes) * 100).toFixed(0)
                              : 0}%
                          </Text>
                        </Box>
                        <Box>
                          <Text size="xs" c="wood.5">
                            体力效率
                          </Text>
                          <Text size="sm" fw={600} c="#4169E1">
                            {record.staminaEfficiency?.toFixed(0) || 0}
                          </Text>
                        </Box>
                      </Group>

                      {!compareMode && (
                        <Group gap="xs">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoad(record.id);
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#2E8B57',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Play size={12} />
                            加载
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(record.id);
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#CD5C5C',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Trash2 size={12} />
                            删除
                          </button>
                        </Group>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </ScrollArea>
          ) : (
            <Stack h="100%" align="center" justify="center">
              <Text size="sm" c="wood.5" ta="center">
                暂无符合条件的实验记录
                <br />
                完成实验后点击「保存记录」
              </Text>
            </Stack>
          )}
        </Stack>
      </Card>

      <Modal
        opened={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.id === 'compare' ? '📊 多记录对比分析' : '实验详情'}
        size="xl"
      >
        {selectedRecord?.id === 'compare' ? (
          <Stack gap="md">
            <Box
              p="md"
              style={{ backgroundColor: '#E6EEFA', borderRadius: '8px' }}
            >
              <Text size="sm" fw={600} c="#4169E1" mb="sm">
                ⚡ 综合能力对比雷达图
              </Text>
              <Box h={260}>
                {radarCompareData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarCompareData}>
                      <PolarGrid stroke="#E8D4A8" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#8B5A2B' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#A67C52' }} />
                      {compareRecords.map((r, i) => {
                        const key = `${r.participantCount}人${getStrategyName(r.cooperationStrategy)}(${i + 1})`;
                        return (
                          <Radar
                            key={r.id}
                            name={key}
                            dataKey={key}
                            stroke={radarColors[i]}
                            fill={radarColors[i]}
                            fillOpacity={0.15}
                            strokeWidth={2}
                          />
                        );
                      })}
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : null}
              </Box>
            </Box>

            <Box p="md" style={{ backgroundColor: '#F0F9F4', borderRadius: '8px' }}>
              <Text size="sm" fw={600} c="bamboo.7" mb="sm">
                📋 指标对比柱状图
              </Text>
              <Box h={200}>
                {compareData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FBF5E6',
                          border: '1px solid #D4B88C',
                          borderRadius: '6px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="有效率" name="有效率(%)" fill="#2E8B57" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="时产量" name="时产量(kg)" fill="#8B5A2B" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="体力效率" name="体力效率" fill="#4169E1" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </Box>
            </Box>

            <Box p="md" style={{ backgroundColor: '#FBF5E6', borderRadius: '8px' }}>
              <Text size="sm" fw={600} c="wood.7" mb="sm">
                📐 详细对比表
              </Text>
              <ScrollArea h={200}>
                <Box style={{ minWidth: 600 }}>
                  {compareRecords.map((r, i) => {
                    const effectiveRate = r.totalStrikes > 0 ? (r.effectiveStrikes / r.totalStrikes) * 100 : 0;
                    const yieldPerHour = r.duration > 0 ? (r.finalYield / r.duration) * 3600 : 0;
                    return (
                      <Box
                        key={r.id}
                        p="sm"
                        mb="xs"
                        style={{
                          backgroundColor: `${radarColors[i]}11`,
                          border: `1px solid ${radarColors[i]}44`,
                          borderRadius: '6px',
                        }}
                      >
                        <Group mb="sm">
                          <Badge color={radarColors[i]} size="sm">
                            {i + 1}. {r.participantCount}人{getStrategyName(r.cooperationStrategy)}
                          </Badge>
                          <Text size="xs" c="wood.5">
                            {formatDate(r.timestamp)}
                          </Text>
                        </Group>
                        <Group grow>
                          <Box>
                            <Text size="xs" c="wood.5">产量</Text>
                            <Text size="sm" fw={600} c="wood.8">{r.finalYield.toFixed(2)}kg</Text>
                          </Box>
                          <Box>
                            <Text size="xs" c="wood.5">有效率</Text>
                            <Text size="sm" fw={600} c="bamboo.7">{effectiveRate.toFixed(1)}%</Text>
                          </Box>
                          <Box>
                            <Text size="xs" c="wood.5">时产量</Text>
                            <Text size="sm" fw={600} c="wood.8">{yieldPerHour.toFixed(1)}kg/h</Text>
                          </Box>
                          <Box>
                            <Text size="xs" c="wood.5">体力消耗</Text>
                            <Text size="sm" fw={600} c="terracotta.7">{r.totalStaminaUsed?.toFixed(0) || 0}</Text>
                          </Box>
                          <Box>
                            <Text size="xs" c="wood.5">体力效率</Text>
                            <Text size="sm" fw={600} c="#4169E1">{r.staminaEfficiency?.toFixed(1) || 0}</Text>
                          </Box>
                          <Box>
                            <Text size="xs" c="wood.5">时长</Text>
                            <Text size="sm" fw={600} c="wood.8">{formatDuration(r.duration)}</Text>
                          </Box>
                        </Group>
                      </Box>
                    );
                  })}
                </Box>
              </ScrollArea>
            </Box>
          </Stack>
        ) : selectedRecord && (
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <Badge color={selectedRecord.mode === 'free' ? 'wood' : 'bamboo'}>
                  {selectedRecord.mode === 'free' ? '自由实验' : '目标挑战'}
                </Badge>
                <Badge color={PARTICIPANT_COLORS[selectedRecord.participantCount] || '#8B5A2B'} variant="light">
                  <Users size={12} />
                  {selectedRecord.participantCount}人 · {getStrategyName(selectedRecord.cooperationStrategy)}
                </Badge>
                <Text size="sm" c="wood.5">
                  {formatDate(selectedRecord.timestamp)}
                </Text>
              </Group>
            </Group>

            <Box p="md" style={{ backgroundColor: '#FBF5E6', borderRadius: '8px' }}>
              <Text size="sm" fw={500} c="wood.7" mb="sm">
                📐 参数配置
              </Text>
              <Group grow>
                <Box>
                  <Text size="xs" c="wood.5">踏板长度</Text>
                  <Text size="sm" fw={600} c="wood.8">{selectedRecord.params.pedalLength.toFixed(2)} m</Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">支点位置</Text>
                  <Text size="sm" fw={600} c="wood.8">{selectedRecord.params.pivotPosition.toFixed(2)} m</Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">踩踏频率</Text>
                  <Text size="sm" fw={600} c="wood.8">{selectedRecord.params.stepFrequency.toFixed(2)} Hz</Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">谷物重量</Text>
                  <Text size="sm" fw={600} c="wood.8">{selectedRecord.params.grainWeight.toFixed(1)} kg</Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">体力消耗</Text>
                  <Text size="sm" fw={600} c="terracotta.7">{selectedRecord.totalStaminaUsed?.toFixed(0) || 0}</Text>
                </Box>
              </Group>
            </Box>

            {selectedRecord.perPersonStats && selectedRecord.perPersonStats.length > 0 && (
              <Box p="md" style={{ backgroundColor: '#E6EEFA', borderRadius: '8px' }}>
                <Text size="sm" fw={500} c="#4169E1" mb="sm">
                  <Group gap="xs" style={{ display: 'inline-flex' }}>
                    <Users size={16} />
                    每人贡献统计
                  </Group>
                </Text>
                <Group grow>
                  {selectedRecord.perPersonStats.map((ps, i) => (
                    <Box
                      key={ps.id}
                      p="xs"
                      style={{
                        backgroundColor: `${PARTICIPANT_COLORS[i + 1] || '#8B5A2B'}11`,
                        borderRadius: '6px',
                        border: `1px solid ${PARTICIPANT_COLORS[i + 1] || '#8B5A2B'}44`,
                      }}
                    >
                      <Text size="xs" fw={600} c={PARTICIPANT_COLORS[i + 1] || '#8B5A2B'} ta="center" mb="xs">
                        {ps.name}
                      </Text>
                      <Stack gap={2}>
                        <Group justify="space-between">
                          <Text size="xs" c="wood.5">踩踏</Text>
                          <Text size="xs" fw={600} c="wood.7">{ps.steps}次</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="wood.5">体力</Text>
                          <Text size="xs" fw={600} c="terracotta.7">{ps.staminaUsed.toFixed(0)}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="wood.5">贡献</Text>
                          <Text size="xs" fw={600} c="bamboo.7">{ps.contributionRate.toFixed(0)}%</Text>
                        </Group>
                      </Stack>
                    </Box>
                  ))}
                </Group>
              </Box>
            )}

            <Box p="md" style={{ backgroundColor: '#F0F9F4', borderRadius: '8px' }}>
              <Text size="sm" fw={500} c="wood.7" mb="sm">
                📊 实验结果
              </Text>
              <Group grow>
                <Box>
                  <Text size="xs" c="wood.5">累计产量</Text>
                  <Text size="lg" fw={700} c="bamboo.7">{selectedRecord.finalYield.toFixed(2)} kg</Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">有效冲击率</Text>
                  <Text size="lg" fw={700} c="wood.8">
                    {selectedRecord.totalStrikes > 0
                      ? ((selectedRecord.effectiveStrikes / selectedRecord.totalStrikes) * 100).toFixed(1)
                      : 0}%
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">平均效率</Text>
                  <Text size="lg" fw={700} c="wood.8">{(selectedRecord.avgEfficiency * 3600).toFixed(1)} kg/h</Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">体力效率</Text>
                  <Text size="lg" fw={700} c="#4169E1">{selectedRecord.staminaEfficiency?.toFixed(1) || 0}</Text>
                </Box>
              </Group>
            </Box>

            {selectedRecord.efficiencyHistory && selectedRecord.efficiencyHistory.length > 0 && (
              <Box p="md" style={{ backgroundColor: '#FBF5E6', borderRadius: '8px' }}>
                <Text size="sm" fw={500} c="wood.7" mb="sm">
                  📈 效率曲线
                </Text>
                <Tabs defaultValue="efficiency" variant="pills">
                  <Tabs.List grow mb="sm">
                    <Tabs.Tab value="efficiency">效率曲线</Tabs.Tab>
                    <Tabs.Tab value="strikes">冲击统计</Tabs.Tab>
                    <Tabs.Tab value="yield">产量趋势</Tabs.Tab>
                    <Tabs.Tab value="stamina">体力消耗</Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="efficiency">
                    <Box h={180}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={selectedRecord.efficiencyHistory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                          <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#8B5A2B' }} domain={[0, 100]} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#FBF5E6', border: '1px solid #D4B88C', borderRadius: '6px' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Area yAxisId="left" type="monotone" dataKey="effectiveRate" name="有效冲击率(%)" fill="#2E8B5733" stroke="#2E8B57" strokeWidth={2} />
                          <Line yAxisId="right" type="monotone" dataKey="yieldPerHour" name="时产量(kg/h)" stroke="#8B5A2B" strokeWidth={2} dot={{ r: 2 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Box>
                  </Tabs.Panel>

                  <Tabs.Panel value="strikes">
                    <Box h={180}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={selectedRecord.efficiencyHistory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#FBF5E6', border: '1px solid #D4B88C', borderRadius: '6px' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Bar dataKey="totalStrikes" name="总舂击" fill="#8B5A2B" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="effectiveStrikes" name="有效冲击" fill="#2E8B57" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Tabs.Panel>

                  <Tabs.Panel value="yield">
                    <Box h={180}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={selectedRecord.efficiencyHistory.map((p) => ({
                            ...p,
                            累计产量: (p.yieldPerHour * p.time) / 3600,
                          }))}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#FBF5E6', border: '1px solid #D4B88C', borderRadius: '6px' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Area type="monotone" dataKey="累计产量" name="累计产量(kg)" fill="#8B5A2B33" stroke="#8B5A2B" strokeWidth={2} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Box>
                  </Tabs.Panel>

                  <Tabs.Panel value="stamina">
                    <Box h={180}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={selectedRecord.efficiencyHistory.map((p) => ({
                            time: p.time,
                            累计体力消耗: p.staminaUsed || 0,
                          }))}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8D4A8" />
                          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#8B5A2B' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#FBF5E6', border: '1px solid #D4B88C', borderRadius: '6px' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Area type="monotone" dataKey="累计体力消耗" name="体力消耗" fill="#CD5C5C33" stroke="#CD5C5C" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Tabs.Panel>
                </Tabs>
              </Box>
            )}

            <Group justify="flex-end">
              <button
                onClick={() => {
                  onLoad(selectedRecord.id);
                  setSelectedRecord(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2E8B57',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Play size={16} />
                加载此参数
              </button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
