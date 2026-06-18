import { Group, Text, Stack, Box, Divider, Badge, SegmentedControl } from '@mantine/core';
import { FlaskConical, Target, Clock, Heart } from 'lucide-react';
import type { SimulationMode, ChallengeConfig } from '../types';
import { TIME_LIMIT_CHALLENGES, STAMINA_LIMIT_CHALLENGES, CHALLENGES } from '../utils/challenges';
import { useState } from 'react';

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
  const [challengeType, setChallengeType] = useState<'time' | 'stamina'>('time');

  const displayChallenges = challengeType === 'time' ? TIME_LIMIT_CHALLENGES : STAMINA_LIMIT_CHALLENGES;

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
            无限制，自由探索参数
          </Text>
        </button>

        <button
          onClick={() => {
            onModeChange('challenge');
            if (!currentChallenge) {
              const first = challengeType === 'time' ? TIME_LIMIT_CHALLENGES[0] : STAMINA_LIMIT_CHALLENGES[0];
              onChallengeChange(first);
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
            限定条件达成目标产量
          </Text>
        </button>
      </Group>

      {mode === 'challenge' && (
        <Box>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500} c="wood.7">
              选择挑战类型
            </Text>
          </Group>
          <SegmentedControl
            value={challengeType}
            onChange={(v) => {
              setChallengeType(v as any);
              const first = v === 'time' ? TIME_LIMIT_CHALLENGES[0] : STAMINA_LIMIT_CHALLENGES[0];
              onChallengeChange(first);
            }}
            data={[
              {
                label: (
                  <Group gap="xs" justify="center">
                    <Clock size={14} />
                    <Text size="xs" fw={500}>限时挑战</Text>
                  </Group>
                ),
                value: 'time',
              },
              {
                label: (
                  <Group gap="xs" justify="center">
                    <Heart size={14} />
                    <Text size="xs" fw={500}>体力挑战</Text>
                  </Group>
                ),
                value: 'stamina',
              },
            ]}
            disabled={disabled}
            color="wood"
            size="sm"
            fullWidth
            mb="sm"
          />

          <Text size="sm" fw={500} c="wood.7" mb="xs">
            选择挑战难度
          </Text>
          <Stack gap="xs">
            {displayChallenges.map((challenge) => (
              <button
                key={challenge.id}
                onClick={() => onChallengeChange(challenge)}
                disabled={disabled}
                style={{
                  padding: '12px',
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: currentChallenge?.id === challenge.id
                    ? challenge.type === 'timeLimit' ? '#F0F9F4' : '#FFF5EB'
                    : '#FAF6E8',
                  border: `2px solid ${currentChallenge?.id === challenge.id ? (challenge.type === 'timeLimit' ? '#2E8B57' : '#CD5C5C') : '#E8D4A8'}`,
                  borderRadius: '8px',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                <Group justify="space-between">
                  <Stack gap={0}>
                    <Group gap="xs" mb={2}>
                      <Text size="sm" fw={600} c="wood.8">
                        {challenge.name}
                      </Text>
                      <Badge
                        size="xs"
                        color={challenge.type === 'timeLimit' ? 'bamboo' : 'terracotta'}
                        variant="light"
                      >
                        {challenge.type === 'timeLimit' ? '⏰ 时间' : '❤️ 体力'}
                      </Badge>
                    </Group>
                    <Text size="xs" c="wood.5">
                      {challenge.description}
                    </Text>
                    <Text size="xs" c="wood.4" mt={4} style={{ fontStyle: 'italic' }}>
                      💡 {challenge.hint}
                    </Text>
                  </Stack>
                  <Stack gap={4} align="flex-end">
                    <Group gap={4}>
                      <Target size={12} color="#2E8B57" />
                      <Text size="xs" fw={600} c="bamboo.6">
                        {challenge.targetYield}kg
                      </Text>
                    </Group>
                    {challenge.type === 'timeLimit' ? (
                      <Group gap={4}>
                        <Clock size={12} color="#8B5A2B" />
                        <Text size="xs" fw={600} c="wood.7">
                          {Math.floor(challenge.timeLimit / 60)}分{challenge.timeLimit % 60 > 0 ? `${challenge.timeLimit % 60}秒` : '钟'}
                        </Text>
                      </Group>
                    ) : (
                      <Group gap={4}>
                        <Heart size={12} color="#CD5C5C" />
                        <Text size="xs" fw={600} c="terracotta.7">
                          {challenge.staminaLimit}点
                        </Text>
                      </Group>
                    )}
                  </Stack>
                </Group>
              </button>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
