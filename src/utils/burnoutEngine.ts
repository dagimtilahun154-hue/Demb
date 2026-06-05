import type {
  BurnoutCause,
  BurnoutRiskInput,
  BurnoutRiskResult,
  BurnoutStatus,
} from '@/types/burnout';

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const scoreFromThreshold = (value: number, soft: number, hard: number, weight: number) => {
  if (value <= soft) return 0;
  const ratio = clamp((value - soft) / Math.max(1, hard - soft), 0, 1);
  return ratio * weight;
};

export function calculateBurnoutRisk(input: BurnoutRiskInput): BurnoutRiskResult {
  const causes = new Set<BurnoutCause>();

  let risk = 0;
  risk += scoreFromThreshold(input.screen_time_minutes, 180, 420, 16);
  risk += scoreFromThreshold(input.high_dopamine_app_minutes, 60, 180, 20);
  risk += scoreFromThreshold(input.app_switch_count, 35, 110, 10);
  risk += scoreFromThreshold(input.night_screen_time, 20, 90, 12);
  risk += scoreFromThreshold(input.sedentary_minutes, 240, 540, 12);
  risk += scoreFromThreshold(7000 - input.step_count, 0, 6500, 12);
  risk += scoreFromThreshold(7 - input.sleep_hours, 0, 3, 12);
  risk += scoreFromThreshold(input.stress_score, 4, 10, 18);
  risk += scoreFromThreshold(6 - input.energy_score, 0, 5, 10);
  risk += scoreFromThreshold(6 - input.mood_score, 0, 5, 8);

  risk -= input.recovery_sessions_completed * 6;
  risk -= input.buddy_support_received * 4;

  if (input.high_dopamine_app_minutes > 90) causes.add('excessive social media');
  if (input.step_count < 3500 || input.sedentary_minutes > 420) causes.add('low movement');
  if (input.sleep_hours < 6.5) causes.add('poor sleep');
  if (input.stress_score >= 7) causes.add('high stress');
  if (input.app_switch_count > 80 && input.high_dopamine_app_minutes > 70) {
    causes.add('dopamine seeking pattern');
  }
  if (input.recovery_sessions_completed < 1 && input.screen_time_minutes > 240) {
    causes.add('low recovery consistency');
  }
  if (input.night_screen_time > 45) causes.add('night screen time');
  if (input.energy_score <= 4) causes.add('low energy');

  const burnoutRiskScore = Math.round(clamp(risk));
  const recoveryScore = Math.round(
    clamp(
      100 -
        burnoutRiskScore +
        input.recovery_sessions_completed * 7 +
        input.buddy_support_received * 4 +
        Math.min(input.step_count / 400, 15)
    )
  );

  let status: BurnoutStatus = 'Balanced';
  if (burnoutRiskScore >= 85) status = 'Recovery Mode';
  else if (burnoutRiskScore >= 70) status = 'Critical';
  else if (burnoutRiskScore >= 52) status = 'At Risk';
  else if (burnoutRiskScore >= 30) status = 'Draining';

  const causeList = Array.from(causes);
  const recommendedActions = buildRecommendedActions(causeList, status);

  return {
    burnoutRiskScore,
    recoveryScore,
    status,
    causes: causeList,
    recommendedActions,
    explanation:
      'Demb is reading burnout risk indicators from digital load, movement, mood, stress, sleep, and recovery consistency. This is wellness support, not a medical diagnosis.',
    generatedAt: new Date().toISOString(),
  };
}

function buildRecommendedActions(causes: BurnoutCause[], status: BurnoutStatus) {
  const actions: string[] = [];

  if (causes.includes('excessive social media') || causes.includes('dopamine seeking pattern')) {
    actions.push('Start a short focus reset before opening high-dopamine apps again.');
  }
  if (causes.includes('low movement')) {
    actions.push('Complete a gentle walking task to bring movement back into the day.');
  }
  if (causes.includes('high stress') || causes.includes('low energy')) {
    actions.push('Use breathing or sound therapy for stress regulation support.');
  }
  if (causes.includes('poor sleep') || causes.includes('night screen time')) {
    actions.push('Begin a sleep preparation routine and reduce late-night screen time.');
  }
  if (causes.includes('low recovery consistency')) {
    actions.push('Complete one recovery session today to protect your streak.');
  }
  if (status === 'Recovery Mode' || status === 'Critical') {
    actions.push('Switch into Recovery Mode and follow a calm three-step plan.');
  }

  return actions.length > 0 ? actions : ['Keep the current rhythm and schedule one small recovery break.'];
}

export function buildRiskInputFromSignals({
  totalScreenTimeMins,
  highDopamineMinutes,
  appSwitchCount,
  nightScreenTime,
  stepsWalked,
  sedentaryMinutes,
  sleepHours,
  moodScore,
  stressScore,
  energyScore,
  recoverySessionsCompleted,
  buddySupportReceived,
}: {
  totalScreenTimeMins: number;
  highDopamineMinutes: number;
  appSwitchCount: number;
  nightScreenTime: number;
  stepsWalked: number;
  sedentaryMinutes: number;
  sleepHours: number;
  moodScore: number;
  stressScore: number;
  energyScore: number;
  recoverySessionsCompleted: number;
  buddySupportReceived: number;
}): BurnoutRiskInput {
  return {
    screen_time_minutes: totalScreenTimeMins,
    high_dopamine_app_minutes: highDopamineMinutes,
    app_switch_count: appSwitchCount,
    night_screen_time: nightScreenTime,
    step_count: stepsWalked,
    sedentary_minutes: sedentaryMinutes,
    sleep_hours: sleepHours,
    mood_score: moodScore,
    stress_score: stressScore,
    energy_score: energyScore,
    recovery_sessions_completed: recoverySessionsCompleted,
    buddy_support_received: buddySupportReceived,
  };
}
