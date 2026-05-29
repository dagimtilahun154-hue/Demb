import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { Image } from 'expo-image';
import NeomorphicCard from '@/components/NeomorphicCard';

export default function FocusLockScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const {
    restrictedApp,
    focusLockTimeLeft,
    tickFocusLock,
    extendFocusLock,
    missions,
  } = useAppStore();

  // Tick the simulated lock countdown timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      tickFocusLock();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatHHMMSS = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExtend = () => {
    // Costs 15 points to extend in emergency! Perfect bypass prevention.
    const store = useAppStore.getState();
    if (store.points >= 15) {
      useAppStore.setState({ points: store.points - 15 });
      extendFocusLock(300); // add 5 mins emergency
      Alert.alert('Emergency Extension', '5 minutes added. -15 Points charged.');
    } else {
      Alert.alert('Unable to Extend', 'You need at least 15 points for an emergency extension.');
    }
  };

  const handleStartMission = () => {
    // Pick the nature walk (m2) or breathing gap (m1) to clear lock
    const missionId = missions[1]?.id || 'm1';
    router.push({ pathname: '/mission', params: { missionId } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.four }]}>
      
      {/* Top Header Badge */}
      <View style={styles.mascotIndicator}>
        <Ionicons name="shield-half-outline" size={20} color="#a78bfa" />
        <Text style={styles.mascotLabel}>DEMB RESTRICTION ENFORCED</Text>
      </View>

      {/* Main Lock Display with 3D Mascot */}
      <View style={styles.lockBox}>
        <NeomorphicCard style={styles.mascotContainer} bgColor="#2a2730">
          <Image
            source={require('../../assets/images/demb_lock.png')}
            style={styles.lockMascot}
            contentFit="contain"
          />
        </NeomorphicCard>

        <Text style={styles.lockTitle}>{restrictedApp || 'Social Media'} is Locked.</Text>
        <Text style={styles.lockSubtitle}>
          Your daily focus threshold has been exceeded. Officer Demb has arrested scrolling privileges.
        </Text>

        <View style={styles.alertRow}>
          <Ionicons name="people-outline" size={16} color="#a78bfa" />
          <Text style={styles.alertText}>Buddy Alert Sent to Alex & Sarah</Text>
        </View>

        <Text style={styles.countdownLabel}>RECOVERY LOCKDOWN ENDS IN</Text>
        <Text style={styles.countdownValue}>{formatHHMMSS(focusLockTimeLeft)}</Text>
      </View>

      {/* Bypass-Proof Buttons */}
      <View style={styles.buttonsWrapper}>
        <NeomorphicCard
          onPress={handleStartMission}
          style={styles.missionButton}
          bgColor="#a6f2cf"
          glowColor="#a6f2cf"
        >
          <Ionicons name="walk" size={20} color="#1d1a21" style={{ marginRight: 6 }} />
          <Text style={styles.missionText}>Complete Recovery Task to Unlock</Text>
        </NeomorphicCard>

        <Pressable
          onPress={handleExtend}
          style={({ pressed }) => [
            styles.extendButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="alert-circle-outline" size={18} color="#e6e0ea" style={{ marginRight: 6 }} />
          <Text style={styles.extendText}>Extend 5m (Costs 15 Points)</Text>
        </Pressable>

        <View style={styles.lockNoticeRow}>
          <Ionicons name="lock-closed-outline" size={14} color="#7a7583" />
          <Text style={styles.lockNoticeText}>Dashboard is locked until recovery is complete.</Text>
        </View>
      </View>
    </View>
  );
}

// React Native Alerts Helper imports
import { Alert, useColorScheme } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1d1a21', // gorgeous premium dark tone
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mascotIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  mascotLabel: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  lockBox: {
    alignItems: 'center',
    gap: Spacing.two,
    width: '100%',
  },
  mascotContainer: {
    width: 150,
    height: 150,
    borderRadius: Radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
    borderWidth: 0,
    ...Shadows.glow('#a78bfa15'),
  },
  lockMascot: {
    width: 130,
    height: 130,
  },
  lockTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  lockSubtitle: {
    color: '#cac4d4',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.three,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginTop: Spacing.one,
  },
  alertText: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '600',
  },
  countdownLabel: {
    color: '#7a7583',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: Spacing.four,
  },
  countdownValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  buttonsWrapper: {
    width: '100%',
    gap: Spacing.two,
  },
  missionButton: {
    height: 56,
    borderRadius: Radius.full,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    padding: 0,
  },
  missionText: {
    color: '#1d1a21',
    fontSize: 15,
    fontWeight: '800',
  },
  extendButton: {
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extendText: {
    color: '#e6e0ea',
    fontSize: 14,
    fontWeight: '600',
  },
  lockNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  lockNoticeText: {
    color: '#7a7583',
    fontSize: 11,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
