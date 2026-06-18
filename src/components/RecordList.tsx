import { useState } from 'react';
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
} from '@mantine/core';
import { Trash2, Download, Play, X, History } from 'lucide-react';
import type { ExperimentRecord } from '../types';

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

export function RecordList({ records, onLoad, onDelete }: RecordListProps) {
  const [selectedRecord, setSelectedRecord] = useState<ExperimentRecord | null>(null);

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
            <Badge color="wood" variant="light">
              {records.length} 条记录
            </Badge>
          </Group>

          {records.length > 0 ? (
            <ScrollArea h={400} type="auto">
              <Stack gap="sm">
                {records.map((record) => (
                  <Box
                    key={record.id}
                    p="sm"
                    style={{
                      backgroundColor: '#FBF5E6',
                      border: '1px solid #E8D4A8',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setSelectedRecord(record)}
                  >
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <Badge
                          color={record.mode === 'free' ? 'wood' : 'bamboo'}
                          size="xs"
                        >
                          {record.mode === 'free' ? '自由实验' : '目标挑战'}
                        </Badge>
                        {record.challengeSuccess !== undefined && (
                          <Badge
                            color={record.challengeSuccess ? 'bamboo' : 'terracotta'}
                            size="xs"
                            variant="light"
                          >
                            {record.challengeSuccess ? '成功' : '失败'}
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
                          {record.finalYield.toFixed(2)} kg
                        </Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="wood.5">
                          有效冲击
                        </Text>
                        <Text size="sm" fw={600} c="bamboo.7">
                          {record.effectiveStrikes}/{record.totalStrikes}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="wood.5">
                          时长
                        </Text>
                        <Text size="sm" fw={600} c="wood.8">
                          {formatDuration(record.duration)}
                        </Text>
                      </Box>
                    </Group>

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
                        加载参数
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
                  </Box>
                ))}
              </Stack>
            </ScrollArea>
          ) : (
            <Stack h="100%" align="center" justify="center">
              <Text size="sm" c="wood.5" ta="center">
                暂无实验记录
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
        title="实验详情"
        size="lg"
      >
        {selectedRecord && (
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <Badge color={selectedRecord.mode === 'free' ? 'wood' : 'bamboo'}>
                  {selectedRecord.mode === 'free' ? '自由实验' : '目标挑战'}
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
                  <Text size="xs" c="wood.5">
                    踏板长度
                  </Text>
                  <Text size="sm" fw={600} c="wood.8">
                    {selectedRecord.params.pedalLength.toFixed(2)} m
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">
                    支点位置
                  </Text>
                  <Text size="sm" fw={600} c="wood.8">
                    {selectedRecord.params.pivotPosition.toFixed(2)} m
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">
                    踩踏频率
                  </Text>
                  <Text size="sm" fw={600} c="wood.8">
                    {selectedRecord.params.stepFrequency.toFixed(2)} Hz
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">
                    谷物重量
                  </Text>
                  <Text size="sm" fw={600} c="wood.8">
                    {selectedRecord.params.grainWeight.toFixed(1)} kg
                  </Text>
                </Box>
              </Group>
            </Box>

            <Box p="md" style={{ backgroundColor: '#F0F9F4', borderRadius: '8px' }}>
              <Text size="sm" fw={500} c="wood.7" mb="sm">
                📊 实验结果
              </Text>
              <Group grow>
                <Box>
                  <Text size="xs" c="wood.5">
                    累计产量
                  </Text>
                  <Text size="lg" fw={700} c="bamboo.7">
                    {selectedRecord.finalYield.toFixed(2)} kg
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">
                    有效冲击率
                  </Text>
                  <Text size="lg" fw={700} c="wood.8">
                    {selectedRecord.totalStrikes > 0
                      ? ((selectedRecord.effectiveStrikes / selectedRecord.totalStrikes) * 100).toFixed(1)
                      : 0}%
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">
                    平均效率
                  </Text>
                  <Text size="lg" fw={700} c="wood.8">
                    {(selectedRecord.avgEfficiency * 3600).toFixed(1)} kg/h
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">
                    最大高度
                  </Text>
                  <Text size="lg" fw={700} c="wood.8">
                    {selectedRecord.maxHeight.toFixed(2)} m
                  </Text>
                </Box>
              </Group>
            </Box>

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
