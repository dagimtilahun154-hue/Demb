import type { BurnoutRiskResult, RecoveryPlan, RecoveryTask } from '@/types/burnout';

const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export function generateMockRecoveryPlan({
  userId,
  risk,
}: {
  userId: string;
  risk: BurnoutRiskResult;
}): RecoveryPlan {
  const walkingTask: RecoveryTask = {
    id: 'task_walk_200',
    type: 'walking',
    title: 'Gentle Reset Walk',
    target: '200 steps',
    durationMinutes: 8,
    verification: 'pedometer',
    rewardPoints: 25,
    recoveryValue: 24,
  };

  const breathingTask: RecoveryTask = {
    id: 'task_breathe_3',
    type: 'breathing',
    title: 'Three Minute Breathing Gap',
    target: '3 minutes',
    durationMinutes: 3,
    verification: 'timer',
    rewardPoints: 15,
    recoveryValue: 18,
  };

  const soundTask: RecoveryTask = {
    id: 'task_sound_5',
    type: 'sound_therapy',
    title: 'Calm Sound Reset',
    target: '5 minutes',
    durationMinutes: 5,
    verification: 'timer',
    rewardPoints: 20,
    recoveryValue: 22,
  };

  const screenOffTask: RecoveryTask = {
    id: 'task_screen_off_10',
    type: 'screen_off',
    title: 'Screen-Off Recovery',
    target: '10 minutes away from screens',
    durationMinutes: 10,
    verification: 'screen_off',
    rewardPoints: 30,
    recoveryValue: 30,
  };

  const tasks = risk.causes.includes('low movement')
    ? [walkingTask, breathingTask, soundTask]
    : [breathingTask, soundTask, screenOffTask];

  return {
    planId: id('plan'),
    userId,
    generatedAt: new Date().toISOString(),
    riskLevel: risk.status,
    primaryCauses: risk.causes.slice(0, 3),
    digitalRules: [
      {
        id: 'rule_social_120',
        appCategory: 'social_media',
        appName: 'TikTok',
        allowedMinutes: 40,
        windowMinutes: 120,
        recoveryRequiredAfterLimit: true,
      },
      {
        id: 'rule_night_screens',
        appCategory: 'social_media',
        appName: 'Instagram',
        allowedMinutes: 20,
        windowMinutes: 180,
        recoveryRequiredAfterLimit: true,
      },
    ],
    recoveryTasks: tasks,
    schedule: [
      { label: 'First reset', timeWindow: 'Now', taskId: tasks[0].id },
      { label: 'Midday support', timeWindow: 'After focused work', taskId: tasks[1].id },
      { label: 'Evening wind-down', timeWindow: 'Before sleep', taskId: tasks[2].id },
    ],
    buddyActions: [
      'Send one encouragement when the shield activates.',
      'Grow the shared recovery tree after each completed session.',
    ],
    explanation:
      'This mock AI plan turns Demb risk indicators into local rules and recovery tasks. It is ready for a real AI response later.',
    active: false,
  };
}
