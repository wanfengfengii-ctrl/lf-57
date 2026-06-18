import type { ChallengeConfig } from '../types';

export const CHALLENGES: ChallengeConfig[] = [
  {
    id: 'beginner',
    name: '初学乍练',
    targetYield: 2,
    timeLimit: 120,
    description: '在2分钟内产出2公斤白米',
    hint: '尝试调整支点位置找到最佳杠杆比',
  },
  {
    id: 'apprentice',
    name: '渐入佳境',
    targetYield: 5,
    timeLimit: 180,
    description: '在3分钟内产出5公斤白米',
    hint: '较高的频率可能带来更多舂击次数，但要注意有效高度',
  },
  {
    id: 'expert',
    name: '炉火纯青',
    targetYield: 10,
    timeLimit: 240,
    description: '在4分钟内产出10公斤白米',
    hint: '长踏板配合合理的支点位置能提供更大的冲击能量',
  },
  {
    id: 'master',
    name: '登峰造极',
    targetYield: 15,
    timeLimit: 300,
    description: '在5分钟内产出15公斤白米',
    hint: '需要在频率和力度之间找到完美平衡',
  },
];

export function getChallengeById(id: string): ChallengeConfig | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

export function getNextChallenge(currentId: string): ChallengeConfig | undefined {
  const currentIndex = CHALLENGES.findIndex((c) => c.id === currentId);
  if (currentIndex < CHALLENGES.length - 1) {
    return CHALLENGES[currentIndex + 1];
  }
  return undefined;
}
