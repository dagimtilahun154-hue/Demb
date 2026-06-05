import type { BurnoutRiskResult, RecoveryPlan, RecoveryTask } from '@/types/burnout';

const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

// Heuristic fallback generator when offline
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
    target: '10 minutes of walking',
    durationMinutes: 10,
    verification: 'pedometer',
    rewardPoints: 25,
    recoveryValue: 25,
  };

  const readingTask: RecoveryTask = {
    id: id('task_read'),
    type: 'reading',
    title: 'Book Reading Time',
    target: '15 minutes of offline reading',
    durationMinutes: 15,
    verification: 'timer',
    rewardPoints: 20,
    recoveryValue: 20,
  };

  const screenOffTask: RecoveryTask = {
    id: id('task_screen_off'),
    type: 'screen_off',
    title: 'Off-Screen Detox',
    target: '30 minutes offline screen off',
    durationMinutes: 30,
    verification: 'screen_off',
    rewardPoints: 35,
    recoveryValue: 35,
  };

  const breathingTask: RecoveryTask = {
    id: id('task_breathe'),
    type: 'breathing',
    title: 'Calm Breathing Gap',
    target: '5 minutes mindful breathing',
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
        windowMinutes: 120, // 40 minutes per 2 hours
        recoveryRequiredAfterLimit: true,
      },
    ],
    recoveryTasks: tasks,
    schedule: [
      { label: 'Morning focus preparation', timeWindow: '08:00 - 10:00', taskId: tasks[0].id },
      { label: 'Afternoon mental recharge', timeWindow: '14:00 - 16:00', taskId: tasks[1].id },
      { label: 'Evening wind-down', timeWindow: '20:00 - 21:00', taskId: tasks[2].id },
    ],
    buddyActions: [
      'Share your recovery tree growth with your buddies.',
      'Cheer them on if they trigger a focus lock.',
    ],
    explanation: 'Created locally (Offline Mode). This plan tracks offline screen-off, walking, and reading intervals to lower dopamine load.',
    active: true,
  };
}

/**
 * Generates an adaptive recovery plan using Gemini API.
 * Uses a structured JSON response schema to ensure safe parsing.
 */
export async function generateAiRecoveryPlan({
  userId,
  risk,
  userProfile,
  latestBiometrics,
}: {
  userId: string;
  risk: BurnoutRiskResult;
  userProfile: any;
  latestBiometrics: any;
}): Promise<RecoveryPlan> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[AI Plan] No EXPO_PUBLIC_GEMINI_API_KEY found, falling back to local engine');
    return generateLocalRecoveryPlan({ userId, risk });
  }

  const prompt = `
    You are the Demb Digital Wellness AI Engine.
    Analyze the user's digital burnout data and compile a highly customized, actionable recovery plan.
    
    User Profile:
    - Name: ${userProfile.name}
    - Recovery Intensity Choice: ${userProfile.recoveryIntensity}
    - Major Problem: ${userProfile.biggestProblem}
    - Daily Goal: ${userProfile.dailyGoal}

    Current Burnout Risk:
    - Score: ${risk.burnoutRiskScore}/100
    - Status: ${risk.status}
    - Identified Causes: ${risk.causes.join(', ')}

    Latest Biometrics:
    - Steps today: ${latestBiometrics.steps}
    - Average Heart Rate: ${latestBiometrics.averageHeartRate} bpm
    - Heart Rate Variability (HRV): ${latestBiometrics.hrv} ms (if watch available)
    - Sleep Hours: ${latestBiometrics.sleepHours} hrs (estimated or watch)
    - Biometrics Source: ${latestBiometrics.dataSource}

    Generate a JSON object matching this TypeScript structure:
    {
      "explanation": "Brief, supportive 2-sentence summary explaining why this plan was tailored based on their data.",
      "digitalRules": [
        {
          "id": "rule_social_limit",
          "appCategory": "social_media",
          "appName": "Instagram/TikTok/Socials",
          "allowedMinutes": 40, 
          "windowMinutes": 120, // Must include a rolling rate limit rule (e.g. 40 minutes per 2 hours)
          "recoveryRequiredAfterLimit": true
        }
      ],
      "recoveryTasks": [
        {
          "id": "task_1",
          "type": "walking" | "breathing" | "screen_off" | "reading" | "sound_therapy",
          "title": "Short title (e.g. 10m Nature Walk, 30m Offline Book)",
          "target": "Actionable instructions (e.g. Walk 200 steps, turn phone off for 30 minutes, read a physical book)",
          "durationMinutes": number,
          "verification": "pedometer" | "timer" | "screen_off" | "manual",
          "rewardPoints": number (10 to 50),
          "recoveryValue": number (10 to 50)
        }
      ],
      "schedule": [
        {
          "label": "e.g., Morning Focus, Evening wind-down",
          "timeWindow": "e.g., 09:00 - 10:00",
          "taskId": "Must match one of the task IDs generated above"
        }
      ],
      "buddyActions": [
        "2 simple buddy tasks to help coordinate group recovery"
      ]
    }
  `;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const resJson = await response.json();
    const responseText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('Empty text response from Gemini');
    }

    const aiPlan = JSON.parse(responseText);
    const recoveryTasks = (aiPlan.recoveryTasks || []).map((task: any) => ({
      ...task,
      id: id('task'),
    }));

    // Hydrate IDs and return complete RecoveryPlan type
    return {
      planId: id('plan'),
      userId,
      generatedAt: new Date().toISOString(),
      riskLevel: risk.status,
      primaryCauses: risk.causes,
      digitalRules: (aiPlan.digitalRules || []).map((r: any) => ({ ...r, id: id('rule') })),
      recoveryTasks,
      schedule: (aiPlan.schedule || []).map((s: any, idx: number) => ({
        ...s,
        taskId: recoveryTasks[idx]?.id,
      })),
      buddyActions: aiPlan.buddyActions || [
        'Coordinate a shared offline break window today.',
        'Encourage your buddies to complete their walks.',
      ],
      explanation: aiPlan.explanation || 'Personalized wellness plan prepared by Gemini AI.',
      active: true,
    };
  } catch (error) {
    console.error('[AI Plan] Failed to query Gemini API, falling back to local rules:', error);
    return generateLocalRecoveryPlan({ userId, risk });
  }
}
