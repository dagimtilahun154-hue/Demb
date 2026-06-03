import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, useColorScheme, Pressable, AppState, AppStateStatus, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import Svg, { Circle } from 'react-native-svg';
import { Image } from 'expo-image';
import NeomorphicCard from '@/components/NeomorphicCard';

// Dynamic sensor imports for crash safety
let Pedometer: any = null;
try {
  Pedometer = require('expo-sensors').Pedometer;
} catch (e) {
  console.log('expo-sensors Pedometer not loaded', e);
}

let Location: any = null;
try {
  Location = require('expo-location');
} catch (e) {
  console.log('expo-location not loaded', e);
}

// Haversine distance calculator in meters
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

export default function MissionTimerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';

  const {
    missions,
    currentActiveMission,
    missionTimeLeft,
    stepsWalked,
    screenOffTargetDuration,
    screenOffInterrupted,
    startMission,
    tickMission,
    completeMission,
    cancelMission,
    incrementSteps,
    startScreenOffDetox,
    registerScreenOff,
    verifyScreenOff,
  } = useAppStore();

  const [isFinished, setIsFinished] = useState(false);
  const [gpsDistance, setGpsDistance] = useState(0);
  const [usingSimulation, setUsingSimulation] = useState(false);
  const appState = useRef(AppState.currentState);

  const missionId = (params.missionId as string) || 'm1';
  const mission = missions.find(m => m.id === missionId) || missions[0];

  // Start the mission on mount
  useEffect(() => {
    startMission(mission.id);
    
    if (mission.id === 'm3') {
      startScreenOffDetox(20); 
    }

    return () => {
      cancelMission();
    };
  }, [mission.id]);

  // Tick timer every second for standard countdowns
  useEffect(() => {
    if (isFinished || !currentActiveMission || mission.id === 'm2' || mission.id === 'm3') return;

    const interval = setInterval(() => {
      if (missionTimeLeft <= 1) {
        setIsFinished(true);
        completeMission();
      } else {
        tickMission();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentActiveMission, missionTimeLeft, isFinished]);

  // Native AppState detection for Screen-Off detox tasks
  useEffect(() => {
    if (mission.id !== 'm3' || isFinished) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/active/) &&
        (nextAppState === 'inactive' || nextAppState === 'background')
      ) {
        registerScreenOff();
      }

      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        const check = verifyScreenOff();
        if (check.success) {
          setIsFinished(true);
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isFinished]);

  // Real GPS & Location tracking
  useEffect(() => {
    if (mission.id !== 'm2' || isFinished) return;

    let locationSubscription: any = null;

    const startGPS = async () => {
      try {
        if (Location) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            let lastCoords: { latitude: number; longitude: number } | null = null;
            let totalDistance = 0;
            
            locationSubscription = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.High,
                timeInterval: 2000,
                distanceInterval: 1,
              },
              (pos: any) => {
                const currentCoords = pos.coords;
                if (lastCoords) {
                  const d = getHaversineDistance(
                    lastCoords.latitude,
                    lastCoords.longitude,
                    currentCoords.latitude,
                    currentCoords.longitude
                  );
                  if (d > 0.3) { // filter noise
                    totalDistance += d;
                    setGpsDistance(Math.round(totalDistance));
                    
                    // Auto-complete if user covers 10m and logs 50 steps
                    const store = useAppStore.getState();
                    if (totalDistance >= 10 && store.stepsWalked >= 50) {
                      setIsFinished(true);
                      completeMission();
                    }
                  }
                }
                lastCoords = currentCoords;
              }
            );
          } else {
            console.log('[GPS] Permission denied, enabling simulation');
            setUsingSimulation(true);
          }
        } else {
          setUsingSimulation(true);
        }
      } catch (err) {
        console.warn('GPS location tracking failed to start', err);
        setUsingSimulation(true);
      }
    };

    startGPS();
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [mission.id, isFinished]);

  // Real Pedometer hardware step updates & fallbacks
  useEffect(() => {
    if (mission.id !== 'm2' || isFinished) return;

    let subscription: any = null;

    const startPedometer = async () => {
      try {
        if (Pedometer) {
          const available = await Pedometer.isAvailableAsync();
          if (available) {
            let initialSteps: number | null = null;
            subscription = Pedometer.watchStepCount((result: any) => {
              if (initialSteps === null) {
                initialSteps = result.steps;
              }
              const diff = result.steps - initialSteps;
              if (diff > 0) {
                incrementSteps(diff);
                initialSteps = result.steps;
              }
              
              // Verify completions
              const store = useAppStore.getState();
              if (gpsDistance >= 10 && store.stepsWalked + diff >= 50) {
                setIsFinished(true);
                completeMission();
              }
            });
          } else {
            setUsingSimulation(true);
          }
        } else {
          setUsingSimulation(true);
        }
      } catch (err) {
        console.warn('Pedometer sensor failed to start', err);
        setUsingSimulation(true);
      }
    };

    startPedometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [mission.id, isFinished, gpsDistance]);

  // Simulated coordinate/steps increments if hardware unavailable
  useEffect(() => {
    if (mission.id !== 'm2' || isFinished || !usingSimulation) return;

    const simulatedInterval = setInterval(() => {
      incrementSteps(4);
      setGpsDistance(prev => {
        const next = prev + 1;
        // Complete walk when user reaches 10m and 50 steps
        const store = useAppStore.getState();
        if (next >= 10 && store.stepsWalked >= 50) {
          setIsFinished(true);
          completeMission();
        }
        return next;
      });
    }, 1500);

    return () => clearInterval(simulatedInterval);
  }, [mission.id, isFinished, usingSimulation]);

  const handleCancel = () => {
    cancelMission();
    router.back();
  };

  const handleFinish = () => {
    router.back();
  };

  // Circular progress calculations for standard timer
  const totalSeconds = mission.durationMinutes * 60;
  const elapsed = totalSeconds - missionTimeLeft;
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render completed success screen
  if (isFinished) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.four }]}>
        <View style={styles.successHeader}>
          <Image
            source={require('../../assets/images/demb_celebrate.png')}
            style={styles.successMascot}
            contentFit="contain"
          />
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Mission Completed!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            You successfully arrested distractions, completed your physical task, and earned points.
          </Text>
        </View>

        <NeomorphicCard style={styles.rewardsCard} bgColor={colors.successContainer + '20'}>
          <Text style={[styles.rewardsLabel, { color: colors.success }]}>PATROL REWARDS</Text>
          <Text style={[styles.rewardsPoints, { color: colors.textPrimary }]}>+{mission.points} Points</Text>
          <Text style={[styles.rewardsRecovery, { color: colors.textSecondary }]}>+{mission.recoveryValue} Balance Score</Text>
        </NeomorphicCard>

        <NeomorphicCard
          onPress={handleFinish}
          style={styles.doneButton}
          bgColor={colors.primary}
        >
          <Text style={[styles.doneButtonText, { color: colors.onPrimary }]}>Secure & Return</Text>
        </NeomorphicCard>
      </View>
    );
  }

  // Render specific layout based on mission type
  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.two, paddingBottom: insets.bottom + Spacing.four }]}>
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Active Mission</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Main Panel Content */}
      <View style={styles.mainContent}>
        {mission.id === 'm2' ? (
          // ─── NATURE WALK MISSION (GPS & Pedometer Real Sensors) ───
          <View style={styles.taskSection}>
            <Image
              source={require('../../assets/images/demb_progress.png')}
              style={styles.mascotImg}
              contentFit="contain"
            />
            <Text style={[styles.taskTitle, { color: colors.textPrimary }]}>Nature Walk Patrol</Text>
            <Text style={[styles.taskDesc, { color: colors.textSecondary }]}>
              Officer Demb requires physical motion. Walk around to update steps and GPS distance!
            </Text>

            {/* Step Gauge */}
            <View style={styles.stepGaugeWrapper}>
              <Text style={[styles.stepGaugeLabel, { color: colors.primary }]}>{stepsWalked} / 50 STEPS</Text>
              <View style={[styles.progressBar, { backgroundColor: colors.surfaceContainer }]}>
                <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${Math.min(100, (stepsWalked / 50) * 100)}%` }]} />
              </View>
            </View>

            {/* GPS Distance Gauge */}
            <View style={styles.stepGaugeWrapper}>
              <Text style={[styles.stepGaugeLabel, { color: colors.secondary }]}>{gpsDistance} / 10 METERS</Text>
              <View style={[styles.progressBar, { backgroundColor: colors.surfaceContainer }]}>
                <View style={[styles.progressBarFill, { backgroundColor: colors.secondary, width: `${Math.min(100, (gpsDistance / 10) * 100)}%` }]} />
              </View>
            </View>

            {/* Live State Observer Pill */}
            <View style={styles.screenStatePill}>
              <View style={[styles.liveDot, { backgroundColor: usingSimulation ? '#F59E0B' : '#22C55E' }]} />
              <Text style={[styles.liveStateText, { color: usingSimulation ? '#F59E0B' : '#22C55E' }]}>
                {usingSimulation ? 'Demo Mode (Mocking Sensors)' : 'Tracking GPS & Steps Sensors Live'}
              </Text>
            </View>
          </View>
        ) : mission.id === 'm3' ? (
          // ─── PHONE LOCKUP MISSION (AppState Screen Off Detox) ───
          <View style={styles.taskSection}>
            <NeomorphicCard style={styles.alertIconCard} bgColor={colors.error + '10'} glowColor={colors.error}>
              <Ionicons name="phone-portrait-outline" size={48} color={colors.error} />
            </NeomorphicCard>

            <Text style={[styles.taskTitle, { color: colors.textPrimary }]}>Phone Lockup Detox</Text>
            
            {screenOffInterrupted ? (
              <NeomorphicCard style={styles.warningCard} bgColor={colors.error + '08'}>
                <Ionicons name="alert-circle" size={24} color={colors.error} />
                <Text style={[styles.warningText, { color: colors.error }]}>DETOX INTERRUPTED!</Text>
                <Text style={[styles.warningSubtext, { color: colors.textSecondary }]}>
                  You unlocked your screen early. Officer Demb has reset the 20-second countdown. Start again!
                </Text>
              </NeomorphicCard>
            ) : (
              <Text style={[styles.taskDesc, { color: colors.textSecondary }]}>
                Stay offline for 20 seconds. Lock your phone screen now to begin. Do not open other apps!
              </Text>
            )}

            <View style={styles.screenStatePill}>
              <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.liveStateText, { color: colors.primary }]}>Demb State Observer Active</Text>
            </View>
          </View>
        ) : (
          // ─── STANDARD TIMER MISSION (Breathing, Stretching, Hydration) ───
          <View style={styles.timerSection}>
            <View style={styles.timerWrapper}>
              <Svg width={size} height={size}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={scheme === 'light' ? '#ece6f0' : '#494552'}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={colors.primary}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              </Svg>

              <View style={styles.timeOverlay}>
                <Text style={[styles.timeText, { color: colors.textPrimary }]}>
                  {formatTime(missionTimeLeft)}
                </Text>
                <Text style={[styles.categoryText, { color: colors.textMuted }]}>
                  {mission.category}
                </Text>
              </View>
            </View>

            <Text style={[styles.missionLabel, { color: colors.primary }]}>{mission.title}</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Put your device down on a flat surface, close your eyes, and focus on steady recovery.
            </Text>
          </View>
        )}
      </View>

      {/* Action Footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleCancel}
          style={({ pressed }) => [
            styles.cancelButton,
            { borderColor: colors.outlineVariant },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Abort Mission</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    paddingHorizontal: Spacing.two,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  timerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  timerWrapper: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  timeOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 38,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.half,
  },
  missionLabel: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tipText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: Spacing.five,
    lineHeight: 18,
  },
  taskSection: {
    alignItems: 'center',
    gap: Spacing.three,
    width: '100%',
  },
  mascotImg: {
    width: 120,
    height: 120,
    marginBottom: Spacing.one,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  taskDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: Spacing.four,
  },
  stepGaugeWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  stepGaugeLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressBar: {
    height: 10,
    width: '100%',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  stepPadsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  footPad: {
    flex: 1,
    aspectRatio: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  footText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertIconCard: {
    width: 90,
    height: 90,
    borderRadius: Radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  warningCard: {
    padding: Spacing.three,
    gap: Spacing.one,
    alignItems: 'center',
    width: '100%',
  },
  warningText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  warningSubtext: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  screenStatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(103, 75, 181, 0.08)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    marginTop: Spacing.two,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveStateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: Spacing.two,
    width: '100%',
  },
  cancelButton: {
    height: 56,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  successHeader: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  successMascot: {
    width: 140,
    height: 140,
    marginBottom: Spacing.one,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.two,
  },
  rewardsCard: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.four,
    marginBottom: Spacing.three,
    marginHorizontal: Spacing.two,
  },
  rewardsLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  rewardsPoints: {
    fontSize: 26,
    fontWeight: '800',
  },
  rewardsRecovery: {
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    height: 56,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    padding: 0,
    marginHorizontal: Spacing.two,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
