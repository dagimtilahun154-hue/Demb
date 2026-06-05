import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store';

const appNameByPackage: Record<string, string> = {
  'com.instagram.android': 'Instagram',
  'com.zhiliaoapp.musically': 'TikTok',
  'com.facebook.katana': 'Facebook',
  'com.snapchat.android': 'Snapchat',
  'com.twitter.android': 'X',
};

export default function FocusLockScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ blockedApp?: string; restrictedAppName?: string }>();

  const {
    restrictedApp,
    focusLockTimeLeft,
    missions,
    burnoutRisk,
    isTimeTampered,
    releaseFocusLock,
    startMission,
    tickFocusLock,
  } = useAppStore();

  const [showIntention, setShowIntention] = useState(false);
  const [intentionStep, setIntentionStep] = useState(0);

  const blockedPackage = Array.isArray(params.blockedApp) ? params.blockedApp[0] : params.blockedApp;
  const routeLabel = Array.isArray(params.restrictedAppName) ? params.restrictedAppName[0] : params.restrictedAppName;
  const blockedAppName = blockedPackage
    ? appNameByPackage[blockedPackage] ?? blockedPackage
    : routeLabel ?? (restrictedApp || 'that app');
  const causeText = burnoutRisk.causes.length > 0 ? burnoutRisk.causes.slice(0, 2).join(' + ') : 'digital overload';

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      tickFocusLock();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickFocusLock]);

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTask = () => {
    const walkMission = missions.find((mission) => mission.id === 'm2') || missions[0];
    if (!walkMission) {
      Alert.alert('No task ready', 'Demb could not find a recovery task yet.');
      return;
    }
    router.push({ pathname: '/mission', params: { missionId: walkMission.id } });
  };

  const handleIntentionAnswer = () => {
    if (intentionStep < intentionPrompts.length - 1) {
      setIntentionStep((step) => step + 1);
      return;
    }

    setShowIntention(false);
    setIntentionStep(0);
  };

  if (isTimeTampered) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <Ionicons name="warning" size={70} color="#EF4444" />
        <Text style={styles.title}>Clock sync needed</Text>
        <Text style={styles.copy}>Demb paused restrictions until your phone time is stable again.</Text>
      </View>
    );
  }

  if (restrictedApp === 'Sleep Lockout') {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.glowTop} />
        <Ionicons name="moon" size={70} color="#A7F36B" />
        <Text style={styles.title}>Sleep lock</Text>
        <Text style={styles.timer}>{formatTime(focusLockTimeLeft)}</Text>
        <Text style={styles.copy}>Social apps reopen after your recovery window.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 34, paddingBottom: insets.bottom + 34 }]}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.lockGlyph}>
        <Ionicons name="lock-closed" size={42} color="#FFFFFF" />
      </View>

      <Text style={styles.eyebrow}>Recovery shield</Text>
      <Text style={styles.title}>{blockedAppName} is paused</Text>

      <Text style={styles.timer}>{formatTime(focusLockTimeLeft)}</Text>
      <Text style={styles.copy}>until this app can open again</Text>

      <Pressable style={styles.taskButton} onPress={handleTask}>
        <Ionicons name="leaf-outline" size={20} color="#1F1E24" />
        <Text style={styles.taskButtonText}>Do a task</Text>
      </Pressable>

      <Pressable style={styles.intentionButton} onPress={() => setShowIntention(true)}>
        <Text style={styles.intentionText}>Set intention</Text>
      </Pressable>

      <Text style={styles.footnote}>{causeText}</Text>

      <Modal visible={showIntention} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Ionicons name="bulb-outline" size={42} color="#6C63FF" />
            <Text style={styles.modalTitle}>Intention</Text>
            <Text style={styles.modalQuestion}>{intentionPrompts[intentionStep].question}</Text>
            <View style={styles.optionList}>
              {intentionPrompts[intentionStep].options.map((option) => (
                <Pressable key={option} style={styles.optionButton} onPress={handleIntentionAnswer}>
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const intentionPrompts = [
  {
    question: 'Why did you open it?',
    options: ['Habit', 'Message', 'Boredom'],
  },
  {
    question: 'What matters next?',
    options: ['Finish work', 'Walk', 'Rest'],
  },
  {
    question: 'Choose your next move.',
    options: ['Wait it out', 'Do a task', 'Close phone'],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 8, 13, 0.82)',
  },
  centered: {
    gap: 18,
  },
  glowTop: {
    position: 'absolute',
    top: -140,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(120, 202, 42, 0.18)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -170,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(108, 99, 255, 0.18)',
  },
  lockGlyph: {
    width: 98,
    height: 98,
    borderRadius: 49,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    marginBottom: 28,
  },
  eyebrow: {
    color: '#A7F36B',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 24,
  },
  timer: {
    color: '#FFFFFF',
    fontSize: 78,
    lineHeight: 86,
    fontWeight: '900',
    textAlign: 'center',
  },
  copy: {
    color: '#E6E5EA',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  taskButton: {
    height: 56,
    width: '100%',
    maxWidth: 330,
    borderRadius: 28,
    backgroundColor: '#A7F36B',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  taskButtonText: {
    color: '#1F1E24',
    fontSize: 16,
    fontWeight: '900',
  },
  intentionButton: {
    height: 52,
    width: '100%',
    maxWidth: 330,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  intentionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  footnote: {
    color: '#BDB9CA',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 22,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 13, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 26,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#1F1E24',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 12,
  },
  modalQuestion: {
    color: '#403B4C',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionList: {
    width: '100%',
    gap: 10,
  },
  optionButton: {
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: '#F5F4F7',
    borderWidth: 1,
    borderColor: '#E2DFE8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  optionText: {
    color: '#403B4C',
    fontSize: 15,
    fontWeight: '800',
  },
});
