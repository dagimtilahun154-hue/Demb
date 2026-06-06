import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppStore } from '@/store';
import { Colors } from '@/constants/theme';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

// Prevent auto hiding of splash screen
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colors = Colors.light;
  const router = useRouter();
  const segments = useSegments();

  const [isReady, setIsReady] = useState(false);
  const user = useAppStore(state => state.user);
  const authStatus = useAppStore(state => state.authStatus);
  const focusLockActive = useAppStore(state => state.focusLockActive);
  const focusLockScreenVisible = useAppStore(state => state.focusLockScreenVisible);
  const observationComplete = useAppStore(state => state.observationComplete);
  const loadSavedState = useAppStore(state => state.loadSavedState);
  const hydrateAuthSession = useAppStore(state => state.hydrateAuthSession);
  const checkSystemLocks = useAppStore(state => state.checkSystemLocks);
  const feelingPromptState = useAppStore(state => state.feelingPromptState);
  const evaluateFeelingPrompt = useAppStore(state => state.evaluateFeelingPrompt);
  const dismissFeelingPrompt = useAppStore(state => state.dismissFeelingPrompt);
  const submitFeelingPrompt = useAppStore(state => state.submitFeelingPrompt);
  const [promptMood, setPromptMood] = useState(5);
  const [promptStress, setPromptStress] = useState(5);
  const [promptUrge, setPromptUrge] = useState(5);
  const [promptNote, setPromptNote] = useState('');

  // Initialize store and check onboarding state
  useEffect(() => {
    async function prepare() {
      try {
        await loadSavedState();
        await hydrateAuthSession();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    prepare();
  }, []);

  // Global background system locks tick
  useEffect(() => {
    if (!isReady) return;
    checkSystemLocks();
    const interval = setInterval(() => {
      checkSystemLocks();
      evaluateFeelingPrompt('daily');
    }, 10000);
    return () => clearInterval(interval);
  }, [isReady, checkSystemLocks, evaluateFeelingPrompt]);

  // Handle routing logic based on auth/onboarding & focus lock state
  useEffect(() => {
    if (!isReady) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const inWelcome = segments[0] === 'welcome';
    const inAuth = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';
    const inObservation = segments[0] === 'observation';
    const inFocusLock = segments[0] === 'focus-lock';
    const isRootRoute = (segments as string[]).length === 0;

    // 1. Only force the restriction screen for visible shields. Manual focus can arm quietly.
    if (focusLockActive && focusLockScreenVisible && !inFocusLock) {
      router.replace('/focus-lock' as any);
      return;
    }

    if (authStatus !== 'signed_in') {
      if (!inWelcome && !inAuth) {
        router.replace('/welcome' as any);
      }
      return;
    }

    // 2. If authenticated but not onboarded, redirect to onboarding.
    if (!user.isOnboarded) {
      if (!inOnboarding) {
        router.replace('/onboarding' as any);
      }
    } else {
      if (!observationComplete && (inWelcome || inAuth || inOnboarding || isRootRoute)) {
        router.replace('/observation' as any);
        return;
      }
      // 3. If onboarded, redirect to tabs (unless already there or in focus-lock/mission)
      if ((observationComplete && inObservation) || inWelcome || inAuth || inOnboarding || isRootRoute) {
        router.replace('/(tabs)' as any);
      }
    }
  }, [isReady, authStatus, user.isOnboarded, focusLockActive, focusLockScreenVisible, observationComplete, segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Modal visible={feelingPromptState.visible} transparent animationType="fade">
        <View style={styles.promptBackdrop}>
          <View style={[styles.promptCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.promptEyebrow, { color: colors.secondary }]}>
              {feelingPromptState.reason === 'high_usage' ? 'Screen load rising' : 'Daily check-in'}
            </Text>
            <Text style={[styles.promptTitle, { color: colors.textPrimary }]}>How are you feeling?</Text>
            <PromptScale label="Mood" value={promptMood} setValue={setPromptMood} />
            <PromptScale label="Stress" value={promptStress} setValue={setPromptStress} />
            <PromptScale label="Urge" value={promptUrge} setValue={setPromptUrge} />
            <TextInput
              value={promptNote}
              onChangeText={setPromptNote}
              placeholder="Optional note"
              placeholderTextColor={colors.textMuted}
              style={[styles.promptInput, { color: colors.textPrimary, backgroundColor: colors.surfaceContainer }]}
            />
            <View style={styles.promptActions}>
              <Pressable style={[styles.promptButton, styles.promptGhost]} onPress={dismissFeelingPrompt}>
                <Text style={[styles.promptGhostText, { color: colors.textSecondary }]}>Later</Text>
              </Pressable>
              <Pressable
                style={[styles.promptButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  submitFeelingPrompt({
                    moodScore: promptMood,
                    stressScore: promptStress,
                    urgeLevel: promptUrge,
                    note: promptNote,
                  });
                  setPromptNote('');
                }}
              >
                <Text style={[styles.promptSubmitText, { color: colors.onPrimary }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="observation" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="plan" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="recovery-mode" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="mood-checkin" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="sound-therapy" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="insights" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="mission" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="focus-lock" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </>
  );
}

function PromptScale({
  label,
  value,
  setValue,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
}) {
  return (
    <View style={styles.scaleBlock}>
      <View style={styles.scaleHeader}>
        <Text style={styles.scaleLabel}>{label}</Text>
        <Text style={styles.scaleValue}>{value}/10</Text>
      </View>
      <View style={styles.scaleRow}>
        {[1, 2, 3, 4, 5].map((step) => {
          const score = step * 2;
          const selected = value === score;
          return (
            <Pressable
              key={score}
              onPress={() => setValue(score)}
              style={[styles.scaleDot, selected && styles.scaleDotSelected]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  promptBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(29, 26, 33, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  promptCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: 24,
    gap: 14,
  },
  promptEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  promptTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  scaleBlock: {
    gap: 8,
  },
  scaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleLabel: {
    color: '#494552',
    fontSize: 13,
    fontWeight: '800',
  },
  scaleValue: {
    color: '#674bb5',
    fontSize: 13,
    fontWeight: '900',
  },
  scaleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  scaleDot: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ece6f0',
  },
  scaleDotSelected: {
    backgroundColor: '#674bb5',
  },
  promptInput: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
  },
  promptActions: {
    flexDirection: 'row',
    gap: 10,
  },
  promptButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptGhost: {
    backgroundColor: '#f2ecf6',
  },
  promptGhostText: {
    fontSize: 15,
    fontWeight: '900',
  },
  promptSubmitText: {
    fontSize: 15,
    fontWeight: '900',
  },
});
