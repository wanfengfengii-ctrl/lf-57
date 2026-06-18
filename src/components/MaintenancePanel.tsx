import { useState } from 'react';
import {
  Card,
  Group,
  Text,
  Stack,
  Box,
  Button,
  Badge,
  Tabs,
  Divider,
  Modal,
  Progress,
  SegmentedControl,
} from '@mantine/core';
import { Wrench, Droplets, RefreshCw, AlertTriangle, CheckCircle, Clock, Coins } from 'lucide-react';
import type {
  EquipmentState,
  EquipmentPartId,
  MaintenanceAction,
  MaintenanceActionType,
  MaintenanceStrategy,
  MaintenanceChallenge,
  MaintenanceRecord,
} from '../types';
import {
  EQUIPMENT_PARTS,
  MAINTENANCE_CHALLENGES,
  getMaintenanceActions,
  getMaintenanceActionName,
  getPartStatusLevel,
  getStatusColor,
  estimateMaintenanceCost,
  getOptimalMaintenanceInterval,
} from '../utils/equipment';

interface MaintenancePanelProps {
  equipment: EquipmentState;
  maintenanceStrategy: MaintenanceStrategy;
  maintenanceChallenge: MaintenanceChallenge | null;
  maintenanceBudgetRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  strikeFrequency: number;
  onStrategyChange: (strategy: MaintenanceStrategy) => void;
  onPerformMaintenance: (action: MaintenanceAction) => boolean;
  onChallengeChange: (challenge: MaintenanceChallenge | null) => void;
  disabled?: boolean;
}

export function MaintenancePanel({
  equipment,
  maintenanceStrategy,
  maintenanceChallenge,
  maintenanceBudgetRemaining,
  isRunning,
  isPaused,
  strikeFrequency,
  onStrategyChange,
  onPerformMaintenance,
  onChallengeChange,
  disabled = false,
}: MaintenancePanelProps) {
  const [selectedPart, setSelectedPart] = useState<EquipmentPartId>('pedal');
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [lastActionResult, setLastActionResult] = useState<{ success: boolean; message: string } | null>(null);

  const partIds = Object.keys(EQUIPMENT_PARTS) as EquipmentPartId[];
  const selectedPartConfig = EQUIPMENT_PARTS[selectedPart];
  const selectedPartState = equipment.parts[selectedPart];
  const maintenanceActions = getMaintenanceActions(selectedPart);

  const handleMaintenance = (action: MaintenanceAction) => {
    if (!isRunning || isPaused) {
      setLastActionResult({ success: false, message: '请先启动模拟' });
      return;
    }

    if (maintenanceChallenge && maintenanceBudgetRemaining < action.cost) {
      setLastActionResult({ success: false, message: '维护预算不足' });
      return;
    }

    const success = onPerformMaintenance(action);
    if (success) {
      setLastActionResult({
        success: true,
        message: `${getMaintenanceActionName(action.type)} ${selectedPartConfig.name}成功！`,
      });
    } else {
      setLastActionResult({ success: false, message: '维护操作失败' });
    }

    setTimeout(() => setLastActionResult(null), 2000);
  };

  const actionIcons: Record<MaintenanceActionType, any> = {
    reinforce: Wrench,
    lubricate: Droplets,
    replace: RefreshCw,
  };

  const actionColors: Record<MaintenanceActionType, string> = {
    reinforce: 'orange',
    lubricate: 'blue',
    replace: 'green',
  };

  const partsThatNeedMaintenance = partIds.filter((id) => {
    const part = equipment.parts[id];
    const level = getPartStatusLevel(part.wear, part.looseness);
    return level === 'poor' || level === 'critical';
  });

  const recentMaintenance = [...equipment.maintenanceHistory].reverse().slice(0, 5);

  return (
    <Card padding="lg" radius="md" h="100%">
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <Text size="lg" fw={600} c="wood.7">
              🔧 维护操作
            </Text>
          </Group>
          <Group gap="xs">
            {maintenanceChallenge && (
              <Badge color="blue" variant="light" size="sm">
                预算剩余: {maintenanceBudgetRemaining}
              </Badge>
            )}
          </Group>
        </Group>

        <Divider c="wood.2" />

        <Box>
          <Text size="xs" fw={500} c="wood.7" mb="xs">
            维护策略
          </Text>
          <SegmentedControl
            value={maintenanceStrategy}
            onChange={(v) => onStrategyChange(v as MaintenanceStrategy)}
            data={[
              { label: '带维护', value: 'withMaintenance' },
              { label: '无维护', value: 'withoutMaintenance' },
            ]}
            color="wood"
            size="sm"
            fullWidth
            disabled={isRunning && !isPaused}
          />
        </Box>

        {partsThatNeedMaintenance.length > 0 && isRunning && (
          <Box
            p="sm"
            style={{
              backgroundColor: '#FFF4E6',
              borderRadius: '6px',
              border: '1px solid #FFA50055',
            }}
          >
            <Group gap="xs" mb="xs">
              <AlertTriangle size={14} color="#FFA500" />
              <Text size="xs" fw={600} c="orange.7">
                部件需要维护
              </Text>
            </Group>
            <Group gap="xs" wrap="wrap">
              {partsThatNeedMaintenance.map((id) => {
                const part = EQUIPMENT_PARTS[id];
                const state = equipment.parts[id];
                const level = getPartStatusLevel(state.wear, state.looseness);
                return (
                  <Badge
                    key={id}
                    size="xs"
                    color={level === 'critical' ? 'red' : 'orange'}
                    variant="light"
                  >
                    {part.icon} {part.name}
                  </Badge>
                );
              })}
            </Group>
          </Box>
        )}

        {lastActionResult && (
          <Box
            p="xs"
            style={{
              backgroundColor: lastActionResult.success ? '#D4EFDF' : '#FFE4E1',
              borderRadius: '6px',
            }}
          >
            <Group gap="xs">
              {lastActionResult.success ? (
                <CheckCircle size={14} color="#2E8B57" />
              ) : (
                <AlertTriangle size={14} color="#CD5C5C" />
              )}
              <Text size="xs" fw={500} c={lastActionResult.success ? 'bamboo.7' : 'terracotta.7'}>
                {lastActionResult.message}
              </Text>
            </Group>
          </Box>
        )}

        <Tabs defaultValue="maintain" variant="pills">
          <Tabs.List grow>
            <Tabs.Tab value="maintain" size="sm">执行维护</Tabs.Tab>
            <Tabs.Tab value="history" size="sm">维护记录</Tabs.Tab>
            <Tabs.Tab value="challenge" size="sm">维护挑战</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="maintain" pt="md">
            <Stack gap="sm">
              <Box>
                <Text size="xs" fw={500} c="wood.7" mb="xs">
                  选择部件
                </Text>
                <Group gap="xs" wrap="wrap">
                  {partIds.map((id) => {
                    const part = EQUIPMENT_PARTS[id];
                    const state = equipment.parts[id];
                    const level = getPartStatusLevel(state.wear, state.looseness);
                    const color = getStatusColor(level);
                    const isSelected = selectedPart === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedPart(id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: isSelected ? `${color}22` : '#FAF6E8',
                          border: `1px solid ${isSelected ? color : '#D4B88C'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          color: isSelected ? color : '#8B5A2B',
                          fontWeight: isSelected ? 600 : 400,
                          transition: 'all 0.2s',
                        }}
                      >
                        <span>{part.icon}</span>
                        <span>{part.name}</span>
                      </button>
                    );
                  })}
                </Group>
              </Box>

              <Box
                p="sm"
                style={{
                  backgroundColor: '#FBF5E6',
                  borderRadius: '6px',
                  border: '1px solid #E8D4A8',
                }}
              >
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <Text size="lg">{selectedPartConfig.icon}</Text>
                    <Text size="sm" fw={600} c="wood.7">
                      {selectedPartConfig.name}
                    </Text>
                  </Group>
                  <Badge
                    size="xs"
                    color={
                      getPartStatusLevel(selectedPartState.wear, selectedPartState.looseness) === 'good'
                        ? 'bamboo'
                        : getPartStatusLevel(selectedPartState.wear, selectedPartState.looseness) === 'fair'
                        ? 'yellow'
                        : getPartStatusLevel(selectedPartState.wear, selectedPartState.looseness) === 'poor'
                        ? 'orange'
                        : 'red'
                    }
                    variant="light"
                  >
                    {getPartStatusLevel(selectedPartState.wear, selectedPartState.looseness) === 'good'
                      ? '状态良好'
                      : getPartStatusLevel(selectedPartState.wear, selectedPartState.looseness) === 'fair'
                      ? '状态一般'
                      : getPartStatusLevel(selectedPartState.wear, selectedPartState.looseness) === 'poor'
                      ? '状态较差'
                      : '状态危险'}
                  </Badge>
                </Group>

                <Text size="xs" c="wood.6" mb="sm">
                  {selectedPartConfig.description}
                </Text>

                <Group grow mb="sm">
                  <Box>
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" c="wood.6">磨损度</Text>
                      <Text size="xs" fw={500} c="wood.7">
                        {selectedPartState.wear.toFixed(1)}%
                      </Text>
                    </Group>
                    <Progress
                      value={selectedPartState.wear}
                      color={selectedPartState.wear > 70 ? 'red' : selectedPartState.wear > 40 ? 'yellow' : 'green'}
                      size="sm"
                      radius="sm"
                    />
                  </Box>
                  <Box>
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" c="wood.6">松动度</Text>
                      <Text size="xs" fw={500} c="wood.7">
                        {selectedPartState.looseness.toFixed(1)}%
                      </Text>
                    </Group>
                    <Progress
                      value={selectedPartState.looseness}
                      color={selectedPartState.looseness > 70 ? 'red' : selectedPartState.looseness > 40 ? 'orange' : 'blue'}
                      size="sm"
                      radius="sm"
                    />
                  </Box>
                </Group>

                <Group justify="space-between">
                  <Text size="xs" c="wood.5">
                    效率: {(selectedPartState.efficiencyFactor * 100).toFixed(1)}%
                  </Text>
                  <Text size="xs" c="wood.5">
                    累计冲击: {selectedPartState.totalStrikes} 次
                  </Text>
                </Group>
              </Box>

              <Stack gap="xs">
                {maintenanceActions.map((action) => {
                  const Icon = actionIcons[action.type];
                  const canAfford = !maintenanceChallenge || maintenanceBudgetRemaining >= action.cost;
                  const isDisabled = disabled || !isRunning || isPaused || !canAfford;
                  return (
                    <button
                      key={action.type}
                      onClick={() => handleMaintenance(action)}
                      disabled={isDisabled}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: isDisabled ? '#F5F0E8' : '#FBF5E6',
                        border: `1px solid ${isDisabled ? '#E8D4A8' : '#D4B88C'}`,
                        borderRadius: '6px',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: isDisabled ? 0.6 : 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      <Group gap="xs">
                        <Icon size={16} color={actionColors[action.type] === 'orange' ? '#DAA520' : actionColors[action.type] === 'blue' ? '#4169E1' : '#2E8B57'} />
                        <Box>
                          <Text size="sm" fw={600} c="wood.7">
                            {getMaintenanceActionName(action.type)}
                          </Text>
                          <Text size="xs" c="wood.5">
                            {action.description}
                          </Text>
                        </Box>
                      </Group>
                      <Group gap="xs">
                        <Badge size="xs" color="wood" variant="light">
                          <Coins size={10} /> {action.cost}
                        </Badge>
                        <Badge size="xs" color="terracotta" variant="light">
                          -{action.staminaCost} 体力
                        </Badge>
                      </Group>
                    </button>
                  );
                })}
              </Stack>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="md">
            <Stack gap="sm">
              {recentMaintenance.length > 0 ? (
                recentMaintenance.map((record) => {
                  const part = EQUIPMENT_PARTS[record.targetPart];
                  const Icon = actionIcons[record.action];
                  return (
                    <Box
                      key={record.id}
                      p="xs"
                      style={{
                        backgroundColor: '#FBF5E6',
                        borderRadius: '6px',
                        border: '1px solid #E8D4A8',
                      }}
                    >
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          <Icon size={14} color="#8B5A2B" />
                          <Text size="xs" fw={600} c="wood.7">
                            {getMaintenanceActionName(record.action)} {part.icon} {part.name}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <Badge size="xs" color="wood" variant="light">
                            {record.cost} 币
                          </Badge>
                          <Badge size="xs" color="terracotta" variant="light">
                            -{record.staminaUsed}
                          </Badge>
                        </Group>
                      </Group>
                      <Group justify="space-between">
                        <Text size="xs" c="wood.5">
                          磨损: {record.wearBefore.toFixed(0)}% → {record.wearAfter.toFixed(0)}%
                        </Text>
                        <Text size="xs" c="wood.5">
                          松动: {record.loosenessBefore.toFixed(0)}% → {record.loosenessAfter.toFixed(0)}%
                        </Text>
                        <Text size="xs" c="wood.5">
                          t={record.timestamp.toFixed(1)}s
                        </Text>
                      </Group>
                    </Box>
                  );
                })
              ) : (
                <Stack h={120} align="center" justify="center">
                  <Text size="xs" c="wood.5">
                    暂无维护记录
                  </Text>
                </Stack>
              )}

              <Box
                p="sm"
                style={{
                  backgroundColor: '#F5E6CC',
                  borderRadius: '6px',
                }}
              >
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={600} c="wood.7">
                    📊 维护统计
                  </Text>
                </Group>
                <Group grow>
                  <Box>
                    <Text size="xs" c="wood.5" ta="center">
                      总维护次数
                    </Text>
                    <Text size="sm" fw={700} c="wood.8" ta="center">
                      {equipment.maintenanceHistory.length}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="wood.5" ta="center">
                      总维护成本
                    </Text>
                    <Text size="sm" fw={700} c="terracotta.7" ta="center">
                      {equipment.totalMaintenanceCost} 币
                    </Text>
                  </Box>
                </Group>
              </Box>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="challenge" pt="md">
            <Stack gap="sm">
              <Box
                p="sm"
                style={{
                  backgroundColor: '#E6EEFA',
                  borderRadius: '6px',
                  border: '1px solid #4169E133',
                }}
              >
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={600} c="#4169E1">
                    🏆 维护挑战
                  </Text>
                  <button
                    onClick={() => setShowChallengeModal(true)}
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
                    选择挑战
                  </button>
                </Group>
                {maintenanceChallenge ? (
                  <Stack gap={4}>
                    <Text size="sm" fw={600} c="wood.7">
                      {maintenanceChallenge.name}
                    </Text>
                    <Text size="xs" c="wood.6">
                      {maintenanceChallenge.description}
                    </Text>
                    <Group grow mt="xs">
                      <Box p="xs" style={{ backgroundColor: 'white', borderRadius: '4px' }}>
                        <Text size="xs" c="wood.5" ta="center">
                          目标产量
                        </Text>
                        <Text size="sm" fw={700} c="bamboo.7" ta="center">
                          {maintenanceChallenge.targetYield} kg
                        </Text>
                      </Box>
                      <Box p="xs" style={{ backgroundColor: 'white', borderRadius: '4px' }}>
                        <Text size="xs" c="wood.5" ta="center">
                          维护预算
                        </Text>
                        <Text size="sm" fw={700} c="#4169E1" ta="center">
                          {maintenanceChallenge.budgetLimit} 币
                        </Text>
                      </Box>
                      {maintenanceChallenge.timeLimit && (
                        <Box p="xs" style={{ backgroundColor: 'white', borderRadius: '4px' }}>
                          <Text size="xs" c="wood.5" ta="center">
                            时间限制
                          </Text>
                          <Text size="sm" fw={700} c="terracotta.7" ta="center">
                            {maintenanceChallenge.timeLimit} s
                          </Text>
                        </Box>
                      )}
                    </Group>
                    <Badge
                      size="xs"
                      color={
                        maintenanceChallenge.difficulty === 'easy'
                          ? 'bamboo'
                          : maintenanceChallenge.difficulty === 'medium'
                          ? 'yellow'
                          : 'red'
                      }
                      variant="light"
                    >
                      难度:{' '}
                      {maintenanceChallenge.difficulty === 'easy'
                        ? '简单'
                        : maintenanceChallenge.difficulty === 'medium'
                        ? '中等'
                        : '困难'}
                    </Badge>
                  </Stack>
                ) : (
                  <Text size="xs" c="wood.5">
                    选择一个维护挑战开始游戏
                  </Text>
                )}
              </Box>

              <Box
                p="sm"
                style={{
                  backgroundColor: '#FAF6E8',
                  borderRadius: '6px',
                }}
              >
                <Text size="xs" fw={500} c="wood.7" mb="xs">
                  💡 维护建议
                </Text>
                <Stack gap={4}>
                  {partIds.map((id) => {
                    const part = EQUIPMENT_PARTS[id];
                    const interval = getOptimalMaintenanceInterval(id, strikeFrequency || 1);
                    return (
                      <Group key={id} justify="space-between">
                        <Text size="xs" c="wood.6">
                          {part.icon} {part.name}
                        </Text>
                        <Text size="xs" c="wood.5">
                          建议每 {interval}s 润滑一次
                        </Text>
                      </Group>
                    );
                  })}
                </Stack>
              </Box>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <Modal
        opened={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        title="选择维护挑战"
        size="md"
      >
        <Stack gap="sm">
          {MAINTENANCE_CHALLENGES.map((challenge) => (
            <button
              key={challenge.id}
              onClick={() => {
                onChallengeChange(challenge);
                setShowChallengeModal(false);
              }}
              style={{
                padding: '12px',
                backgroundColor:
                  maintenanceChallenge?.id === challenge.id ? '#E6EEFA' : '#FBF5E6',
                border: `1px solid ${maintenanceChallenge?.id === challenge.id ? '#4169E1' : '#D4B88C'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={600} c="wood.7">
                  {challenge.name}
                </Text>
                <Badge
                  size="xs"
                  color={
                    challenge.difficulty === 'easy'
                      ? 'bamboo'
                      : challenge.difficulty === 'medium'
                      ? 'yellow'
                      : 'red'
                  }
                >
                  {challenge.difficulty === 'easy'
                    ? '简单'
                    : challenge.difficulty === 'medium'
                    ? '中等'
                    : '困难'}
                </Badge>
              </Group>
              <Text size="xs" c="wood.6" mb="sm">
                {challenge.description}
              </Text>
              <Group grow>
                <Box>
                  <Text size="xs" c="wood.5">目标产量</Text>
                  <Text size="sm" fw={600} c="bamboo.7">
                    {challenge.targetYield} kg
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="wood.5">维护预算</Text>
                  <Text size="sm" fw={600} c="#4169E1">
                    {challenge.budgetLimit} 币
                  </Text>
                </Box>
                {challenge.timeLimit && (
                  <Box>
                    <Text size="xs" c="wood.5">时间限制</Text>
                    <Text size="sm" fw={600} c="terracotta.7">
                      {challenge.timeLimit}s
                    </Text>
                  </Box>
                )}
              </Group>
            </button>
          ))}
        </Stack>
      </Modal>
    </Card>
  );
}
