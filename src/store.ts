import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  name: string;
  email: string;
  profileType: 'student' | 'employee' | 'entrepreneur' | 'parent' | 'other' | '';
  biggestProblem: string;
  dailyGoal: string;
  isOnboarded: boolean;
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
  
  // Missions
  missions: RecoveryMission[];
  completedMissions: string[]; // ids of completed missions
  
  // App Modes / Simulation
  focusLockActive: boolean;
  restrictedApp: string;
  focusLockTimeLeft: number; // seconds
  currentActiveMission: RecoveryMission | null;
  missionTimeLeft: number; // seconds
  syncStatus: 'synced' | 'pending_sync' | 'syncing';
  
  // Actions
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
  
  // Buddy Actions
  sendBuddyRequest: (name: string) => void;
  acceptBuddyRequest: (requestId: string) => void;
  declineBuddyRequest: (requestId: string) => void;
  sendCheerToBuddy: (buddyName: string) => void;
  
  // Hardware & Screen Off Actions
  incrementSteps: (count: number) => void;
  startScreenOffDetox: (durationSeconds: number) => void;
  registerScreenOff: () => void;
  verifyScreenOff: () => { success: boolean; elapsedSeconds: number };
  
  // Focus Lock Simulation Actions
  triggerFocusLock: (appName: string, durationSeconds?: number) => void;
  tickFocusLock: () => void;
  extendFocusLock: (seconds: number) => void;
  releaseFocusLock: () => void;
  
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
    bgColor: '#ece6f0', // soft purple
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
    bgColor: '#a6f2cf', // soft green
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
    bgColor: '#ffdad6', // soft peach/red
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
    bgColor: '#ffdcbd', // soft orange
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
    bgColor: '#e8ddff', // light purple-blue
  }
];

const initialProfile: UserProfile = {
  name: '',
  email: '',
  profileType: '',
  biggestProblem: '',
  dailyGoal: '',
  isOnboarded: false,
};

const initialBalance: DailyBalance = {
  energySpent: 87, // Match design mockup initial state
  energyRecovered: 41, // Match design mockup initial state
  balanceScore: -46, // 41 - 87
  recoveryDebt: 46,
  burnoutRisk: 'Moderate',
  focusLevel: 65,
};

// Calculate balance stats based on logs
const recalculateBalance = (logs: EnergyLog[]): DailyBalance => {
  let spent = 87; // seed values to match the default mockups
  let recovered = 41;

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
  
  // Helper to save state locally
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
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save state to AsyncStorage', e);
    }
  };

  return {
    // State
    user: initialProfile,
    balance: initialBalance,
    points: 50,
    streakCount: 5,
    energyLogs: [],
    priorities: null,
    eveningReviews: [],
    missions: DEFAULT_MISSIONS,
    completedMissions: [],
    
    // Buddy system seed data
    buddies: ['Alex', 'Sarah', 'Jessica'],
    buddyRequests: [],
    buddyFeed: [
      { id: 'f1', name: 'Alex', event: 'success', detail: 'completed a 10m Nature Walk!', timestamp: '2 mins ago' },
      { id: 'f2', name: 'Sarah', event: 'lock', detail: 'is stuck on Instagram. Cheer them on!', timestamp: '5 mins ago' }
    ],
    
    // Hardware step and screen-off tracking state
    stepsWalked: 0,
    screenOffStartTime: null,
    screenOffTargetDuration: 0,
    screenOffInterrupted: false,
    
    focusLockActive: false,
    restrictedApp: '',
    focusLockTimeLeft: 0,
    currentActiveMission: null,
    missionTimeLeft: 0,
    syncStatus: 'synced',
    
    // Onboarding Action
    setOnboarding: (profileData) => {
      const updatedUser = { ...get().user, ...profileData, isOnboarded: true };
      set({ user: updatedUser });
      saveState({ user: updatedUser });
      get().triggerSync();
    },

    // Energy Log Actions
    addEnergyLog: (logData) => {
      // Calculate score value based on category/duration/intensity
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

      // Auto-trigger Focus Lock simulation if balance is too low (e.g. balanceScore < -60)
      if (updatedBalance.balanceScore < -60 && !get().focusLockActive) {
        get().triggerFocusLock('Instagram', 15 * 60); // simulated 15 mins lock
      }

      saveState({ energyLogs: updatedLogs, balance: updatedBalance });
      get().triggerSync();
    },

    deleteEnergyLog: (id) => {
      const updatedLogs = get().energyLogs.filter(log => log.id !== id);
      const updatedBalance = recalculateBalance(updatedLogs);

      set({
        energyLogs: updatedLogs,
        balance: updatedBalance,
      });

      saveState({ energyLogs: updatedLogs, balance: updatedBalance });
      get().triggerSync();
    },

    // Priorities
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

    // Reviews
    submitEveningReview: (reviewData) => {
      const newReview: EveningReview = {
        ...reviewData,
        date: new Date().toDateString(),
      };
      const updatedReviews = [newReview, ...get().eveningReviews];
      const newPoints = get().points + 20; // 20 points for reflecting!

      set({
        eveningReviews: updatedReviews,
        points: newPoints,
      });

      saveState({ eveningReviews: updatedReviews, points: newPoints });
      get().triggerSync();
    },

    // Missions
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

    completeMission: () => {
      const activeMission = get().currentActiveMission;
      if (!activeMission) return;

      // Add to completed list
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

      // If focus lock was active, release it since we completed a mission!
      if (get().focusLockActive) {
        get().releaseFocusLock();
      }

      saveState({
        completedMissions: updatedCompletions,
        points: newPoints,
        streakCount: newStreak,
        energyLogs: updatedLogs,
        balance: updatedBalance,
      });
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

    // Buddy Actions
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

    sendCheerToBuddy: (buddyName) => {
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
      saveState({ buddyFeed: updatedFeed, points: newPoints });
    },
    
    // Hardware & Screen Off Actions
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

    // Focus Lock Simulation Actions
    triggerFocusLock: (appName, durationSeconds = 600) => {
      set({
        focusLockActive: true,
        restrictedApp: appName,
        focusLockTimeLeft: durationSeconds,
      });
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
        restrictedApp: '',
        focusLockTimeLeft: 0,
      });
    },

    // Sync Simulation
    triggerSync: () => {
      set({ syncStatus: 'pending_sync' });
      setTimeout(() => {
        set({ syncStatus: 'syncing' });
        setTimeout(() => {
          set({ syncStatus: 'synced' });
        }, 1500);
      }, 500);
    },

    // Load State
    loadSavedState: async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          set({
            user: parsed.user ?? initialProfile,
            balance: parsed.balance ?? initialBalance,
            points: parsed.points ?? 50,
            streakCount: parsed.streakCount ?? 5,
            energyLogs: parsed.energyLogs ?? [],
            priorities: parsed.priorities ?? null,
            eveningReviews: parsed.eveningReviews ?? [],
            completedMissions: parsed.completedMissions ?? [],
            buddies: parsed.buddies ?? ['Alex', 'Sarah', 'Jessica'],
            buddyRequests: parsed.buddyRequests ?? [],
            buddyFeed: parsed.buddyFeed ?? [
              { id: 'f1', name: 'Alex', event: 'success', detail: 'completed a 10m Nature Walk!', timestamp: '2 mins ago' },
              { id: 'f2', name: 'Sarah', event: 'lock', detail: 'is stuck on Instagram. Cheer them on!', timestamp: '5 mins ago' }
            ],
          });
        }
      } catch (e) {
        console.error('Failed to load state from AsyncStorage', e);
      }
    },

    resetAllData: () => {
      set({
        user: initialProfile,
        balance: initialBalance,
        points: 50,
        streakCount: 5,
        energyLogs: [],
        priorities: null,
        eveningReviews: [],
        completedMissions: [],
        buddies: ['Alex', 'Sarah', 'Jessica'],
        buddyRequests: [],
        buddyFeed: [
          { id: 'f1', name: 'Alex', event: 'success', detail: 'completed a 10m Nature Walk!', timestamp: '2 mins ago' },
          { id: 'f2', name: 'Sarah', event: 'lock', detail: 'is stuck on Instagram. Cheer them on!', timestamp: '5 mins ago' }
        ],
        stepsWalked: 0,
        screenOffStartTime: null,
        screenOffTargetDuration: 0,
        screenOffInterrupted: false,
        focusLockActive: false,
        restrictedApp: '',
        focusLockTimeLeft: 0,
        currentActiveMission: null,
        missionTimeLeft: 0,
      });
      AsyncStorage.removeItem(STORAGE_KEY);
    }
  };
});
