import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Switch, Animated, Alert, Platform, AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabInset } from '@/constants/theme';
import { useAppStore } from '@/store';
import { AppBlocker, APP_PACKAGE_MAP } from '@/utils/AppBlocker';

const APPS = [
  { name: 'TikTok',     icon: 'videocam',           color: '#010101' },
  { name: 'Instagram',  icon: 'camera',             color: '#C13584' },
  { name: 'YouTube',    icon: 'logo-youtube',       color: '#FF0000' },
  { name: 'Snapchat',   icon: 'chatbubble-ellipses',color: '#FFFC00' },
  { name: 'Facebook',   icon: 'logo-facebook',      color: '#1877F2' },
  { name: 'Twitter',    icon: 'logo-twitter',       color: '#1DA1F2' },
  { name: 'WhatsApp',   icon: 'chatbubbles',        color: '#25D366' },
  { name: 'Telegram',   icon: 'paper-plane',        color: '#2CA5E0' },
];

const DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
];

export default function ControllerScreen() {
  const insets = useSafeAreaInsets();
  const { triggerFocusLock, releaseFocusLock, focusLockActive } = useAppStore();

  const [selectedApps, setSelectedApps] = useState<string[]>(['TikTok', 'Instagram']);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [isBlocking, setIsBlocking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [hasUsagePerm, setHasUsagePerm] = useState<boolean | null>(null);
  const [hasOverlayPerm, setHasOverlayPerm] = useState<boolean | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Resume permission check when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        checkPermissions();
        // Also sync blocking state from native
        syncBlockingState();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  // Pulse animation when blocking
  useEffect(() => {
    if (isBlocking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isBlocking]);

  // Countdown timer
  useEffect(() => {
    if (isBlocking && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoRelease();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isBlocking]);

  const checkPermissions = async () => {
    if (Platform.OS !== 'android') return;
    const usage = await AppBlocker.hasUsageStatsPermission();
    const overlay = await AppBlocker.hasOverlayPermission();
    setHasUsagePerm(usage);
    setHasOverlayPerm(overlay);
  };

  const syncBlockingState = async () => {
    if (Platform.OS !== 'android') return;
    const active = await AppBlocker.isBlockingActive();
    if (active && !isBlocking) {
      const remaining = await AppBlocker.getTimeRemaining();
      setIsBlocking(true);
      setTimeLeft(Math.floor(remaining / 1000));
    } else if (!active && isBlocking) {
      setIsBlocking(false);
      setTimeLeft(0);
    }
  };

  const handleAutoRelease = () => {
    setIsBlocking(false);
    setTimeLeft(0);
    AppBlocker.stopBlocking();
    releaseFocusLock();
    Alert.alert('✅ Focus Session Complete', 'Your screen time block has ended. Well done!');
  };

  const toggleApp = (name: string) => {
    setSelectedApps(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const handleActivate = async () => {
    if (selectedApps.length === 0) {
      Alert.alert('Select Apps', 'Pick at least one app to block.');
      return;
    }

    if (Platform.OS === 'android') {
      // Check permissions
      const usage = await AppBlocker.hasUsageStatsPermission();
      const overlay = await AppBlocker.hasOverlayPermission();

      if (!usage) {
        Alert.alert(
          '⚙️ Usage Access Required',
          'Go to Settings → Apps → Special app access → Usage access → Enable DEMB.\n\nOpening settings now...',
          [{ text: 'Open Settings', onPress: () => AppBlocker.openUsageStatsSettings() },
           { text: 'Cancel', style: 'cancel' }]
        );
        return;
      }

      if (!overlay) {
        Alert.alert(
          '⚙️ "Appear on Top" Required',
          'Go to Settings → Apps → Special app access → Appear on top → Enable DEMB.\n\nOpening settings now...',
          [{ text: 'Open Settings', onPress: () => AppBlocker.openOverlaySettings() },
           { text: 'Cancel', style: 'cancel' }]
        );
        return;
      }

      const started = await AppBlocker.startBlocking(selectedApps, selectedDuration);
      if (!started) return;
    }

    // Also trigger in-app lock
    triggerFocusLock(selectedApps.join(', '), selectedDuration * 60);
    setIsBlocking(true);
    setTimeLeft(selectedDuration * 60);
  };

  const handleDeactivate = () => {
    Alert.alert(
      'End Block Session?',
      'Complete a recovery mission to unlock, or stop the session early.',
      [
        { text: 'Stop Early', style: 'destructive', onPress: () => {
          AppBlocker.stopBlocking();
          releaseFocusLock();
          setIsBlocking(false);
          setTimeLeft(0);
          clearInterval(timerRef.current);
        }},
        { text: 'Keep Blocking', style: 'cancel' },
      ]
    );
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const missingPerms = Platform.OS === 'android' && (!hasUsagePerm || !hasOverlayPerm);

  return (
    <View style={styles.screen}>
      <View style={styles.glow1} pointerEvents="none" />
      <View style={styles.glow2} pointerEvents="none" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: Math.max(insets.top + 18, 32), paddingBottom: BottomTabInset + 40 }
        ]}
      >
        {/* Header */}
        <Text style={styles.title}>Screen{'\n'}Controller</Text>
        <Text style={styles.subtitle}>
          {isBlocking ? 'Block active — stay focused.' : 'Choose apps to block and set a timer.'}
        </Text>

        {/* Permission Warning */}
        {missingPerms && !isBlocking && (
          <Pressable style={styles.permWarning} onPress={checkPermissions}>
            <Ionicons name="warning-outline" size={18} color="#F59E0B" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.permTitle}>Permissions Needed</Text>
              {!hasUsagePerm && (
                <Text style={styles.permText} onPress={() => AppBlocker.openUsageStatsSettings()}>
                  • Usage Access → <Text style={styles.permLink}>Grant →</Text>
                </Text>
              )}
              {!hasOverlayPerm && (
                <Text style={styles.permText} onPress={() => AppBlocker.openOverlaySettings()}>
                  • Appear on Top → <Text style={styles.permLink}>Grant →</Text>
                </Text>
              )}
            </View>
          </Pressable>
        )}

        {/* Active Shield Display */}
        {isBlocking ? (
          <Animated.View style={[styles.shieldActive, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.shieldOrb}>
              <Ionicons name="shield-checkmark" size={52} color="#6C63FF" />
            </View>
            <Text style={styles.shieldTimer}>{formatTime(timeLeft)}</Text>
            <Text style={styles.shieldLabel}>remaining</Text>
            <View style={styles.blockedPillRow}>
              {selectedApps.map(a => (
                <View key={a} style={styles.blockedPill}>
                  <Text style={styles.blockedPillText}>{a}</Text>
                </View>
              ))}
            </View>
            <Pressable style={styles.deactivateBtn} onPress={handleDeactivate}>
              <Text style={styles.deactivateBtnText}>End Session</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            {/* App Selector */}
            <Text style={styles.sectionLabel}>Select apps to block</Text>
            <View style={styles.appGrid}>
              {APPS.map(app => {
                const selected = selectedApps.includes(app.name);
                return (
                  <Pressable
                    key={app.name}
                    style={[styles.appCard, selected && styles.appCardSelected]}
                    onPress={() => toggleApp(app.name)}
                  >
                    <View style={[styles.appIconCircle, { backgroundColor: selected ? app.color : '#F0EEF5' }]}>
                      <Ionicons
                        name={app.icon as any}
                        size={22}
                        color={selected ? '#FFFFFF' : '#746D87'}
                      />
                    </View>
                    <Text style={[styles.appName, selected && styles.appNameSelected]}>
                      {app.name}
                    </Text>
                    {selected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={11} color="#FFF" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Duration Selector */}
            <Text style={styles.sectionLabel}>Block duration</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map(d => (
                <Pressable
                  key={d.value}
                  style={[styles.durationChip, selectedDuration === d.value && styles.durationChipSelected]}
                  onPress={() => setSelectedDuration(d.value)}
                >
                  <Text style={[styles.durationText, selectedDuration === d.value && styles.durationTextSelected]}>
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Ionicons name="shield-outline" size={20} color="#6C63FF" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.summaryTitle}>
                  {selectedApps.length > 0
                    ? `Block ${selectedApps.join(', ')}`
                    : 'No apps selected'}
                </Text>
                <Text style={styles.summaryMeta}>
                  for {selectedDuration} minutes · apps redirect to DEMB
                </Text>
              </View>
            </View>

            {/* Activate Button */}
            <Pressable
              style={[styles.activateBtn, selectedApps.length === 0 && styles.activateBtnDisabled]}
              onPress={handleActivate}
            >
              <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.activateBtnText}>Activate Block</Text>
            </Pressable>

            {/* How it works */}
            <View style={styles.howCard}>
              <Text style={styles.howTitle}>How it works</Text>
              {[
                { icon: 'shield-checkmark-outline', text: 'Monitors the foreground app every 0.5 seconds' },
                { icon: 'phone-portrait-outline', text: 'Detected blocked app → DEMB opens instantly' },
                { icon: 'lock-closed-outline', text: 'Complete a mission or wait for timer to unlock' },
                { icon: 'notifications-outline', text: 'Persistent notification keeps the shield active' },
              ].map((item, i) => (
                <View key={i} style={styles.howRow}>
                  <Ionicons name={item.icon as any} size={16} color="#6C63FF" />
                  <Text style={styles.howText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FBF9FA' },
  glow1: {
    position: 'absolute', top: -100, right: -120,
    width: 320, height: 360, borderRadius: 160,
    backgroundColor: 'rgba(108, 99, 255, 0.10)',
  },
  glow2: {
    position: 'absolute', top: 500, left: -120,
    width: 280, height: 300, borderRadius: 140,
    backgroundColor: 'rgba(120, 202, 42, 0.08)',
  },
  scroll: { paddingHorizontal: 24 },
  title: {
    fontSize: 36, fontWeight: '900', color: '#202025',
    lineHeight: 40, marginBottom: 6,
  },
  subtitle: {
    fontSize: 14, fontWeight: '600', color: '#746F7E', marginBottom: 24,
  },
  permWarning: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFFBEB', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 20,
  },
  permTitle: { fontSize: 13, fontWeight: '800', color: '#92400E', marginBottom: 4 },
  permText: { fontSize: 12, color: '#92400E', marginTop: 2 },
  permLink: { color: '#6C63FF', fontWeight: '700' },
  shieldActive: {
    alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 32, padding: 32, marginBottom: 24,
    borderWidth: 1, borderColor: '#E8DFFF',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 28, elevation: 8,
  },
  shieldOrb: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#EDE9FF', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  shieldTimer: {
    fontSize: 54, fontWeight: '900', color: '#202025', letterSpacing: -2,
  },
  shieldLabel: {
    fontSize: 14, fontWeight: '600', color: '#746F7E', marginTop: 2, marginBottom: 18,
  },
  blockedPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 },
  blockedPill: {
    backgroundColor: '#EDE9FF', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  blockedPillText: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },
  deactivateBtn: {
    height: 48, paddingHorizontal: 32, borderRadius: 24,
    borderWidth: 1.5, borderColor: '#E0DCE8', justifyContent: 'center', alignItems: 'center',
  },
  deactivateBtnText: { fontSize: 14, fontWeight: '700', color: '#746D87' },
  sectionLabel: {
    fontSize: 13, fontWeight: '800', color: '#746F7E',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
  },
  appGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28,
  },
  appCard: {
    width: '22%', minWidth: 72, alignItems: 'center', paddingVertical: 14,
    backgroundColor: '#FFFFFF', borderRadius: 20,
    borderWidth: 1.5, borderColor: '#ECE9EF',
    shadowColor: '#D8D3DE', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14, shadowRadius: 12, elevation: 3,
    position: 'relative',
  },
  appCardSelected: {
    borderColor: '#6C63FF', borderWidth: 2,
    backgroundColor: '#F7F5FF',
  },
  appIconCircle: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  appName: { fontSize: 11, fontWeight: '700', color: '#746F7E', textAlign: 'center' },
  appNameSelected: { color: '#6C63FF' },
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center',
  },
  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap' },
  durationChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#ECE9EF',
  },
  durationChipSelected: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  durationText: { fontSize: 13, fontWeight: '700', color: '#746D87' },
  durationTextSelected: { color: '#FFFFFF' },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0EDFF', borderRadius: 20, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: '#E0D9FF',
  },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: '#202025', marginBottom: 3 },
  summaryMeta: { fontSize: 12, fontWeight: '600', color: '#746F7E' },
  activateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 58, borderRadius: 29, backgroundColor: '#6C63FF',
    marginBottom: 24,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
  },
  activateBtnDisabled: { backgroundColor: '#C8C4D4', shadowOpacity: 0 },
  activateBtnText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  howCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22,
    borderWidth: 1, borderColor: '#ECE9EF',
    shadowColor: '#D8D3DE', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14, shadowRadius: 18, elevation: 3,
  },
  howTitle: { fontSize: 15, fontWeight: '900', color: '#202025', marginBottom: 14 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  howText: { fontSize: 13, fontWeight: '600', color: '#746F7E', flex: 1 },
});
