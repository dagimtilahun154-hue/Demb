import { NativeModules, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Native modules bridge
const { DembBlockerModule } = NativeModules;

export interface BiometricData {
  steps: number;
  averageHeartRate: number;
  hrv: number; // SDNN or RMSSD
  sleepHours: number;
  dataSource: 'smartwatch' | 'phone_sensors' | 'self_reported' | 'default';
}

const STORAGE_KEYS = {
  LAST_INTERACTION: '@demb_last_interaction_time',
  DAILY_BIOMETRICS: '@demb_daily_biometrics',
};

// Log interaction to estimate sleep duration for non-watch users
export async function recordUserInteraction() {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_INTERACTION, Date.now().toString());
  } catch (e) {
    console.warn('Failed to record user interaction for sleep estimation', e);
  }
}

// Estimate sleep duration based on phone idle period
export async function estimateSleepFromIdle(): Promise<number> {
  try {
    const lastInteractionStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_INTERACTION);
    if (!lastInteractionStr) return 7.0; // Default baseline

    const lastInteraction = parseInt(lastInteractionStr, 10);
    const now = Date.now();
    const idleMs = now - lastInteraction;

    // Convert to hours. If idle is between 4 and 12 hours, assume that was sleep.
    const idleHours = idleMs / (1000 * 60 * 60);
    if (idleHours >= 4 && idleHours <= 12) {
      return Math.round(idleHours * 10) / 10;
    }
  } catch (e) {
    console.warn('Failed to estimate sleep from idle duration', e);
  }
  return 7.0; // Default fallback
}

/**
 * Main function to fetch biometrics, checking native smartwatch integration (Health Connect) first.
 * If not available or denied, falls back to local pedometer and idle sleep calculation.
 */
export async function getSyncBiometrics(): Promise<BiometricData> {
  const isAndroid = Platform.OS === 'android';
  
  // 1. Attempt smartwatch connection via native Android module
  if (isAndroid && DembBlockerModule) {
    try {
      const hasPermission = await DembBlockerModule.checkHealthPermissions();
      if (hasPermission) {
        const nativeData = await DembBlockerModule.getHealthConnectData();
        if (nativeData) {
          return {
            steps: nativeData.steps || 0,
            averageHeartRate: nativeData.averageHeartRate || 72,
            hrv: nativeData.hrv || 55,
            sleepHours: nativeData.sleepHours || 7.2,
            dataSource: 'smartwatch',
          };
        }
      }
    } catch (err) {
      console.log('[HealthConnect] Native smartwatch read failed or bypassed:', err);
    }
  }

  // 2. Pedometer Fallback (expo-sensors)
  let steps = 0;
  let hasPedometer = false;
  try {
    hasPedometer = await Pedometer.isAvailableAsync();
    if (hasPedometer) {
      const start = new Date();
      start.setHours(0, 0, 0, 0); // Start of today
      const end = new Date();
      const result = await Pedometer.getStepCountAsync(start, end);
      steps = result.steps;
    }
  } catch (err) {
    console.log('[Pedometer] Failed to query local phone steps:', err);
  }

  // 3. Sleep duration fallback
  const sleepHours = await estimateSleepFromIdle();

  // 4. HRV/Stress baseline or manual check-in placeholders
  const averageHeartRate = 72; // baseline
  const hrv = 55; // baseline

  return {
    steps: steps || 1500, // baseline defaults if completely zero
    averageHeartRate,
    hrv,
    sleepHours,
    dataSource: hasPedometer ? 'phone_sensors' : 'default',
  };
}

/**
 * Helper to request smartwatch sync permissions (called from UI settings)
 */
export async function requestSmartwatchPermissions(): Promise<boolean> {
  const isAndroid = Platform.OS === 'android';
  if (isAndroid && DembBlockerModule) {
    try {
      return await DembBlockerModule.requestHealthPermissions();
    } catch (err) {
      console.warn('[HealthConnect] Request permissions error:', err);
    }
  }
  return false;
}
