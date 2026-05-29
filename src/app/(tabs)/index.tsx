import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useColorScheme, ScrollView, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadows, BottomTabInset } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import NeomorphicCard from '@/components/NeomorphicCard';
import ProgressCircle from '@/components/ProgressCircle';

export default function DashboardScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';

  const {
    user,
    balance,
    streakCount,
    missions,
    completedMissions,
    priorities,
    togglePriority,
    syncStatus,
  } = useAppStore();

  // Animation values for moving background blobs
  const bounceAnim1 = React.useRef(new Animated.Value(0)).current;
  const bounceAnim2 = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(bounceAnim1, {
            toValue: 1,
            duration: 9000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim1, {
            toValue: 0,
            duration: 9000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(bounceAnim2, {
            toValue: 1,
            duration: 11000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim2, {
            toValue: 0,
            duration: 11000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const transX1 = bounceAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 30],
  });
  const transY1 = bounceAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 20],
  });

  const transX2 = bounceAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [30, -30],
  });
  const transY2 = bounceAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [20, -20],
  });

  const displayScore = Math.max(0, Math.min(100, Math.round(100 - balance.recoveryDebt)));

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Background Auroras */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View 
          style={[
            styles.blurBlob, 
            { 
              backgroundColor: isDark ? '#3d256d' : '#e8ddff',
              top: '10%', 
              left: '-10%',
              transform: [{ translateX: transX1 }, { translateY: transY1 }] 
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.blurBlob, 
            { 
              backgroundColor: isDark ? '#1a4f3b' : '#a6f2cf',
              bottom: '15%', 
              right: '-10%',
              transform: [{ translateX: transX2 }, { translateY: transY2 }] 
            }
          ]} 
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.two,
            paddingBottom: BottomTabInset + Spacing.four,
          },
        ]}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <NeomorphicCard style={styles.avatarCard}>
              <Image
                source={require('../../../assets/images/logo.jpg')}
                style={styles.avatar}
                contentFit="cover"
              />
            </NeomorphicCard>
            <View style={styles.greetingContainer}>
              <Text style={[styles.greetingText, { color: colors.textMuted }]}>{getGreeting()},</Text>
              <Text style={[styles.nameText, { color: colors.textPrimary }]}>
                {user.name || 'Demb Cadet'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Sync Badge */}
            <View style={[styles.syncBadge, { backgroundColor: colors.surfaceContainer }]}>
              <Ionicons
                name={
                  syncStatus === 'synced'
                    ? 'cloud-done-outline'
                    : syncStatus === 'syncing'
                    ? 'sync'
                    : 'cloud-upload-outline'
                }
                size={12}
                color={syncStatus === 'synced' ? colors.secondary : colors.primary}
              />
              <Text style={[styles.syncText, { color: colors.textSecondary }]}>
                {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Pending'}
              </Text>
            </View>

            {/* Streak Pill */}
            <View style={[styles.streakBadge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={styles.streakText}>🔥 {streakCount}</Text>
            </View>
          </View>
        </View>

        {/* Elegant Balance Card with 3D Mascot */}
        <NeomorphicCard style={styles.balanceCard}>
          <View style={styles.balanceInfo}>
            <Text style={[styles.balanceLabel, { color: colors.primaryLight }]}>BALANCE SCORE</Text>
            <Text style={[styles.balanceScoreText, { color: colors.textPrimary }]}>{displayScore}</Text>
            
            <View style={styles.debtIndicator}>
              <Ionicons 
                name={displayScore < 50 ? "shield-alert-outline" : "shield-checkmark-outline"} 
                size={14} 
                color={displayScore < 50 ? colors.error : colors.success} 
              />
              <Text 
                style={[
                  styles.debtText, 
                  { color: displayScore < 50 ? colors.error : colors.success }
                ]}
              >
                {displayScore < 50 ? `${balance.recoveryDebt} Recovery Debt` : 'Optimal Recovery'}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <ProgressCircle score={displayScore} size={96} strokeWidth={10} showIcon={true} />
            <Image
              source={require('../../../assets/images/demb_progress.png')}
              style={styles.mascotProgress}
              contentFit="contain"
            />
          </View>
        </NeomorphicCard>

        {/* Action Insights Bar */}
        <NeomorphicCard
          onPress={() => router.push('/(tabs)/circles')}
          style={styles.insightsCard}
          bgColor={colors.surfaceContainerLow}
        >
          <View style={styles.insightHeader}>
            <View style={[styles.insightDot, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Active Guardians</Text>
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightDesc, { color: colors.textSecondary }]}>
              Your buddies Alex & Sarah are active. Everything is secure!
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </NeomorphicCard>

        {/* Daily feeling Log */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>How are you feeling today?</Text>
        <NeomorphicCard style={styles.moodCard}>
          <View style={styles.moodGrid}>
            {[
              { emoji: '😊', text: 'Great', color: colors.success, bg: isDark ? '#1a4f3b' : '#a6f2cf' },
              { emoji: '🙂', text: 'Good', color: colors.primary, bg: isDark ? '#3d256d' : '#e8ddff' },
              { emoji: '😐', text: 'Okay', color: colors.textSecondary, bg: isDark ? '#292630' : '#ece6f0' },
              { emoji: '😟', text: 'Drained', color: colors.tertiary, bg: isDark ? '#683c00' : '#ffdcbd' },
              { emoji: '😢', text: 'Bad', color: colors.error, bg: isDark ? '#93000a' : '#ffdad6' },
            ].map(mood => (
              <Pressable
                key={mood.text}
                onPress={() => useAppStore.getState().addEnergyLog({
                  type: 'recovered',
                  category: 'Relaxation',
                  title: `Feeling logged: ${mood.text}`,
                  durationMinutes: 1,
                  intensity: 'Low',
                  notes: 'Self wellness tracking log',
                })}
                style={({ pressed }) => [
                  styles.moodButton,
                  { backgroundColor: mood.bg + '30', borderColor: colors.outlineVariant + '20' },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodText, { color: mood.color }]}>{mood.text}</Text>
              </Pressable>
            ))}
          </View>
        </NeomorphicCard>

        {/* Recovery Missions */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recovery Missions</Text>
        <View style={styles.missionsGrid}>
          {missions.map(mission => {
            const isCompleted = completedMissions.includes(mission.id);
            return (
              <NeomorphicCard
                key={mission.id}
                onPress={() => router.push({ pathname: '/mission', params: { missionId: mission.id } })}
                style={styles.missionTile}
                bgColor={mission.bgColor}
              >
                <View style={styles.missionHeader}>
                  <Ionicons name={mission.icon as any} size={22} color={colors.primary} />
                  <Text style={[styles.missionDuration, { color: colors.textSecondary }]}>
                    {mission.durationMinutes}m
                  </Text>
                </View>
                <Text style={[styles.missionTitleText, { color: colors.textPrimary }]}>{mission.title}</Text>
                {isCompleted && (
                  <View style={[styles.completedCheck, { backgroundColor: colors.secondary }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </NeomorphicCard>
            );
          })}
        </View>

        {/* Priorities Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Priorities</Text>
        {!priorities ? (
          <NeomorphicCard
            onPress={() => router.push('/(tabs)/activity')}
            style={styles.noPrioritiesCard}
            bgColor={colors.surfaceContainerLow}
          >
            <Ionicons name="list-outline" size={28} color={colors.primary} />
            <Text style={[styles.noPrioritiesText, { color: colors.textPrimary }]}>
              No priorities set for today.
            </Text>
            <Text style={[styles.noPrioritiesSubtext, { color: colors.textMuted }]}>
              Define priorities in the energy logger to maintain steady balance.
            </Text>
          </NeomorphicCard>
        ) : (
          <View style={styles.prioritiesList}>
            {[
              { key: 'main' as const, label: 'Main Task', text: priorities.mainTask, completed: priorities.mainCompleted },
              { key: 'health' as const, label: 'Health Goal', text: priorities.healthGoal, completed: priorities.healthCompleted },
              { key: 'recovery' as const, label: 'Recovery Goal', text: priorities.recoveryGoal, completed: priorities.recoveryCompleted },
            ].map(item => (
              <NeomorphicCard
                key={item.key}
                onPress={() => togglePriority(item.key)}
                style={styles.priorityRow}
              >
                <View
                  style={[
                    styles.checkboxCircle,
                    { borderColor: colors.primary },
                    item.completed && { backgroundColor: colors.primary },
                  ]}
                >
                  {item.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <View style={styles.priorityContent}>
                  <Text style={[styles.priorityLabel, { color: colors.primaryLight }]}>{item.label}</Text>
                  <Text
                    style={[
                      styles.priorityText,
                      { color: colors.textPrimary },
                      item.completed && styles.completedText,
                    ]}
                    numberOfLines={1}
                  >
                    {item.text}
                  </Text>
                </View>
              </NeomorphicCard>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  blurBlob: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.35,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatarCard: {
    padding: Spacing.half,
    borderRadius: Radius.lg,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '400',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  syncText: {
    fontSize: 10,
    fontWeight: '600',
  },
  streakBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
  },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
  },
  balanceInfo: {
    gap: Spacing.one,
    flex: 1,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  balanceScoreText: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 52,
  },
  debtIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  debtText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 120,
    height: 120,
  },
  mascotProgress: {
    position: 'absolute',
    width: 58,
    height: 58,
    top: -12,
    right: -10,
  },
  insightsCard: {
    padding: Spacing.three,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.half,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightDesc: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    paddingRight: Spacing.three,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: Spacing.one,
  },
  moodCard: {
    padding: Spacing.three,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  moodButton: {
    flex: 1,
    height: 64,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    gap: Spacing.half,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodText: {
    fontSize: 11,
    fontWeight: '700',
  },
  missionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  missionTile: {
    width: '47.5%',
    padding: Spacing.three,
    gap: Spacing.two,
    position: 'relative',
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionDuration: {
    fontSize: 12,
    fontWeight: '600',
  },
  missionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  completedCheck: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPrioritiesCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.two,
  },
  noPrioritiesText: {
    fontSize: 15,
    fontWeight: '700',
  },
  noPrioritiesSubtext: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  prioritiesList: {
    gap: Spacing.two,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityContent: {
    flex: 1,
    gap: Spacing.half,
  },
  priorityLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
});
