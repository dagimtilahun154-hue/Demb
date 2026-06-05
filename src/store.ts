import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  initDb, 
  saveDbUser, 
  getDbUser, 
  addDbLog, 
  deleteDbLog, 
  getDbLogs, 
  addDbCompletedMission, 
  getDbCompletedMissions,
  queueSyncItem,
  getSyncQueue,
  removeSyncItems,
  addSocialUsageLog,
  getSocialUsageLogs,
  pruneOldSocialLogs
} from './db';
import type {
  ActivitySnapshot,
  BehaviorEvent,
  Buddy,
  BuddyGroup,
  BurnoutRiskResult,
  EncouragementMessage,
  MoodCheckIn,
  RecoveryPlan,
  RecoverySession,
  RecoveryTask,
  RecoveryTree,
  ScreenUsageSnapshot,
} from './types/burnout';
import { NativeModules, Platform } from 'react-native';
import { buildRiskInputFromSignals, calculateBurnoutRisk } from './utils/burnoutEngine';
import { generateAiRecoveryPlan } from './utils/mockAiPlan';
import { getSyncBiometrics, requestSmartwatchPermissions } from './utils/healthConnect';
import {
  fetchBuddyFeed,
  fetchUserProfile,
  getCachedAuthUser,
  pushBuddyFeedEvent,
  signInWithEmail,
  signOutSupabase,
  signUpWithEmail,
  syncRecoveryTree,
  syncUserProfile,
} from './utils/supabaseClient';

const { DembBlockerModule } = NativeModules;

export interface EnergyLog {
  id: string;
  type: 'spent' | 'recovered';
  category: string;
  title: string;
  durationMinutes: number;
  intensity: 'Low' | 'Medium' | 'High';
  scoreValue: number;
  notes: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileType: 'student' | 'employee' | 'entrepreneur' | 'parent' | 'other' | '';
  biggestProblem: string;
  dailyGoal: string;
  isOnboarded: boolean;
  recoveryIntensity: 'low' | 'medium' | 'high';
}

export interface DailyBalance {
  energySpent: number;
  energyRecovered: number;
  balanceScore: number;
  recoveryDebt: number;
  burnoutRisk: 'Low' | 'Moderate' | 'High' | 'Critical';
  focusLevel: number; // 0 to 100
}

export interface RecoveryMission {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  points: number;
  verificationType: 'timer' | 'step' | 'gps' | 'inactivity';
  recoveryValue: number;
  icon: string;
  bgColor: string;
}

export interface DailyPriorities {
  date: string;
  mainTask: string;
  healthGoal: string;
  recoveryGoal: string;
  mainCompleted: boolean;
  healthCompleted: boolean;
  recoveryCompleted: boolean;
}

export interface EveningReview {
  date: string;
  whatMattered: string;
  whatDistracted: string;
  recoveryRating: number; // 1-5
  tomorrowGoal: string;
}

export interface BuddyRequest {
  id: string;
  name: string;
  type: 'incoming' | 'outgoing';
  status: 'pending' | 'accepted' | 'declined';
}

export interface BuddyFeedItem {
  id: string;
  name: string;
  event: 'lock' | 'success' | 'cheer';
  detail: string;
  timestamp: string;
}

export interface AppState {
  authReady: boolean;
  authStatus: 'signed_out' | 'signed_in';
  authUserId: string | null;
  authError: string | null;

  // User Profile
  user: UserProfile;
  
  // Balance Stats
  balance: DailyBalance;
  points: number;
  streakCount: number;
  
  // Lists
  energyLogs: EnergyLog[];
  priorities: DailyPriorities | null;
  eveningReviews: EveningReview[];
  
  // Buddy System
  buddies: string[];
  buddyRequests: BuddyRequest[];
  buddyFeed: BuddyFeedItem[];
  
  // Hardware / Screen-Off Tracking
  stepsWalked: number;
  screenOffStartTime: number | null; // unix timestamp in ms
  screenOffTargetDuration: number; // seconds
  screenOffInterrupted: boolean;
  
  // Focus Timer
  breakLoopActive: boolean;
  breakLoopTime: number; // in seconds
  
  // Missions
  missions: RecoveryMission[];
  completedMissions: string[]; // ids of completed missions
  
  // App Modes / Locks
  focusLockActive: boolean;
  focusLockScreenVisible: boolean;
  restrictedApp: string; // e.g. 'TikTok', 'Instagram', 'Sleep Lockout'
  focusLockTimeLeft: number; // seconds
  currentActiveMission: RecoveryMission | null;
  missionTimeLeft: number; // seconds
  syncStatus: 'synced' | 'pending_sync' | 'syncing';
  
  // Advanced Blocker State
  isTimeTampered: boolean;
  lastKnownTime: number; // For detecting system clock changes
  
  // Social Media Real Data
  socialUsage: {
    TikTok: number; // minutes
    Instagram: number; // minutes
    YouTube: number; // minutes
    Snapchat: number; // minutes
    Facebook: number; // minutes
  };

  // Burnout Prevention OS
  observationStartedAt: string | null;
  observationComplete: boolean;
  behaviorEvents: BehaviorEvent[];
  moodCheckIns: MoodCheckIn[];
  screenUsageSnapshots: ScreenUsageSnapshot[];
  activitySnapshots: ActivitySnapshot[];
  burnoutRisk: BurnoutRiskResult;
  recoveryPlan: RecoveryPlan | null;
  recoverySessions: RecoverySession[];
  buddyGroup: BuddyGroup;
  recoveryTree: RecoveryTree;
  encouragementMessages: EncouragementMessage[];
  
  // Actions
  hydrateAuthSession: () => Promise<void>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
  signIn: (input: { email: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setOnboarding: (profile: Partial<UserProfile>) => void;
  addEnergyLog: (log: Omit<EnergyLog, 'id' | 'createdAt' | 'scoreValue'>) => void;
  deleteEnergyLog: (id: string) => void;
  setPriorities: (priorities: Omit<DailyPriorities, 'date' | 'mainCompleted' | 'healthCompleted' | 'recoveryCompleted'>) => void;
  togglePriority: (type: 'main' | 'health' | 'recovery') => void;
  submitEveningReview: (review: Omit<EveningReview, 'date'>) => void;
  startMission: (missionId: string) => void;
  tickMission: () => void;
  completeMission: () => void;
  cancelMission: () => void;
  
  // Focus Actions
  toggleBreakLoop: () => void;
  tickBreakLoop: () => void;
  
  // Buddy Actions
  sendBuddyRequest: (name: string) => void;
  acceptBuddyRequest: (requestId: string) => void;
  declineBuddyRequest: (requestId: string) => void;
  sendCheerToBuddy: (buddyName: string) => void;
  fetchOnlineBuddyUpdates: () => Promise<void>;
  
  // Hardware & Screen Off Actions
  incrementSteps: (count: number) => void;
  startScreenOffDetox: (durationSeconds: number) => void;
  registerScreenOff: () => void;
  verifyScreenOff: () => { success: boolean; elapsedSeconds: number };
  
  // Focus Lock / Blocker Actions
  triggerFocusLock: (appName: string, durationSeconds?: number, options?: { showScreen?: boolean }) => void;
  tickFocusLock: () => void;
  extendFocusLock: (seconds: number) => void;
  releaseFocusLock: () => void;
  
  // System Monitor Ticks
  checkSystemLocks: () => void;
  logManualSocialUsage: (app: string, minutes: number) => Promise<void>;

  // Burnout Prevention Actions
  startObservation: () => void;
  completeObservation: () => void;
  seedObservationData: () => void;
  recordBehaviorEvent: (event: Omit<BehaviorEvent, 'id' | 'createdAt' | 'synced'>) => void;
  submitMoodCheckIn: (checkIn: Omit<MoodCheckIn, 'id' | 'createdAt'>) => void;
  refreshBurnoutRisk: () => BurnoutRiskResult;
  generateRecoveryPlan: () => RecoveryPlan;
  activateRecoveryPlan: () => void;
  completeRecoveryTask: (task: RecoveryTask) => void;
  addBuddyTreeLeaf: (count?: number) => void;
  sendEncouragementMessage: (buddyName: string, message: string) => void;
  
  // Sync
  triggerSync: () => void;
  loadSavedState: () => Promise<void>;
  resetAllData: () => void;
}

const DEFAULT_MISSIONS: RecoveryMission[] = [
  {
    id: 'm1',
    title: 'Breathing Gap',
    category: 'Meditation',
    durationMinutes: 2,
    points: 10,
    verificationType: 'timer',
    recoveryValue: 15,
    icon: 'hourglass-outline',
    bgColor: '#ece6f0',
  },
  {
    id: 'm2',
    title: 'Nature Walk',
    category: 'Walking',
    durationMinutes: 10,
    points: 25,
    verificationType: 'timer',
    recoveryValue: 30,
    icon: 'walk-outline',
    bgColor: '#a6f2cf',
  },
  {
    id: 'm3',
    title: 'Phone Lockup',
    category: 'No-screen break',
    durationMinutes: 15,
    points: 40,
    verificationType: 'timer',
    recoveryValue: 50,
    icon: 'lock-closed-outline',
    bgColor: '#ffdad6',
  },
  {
    id: 'm4',
    title: 'Stretch Patrol',
    category: 'Exercise',
    durationMinutes: 5,
    points: 15,
    verificationType: 'timer',
    recoveryValue: 20,
    icon: 'body-outline',
    bgColor: '#ffdcbd',
  },
  {
    id: 'm5',
    title: 'Hydration Station',
    category: 'Relaxation',
    durationMinutes: 1,
    points: 5,
    verificationType: 'timer',
    recoveryValue: 8,
    icon: 'water-outline',
    bgColor: '#e8ddff',
  }
];

const initialProfile: UserProfile = {
  id: '',
  name: '',
  email: '',
  profileType: '',
  biggestProblem: '',
  dailyGoal: '',
  isOnboarded: false,
  recoveryIntensity: 'medium',
};

const initialBalance: DailyBalance = {
  energySpent: 0,
  energyRecovered: 0,
  balanceScore: 0,
  recoveryDebt: 0,
  burnoutRisk: 'Low',
  focusLevel: 100,
};

const initialSocialUsage = {
  TikTok: 0,
  Instagram: 0,
  YouTube: 0,
  Snapchat: 0,
  Facebook: 0,
};

const initialBurnoutRisk = calculateBurnoutRisk(
  buildRiskInputFromSignals({
    totalScreenTimeMins: Object.values(initialSocialUsage).reduce((sum, mins) => sum + mins, 0),
    highDopamineMinutes: initialSocialUsage.TikTok + initialSocialUsage.Instagram + initialSocialUsage.Snapchat,
    appSwitchCount: 0,
    nightScreenTime: 0,
    stepsWalked: 0,
    sedentaryMinutes: 0,
    sleepHours: 7,
    moodScore: 7,
    stressScore: 3,
    energyScore: 7,
    recoverySessionsCompleted: 0,
    buddySupportReceived: 0,
  })
);

const initialRecoveryTree: RecoveryTree = {
  id: 'local_tree',
  level: 1,
  leavesCount: 0,
  branchesCount: 0,
  flowersCount: 0,
  fruitsCount: 0,
  growthStage: 'young_tree',
};

const initialBuddyGroup: BuddyGroup = {
  id: 'local_group',
  name: 'My Buddies',
  groupStreak: 0,
  members: [
    { id: 'me', name: 'You', personalStreak: 0, recoveryScore: initialBurnoutRisk.recoveryScore, currentState: initialBurnoutRisk.status, treeContribution: 0 },
  ],
};

export const ENCOURAGEMENT_MESSAGES = [
  "Keep going, you're doing great.",
  "Take a small break, I'm with you.",
  "Let's keep the flame steady.",
  "You're close to recovery mode completion.",
  'Small steps count.',
];

const recalculateBalance = (logs: EnergyLog[]): DailyBalance => {
  let spent = 0;
  let recovered = 0;

  logs.forEach(log => {
    if (log.type === 'spent') {
      spent += log.scoreValue;
    } else {
      recovered += log.scoreValue;
    }
  });

  const balanceScore = recovered - spent;
  const recoveryDebt = Math.max(0, spent - recovered);
  
  let burnoutRisk: DailyBalance['burnoutRisk'] = 'Low';
  if (recoveryDebt > 70) burnoutRisk = 'Critical';
  else if (recoveryDebt > 50) burnoutRisk = 'High';
  else if (recoveryDebt > 25) burnoutRisk = 'Moderate';

  const focusLevel = Math.max(0, Math.min(100, Math.round(100 - (recoveryDebt * 0.8))));

  return {
    energySpent: spent,
    energyRecovered: recovered,
    balanceScore,
    recoveryDebt,
    burnoutRisk,
    focusLevel,
  };
};

const STORAGE_KEY = '@demb_app_state';

export const useAppStore = create<AppState>((set, get) => {
  
  const saveState = async (newState: Partial<AppState>) => {
    try {
      const stateToSave = {
        user: newState.user ?? get().user,
        balance: newState.balance ?? get().balance,
        points: newState.points ?? get().points,
        streakCount: newState.streakCount ?? get().streakCount,
        energyLogs: newState.energyLogs ?? get().energyLogs,
        priorities: newState.priorities ?? get().priorities,
        eveningReviews: newState.eveningReviews ?? get().eveningReviews,
        completedMissions: newState.completedMissions ?? get().completedMissions,
        buddies: newState.buddies ?? get().buddies,
        buddyRequests: newState.buddyRequests ?? get().buddyRequests,
        buddyFeed: newState.buddyFeed ?? get().buddyFeed,
        socialUsage: newState.socialUsage ?? get().socialUsage,
        observationStartedAt: newState.observationStartedAt ?? get().observationStartedAt,
        observationComplete: newState.observationComplete ?? get().observationComplete,
        behaviorEvents: newState.behaviorEvents ?? get().behaviorEvents,
        moodCheckIns: newState.moodCheckIns ?? get().moodCheckIns,
        screenUsageSnapshots: newState.screenUsageSnapshots ?? get().screenUsageSnapshots,
        activitySnapshots: newState.activitySnapshots ?? get().activitySnapshots,
        burnoutRisk: newState.burnoutRisk ?? get().burnoutRisk,
        recoveryPlan: newState.recoveryPlan ?? get().recoveryPlan,
        recoverySessions: newState.recoverySessions ?? get().recoverySessions,
        buddyGroup: newState.buddyGroup ?? get().buddyGroup,
        recoveryTree: newState.recoveryTree ?? get().recoveryTree,
        encouragementMessages: newState.encouragementMessages ?? get().encouragementMessages,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save state to AsyncStorage', e);
    }
  };

  return {
    // State
    authReady: false,
    authStatus: 'signed_out',
    authUserId: null,
    authError: null,

    user: initialProfile,
    balance: initialBalance,
    points: 0,
    streakCount: 0,
    energyLogs: [],
    priorities: null,
    eveningReviews: [],
    missions: DEFAULT_MISSIONS,
    completedMissions: [],
    
    buddies: [],
    buddyRequests: [],
    buddyFeed: [],
    
    stepsWalked: 0,
    screenOffStartTime: null,
    screenOffTargetDuration: 0,
    screenOffInterrupted: false,
    
    breakLoopActive: false,
    breakLoopTime: 0,
    
    focusLockActive: false,
    focusLockScreenVisible: false,
    restrictedApp: '',
    focusLockTimeLeft: 0,
    currentActiveMission: null,
    missionTimeLeft: 0,
    syncStatus: 'synced',
    
    isTimeTampered: false,
    lastKnownTime: Date.now(),
    
    socialUsage: initialSocialUsage,

    observationStartedAt: null,
    observationComplete: false,
    behaviorEvents: [],
    moodCheckIns: [],
    screenUsageSnapshots: [],
    activitySnapshots: [],
    burnoutRisk: initialBurnoutRisk,
    recoveryPlan: null,
    recoverySessions: [],
    buddyGroup: initialBuddyGroup,
    recoveryTree: initialRecoveryTree,
    encouragementMessages: [],
    
    hydrateAuthSession: async () => {
      const authUser = await getCachedAuthUser();
      if (!authUser) {
        set({ authReady: true, authStatus: 'signed_out', authUserId: null });
        return;
      }

      const cachedUser = await getDbUser();
      const onlineProfile = await fetchUserProfile(authUser.id);
      const fallbackName =
        (authUser.user_metadata?.name as string | undefined) ||
        authUser.email?.split('@')[0] ||
        '';
      const userProfile: UserProfile = {
        ...initialProfile,
        ...cachedUser,
        id: authUser.id,
        email: authUser.email ?? cachedUser?.email ?? '',
        name: onlineProfile?.name || cachedUser?.name || fallbackName,
      };

      set({
        authReady: true,
        authStatus: 'signed_in',
        authUserId: authUser.id,
        user: userProfile,
      });
      await saveDbUser(userProfile);
      await saveState({ user: userProfile });
    },

    signUp: async ({ name, email, password }) => {
      const result = await signUpWithEmail({ name, email, password });
      if (!result.user) {
        const error = result.error ?? 'Registration failed. Check your connection and try again.';
        set({ authError: error });
        return { ok: false, error };
      }

      const userProfile: UserProfile = {
        ...initialProfile,
        id: result.user.id,
        name,
        email,
        isOnboarded: false,
      };
      set({ authReady: true, authStatus: 'signed_in', authUserId: result.user.id, authError: null, user: userProfile });
      await saveDbUser(userProfile);
      await saveState({ user: userProfile });
      return { ok: true };
    },

    signIn: async ({ email, password }) => {
      const result = await signInWithEmail({ email, password });
      if (!result.user) {
        const error = result.error ?? 'Sign in failed. Check your connection and try again.';
        set({ authError: error });
        return { ok: false, error };
      }

      const cachedUser = await getDbUser();
      const onlineProfile = await fetchUserProfile(result.user.id);
      const fallbackName =
        (result.user.user_metadata?.name as string | undefined) ||
        result.user.email?.split('@')[0] ||
        '';
      const userProfile: UserProfile = {
        ...initialProfile,
        ...cachedUser,
        id: result.user.id,
        email: result.user.email ?? email,
        name: onlineProfile?.name || cachedUser?.name || fallbackName,
      };
      set({ authReady: true, authStatus: 'signed_in', authUserId: result.user.id, authError: null, user: userProfile });
      await saveDbUser(userProfile);
      await saveState({ user: userProfile });
      return { ok: true };
    },

    signOut: async () => {
      await signOutSupabase();
      set({
        authStatus: 'signed_out',
        authUserId: null,
        authError: null,
        user: initialProfile,
        observationComplete: false,
      });
      await saveDbUser(initialProfile);
      await saveState({ user: initialProfile, observationComplete: false });
    },

    // Onboarding Action
    setOnboarding: async (profileData) => {
      const updatedUser = { 
        ...get().user, 
        ...profileData, 
        isOnboarded: true 
      };
      
      set({ user: updatedUser });
      await saveDbUser(updatedUser);
      await saveState({ user: updatedUser });
      
      // Queue sync item
      await queueSyncItem('onboarding_update', { name: updatedUser.name, intensity: updatedUser.recoveryIntensity });
      await syncUserProfile({
        id: updatedUser.id || get().authUserId || updatedUser.email || 'local-user',
        name: updatedUser.name,
        recovery_score: get().burnoutRisk.recoveryScore,
        streak_count: get().streakCount,
        current_status: get().burnoutRisk.status,
      });
      get().startObservation();
      get().triggerSync();
    },

    // Energy Log Actions
    addEnergyLog: async (logData) => {
      let multiplier = 1.0;
      if (logData.type === 'spent') {
        if (logData.intensity === 'Low') multiplier = 0.5;
        else if (logData.intensity === 'Medium') multiplier = 1.0;
        else multiplier = 2.0;
      } else {
        if (logData.intensity === 'Low') multiplier = 0.5;
        else if (logData.intensity === 'Medium') multiplier = 1.0;
        else multiplier = 1.5;
      }

      const scoreValue = Math.round(logData.durationMinutes * multiplier);

      const newLog: EnergyLog = {
        ...logData,
        id: Math.random().toString(36).substr(2, 9),
        scoreValue,
        createdAt: new Date().toISOString(),
      };

      const updatedLogs = [newLog, ...get().energyLogs];
      const updatedBalance = recalculateBalance(updatedLogs);

      set({
        energyLogs: updatedLogs,
        balance: updatedBalance,
      });

      // Write to SQLite
      await addDbLog(newLog);

      if (updatedBalance.balanceScore < -60 && !get().focusLockActive) {
        get().triggerFocusLock('Instagram', 15 * 60);
      }

      await saveState({ energyLogs: updatedLogs, balance: updatedBalance });
      await queueSyncItem('add_log', { id: newLog.id, scoreValue: newLog.scoreValue });
      get().triggerSync();
    },

    deleteEnergyLog: async (id) => {
      const updatedLogs = get().energyLogs.filter(log => log.id !== id);
      const updatedBalance = recalculateBalance(updatedLogs);

      set({
        energyLogs: updatedLogs,
        balance: updatedBalance,
      });

      // Delete from SQLite
      await deleteDbLog(id);

      await saveState({ energyLogs: updatedLogs, balance: updatedBalance });
      await queueSyncItem('delete_log', { id });
      get().triggerSync();
    },

    setPriorities: (priorityData) => {
      const newPriorities: DailyPriorities = {
        ...priorityData,
        date: new Date().toDateString(),
        mainCompleted: false,
        healthCompleted: false,
        recoveryCompleted: false,
      };
      set({ priorities: newPriorities });
      saveState({ priorities: newPriorities });
      get().triggerSync();
    },

    togglePriority: (type) => {
      const current = get().priorities;
      if (!current) return;

      const updated = { ...current };
      let pointsGained = 0;
      if (type === 'main') {
        updated.mainCompleted = !updated.mainCompleted;
        pointsGained = updated.mainCompleted ? 5 : -5;
      } else if (type === 'health') {
        updated.healthCompleted = !updated.healthCompleted;
        pointsGained = updated.healthCompleted ? 5 : -5;
      } else if (type === 'recovery') {
        updated.recoveryCompleted = !updated.recoveryCompleted;
        pointsGained = updated.recoveryCompleted ? 5 : -5;
      }

      const newPoints = Math.max(0, get().points + pointsGained);

      set({
        priorities: updated,
        points: newPoints,
      });

      saveState({ priorities: updated, points: newPoints });
      get().triggerSync();
    },

    submitEveningReview: (reviewData) => {
      const newReview: EveningReview = {
        ...reviewData,
        date: new Date().toDateString(),
      };
      const updatedReviews = [newReview, ...get().eveningReviews];
      const newPoints = get().points + 20;

      set({
        eveningReviews: updatedReviews,
        points: newPoints,
      });

      saveState({ eveningReviews: updatedReviews, points: newPoints });
      get().triggerSync();
    },

    startMission: (missionId) => {
      const mission = get().missions.find(m => m.id === missionId);
      if (!mission) return;

      set({
        currentActiveMission: mission,
        missionTimeLeft: mission.durationMinutes * 60,
      });
    },

    tickMission: () => {
      const timeLeft = get().missionTimeLeft;
      if (timeLeft <= 1) {
        get().completeMission();
      } else {
        set({ missionTimeLeft: timeLeft - 1 });
      }
    },

    completeMission: async () => {
      const activeMission = get().currentActiveMission;
      if (!activeMission) return;

      const updatedCompletions = [...get().completedMissions, activeMission.id];
      const newPoints = get().points + activeMission.points;
      const newStreak = get().streakCount + 1;

      // Add as recovery log to reduce debt
      const recoveryLog: EnergyLog = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'recovered',
        category: activeMission.category,
        title: `Mission: ${activeMission.title}`,
        durationMinutes: activeMission.durationMinutes,
        intensity: 'Medium',
        scoreValue: activeMission.recoveryValue,
        notes: 'Recovery Mission Completed!',
        createdAt: new Date().toISOString(),
      };

      const updatedLogs = [recoveryLog, ...get().energyLogs];
      const updatedBalance = recalculateBalance(updatedLogs);

      set({
        completedMissions: updatedCompletions,
        points: newPoints,
        streakCount: newStreak,
        energyLogs: updatedLogs,
        balance: updatedBalance,
        currentActiveMission: null,
        missionTimeLeft: 0,
      });

      // Write to SQLite
      await addDbCompletedMission(activeMission.id);
      await addDbLog(recoveryLog);

      if (get().focusLockActive) {
        get().releaseFocusLock();
      }

      const recoverySession: RecoverySession = {
        id: Math.random().toString(36).substr(2, 9),
        taskId: activeMission.id,
        taskType: activeMission.category === 'Walking' ? 'walking' : activeMission.category === 'No-screen break' ? 'screen_off' : 'breathing',
        completedAt: new Date().toISOString(),
        rewardPoints: activeMission.points,
        recoveryValue: activeMission.recoveryValue,
      };
      const updatedSessions = [recoverySession, ...get().recoverySessions];
      set({ recoverySessions: updatedSessions });
      get().addBuddyTreeLeaf(1);
      get().refreshBurnoutRisk();

      await saveState({
        completedMissions: updatedCompletions,
        points: newPoints,
        streakCount: newStreak,
        energyLogs: updatedLogs,
        balance: updatedBalance,
        recoverySessions: updatedSessions,
      });

      await queueSyncItem('complete_mission', { id: activeMission.id, points: activeMission.points });
      get().triggerSync();
    },

    cancelMission: () => {
      set({
        currentActiveMission: null,
        missionTimeLeft: 0,
        stepsWalked: 0,
        screenOffStartTime: null,
        screenOffTargetDuration: 0,
        screenOffInterrupted: false,
      });
    },

    sendBuddyRequest: (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      
      const newRequest: BuddyRequest = {
        id: Math.random().toString(36).substr(2, 9),
        name: trimmed,
        type: 'outgoing',
        status: 'pending'
      };
      
      const updatedRequests = [...get().buddyRequests, newRequest];
      set({ buddyRequests: updatedRequests });
      saveState({ buddyRequests: updatedRequests });
    },

    acceptBuddyRequest: (requestId) => {
      const requests = get().buddyRequests;
      const target = requests.find(r => r.id === requestId);
      if (!target) return;
      
      const updatedRequests = requests.map(r => 
        r.id === requestId ? { ...r, status: 'accepted' as const } : r
      );
      
      const updatedBuddies = [...get().buddies, target.name];
      const newFeedItem: BuddyFeedItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: target.name,
        event: 'success',
        detail: 'became your buddy!',
        timestamp: 'Just now'
      };
      const updatedFeed = [newFeedItem, ...get().buddyFeed];

      set({
        buddyRequests: updatedRequests,
        buddies: updatedBuddies,
        buddyFeed: updatedFeed
      });
      saveState({
        buddyRequests: updatedRequests,
        buddies: updatedBuddies,
        buddyFeed: updatedFeed
      });
    },

    declineBuddyRequest: (requestId) => {
      const requests = get().buddyRequests;
      const updatedRequests = requests.map(r => 
        r.id === requestId ? { ...r, status: 'declined' as const } : r
      );
      set({ buddyRequests: updatedRequests });
      saveState({ buddyRequests: updatedRequests });
    },

    sendCheerToBuddy: async (buddyName) => {
      const newFeedItem: BuddyFeedItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: 'You',
        event: 'cheer',
        detail: `sent a cheer to ${buddyName}!`,
        timestamp: 'Just now'
      };
      
      const newPoints = get().points + 5;
      const updatedFeed = [newFeedItem, ...get().buddyFeed];
      
      set({ buddyFeed: updatedFeed, points: newPoints });
      await saveState({ buddyFeed: updatedFeed, points: newPoints });
      
      await queueSyncItem('cheer_buddy', { buddy: buddyName });
      get().triggerSync();
    },

    toggleBreakLoop: () => {
      const active = get().breakLoopActive;
      if (!active) {
        const risk = get().refreshBurnoutRisk();
        const label = risk.burnoutRiskScore >= 70 ? 'Burnout Risk Rising' : 'Focus Session';
        get().triggerFocusLock(label, 40 * 60, { showScreen: false });
        set({ breakLoopActive: true, breakLoopTime: 0 });
        get().recordBehaviorEvent({
          type: 'shield_triggered',
          payload: { source: 'manual_focus_session', riskScore: risk.burnoutRiskScore },
        });
      } else {
        get().releaseFocusLock();
      }
    },

    tickBreakLoop: () => {
      if (get().breakLoopActive) {
        set({ breakLoopTime: get().breakLoopTime + 1 });
      }
    },

    fetchOnlineBuddyUpdates: async () => {
      try {
        const userId = get().authUserId || get().user.id || get().user.email || 'local-user';
        const newItems = await fetchBuddyFeed(userId);
        if (newItems.length === 0) {
          return;
        }

        const currentFeed = get().buddyFeed;
        const updatedFeed = [...newItems, ...currentFeed].slice(0, 15);
        set({ buddyFeed: updatedFeed });
        await saveState({ buddyFeed: updatedFeed });
      } catch (err) {
        console.log('[Supabase] Buddy feed refresh skipped:', err);
      }
    },
    
    incrementSteps: (count) => {
      const newSteps = get().stepsWalked + count;
      set({ stepsWalked: newSteps });
      
      const active = get().currentActiveMission;
      if (active && active.category === 'Walking' && newSteps >= 100) {
        set({ stepsWalked: 0 });
        get().completeMission();
      }
    },

    startScreenOffDetox: (durationSeconds) => {
      set({
        screenOffTargetDuration: durationSeconds,
        screenOffStartTime: null,
        screenOffInterrupted: false,
      });
    },

    registerScreenOff: () => {
      if (get().screenOffTargetDuration > 0) {
        set({
          screenOffStartTime: Date.now(),
          screenOffInterrupted: false,
        });
      }
    },

    verifyScreenOff: () => {
      const startTime = get().screenOffStartTime;
      const target = get().screenOffTargetDuration;
      
      if (!startTime || target <= 0) {
        return { success: false, elapsedSeconds: 0 };
      }
      
      const elapsedMs = Date.now() - startTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      if (elapsedSeconds >= target) {
        set({
          screenOffStartTime: null,
          screenOffTargetDuration: 0,
          screenOffInterrupted: false,
        });
        get().completeMission();
        return { success: true, elapsedSeconds };
      } else {
        set({
          screenOffStartTime: null,
          screenOffInterrupted: true,
        });
        return { success: false, elapsedSeconds };
      }
    },

    triggerFocusLock: (appName, durationSeconds = 600, options = {}) => {
      set({
        focusLockActive: true,
        focusLockScreenVisible: options.showScreen ?? true,
        restrictedApp: appName,
        focusLockTimeLeft: durationSeconds,
      });
      if (Platform.OS === 'android' && DembBlockerModule) {
        try {
          DembBlockerModule.setLockState(true, appName);
        } catch (e) {
          console.log('[NativeBlocker] Error setting lock active:', e);
        }
      }
    },

    tickFocusLock: () => {
      const timeLeft = get().focusLockTimeLeft;
      if (timeLeft <= 1) {
        get().releaseFocusLock();
      } else {
        set({ focusLockTimeLeft: timeLeft - 1 });
      }
    },

    extendFocusLock: (seconds) => {
      set({ focusLockTimeLeft: get().focusLockTimeLeft + seconds });
    },

    releaseFocusLock: () => {
      set({
        focusLockActive: false,
        focusLockScreenVisible: false,
        restrictedApp: '',
        focusLockTimeLeft: 0,
        breakLoopActive: false,
        breakLoopTime: 0,
      });
      if (Platform.OS === 'android' && DembBlockerModule) {
        try {
          DembBlockerModule.setLockState(false, '');
        } catch (e) {
          console.log('[NativeBlocker] Error releasing lock:', e);
        }
      }
    },

    // Local fallback until native usage events are available from the Android blocker module.
    logManualSocialUsage: async (app, minutes) => {
      // 1. Write to database log history
      await addSocialUsageLog(app, minutes);
      
      // 2. Update local state representation
      const currentUsage = get().socialUsage;
      const key = app as keyof typeof currentUsage;
      if (currentUsage[key] !== undefined) {
        const updatedUsage = {
          ...currentUsage,
          [key]: currentUsage[key] + minutes,
        };
        set({ socialUsage: updatedUsage });
      }
      
      // 3. Re-verify locks
      get().checkSystemLocks();
      
      // 4. Send buddy status alert
      await queueSyncItem('social_activity', { app, minutes });
      get().triggerSync();
    },

    startObservation: () => {
      const startedAt = get().observationStartedAt ?? new Date().toISOString();
      set({
        observationStartedAt: startedAt,
        observationComplete: false,
      });
      get().seedObservationData();
      saveState({ observationStartedAt: startedAt, observationComplete: false });
    },

    completeObservation: () => {
      set({ observationComplete: true });
      const plan = get().generateRecoveryPlan();
      set({ recoveryPlan: { ...plan, active: true } });
      saveState({ observationComplete: true, recoveryPlan: { ...plan, active: true } });
    },

    seedObservationData: () => {
      const now = new Date().toISOString();
      const usage = get().socialUsage;
      const screenSnapshot: ScreenUsageSnapshot = {
        id: Math.random().toString(36).substr(2, 9),
        screenTimeMinutes: Object.values(usage).reduce((sum, mins) => sum + mins, 0),
        highDopamineAppMinutes: usage.TikTok + usage.Instagram + usage.Snapchat,
        appSwitchCount: 72,
        nightScreenTime: 38,
        topApps: [
          { appName: 'Instagram', minutes: usage.Instagram, category: 'social_media' },
          { appName: 'TikTok', minutes: usage.TikTok, category: 'social_media' },
          { appName: 'YouTube', minutes: usage.YouTube, category: 'video' },
        ],
        createdAt: now,
      };
      const activitySnapshot: ActivitySnapshot = {
        id: Math.random().toString(36).substr(2, 9),
        stepCount: Math.max(get().stepsWalked, 2200),
        sedentaryMinutes: 420,
        sleepHours: 6.2,
        createdAt: now,
      };
      const screenUsageSnapshots = [screenSnapshot, ...get().screenUsageSnapshots].slice(0, 12);
      const activitySnapshots = [activitySnapshot, ...get().activitySnapshots].slice(0, 12);
      set({ screenUsageSnapshots, activitySnapshots });
      get().recordBehaviorEvent({
        type: 'screen_usage_snapshot',
        payload: screenSnapshot as unknown as Record<string, unknown>,
      });
      get().recordBehaviorEvent({
        type: 'step_snapshot',
        payload: activitySnapshot as unknown as Record<string, unknown>,
      });
      get().refreshBurnoutRisk();
      saveState({ screenUsageSnapshots, activitySnapshots });
    },

    recordBehaviorEvent: (event) => {
      const newEvent: BehaviorEvent = {
        ...event,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        synced: false,
      };
      const behaviorEvents = [newEvent, ...get().behaviorEvents].slice(0, 80);
      set({ behaviorEvents });
      saveState({ behaviorEvents });
      queueSyncItem(event.type, event.payload);
    },

    submitMoodCheckIn: (checkIn) => {
      const newCheckIn: MoodCheckIn = {
        ...checkIn,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      };
      const moodCheckIns = [newCheckIn, ...get().moodCheckIns].slice(0, 30);
      set({ moodCheckIns });
      get().recordBehaviorEvent({
        type: 'mood_checkin',
        payload: {
          moodScore: newCheckIn.moodScore,
          energyScore: newCheckIn.energyScore,
          stressScore: newCheckIn.stressScore,
          focusScore: newCheckIn.focusScore,
          overwhelmed: newCheckIn.overwhelmed,
        },
      });
      const risk = get().refreshBurnoutRisk();
      if (risk.burnoutRiskScore >= 70 && get().observationComplete && !get().focusLockActive) {
        get().triggerFocusLock('Burnout Risk Rising', 15 * 60);
      }
      saveState({ moodCheckIns });
    },

    refreshBurnoutRisk: () => {
      const usage = get().socialUsage;
      const latestMood = get().moodCheckIns[0];
      const latestScreen = get().screenUsageSnapshots[0];
      const latestActivity = get().activitySnapshots[0];
      const totalScreenTimeMins =
        latestScreen?.screenTimeMinutes ?? Object.values(usage).reduce((sum, mins) => sum + mins, 0);
      const highDopamineMinutes =
        latestScreen?.highDopamineAppMinutes ?? usage.TikTok + usage.Instagram + usage.Snapchat;

      // Background biometric sync
      getSyncBiometrics().then(biometrics => {
        const currentSteps = get().stepsWalked;
        let changed = false;
        const updates: Partial<AppState> = {};

        if (biometrics.steps > currentSteps) {
          updates.stepsWalked = biometrics.steps;
          changed = true;
        }

        if (latestActivity && latestActivity.sleepHours !== biometrics.sleepHours) {
          const updatedAct = {
            ...latestActivity,
            stepCount: biometrics.steps,
            sleepHours: biometrics.sleepHours,
          };
          updates.activitySnapshots = [updatedAct, ...get().activitySnapshots.slice(1)];
          changed = true;
        }

        if (changed) {
          set(updates);
          saveState(updates);
        }
      }).catch(err => {
        console.log('[Store] Background biometrics fetch skipped:', err);
      });

      const risk = calculateBurnoutRisk(
        buildRiskInputFromSignals({
          totalScreenTimeMins,
          highDopamineMinutes,
          appSwitchCount: latestScreen?.appSwitchCount ?? 0,
          nightScreenTime: latestScreen?.nightScreenTime ?? 0,
          stepsWalked: Math.max(get().stepsWalked, latestActivity?.stepCount ?? 0),
          sedentaryMinutes: latestActivity?.sedentaryMinutes ?? 0,
          sleepHours: latestActivity?.sleepHours ?? 7,
          moodScore: latestMood?.moodScore ?? 7,
          stressScore: latestMood?.stressScore ?? 3,
          energyScore: latestMood?.energyScore ?? 7,
          recoverySessionsCompleted: get().recoverySessions.length + get().completedMissions.length,
          buddySupportReceived: get().encouragementMessages.length,
        })
      );

      const buddyGroup = {
        ...get().buddyGroup,
        members: get().buddyGroup.members.map(member =>
          member.id === 'me'
            ? {
                ...member,
                recoveryScore: risk.recoveryScore,
                currentState: risk.status,
                personalStreak: get().streakCount,
                treeContribution: get().recoveryTree.leavesCount,
              }
            : member
        ),
      };

      set({ burnoutRisk: risk, buddyGroup });
      saveState({ burnoutRisk: risk, buddyGroup });
      return risk;
    },

    generateRecoveryPlan: () => {
      const risk = get().refreshBurnoutRisk();
      const { generateLocalRecoveryPlan } = require('./utils/mockAiPlan');
      const plan = generateLocalRecoveryPlan({
        userId: get().authUserId || get().user.id || get().user.email || 'local-user',
        risk,
      });
      set({ recoveryPlan: plan });
      
      getSyncBiometrics().then(biometrics => {
        generateAiRecoveryPlan({
          userId: get().authUserId || get().user.id || get().user.email || 'local-user',
          risk,
          userProfile: get().user,
          latestBiometrics: biometrics,
        }).then(aiPlan => {
          set({ recoveryPlan: aiPlan });
          saveState({ recoveryPlan: aiPlan });
          console.log('[Store] Cloud AI plan generated and cached successfully');
        }).catch(err => {
          console.log('[Store] Cloud AI plan failed to generate:', err);
        });
      }).catch(err => {
        console.log('[Store] Background biometrics fetch failed for AI plan:', err);
      });

      get().recordBehaviorEvent({
        type: 'plan_rule_executed',
        payload: { planId: plan.planId, riskLevel: plan.riskLevel },
      });
      saveState({ recoveryPlan: plan });
      return plan;
    },

    activateRecoveryPlan: () => {
      const currentPlan = get().recoveryPlan ?? get().generateRecoveryPlan();
      const recoveryPlan = { ...currentPlan, active: true };
      set({ recoveryPlan });
      saveState({ recoveryPlan });
    },

    completeRecoveryTask: async (task) => {
      const recoverySession: RecoverySession = {
        id: Math.random().toString(36).substr(2, 9),
        taskId: task.id,
        taskType: task.type,
        completedAt: new Date().toISOString(),
        rewardPoints: task.rewardPoints,
        recoveryValue: task.recoveryValue,
      };
      const recoveryLog: EnergyLog = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'recovered',
        category: task.type === 'sound_therapy' ? 'Stress regulation support' : task.type,
        title: task.title,
        durationMinutes: task.durationMinutes,
        intensity: 'Medium',
        scoreValue: task.recoveryValue,
        notes: 'Recovery support task completed.',
        createdAt: new Date().toISOString(),
      };
      const recoverySessions = [recoverySession, ...get().recoverySessions];
      const energyLogs = [recoveryLog, ...get().energyLogs];
      const balance = recalculateBalance(energyLogs);
      const points = get().points + task.rewardPoints;

      set({ recoverySessions, energyLogs, balance, points });
      await addDbLog(recoveryLog);
      get().addBuddyTreeLeaf(1);

      pushBuddyFeedEvent(
        get().user.name || 'Anonymous Buddy',
        'success',
        `completed a ${task.durationMinutes}m ${task.title}!`
      ).catch(e => console.log('[Supabase] Feed event push skipped:', e));

      get().recordBehaviorEvent({
        type: 'recovery_session_completed',
        payload: { taskId: task.id, taskType: task.type, rewardPoints: task.rewardPoints },
      });
      get().refreshBurnoutRisk();
      await saveState({ recoverySessions, energyLogs, balance, points });
      get().triggerSync();
    },

    addBuddyTreeLeaf: (count = 1) => {
      const leavesCount = get().recoveryTree.leavesCount + count;
      const branchesCount = Math.floor(leavesCount / 7);
      const flowersCount = Math.floor(leavesCount / 30);
      const fruitsCount = Math.floor(leavesCount / 50);
      const level = Math.max(1, Math.floor(leavesCount / 6));
      const growthStage =
        leavesCount >= 50 ? 'fruiting' : leavesCount >= 30 ? 'blooming' : leavesCount >= 8 ? 'young_tree' : 'seedling';
      const recoveryTree: RecoveryTree = {
        ...get().recoveryTree,
        leavesCount,
        branchesCount,
        flowersCount,
        fruitsCount,
        level,
        growthStage,
      };
      set({ recoveryTree });
      saveState({ recoveryTree });
      syncRecoveryTree(recoveryTree).catch(e => console.log('[Supabase] Tree progress sync skipped:', e));
    },

    sendEncouragementMessage: (buddyName, message) => {
      const encouragement: EncouragementMessage = {
        id: Math.random().toString(36).substr(2, 9),
        text: message,
        toBuddyName: buddyName,
        createdAt: new Date().toISOString(),
      };
      const encouragementMessages = [encouragement, ...get().encouragementMessages].slice(0, 30);
      const buddyFeed: BuddyFeedItem[] = [
        {
          id: Math.random().toString(36).substr(2, 9),
          name: 'You',
          event: 'cheer' as const,
          detail: `sent encouragement to ${buddyName}: "${message}"`,
          timestamp: 'Just now',
        },
        ...get().buddyFeed,
      ].slice(0, 20);
      set({ encouragementMessages, buddyFeed, points: get().points + 5 });
      
      pushBuddyFeedEvent(
        get().user.name || 'Anonymous Buddy',
        'cheer',
        `sent encouragement to ${buddyName}: "${message}"`
      ).catch(e => console.log('[Supabase] Feed event push skipped:', e));

      get().recordBehaviorEvent({
        type: 'buddy_encouragement_sent',
        payload: { buddyName, message },
      });
      saveState({ encouragementMessages, buddyFeed, points: get().points });
    },

    // SYSTEM LOCK MONITOR
    checkSystemLocks: async () => {
      // A. TIME TAMPER DETECTOR
      const now = Date.now();
      const last = get().lastKnownTime;
      const diff = now - last;
      const currentRisk = get().refreshBurnoutRisk();
      
      // Check for jumps larger than 10 minutes (600,000 ms) in either direction
      // (ignoring normal AppState suspensions since we update lastKnownTime on resume)
      if (Math.abs(diff) > 10 * 60 * 1000) {
        set({ isTimeTampered: true });
        console.warn('[SECURITY] System clock tampering detected!');
      }
      set({ lastKnownTime: now });

      // B. MIDNIGHT SLEEP LOCK
      const hour = new Date().getHours();
      const intensity = get().user.recoveryIntensity || 'medium';
      
      if (intensity === 'high' && (hour >= 23 || hour < 6)) {
        if (get().restrictedApp !== 'Sleep Lockout') {
          get().triggerFocusLock('Sleep Lockout', 3600 * 7); // Full sleep cycle block
        }
        return;
      } else if (get().restrictedApp === 'Sleep Lockout' && (hour >= 6 && hour < 23)) {
        // Sleep lockout is over! release
        get().releaseFocusLock();
      }

      // C. SLIDING WINDOW RATE LIMITER (rolling social media window)
      // High: 30m in last 2h. Medium: 40m in last 2h. Low: 60m in last 2h.
      const thresholdMap = {
        high: 30,
        medium: 40,
        low: 60,
      };
      const threshold = thresholdMap[intensity];
      const slidingStart = Date.now() - 2 * 60 * 60 * 1000;
      
      const usageLogs = await getSocialUsageLogs(slidingStart);
      const totalMinutes = usageLogs.reduce((acc, log) => acc + log.durationMinutes, 0);

      // If user exceeded the sliding window, activate a supportive recovery shield.
      if (totalMinutes >= threshold && !get().focusLockActive) {
        get().triggerFocusLock('Digital Overload Pattern', 1200); // 20 minute cooldown
        
        await queueSyncItem('rate_limit_lockout', { limit: threshold, actual: totalMinutes });
        get().recordBehaviorEvent({
          type: 'shield_triggered',
          payload: { source: 'digital_limit', limit: threshold, actual: totalMinutes },
        });
        get().triggerSync();
      }

      // D. BIOMETRIC TRIGGER CHECK (Smartwatch Spikes)
      try {
        const biometrics = await getSyncBiometrics();
        if (biometrics.averageHeartRate > 100 && biometrics.hrv < 35 && !get().focusLockActive) {
          get().triggerFocusLock('Biometric Stress Alert', 600); // 10 minute cooldown
          await queueSyncItem('biometric_spike_lockout', { hr: biometrics.averageHeartRate, hrv: biometrics.hrv });
          get().recordBehaviorEvent({
            type: 'shield_triggered',
            payload: { source: 'biometric_spike', hr: biometrics.averageHeartRate, hrv: biometrics.hrv },
          });
          get().triggerSync();
        }
      } catch (err) {
        console.log('[Store] checkSystemLocks biometric check skipped:', err);
      }

      if (
        get().observationComplete &&
        currentRisk.burnoutRiskScore >= 76 &&
        !get().focusLockActive
      ) {
        get().triggerFocusLock('Burnout Risk Rising', 15 * 60);
        get().recordBehaviorEvent({
          type: 'shield_triggered',
          payload: { source: 'burnout_risk_engine', riskScore: currentRisk.burnoutRiskScore },
        });
      }
    },

    // Sync Simulation
    triggerSync: () => {
      set({ syncStatus: 'pending_sync' });
      setTimeout(async () => {
        set({ syncStatus: 'syncing' });
        
        try {
          const queue = await getSyncQueue();
          if (queue.length > 0) {
            const synced = await syncUserProfile({
              id: get().authUserId || get().user.id || get().user.email || 'local-user',
              name: get().user.name || 'Demb User',
              recovery_score: get().burnoutRisk.recoveryScore,
              streak_count: get().streakCount,
              current_status: get().burnoutRisk.status,
            });

            if (synced) {
              await removeSyncItems(queue.map(q => q.id));
              console.log(`[SYNC] Synced ${queue.length} queued items`);
            } else {
              console.log(`[SYNC] Supabase is not configured. Keeping ${queue.length} items in SQLite queue.`);
            }
          }
        } catch (err) {
          console.log('[SYNC] Offline or network error. Items remain in SQLite queue.', err);
        }

        set({ syncStatus: 'synced' });
      }, 1500);
    },

    // Load State
    loadSavedState: async () => {
      try {
        await initDb();
        await pruneOldSocialLogs();

        // Load setting configurations from SQLite
        const dbUser = await getDbUser();
        const dbLogs = await getDbLogs();
        const dbMissions = await getDbCompletedMissions();

        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const userProfile = dbUser ?? parsed.user ?? initialProfile;
          const logs = dbLogs.length > 0 ? dbLogs : (parsed.energyLogs ?? []);
          const balance = recalculateBalance(logs);
          
          set({
            user: userProfile,
            balance: balance,
            points: parsed.points ?? 0,
            streakCount: parsed.streakCount ?? 0,
            energyLogs: logs,
            priorities: parsed.priorities ?? null,
            eveningReviews: parsed.eveningReviews ?? [],
            completedMissions: dbMissions.length > 0 ? dbMissions : (parsed.completedMissions ?? []),
            buddies: parsed.buddies ?? [],
            buddyRequests: parsed.buddyRequests ?? [],
            buddyFeed: parsed.buddyFeed ?? [],
            socialUsage: parsed.socialUsage ?? initialSocialUsage,
            observationStartedAt: parsed.observationStartedAt ?? null,
            observationComplete: parsed.observationComplete ?? false,
            behaviorEvents: parsed.behaviorEvents ?? [],
            moodCheckIns: parsed.moodCheckIns ?? [],
            screenUsageSnapshots: parsed.screenUsageSnapshots ?? [],
            activitySnapshots: parsed.activitySnapshots ?? [],
            burnoutRisk: parsed.burnoutRisk ?? initialBurnoutRisk,
            recoveryPlan: parsed.recoveryPlan ?? null,
            recoverySessions: parsed.recoverySessions ?? [],
            buddyGroup: parsed.buddyGroup ?? initialBuddyGroup,
            recoveryTree: parsed.recoveryTree ?? initialRecoveryTree,
            encouragementMessages: parsed.encouragementMessages ?? [],
            breakLoopActive: false,
            breakLoopTime: 0,
            focusLockScreenVisible: false,
            lastKnownTime: Date.now(),
          });
        } else {
          // No AsyncStorage state, check if SQLite user exists
          if (dbUser) {
            const balance = recalculateBalance(dbLogs);
            set({
              user: dbUser,
              authStatus: dbUser.id || dbUser.email ? 'signed_in' : 'signed_out',
              authUserId: dbUser.id || null,
              energyLogs: dbLogs,
              completedMissions: dbMissions,
              balance: balance,
              burnoutRisk: initialBurnoutRisk,
              lastKnownTime: Date.now(),
            });
          }
        }

        // Initialize Native Blocker settings
        if (Platform.OS === 'android' && DembBlockerModule) {
          try {
            const defaultBlocked = [
              'com.instagram.android',
              'com.zhiliaoapp.musically',
              'com.facebook.katana',
              'com.snapchat.android',
              'com.twitter.android'
            ];
            DembBlockerModule.setBlockedPackages(defaultBlocked);
            DembBlockerModule.setLockState(get().focusLockActive, get().restrictedApp);
          } catch (e) {
            console.log('[NativeBlocker] Error syncing startup settings:', e);
          }
        }

        // Initial system check
        get().checkSystemLocks();
      } catch (e) {
        console.error('Failed to load state from database/AsyncStorage', e);
      }
    },
    resetAllData: () => {
      set({
        user: initialProfile,
        balance: initialBalance,
        points: 0,
        streakCount: 0,
        energyLogs: [],
        priorities: null,
        eveningReviews: [],
        completedMissions: [],
        buddies: [],
        buddyRequests: [],
        buddyFeed: [],
        stepsWalked: 0,
        screenOffStartTime: null,
        screenOffTargetDuration: 0,
        screenOffInterrupted: false,
        breakLoopActive: false,
        breakLoopTime: 0,
        focusLockActive: false,
        focusLockScreenVisible: false,
        restrictedApp: '',
        focusLockTimeLeft: 0,
        currentActiveMission: null,
        missionTimeLeft: 0,
        isTimeTampered: false,
        socialUsage: initialSocialUsage,
        observationStartedAt: null,
        observationComplete: false,
        behaviorEvents: [],
        moodCheckIns: [],
        screenUsageSnapshots: [],
        activitySnapshots: [],
        burnoutRisk: initialBurnoutRisk,
        recoveryPlan: null,
        recoverySessions: [],
        buddyGroup: initialBuddyGroup,
        recoveryTree: initialRecoveryTree,
        encouragementMessages: [],
      });
      AsyncStorage.removeItem(STORAGE_KEY);
      AsyncStorage.removeItem(KEYS.USER);
      AsyncStorage.removeItem(KEYS.LOGS);
      AsyncStorage.removeItem(KEYS.MISSIONS);
      AsyncStorage.removeItem(KEYS.SYNC_QUEUE);
      AsyncStorage.removeItem(KEYS.SOCIAL_LOGS);
    }
  };
});

const KEYS = {
  USER: '@demb_db_user',
  LOGS: '@demb_db_logs',
  MISSIONS: '@demb_db_missions',
  SYNC_QUEUE: '@demb_db_sync_queue',
  SOCIAL_LOGS: '@demb_db_social_logs',
};
