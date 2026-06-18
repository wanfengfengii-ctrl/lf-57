import { Group, Button, Text, Stack, Box, Divider } from '@mantine/core';
import { FlaskConical, Target } from 'lucide-react';
import type { SimulationMode, ChallengeConfig } from '../types';
import { CHALLENGES } from '../utils/challenges';

interface ModeSelectorProps {
  mode: SimulationMode;
  currentChallenge: ChallengeConfig | null;
  onModeChange: (mode: SimulationMode) => void;
  onChallengeChange: (challenge: ChallengeConfig | null) => void;
  disabled?: boolean;
}

export function ModeSelector({
  mode,
  currentChallenge,
  onModeChange,
  onChallengeChange,
  disabled,
}: ModeSelectorProps) {
  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="lg" fw={600} c="wood.7">
          🎮 实验模式
        </Text>
      </Group>

      <Divider c="wood.2" />

      <Group grow>
        <button
          onClick={() => {
            onModeChange('free');
            onChallengeChange(null);
          }}
          disabled={disabled}
          style={{
            padding: '16px',
            backgroundColor: mode === 'free' ? '#8B5A2B' : '#FAF6E8',
            color: mode === 'free' ? 'white' : '#8B5A2B',
            border: `2px solid ${mode === 'free' ? '#8B5A2B' : '#D4B88C'}`,
            borderRadius: '8px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <FlaskConical size={24} />
          <Text size="sm" fw={600}>
            自由实验
          </Text>
          <Text size="xs" style={{ opacity: 0.8 }}>
            无时间限制，自由探索参数
          </Text>
        </button>

        <button
          onClick={() => {
            onModeChange('challenge');
            if (!currentChallenge) {
              onChallengeChange(CHALLENGES[0]);
            }
          }}
          disabled={disabled}
          style={{
            padding: '16px',
            backgroundColor: mode === 'challenge' ? '#2E8B57' : '#FAF6E8',
            color: mode === 'challenge' ? 'white' : '#2E8B57',
            border: `2px solid ${mode === 'challenge' ? '#2E8B57' : '#D4B88C'}`,
            borderRadius: '8px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Target size={24} />
          <Text size="sm" fw={600}>
            目标挑战
          </Text>
          <Text size="xs" style={{ opacity: 0.8 }}>
            在限定时间内达成产量目标
          </Text>
        </button>
      </Group>

      {mode === 'challenge' && (
        <Box>
          <Text size="sm" fw={500} c="wood.7" mb="xs">
            选择挑战难度
          </Text>
          <Stack gap="xs">
            {CHALLENGES.map((challenge) => (
              <button
                key={challenge.id}
                onClick={() => onChallengeChange(challenge)}
                disabled={disabled}
                style={{
                  padding: '12px',
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: currentChallenge?.id === challenge.id
                    ? '#F0F9F4'
                    : '#FAF6E8',
                  border: `2px solid ${currentChallenge?.id === challenge.id ? '#2E8B57' : '#E8D4A8'}`,
                  borderRadius: '8px',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                <Group justify="space-between">
                  <Stack gap={0}>
                    <Text size="sm" fw={600} c="wood.8">
                      {challenge.name}
                    </Text>
                    <Text size="xs" c="wood.5">
                      {challenge.description}
                    </Text>
                  </Stack>
                  <Text size="xs" fw={600} c="bamboo.6">
                    {challenge.targetYield}kg / {Math.floor(challenge.timeLimit / 60)}分钟
                  </Text>
                </Group>
              </button>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
