export type BurnoutStatus = 'Balanced' | 'Draining' | 'At Risk' | 'Critical' | 'Recovery Mode';

export type BurnoutCause =
  | 'excessive social media'
  | 'low movement'
  | 'poor sleep'
  | 'high stress'
  | 'dopamine seeking pattern'
  | 'low recovery consistency'
  | 'night screen time'
  | 'low energy';

export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  profileType?: string;
  recoveryIntensity?: 'low' | 'medium' | 'high';
}

export interface OnboardingGoals {
  mainProblem: string;
  recoveryGoals: string[];
  digitalHabits: string[];
  sleepHabits: string;
  stressLevel: number;
  preferredRecoveryTasks: RecoveryTaskType[];
}

export type BehaviorEventType =
  | 'mood_checkin'
  | 'screen_usage_snapshot'
  | 'step_snapshot'
  | 'recovery_session_completed'
  | 'buddy_encouragement_sent'
  | 'shield_triggered'
  | 'plan_rule_executed'
  | 'support_chat_message'
  | 'feeling_prompt';

export interface BehaviorEvent {
  id: string;
  type: BehaviorEventType;
  payload: Record<string, unknown>;
  createdAt: string;
  synced: boolean;
}

export interface MoodCheckIn {
  id: string;
  moodScore: number;
  energyScore: number;
  stressScore: number;
  focusScore: number;
  overwhelmed: boolean;
  note?: string;
  createdAt: string;
}

export type SupportChatRole = 'user' | 'assistant' | 'system';

export type SupportChatAction =
  | 'start_focus'
  | 'start_recovery_task'
  | 'delay_app'
  | 'update_intention'
  | 'ask_buddy'
  | 'mood_checkin';

export interface SupportChatMessage {
  id: string;
  role: SupportChatRole;
  text: string;
  createdAt: string;
  synced: boolean;
  source: 'user' | 'groq' | 'local' | 'prompt';
  suggestedAction?: SupportChatAction;
}

export interface FeelingPromptState {
  visible: boolean;
  reason: 'daily' | 'high_usage' | null;
  lastDailyPromptDate: string | null;
  lastHighUsagePromptDate: string | null;
  lastDismissedAt: string | null;
}

export interface ScreenUsageSnapshot {
  id: string;
  screenTimeMinutes: number;
  highDopamineAppMinutes: number;
  appSwitchCount: number;
  nightScreenTime: number;
  topApps: Array<{ appName: string; minutes: number; category: string }>;
  createdAt: string;
}

export interface ActivitySnapshot {
  id: string;
  stepCount: number;
  sedentaryMinutes: number;
  sleepHours?: number;
  createdAt: string;
}

export interface BurnoutRiskInput {
  screen_time_minutes: number;
  high_dopamine_app_minutes: number;
  app_switch_count: number;
  night_screen_time: number;
  step_count: number;
  sedentary_minutes: number;
  sleep_hours: number;
  mood_score: number;
  stress_score: number;
  energy_score: number;
  recovery_sessions_completed: number;
  buddy_support_received: number;
  heart_rate?: number;
  hrv?: number;
}

export interface BurnoutRiskResult {
  burnoutRiskScore: number;
  recoveryScore: number;
  status: BurnoutStatus;
  causes: BurnoutCause[];
  recommendedActions: string[];
  explanation: string;
  generatedAt: string;
}

export interface RecoveryPlan {
  planId: string;
  userId: string;
  generatedAt: string;
  riskLevel: BurnoutStatus;
  primaryCauses: BurnoutCause[];
  digitalRules: DigitalRule[];
  recoveryTasks: RecoveryTask[];
  schedule: Array<{ label: string; timeWindow: string; taskId?: string }>;
  buddyActions: string[];
  explanation: string;
  active: boolean;
  lockScreenMessage?: string;
  supportPrompts?: string[];
  dailyCheckInTime?: string;
  emotionalSupportTone?: string;
  aiActions?: SupportChatAction[];
}

export interface DigitalRule {
  id: string;
  appCategory: string;
  appName: string;
  allowedMinutes: number;
  windowMinutes: number;
  recoveryRequiredAfterLimit: boolean;
}

export type RecoveryTaskType =
  | 'walking'
  | 'breathing'
  | 'screen_off'
  | 'hydration'
  | 'reading'
  | 'sound_therapy'
  | 'sleep_preparation';

export interface RecoveryTask {
  id: string;
  type: RecoveryTaskType;
  title: string;
  target: string;
  durationMinutes: number;
  verification: 'timer' | 'pedometer' | 'screen_off' | 'manual';
  rewardPoints: number;
  recoveryValue: number;
}

export interface RecoverySession {
  id: string;
  taskId: string;
  taskType: RecoveryTaskType;
  completedAt: string;
  rewardPoints: number;
  recoveryValue: number;
}

export interface Buddy {
  id: string;
  name: string;
  personalStreak: number;
  recoveryScore: number;
  currentState: BurnoutStatus;
  treeContribution: number;
}

export interface BuddyGroup {
  id: string;
  name: string;
  members: Buddy[];
  groupStreak: number;
}

export interface RecoveryTree {
  id: string;
  level: number;
  leavesCount: number;
  branchesCount: number;
  flowersCount: number;
  fruitsCount: number;
  growthStage: 'seedling' | 'young_tree' | 'blooming' | 'fruiting';
}

export interface EncouragementMessage {
  id: string;
  text: string;
  toBuddyName: string;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  action: BehaviorEventType | string;
  payload: string;
  timestamp: number;
}
