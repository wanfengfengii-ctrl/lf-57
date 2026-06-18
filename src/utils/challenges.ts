import type { ChallengeConfig } from '../types';

export const CHALLENGES: ChallengeConfig[] = [
  {
    id: 'beginner',
    name: '初学乍练',
    type: 'timeLimit',
    targetYield: 2,
    timeLimit: 120,
    description: '在2分钟内产出2公斤白米',
    hint: '尝试调整支点位置找到最佳杠杆比',
  },
  {
    id: 'apprentice',
    name: '渐入佳境',
    type: 'timeLimit',
    targetYield: 5,
    timeLimit: 180,
    description: '在3分钟内产出5公斤白米',
    hint: '较高的频率可能带来更多舂击次数，但要注意有效高度',
  },
  {
    id: 'expert',
    name: '炉火纯青',
    type: 'timeLimit',
    targetYield: 10,
    timeLimit: 240,
    description: '在4分钟内产出10公斤白米',
    hint: '长踏板配合合理的支点位置能提供更大的冲击能量',
  },
  {
    id: 'master',
    name: '登峰造极',
    type: 'timeLimit',
    targetYield: 15,
    timeLimit: 300,
    description: '在5分钟内产出15公斤白米',
    hint: '需要在频率和力度之间找到完美平衡',
  },
  {
    id: 'stamina_saver',
    name: '体力节约',
    type: 'staminaLimit',
    targetYield: 3,
    staminaLimit: 150,
    description: '使用不超过150点体力产出3公斤白米',
    hint: '提高有效冲击率能显著节省体力，尝试使用协同模式',
  },
  {
    id: 'stamina_team',
    name: '团队协作',
    type: 'staminaLimit',
    targetYield: 8,
    staminaLimit: 300,
    description: '使用2-3人协同模式，在300点体力预算内产出8公斤白米',
    hint: '交替或波浪策略能平衡每个人的体力消耗',
  },
  {
    id: 'stamina_master',
    name: '精打细算',
    type: 'staminaLimit',
    targetYield: 12,
    staminaLimit: 400,
    description: '极限挑战：400点体力预算内产出12公斤白米',
    hint: '精确设置每人的节奏与力度，最大化体力效率',
  },
];

export const TIME_LIMIT_CHALLENGES = CHALLENGES.filter(c => c.type === 'timeLimit');
export const STAMINA_LIMIT_CHALLENGES = CHALLENGES.filter(c => c.type === 'staminaLimit');

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
