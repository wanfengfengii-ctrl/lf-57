import { useRef, useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Group,
  Text,
  Paper,
  Box,
  Tabs,
  useMantineTheme,
} from '@mantine/core';
import { useSimulation } from '../hooks/useSimulation';
import { ControlPanel } from '../components/ControlPanel';
import { SimulationScene } from '../components/SimulationScene';
import { StatsPanel } from '../components/StatsPanel';
import { ModeSelector } from '../components/ModeSelector';
import { RecordList } from '../components/RecordList';
import { useSimulationStore } from '../store/simulationStore';

export function SimulationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>('stats');
  const { records, loadRecord, removeRecord, loadAllRecords } = useSimulationStore();

  useEffect(() => {
    loadAllRecords();
  }, [loadAllRecords]);

  const {
    params,
    state,
    mode,
    currentChallenge,
    challengeTimeRemaining,
    challengeStaminaRemaining,
    effectiveRate,
    yieldPerHour,
    staminaEfficiency,
    canvasWidth,
    canvasHeight,
    setParams,
    resetParams,
    start,
    pause,
    resume,
    reset,
    setMode,
    setChallenge,
    saveCurrentRecord,
    getValidationErrors,
    setParticipantCount,
    setCooperationStrategy,
    updateStepper,
    setTotalStaminaBudget,
  } = useSimulation(canvasRef);

  const errors = getValidationErrors();

  const handleSave = () => {
    saveCurrentRecord();
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: `
          linear-gradient(135deg, #FBF5E6 0%, #F5E6CC 50%, #FAF6E8 100%)
        `,
        backgroundAttachment: 'fixed',
      }}
    >
      <Container fluid size="100%" py="lg">
        <Paper
          p="md"
          mb="md"
          radius="md"
          style={{
            background: 'linear-gradient(135deg, #8B5A2B 0%, #6B4423 100%)',
            boxShadow: '0 4px 20px rgba(139, 90, 43, 0.3)',
          }}
        >
          <Group justify="space-between">
            <Group gap="md">
              <Text size="xl" fw={700} c="white">
                🌾 踏碓舂米效率模拟器
              </Text>
              <Text size="sm" c="wood.1">
                传统农具物理模拟 · 杠杆原理可视化
              </Text>
            </Group>
            <Group gap="xs">
              <Text size="xs" c="wood.1">
                基于 Matter.js 物理引擎
              </Text>
            </Group>
          </Group>
        </Paper>

        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 3 }}>
            <ControlPanel
              params={params}
              stepperStates={state.stepperStates || []}
              onChange={setParams}
              onParticipantCountChange={setParticipantCount}
              onStrategyChange={setCooperationStrategy}
              onStepperChange={updateStepper}
              onStaminaBudgetChange={setTotalStaminaBudget}
              totalStaminaUsed={state.totalStaminaUsed || 0}
              errors={errors}
              disabled={state.isRunning && !state.isPaused}
            />

            <Box mt="lg">
              <Paper p="lg" radius="md">
                <ModeSelector
                  mode={mode}
                  currentChallenge={currentChallenge}
                  onModeChange={setMode}
                  onChallengeChange={setChallenge}
                  disabled={state.isRunning && !state.isPaused}
                />
              </Paper>
            </Box>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <SimulationScene
              canvasRef={canvasRef}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              state={state}
              params={params}
              effectiveRate={effectiveRate}
              yieldPerHour={yieldPerHour}
              mode={mode}
              currentChallenge={currentChallenge}
              challengeTimeRemaining={challengeTimeRemaining}
              challengeStaminaRemaining={challengeStaminaRemaining}
              staminaEfficiency={staminaEfficiency}
              onStart={start}
              onPause={pause}
              onResume={resume}
              onReset={reset}
              onSave={handleSave}
              errors={errors}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }}>
            <Tabs
              value={activeTab}
              onChange={setActiveTab}
              variant="pills"
              orientation="horizontal"
            >
              <Tabs.List grow mb="md">
                <Tabs.Tab value="stats" size="sm">
                  📊 统计
                </Tabs.Tab>
                <Tabs.Tab value="records" size="sm">
                  📋 记录
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="stats">
                <StatsPanel
                  efficiencyHistory={state.efficiencyHistory}
                  state={state}
                  effectiveRate={effectiveRate}
                  yieldPerHour={yieldPerHour}
                  staminaEfficiency={staminaEfficiency}
                  participantCount={params.multiPerson?.participantCount || 1}
                  cooperationStrategy={params.multiPerson?.cooperationStrategy || 'synchronized'}
                  allRecords={records}
                />
              </Tabs.Panel>

              <Tabs.Panel value="records">
                <RecordList
                  records={records}
                  onLoad={loadRecord}
                  onDelete={removeRecord}
                />
              </Tabs.Panel>
            </Tabs>
          </Grid.Col>
        </Grid>

        <Paper p="md" mt="lg" radius="md">
          <Group justify="space-between" wrap="wrap">
            <Group gap="md">
              <Box>
                <Text size="xs" c="wood.5">
                  💡 使用说明
                </Text>
                <Text size="sm" c="wood.7">
                  调整左侧参数，点击「启动模拟」观察踏碓工作过程。碓头冲击高度不足
                  0.15m 时不计入有效舂击。
                </Text>
              </Box>
            </Group>
            <Group gap="xs">
              <Text size="xs" c="wood.5">
                物理常量: g=9.8m/s² | 碓头重15kg | 最小有效高度0.15m
              </Text>
            </Group>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
}
