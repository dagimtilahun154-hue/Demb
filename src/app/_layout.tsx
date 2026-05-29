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
  const focusLockActive = useAppStore(state => state.focusLockActive);
  const loadSavedState = useAppStore(state => state.loadSavedState);

  // Initialize store and check onboarding state
  useEffect(() => {
    async function prepare() {
      try {
        await loadSavedState();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    prepare();
  }, []);

  // Handle routing logic based on auth/onboarding & focus lock state
  useEffect(() => {
    if (!isReady) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const inWelcome = segments[0] === 'welcome';
    const inOnboarding = segments[0] === 'onboarding';
    const inFocusLock = segments[0] === 'focus-lock';

    // 1. If focus lock is triggered, force redirect to focus-lock screen
    if (focusLockActive && !inFocusLock) {
      router.replace('/focus-lock' as any);
      return;
    }

    // 2. If not onboarded, redirect to welcome (unless already there or in onboarding)
    if (!user.isOnboarded) {
      if (!inWelcome && !inOnboarding) {
        router.replace('/welcome' as any);
      }
    } else {
      // 3. If onboarded, redirect to tabs (unless already there or in focus-lock/mission)
      if (inWelcome || inOnboarding || segments.length === 0) {
        router.replace('/(tabs)' as any);
      }
    }
  }, [isReady, user.isOnboarded, focusLockActive, segments]);

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
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="mission" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="focus-lock" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </>
  );
}
