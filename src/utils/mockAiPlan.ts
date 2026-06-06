import type {
  BurnoutCause,
  BurnoutRiskResult,
  RecoveryPlan,
  RecoveryTask,
  RecoveryTaskType,
  SupportChatAction,
  SupportChatMessage,
} from '@/types/burnout';
import { hasSupabaseConfig, supabase } from './supabase';

const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
const aiEngineUrl = (process.env.EXPO_PUBLIC_AI_ENGINE_URL || '').replace(/\/$/, '');

const taskTypes: RecoveryTaskType[] = [
  'walking',
  'breathing',
  'screen_off',
  'hydration',
  'reading',
  'sound_therapy',
  'sleep_preparation',
];

const chatActions: SupportChatAction[] = [
  'start_focus',
  'start_recovery_task',
  'delay_app',
  'update_intention',
  'ask_buddy',
  'mood_checkin',
];

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
};

const normalizeTask = (task: any, fallback: RecoveryTask): RecoveryTask => {
  const type = taskTypes.includes(task?.type) ? task.type : fallback.type;
  return {
    id: typeof task?.id === 'string' ? task.id : id('task'),
    type,
    title: typeof task?.title === 'string' && task.title.trim() ? task.title.trim().slice(0, 48) : fallback.title,
    target: typeof task?.target === 'string' && task.target.trim() ? task.target.trim().slice(0, 120) : fallback.target,
    durationMinutes: clamp(task?.durationMinutes, 1, 90, fallback.durationMinutes),
    verification: ['timer', 'pedometer', 'screen_off', 'manual'].includes(task?.verification) ? task.verification : fallback.verification,
    rewardPoints: clamp(task?.rewardPoints, 5, 60, fallback.rewardPoints),
    recoveryValue: clamp(task?.recoveryValue, 5, 60, fallback.recoveryValue),
  };
};

// Heuristic fallback generator when offline or when AI output is invalid.
export function generateLocalRecoveryPlan({
  userId,
  risk,
}: {
  userId: string;
  risk: BurnoutRiskResult;
}): RecoveryPlan {
  const walkingTask: RecoveryTask = {
    id: id('task_walk'),
    type: 'walking',
    title: 'Gentle Walk',
    target: 'Walk outside or around the room for 10 minutes.',
    durationMinutes: 10,
    verification: 'pedometer',
    rewardPoints: 25,
    recoveryValue: 25,
  };

  const readingTask: RecoveryTask = {
    id: id('task_read'),
    type: 'reading',
    title: 'Offline Reading',
    target: 'Read something offline for 15 minutes.',
    durationMinutes: 15,
    verification: 'timer',
    rewardPoints: 20,
    recoveryValue: 20,
  };

  const screenOffTask: RecoveryTask = {
    id: id('task_screen_off'),
    type: 'screen_off',
    title: 'Screen-Off Reset',
    target: 'Put the phone away for 30 minutes.',
    durationMinutes: 30,
    verification: 'screen_off',
    rewardPoints: 35,
    recoveryValue: 35,
  };

  const breathingTask: RecoveryTask = {
    id: id('task_breathe'),
    type: 'breathing',
    title: 'Breathing Gap',
    target: 'Breathe slowly for 5 minutes before reopening anything.',
    durationMinutes: 5,
    verification: 'timer',
    rewardPoints: 15,
    recoveryValue: 15,
  };

  const tasks = risk.causes.includes('low movement')
    ? [walkingTask, readingTask, screenOffTask]
    : [breathingTask, readingTask, screenOffTask];

  return {
    planId: id('plan'),
    userId,
    generatedAt: new Date().toISOString(),
    riskLevel: risk.status,
    primaryCauses: risk.causes.slice(0, 3),
    digitalRules: [
      {
        id: id('rule_social'),
        appCategory: 'social_media',
        appName: 'Social Apps',
        allowedMinutes: 40,
        windowMinutes: 120,
        recoveryRequiredAfterLimit: true,
      },
    ],
    recoveryTasks: tasks,
    schedule: [
      { label: 'Morning focus', timeWindow: '08:00 - 10:00', taskId: tasks[0].id },
      { label: 'Afternoon reset', timeWindow: '14:00 - 16:00', taskId: tasks[1].id },
      { label: 'Evening wind-down', timeWindow: '20:00 - 21:00', taskId: tasks[2].id },
    ],
    buddyActions: ['Ask one buddy for a check-in.', 'Send a cheer after a recovery task.'],
    explanation: 'Created locally from your usage and recovery signals. It keeps social use bounded while giving your nervous system short recovery exits.',
    active: true,
    lockScreenMessage: 'Pause here. One small reset first.',
    supportPrompts: [
      'What are you trying to feel by opening this app?',
      'Name the next small recovery action.',
      'Do you want a focus window or a softer reset?',
    ],
    dailyCheckInTime: '20:00',
    emotionalSupportTone: 'calm, brief, practical',
    aiActions: ['start_focus', 'start_recovery_task', 'delay_app', 'mood_checkin'],
  };
}

export function validateRecoveryPlan(input: any, userId: string, risk: BurnoutRiskResult): RecoveryPlan {
  const fallback = generateLocalRecoveryPlan({ userId, risk });
  const rawTasks = Array.isArray(input?.recoveryTasks) ? input.recoveryTasks : [];
  const recoveryTasks = rawTasks.length > 0
    ? rawTasks.slice(0, 5).map((task: any, index: number) => normalizeTask(task, fallback.recoveryTasks[index] ?? fallback.recoveryTasks[0]))
    : fallback.recoveryTasks;

  return {
    planId: typeof input?.planId === 'string' ? input.planId : id('plan'),
    userId,
    generatedAt: new Date().toISOString(),
    riskLevel: risk.status,
    primaryCauses: Array.isArray(input?.primaryCauses)
      ? input.primaryCauses.filter((cause: BurnoutCause) => risk.causes.includes(cause)).slice(0, 4)
      : fallback.primaryCauses,
    digitalRules: Array.isArray(input?.digitalRules) && input.digitalRules.length > 0
      ? input.digitalRules.slice(0, 4).map((rule: any) => ({
          id: typeof rule?.id === 'string' ? rule.id : id('rule'),
          appCategory: typeof rule?.appCategory === 'string' ? rule.appCategory : 'social_media',
          appName: typeof rule?.appName === 'string' ? rule.appName : 'Social Apps',
          allowedMinutes: clamp(rule?.allowedMinutes, 5, 120, 40),
          windowMinutes: clamp(rule?.windowMinutes, 30, 360, 120),
          recoveryRequiredAfterLimit: Boolean(rule?.recoveryRequiredAfterLimit ?? true),
        }))
      : fallback.digitalRules,
    recoveryTasks,
    schedule: Array.isArray(input?.schedule) && input.schedule.length > 0
      ? input.schedule.slice(0, 5).map((slot: any, index: number) => ({
          label: typeof slot?.label === 'string' ? slot.label.slice(0, 48) : fallback.schedule[index]?.label ?? 'Recovery window',
          timeWindow: typeof slot?.timeWindow === 'string' ? slot.timeWindow.slice(0, 32) : fallback.schedule[index]?.timeWindow ?? '20:00 - 21:00',
          taskId: recoveryTasks.find((task: RecoveryTask) => task.id === slot?.taskId)?.id ?? recoveryTasks[index % recoveryTasks.length]?.id,
        }))
      : fallback.schedule,
    buddyActions: Array.isArray(input?.buddyActions) && input.buddyActions.length > 0
      ? input.buddyActions.filter((item: unknown) => typeof item === 'string').slice(0, 3)
      : fallback.buddyActions,
    explanation: typeof input?.explanation === 'string' && input.explanation.trim()
      ? input.explanation.trim().slice(0, 280)
      : fallback.explanation,
    active: true,
    lockScreenMessage: typeof input?.lockScreenMessage === 'string' ? input.lockScreenMessage.slice(0, 90) : fallback.lockScreenMessage,
    supportPrompts: Array.isArray(input?.supportPrompts)
      ? input.supportPrompts.filter((item: unknown) => typeof item === 'string').slice(0, 5)
      : fallback.supportPrompts,
    dailyCheckInTime: typeof input?.dailyCheckInTime === 'string' ? input.dailyCheckInTime.slice(0, 5) : fallback.dailyCheckInTime,
    emotionalSupportTone: typeof input?.emotionalSupportTone === 'string' ? input.emotionalSupportTone.slice(0, 80) : fallback.emotionalSupportTone,
    aiActions: Array.isArray(input?.aiActions)
      ? input.aiActions.filter((action: SupportChatAction) => chatActions.includes(action)).slice(0, 6)
      : fallback.aiActions,
  };
}

export async function generateAiRecoveryPlan({
  userId,
  risk,
  userProfile,
  latestBiometrics,
  observationSummary,
}: {
  userId: string;
  risk: BurnoutRiskResult;
  userProfile: any;
  latestBiometrics: any;
  observationSummary: any;
}): Promise<RecoveryPlan> {
  if (aiEngineUrl) {
    try {
      const response = await fetch(`${aiEngineUrl}/recovery-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          risk,
          userProfile,
          latestBiometrics,
          observationSummary,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return validateRecoveryPlan(data?.plan ?? data, userId, risk);
      }
      console.log('[AI Plan] Hugging Face AI engine failed:', response.status);
    } catch (error) {
      console.log('[AI Plan] Hugging Face AI engine unreachable:', error);
    }
  }

  if (!hasSupabaseConfig || !supabase) {
    return generateLocalRecoveryPlan({ userId, risk });
  }

  const { data, error } = await supabase.functions.invoke('groq-recovery-plan', {
    body: {
      userId,
      risk,
      userProfile,
      latestBiometrics,
      observationSummary,
    },
  });

  if (error) {
    console.log('[AI Plan] Supabase Groq function failed, falling back locally:', error.message);
    return generateLocalRecoveryPlan({ userId, risk });
  }

  return validateRecoveryPlan(data?.plan ?? data, userId, risk);
}

export async function generateSupportReply({
  text,
  messages,
  recoveryPlan,
  risk,
  observationSummary,
}: {
  text: string;
  messages: SupportChatMessage[];
  recoveryPlan: RecoveryPlan | null;
  risk: BurnoutRiskResult;
  observationSummary: any;
}): Promise<{ text: string; suggestedAction?: SupportChatAction; source: 'groq' | 'local' }> {
  if (aiEngineUrl) {
    try {
      const response = await fetch(`${aiEngineUrl}/support-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          recentMessages: messages.slice(0, 10).map(message => ({
            role: message.role,
            text: message.text,
            createdAt: message.createdAt,
          })),
          recoveryPlan,
          risk,
          observationSummary,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof data?.reply === 'string') {
          return {
            text: data.reply.slice(0, 600),
            suggestedAction: chatActions.includes(data?.suggestedAction) ? data.suggestedAction : undefined,
            source: 'groq',
          };
        }
      } else {
        console.log('[AI Chat] Hugging Face AI engine failed:', response.status);
      }
    } catch (error) {
      console.log('[AI Chat] Hugging Face AI engine unreachable:', error);
    }
  }

  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase.functions.invoke('groq-support-chat', {
      body: {
        text,
        recentMessages: messages.slice(0, 10).map(message => ({
          role: message.role,
          text: message.text,
          createdAt: message.createdAt,
        })),
        recoveryPlan,
        risk,
        observationSummary,
      },
    });

    if (!error && typeof data?.reply === 'string') {
      return {
        text: data.reply.slice(0, 600),
        suggestedAction: chatActions.includes(data?.suggestedAction) ? data.suggestedAction : undefined,
        source: 'groq',
      };
    }
  }

  const lower = text.toLowerCase();
  if (lower.includes('scroll') || lower.includes('tiktok') || lower.includes('instagram')) {
    return {
      text: 'That urge makes sense. Your mind is reaching for quick relief, not trying to ruin your focus. What feeling is underneath it right now?',
      source: 'local',
    };
  }
  if (lower.includes('tired') || lower.includes('drained') || lower.includes('burn')) {
    return {
      text: 'That sounds genuinely heavy. I am here with you in it. Is it more exhaustion, pressure, or feeling emotionally overloaded?',
      source: 'local',
    };
  }
  return {
    text: 'I hear you. This is a private space, and chats expire after 24 hours. What do you wish someone understood about this moment?',
    source: 'local',
  };
}
