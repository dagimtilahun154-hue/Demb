import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
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
    }, 10000);
    return () => clearInterval(interval);
  }, [isReady]);

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
