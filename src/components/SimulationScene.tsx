import { useRef, useEffect } from 'react';
import { Card, Group, Text, Badge, Stack, Box, Progress, Divider } from '@mantine/core';
import { Play, Pause, RotateCcw, ArrowRight, Users, Heart, Activity } from 'lucide-react';
import type { SimulationState, SimulationParams, ChallengeConfig } from '../types';
import { DEFAULT_PHYSICS_CONFIG } from '../utils/physics';
import { getStrategyName } from '../utils/validation';

interface SimulationSceneProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasWidth: number;
  canvasHeight: number;
  state: SimulationState;
  params: SimulationParams;
  effectiveRate: number;
  yieldPerHour: number;
  mode: 'free' | 'challenge';
  currentChallenge: ChallengeConfig | null;
  challengeTimeRemaining: number;
  challengeStaminaRemaining: number;
  staminaEfficiency: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSave: () => void;
  errors: Record<string, string>;
}

const STEPPER_COLORS: Record<number, string> = {
  1: '#8B5A2B',
  2: '#2E8B57',
  3: '#4169E1',
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function SimulationScene({
  canvasRef,
  canvasWidth,
  canvasHeight,
  state,
  params,
  effectiveRate,
  yieldPerHour,
  mode,
  currentChallenge,
  challengeTimeRemaining,
  challengeStaminaRemaining,
  staminaEfficiency,
  onStart,
  onPause,
  onResume,
  onReset,
  onSave,
  errors,
}: SimulationSceneProps) {
  const hasErrors = Object.keys(errors).length > 0;
  const canStart = !hasErrors && !state.isRunning;
  const heightPercentage = Math.min(
    100,
    (state.currentHeight / Math.max(0.5, state.maxHeight || 0.5)) * 100
  );
  const progressPercentage = currentChallenge
    ? Math.min(100, (state.accumulatedYield / currentChallenge.targetYield) * 100)
    : 0;
  const staminaPercentage = currentChallenge?.type === 'staminaLimit' && currentChallenge.staminaLimit
    ? Math.max(0, Math.min(100, (challengeStaminaRemaining / currentChallenge.staminaLimit) * 100))
    : 0;

  const isStaminaChallenge = currentChallenge?.type === 'staminaLimit';

  const challengeComplete =
    mode === 'challenge' &&
    !state.isRunning &&
    currentChallenge &&
    state.elapsedTime > 0;

  const challengeSuccess =
    currentChallenge && state.accumulatedYield >= currentChallenge.targetYield;

  const participantCount = params.multiPerson?.participantCount || 1;
  const cooperationStrategy = params.multiPerson?.cooperationStrategy || 'synchronized';
  const steppers = params.multiPerson?.steppers || [];
  const stepperStates = state.stepperStates || [];

  return (
    <Card padding="lg" radius="md" h="100%">
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <Text size="lg" fw={600} c="wood.7">
              🏺 踏碓舂米模拟
            </Text>
            <Badge color={mode === 'free' ? 'wood' : 'bamboo'} variant="light">
              {mode === 'free' ? '自由实验' : '目标挑战'}
            </Badge>
            <Badge color={STEPPER_COLORS[participantCount] || '#8B5A2B'} variant="light">
              <Group gap={4} style={{ display: 'inline-flex' }}>
                <Users size={12} />
                {participantCount}人 · {getStrategyName(cooperationStrategy)}
              </Group>
            </Badge>
          </Group>
          <Text size="sm" c="wood.5">
            运行时长: {formatTime(state.elapsedTime)}
          </Text>
        </Group>

        {mode === 'challenge' && currentChallenge && (
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500} c="wood.7">
                🎯 {currentChallenge.name}: {currentChallenge.description}
              </Text>
              <Group gap="md">
                {!isStaminaChallenge && (
                  <Text
                    size="sm"
                    fw={600}
                    c={challengeTimeRemaining < 30 ? 'terracotta.6' : 'wood.7'}
                  >
                    ⏱️ {formatTime(challengeTimeRemaining)}
                  </Text>
                )}
                {isStaminaChallenge && (
                  <Text
                    size="sm"
                    fw={600}
                    c={staminaPercentage < 20 ? 'terracotta.6' : '#CD5C5C'}
                  >
                    <Group gap={4} style={{ display: 'inline-flex' }}>
                      <Heart size={14} />
                      {challengeStaminaRemaining.toFixed(0)}/{currentChallenge.staminaLimit}
                    </Group>
                  </Text>
                )}
              </Group>
            </Group>
            <Progress
              value={progressPercentage}
              color={challengeSuccess ? 'bamboo' : 'wood'}
              size="sm"
            />
            {isStaminaChallenge && (
              <Progress
                value={staminaPercentage}
                color={staminaPercentage < 20 ? 'terracotta' : 'red'}
                size="xs"
                mt="xs"
              />
            )}
            <Group justify="space-between" mt="xs">
              <Text size="xs" c="wood.5">
                当前产量: {state.accumulatedYield.toFixed(2)} kg
              </Text>
              <Text size="xs" c="wood.5">
                目标: {currentChallenge.targetYield} kg
              </Text>
              {isStaminaChallenge && (
                <Text size="xs" c="wood.5">
                  消耗体力: {state.totalStaminaUsed?.toFixed(0) || 0}
                </Text>
              )}
            </Group>
          </Box>
        )}

        {participantCount > 1 && (
          <Box
            p="sm"
            style={{
              backgroundColor: '#FBF5E6',
              borderRadius: '8px',
              border: '1px solid #E8D4A8',
            }}
          >
            <Group mb="xs" justify="space-between">
              <Group gap="xs">
                <Activity size={14} color="#8B5A2B" />
                <Text size="xs" fw={500} c="wood.7">
                  踩踏者状态
                </Text>
              </Group>
              <Text size="xs" fw={500} c="#4169E1">
                体力效率: {staminaEfficiency.toFixed(1)}
              </Text>
            </Group>
            <Group grow>
              {steppers.slice(0, participantCount).map((sp, idx) => {
                const ss = stepperStates[idx];
                const staminaPct = ss ? Math.max(0, Math.min(100, (ss.currentStamina / ss.maxStamina) * 100)) : 100;
                const stepsInLastInterval = ss?.totalSteps || 0;
                const isActive = state.isRunning && stepsInLastInterval > 0;
                return (
                  <Box key={sp.id}>
                    <Group justify="space-between" mb={4}>
                      <Text
                        size="xs"
                        fw={600}
                        c={STEPPER_COLORS[idx + 1] || '#8B5A2B'}
                      >
                        {sp.name}{isActive ? ' 💪' : ''}
                      </Text>
                      <Text size="xs" c="wood.5">
                        {ss?.currentStamina.toFixed(0) || 100}
                      </Text>
                    </Group>
                    <Progress
                      value={staminaPct}
                      color={staminaPct < 30 ? 'terracotta' : STEPPER_COLORS[idx + 1] || '#8B5A2B'}
                      size="xs"
                    />
                    <Group justify="space-between" mt={4}>
                      <Text size="xs" c="wood.4">
                        {sp.stepFrequency.toFixed(1)}Hz
                      </Text>
                      <Text size="xs" c="wood.4">
                        ×{sp.forceMultiplier.toFixed(1)}
                      </Text>
                    </Group>
                  </Box>
                );
              })}
            </Group>
          </Box>
        )}

        {participantCount === 1 && (
          <Box
            p="sm"
            style={{
              backgroundColor: '#FFF5EB',
              borderRadius: '8px',
              border: '1px solid #FFD4A8',
            }}
          >
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <Heart size={14} color="#CD5C5C" />
                <Text size="xs" fw={500} c="terracotta.7">
                  体力状态
                </Text>
              </Group>
              <Group gap="md">
                <Text size="xs" fw={600} c="wood.7">
                  剩余: {stepperStates[0]?.currentStamina.toFixed(0) || 100}/100
                </Text>
                <Text size="xs" c="wood.5">
                  已消耗: {state.totalStaminaUsed?.toFixed(0) || 0}
                </Text>
                <Text size="xs" fw={600} c="#4169E1">
                  效率: {staminaEfficiency.toFixed(1)}
                </Text>
              </Group>
            </Group>
            <Progress
              value={stepperStates[0]?.currentStamina || 100}
              color={(stepperStates[0]?.currentStamina || 100) < 30 ? 'terracotta' : 'bamboo'}
              size="xs"
              mt="xs"
            />
          </Box>
        )}

        {challengeComplete && (
          <Box
            p="md"
            style={{
              backgroundColor: challengeSuccess ? '#F0F9F4' : '#FFF5F0',
              borderRadius: '8px',
              border: `1px solid ${challengeSuccess ? '#A8DFBD' : '#FFC9AD'}`,
            }}
          >
            <Group justify="space-between">
              <Text size="md" fw={600} c={challengeSuccess ? 'bamboo.7' : 'terracotta.7'}>
                {challengeSuccess ? '🎉 挑战成功！' : isStaminaChallenge ? '❤️ 体力耗尽' : '⏰ 时间到'}
              </Text>
              <Group gap="md">
                <Text size="sm" c="wood.6">
                  最终产量: {state.accumulatedYield.toFixed(2)} kg
                </Text>
                {isStaminaChallenge && (
                  <Text size="sm" c="terracotta.6">
                    消耗体力: {state.totalStaminaUsed?.toFixed(0) || 0}
                  </Text>
                )}
              </Group>
            </Group>
            {!challengeSuccess && currentChallenge && (
              <Text size="xs" c="wood.5" mt="xs">
                💡 提示: {currentChallenge.hint}
              </Text>
            )}
            {challengeSuccess && participantCount > 1 && (
              <Text size="xs" c="bamboo.6" mt="xs">
                🏆 多人协同效率优异！体力效率: {staminaEfficiency.toFixed(1)}
              </Text>
            )}
          </Box>
        )}

        <Box
          style={{
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '2px solid #E8D4A8',
            backgroundColor: '#FDF5E6',
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              maxHeight: '400px',
            }}
          />

          <Box
            style={{
              position: 'absolute',
              right: '12px',
              top: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <Box
              p="xs"
              style={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '6px',
                minWidth: '80px',
              }}
            >
              <Text size="xs" c="wood.5" ta="center">
                碓头高度
              </Text>
              <Text size="lg" fw={700} c="wood.8" ta="center">
                {state.currentHeight.toFixed(2)}
                <Text size="xs" span c="wood.5">
                  m
                </Text>
              </Text>
              <Progress
                value={heightPercentage}
                color={
                  state.currentHeight >= DEFAULT_PHYSICS_CONFIG.MIN_EFFECTIVE_HEIGHT
                    ? 'bamboo'
                    : 'terracotta'
                }
                size="sm"
                mt="xs"
              />
              <Text size="xs" c="wood.4" ta="center" mt="xs">
                最高: {state.maxHeight.toFixed(2)}m
              </Text>
            </Box>
          </Box>

          {state.isPaused && (
            <Box
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(253,245,230,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text size="xl" fw={700} c="wood.7">
                ⏸️ 已暂停
              </Text>
            </Box>
          )}

          {!state.isRunning && state.elapsedTime === 0 && !hasErrors && (
            <Box
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(253,245,230,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Stack align="center" gap="sm">
                <Text size="lg" fw={600} c="wood.7">
                  点击「启动」开始模拟
                </Text>
                <Text size="sm" c="wood.5">
                  调整左侧参数优化舂米效率
                </Text>
              </Stack>
            </Box>
          )}

          {hasErrors && (
            <Box
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255,245,240,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Stack align="center" gap="sm">
                <Text size="lg" fw={600} c="terracotta.7">
                  ⚠️ 参数有误
                </Text>
                {Object.values(errors).map((error, i) => (
                  <Text key={i} size="sm" c="terracotta.6">
                    {error}
                  </Text>
                ))}
              </Stack>
            </Box>
          )}
        </Box>

        <Group grow>
          {!state.isRunning ? (
            <button
              onClick={onStart}
              disabled={!canStart}
              style={{
                padding: '12px 24px',
                backgroundColor: canStart ? '#8B5A2B' : '#C4A26E',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: canStart ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <Play size={18} />
              启动模拟
            </button>
          ) : state.isPaused ? (
            <button
              onClick={onResume}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2E8B57',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Play size={18} />
              继续
            </button>
          ) : (
            <button
              onClick={onPause}
              style={{
                padding: '12px 24px',
                backgroundColor: '#A67C52',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Pause size={18} />
              暂停
            </button>
          )}

          <button
            onClick={onReset}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6B4423',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <RotateCcw size={18} />
            重置
          </button>

          <button
            onClick={onSave}
            disabled={state.elapsedTime < 1}
            style={{
              padding: '12px 24px',
              backgroundColor: state.elapsedTime >= 1 ? '#2E8B57' : '#A8DFBD',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: state.elapsedTime >= 1 ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            保存记录
            <ArrowRight size={18} />
          </button>
        </Group>

        <Group grow>
          <Box p="sm" style={{ backgroundColor: '#F5E6CC', borderRadius: '8px' }}>
            <Text size="xs" c="wood.5" ta="center">
              总舂击次数
            </Text>
            <Text size="xl" fw={700} c="wood.8" ta="center">
              {state.totalStrikes}
            </Text>
          </Box>
          <Box p="sm" style={{ backgroundColor: '#D4EFDF', borderRadius: '8px' }}>
            <Text size="xs" c="wood.5" ta="center">
              有效冲击率
            </Text>
            <Text
              size="xl"
              fw={700}
              c={effectiveRate >= 80 ? 'bamboo.7' : effectiveRate >= 50 ? 'wood.7' : 'terracotta.7'}
              ta="center"
            >
              {effectiveRate.toFixed(1)}%
            </Text>
          </Box>
          <Box p="sm" style={{ backgroundColor: '#FAF6E8', borderRadius: '8px' }}>
            <Text size="xs" c="wood.5" ta="center">
              累计产量
            </Text>
            <Text size="xl" fw={700} c="wood.8" ta="center">
              {state.accumulatedYield.toFixed(2)}
              <Text size="sm" span c="wood.5">
                kg
              </Text>
            </Text>
          </Box>
          <Box p="sm" style={{ backgroundColor: '#FFE4D6', borderRadius: '8px' }}>
            <Text size="xs" c="wood.5" ta="center">
              时产量
            </Text>
            <Text size="xl" fw={700} c="wood.8" ta="center">
              {yieldPerHour.toFixed(1)}
              <Text size="sm" span c="wood.5">
                kg/h
              </Text>
            </Text>
          </Box>
        </Group>
      </Stack>
    </Card>
  );
}
