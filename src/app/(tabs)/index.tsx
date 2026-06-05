import React from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabInset } from '@/constants/theme';
import { useAppStore } from '@/store';
import AnimatedPressable from '@/components/AnimatedPressable';

const characterByState = {
  good: require('../../../assets/images/demb-happy.png'),
  neutral: require('../../../assets/images/demb-neutral.png'),
  bad: require('../../../assets/images/demb-alert.png'),
};

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const float = React.useRef(new Animated.Value(0)).current;
  
  const { 
    user, 
    balance, 
    streakCount, 
    buddies, 
    completedMissions, 
    points, 
    missions,
    breakLoopActive,
    breakLoopTime,
    toggleBreakLoop,
    tickBreakLoop,
    fetchOnlineBuddyUpdates,
    socialUsage,
    checkSystemLocks,
    logManualSocialUsage,
    burnoutRisk,
    recoveryPlan,
    generateRecoveryPlan
  } = useAppStore();

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [float]);

  // Handle continuous break loop counting
  React.useEffect(() => {
    let interval: any;
    if (breakLoopActive) {
      interval = setInterval(() => {
        tickBreakLoop();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breakLoopActive]);

  // Online Buddy system updates
  React.useEffect(() => {
    fetchOnlineBuddyUpdates();
    const interval = setInterval(() => {
      fetchOnlineBuddyUpdates();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Background System locks & Rate-Limit Monitor
  React.useEffect(() => {
    checkSystemLocks();
    const interval = setInterval(() => {
      checkSystemLocks();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const floatY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const formatStopwatch = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return hrs > 0 ? `${hrs}h ${m}m` : `${m}m`;
  };

  const recoveryScore = burnoutRisk.recoveryScore;
  const state = recoveryScore >= 76 ? 'good' : recoveryScore >= 52 ? 'neutral' : 'bad';
  const stateLabel = burnoutRisk.status;
  const stateCopy = recoveryScore >= 76 ? 'Nice rhythm.' : recoveryScore >= 52 ? 'Reset helps.' : 'Recharge now.';
  const displayName = user.name && user.name !== 'Demb Cadet' ? user.name : 'Dagim';
  const activeMission = missions[1] ?? missions[0];
  const challengeProgress = 0.62;
  const mainCause = burnoutRisk.causes[0] ?? 'steady recovery rhythm';
  const currentPlan = recoveryPlan ?? undefined;
  const planTask = currentPlan?.recoveryTasks[0];

  const startMission = () => {
    router.push({ pathname: '/mission', params: { missionId: activeMission?.id ?? 'm1' } });
  };

  const openPlan = () => {
    if (!recoveryPlan) {
      generateRecoveryPlan();
    }
    router.push('/plan');
  };

  const totalScreenTimeMins = socialUsage.TikTok + socialUsage.Instagram + socialUsage.YouTube + socialUsage.Snapchat + socialUsage.Facebook;

  return (
    <View style={styles.screen}>
      <View style={styles.topGlow} pointerEvents="none" />
      <View style={styles.midGlow} pointerEvents="none" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 18, 32),
            paddingBottom: BottomTabInset + 38,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.greeting}>Good Afternoon,</Text>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.headerSubtitle}>Recovery continues.</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton}>
              <Ionicons name="search-outline" size={22} color="#6D6879" />
            </Pressable>
            <View style={styles.avatarShell}>
              <Image
                source={require('../../../assets/images/demb-app-logo.png')}
                style={styles.avatar}
                contentFit="cover"
              />
            </View>
          </View>
        </View>

        <View style={styles.hero}>
          <AnimatedPressable
            lifted
            style={[
              styles.breakLoopButton,
              breakLoopActive && { backgroundColor: '#6C63FF', borderColor: '#FFFFFF', shadowColor: '#6C63FF', shadowRadius: 36, shadowOpacity: 0.6 }
            ]} 
            onPress={toggleBreakLoop}
          >
            <Text style={[styles.breakLoopText, breakLoopActive && { color: '#FFFFFF' }]}>
              {breakLoopActive ? 'STOP LOOP' : 'BREAK LOOP'}
            </Text>
            {breakLoopActive && (
              <Text style={[styles.stopwatchText, { color: '#FFFFFF' }]}>{formatStopwatch(breakLoopTime)}</Text>
            )}
          </AnimatedPressable>

          <Text style={styles.heroCaption}>
            {breakLoopActive ? 'Loop paused.' : 'Recover now.'}
          </Text>
        </View>

        <View style={styles.scoreCardContainer}>
          {/* Floating Smiling Character overlay when score is > 80 */}
          {recoveryScore >= 80 && (
            <Animated.View style={[styles.floatingScoreCharacter, { transform: [{ translateY: floatY }] }]}>
              <Image 
                source={require('../../../assets/images/demb-happy.png')} 
                style={styles.floatingCharacterImage} 
                contentFit="contain" 
              />
            </Animated.View>
          )}

          <View style={styles.scoreCard}>
            <View style={styles.scoreTop}>
              <View>
                <Text style={styles.cardLabel}>Recovery Score</Text>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreValue}>{recoveryScore}%</Text>
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillText}>{stateLabel}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.ring}>
                <Ionicons name="refresh-outline" size={31} color="#746D87" />
              </View>
            </View>

            <View style={styles.cardDivider} />
            <View style={styles.scoreTrend}>
              <Ionicons name="trending-up-outline" size={15} color="#746D87" />
              <Text style={styles.trendText}>{stateCopy}</Text>
            </View>
          </View>
        </View>

        <View style={styles.burnoutGrid}>
          <View style={styles.burnoutCard}>
            <Text style={styles.cardLabel}>Burnout Risk</Text>
            <Text style={styles.burnoutValue}>{burnoutRisk.burnoutRiskScore}%</Text>
            <Text style={styles.burnoutMeta}>{stateLabel}</Text>
          </View>
          <AnimatedPressable lifted style={styles.burnoutCard} onPress={() => router.push('/insights')}>
            <Text style={styles.cardLabel}>Main Cause</Text>
            <Text style={styles.causeText}>{mainCause}</Text>
            <Text style={styles.burnoutMeta}>View insights</Text>
          </AnimatedPressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="flame-outline" value={`${streakCount} Days`} label="Streak" />
          <StatCard icon="people-outline" value={`${Math.max(buddies.length, 1)} Buddy`} label="Support" />
          <StatCard icon="gift-outline" value={`${Math.max(completedMissions.length, points > 0 ? 3 : 0)} Unlocked`} label="Rewards" />
        </View>

        <View style={styles.planCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Plan</Text>
            <Pressable onPress={openPlan}>
              <Ionicons name="sparkles-outline" size={22} color="#6D6879" />
            </Pressable>
          </View>
          <View style={styles.planTaskRow}>
            <View style={styles.challengeIcon}>
              <Ionicons
                name={planTask?.type === 'sound_therapy' ? 'musical-notes-outline' : planTask?.type === 'walking' ? 'walk-outline' : 'leaf-outline'}
                size={24}
                color="#746D87"
              />
            </View>
            <View style={styles.challengeCopy}>
              <Text style={styles.challengeTitle}>{planTask?.title ?? 'Generate recovery plan'}</Text>
              <Text style={styles.miniLabel}>
                {planTask ? `${planTask.target} · +${planTask.rewardPoints}` : 'From your signals'}
              </Text>
            </View>
          </View>
          <View style={styles.planActions}>
            <AnimatedPressable lifted style={[styles.outlineButton, styles.planButton]} onPress={openPlan}>
              <Text style={styles.outlineButtonText}>{planTask ? 'View Plan' : 'Generate Plan'}</Text>
            </AnimatedPressable>
            <AnimatedPressable lifted style={[styles.outlineButton, styles.planButton]} onPress={() => router.push('/mood-checkin')}>
              <Text style={styles.outlineButtonText}>Mood Check-In</Text>
            </AnimatedPressable>
          </View>
        </View>

        <View style={styles.challengeCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Challenge</Text>
            <Ionicons name="ellipsis-horizontal" size={22} color="#6D6879" />
          </View>

          <View style={styles.challengeBody}>
            <View style={styles.challengeIcon}>
              <Ionicons name="walk-outline" size={25} color="#746D87" />
            </View>
            <View style={styles.challengeCopy}>
              <Text style={styles.challengeTitle}>Walk 200 Steps</Text>
              <Text style={styles.miniLabel}>Progress</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${challengeProgress * 100}%` }]} />
              </View>
            </View>
            <Text style={styles.progressText}>125 / 200</Text>
          </View>

          <AnimatedPressable lifted style={styles.outlineButton} onPress={startMission}>
            <Text style={styles.outlineButtonText}>Continue Challenge</Text>
          </AnimatedPressable>
        </View>

        <View style={styles.digitalCard}>
          <View style={styles.digitalTitleRow}>
            <Ionicons name="eye-outline" size={24} color="#746D87" />
            <Text style={styles.sectionTitle}>Digital{'\n'}Balance</Text>
          </View>

          <View style={styles.screenTimeRow}>
            <Text style={styles.screenTime}>{formatMinutes(totalScreenTimeMins)}</Text>
            <Text style={styles.screenTimeLabel}>Screen Time</Text>
          </View>

          <UsageRow icon="videocam-outline" app="TikTok" time={formatMinutes(socialUsage.TikTok)} />
          <UsageRow icon="camera-outline" app="Instagram" time={formatMinutes(socialUsage.Instagram)} />
          <UsageRow icon="logo-youtube" app="YouTube" time={formatMinutes(socialUsage.YouTube)} />
          <UsageRow icon="chatbubble-ellipses-outline" app="Snapchat" time={formatMinutes(socialUsage.Snapchat)} />

          <View style={styles.insightBox}>
            <Text style={styles.insightText}>Social time is high. Reset helps.</Text>
          </View>

          <AnimatedPressable lifted style={styles.darkButton} onPress={startMission}>
            <Text style={styles.darkButtonText}>Start Recovery</Text>
          </AnimatedPressable>
        </View>

        <View style={styles.buddyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Buddy</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>

          <View style={styles.buddyProfile}>
            <Image source={require('../../../assets/images/logo.jpg')} style={styles.buddyAvatar} contentFit="cover" />
            <View>
              <Text style={styles.buddyName}>Abel</Text>
              <Text style={styles.buddyStatus}>Recovering</Text>
            </View>
          </View>

          <View style={styles.buddyStats}>
            <View style={styles.buddyStatBlock}>
              <Text style={styles.buddyLabel}>Shared Streak</Text>
              <Text style={styles.buddyValue}>12 Days</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.buddyStatBlock}>
              <Text style={styles.buddyLabel}>Activity Level</Text>
              <Text style={styles.buddyValue}>High</Text>
            </View>
          </View>

          <AnimatedPressable lifted style={styles.outlineButton} onPress={() => router.push('/(tabs)/circles')}>
            <Text style={styles.outlineButtonText}>Buddies</Text>
          </AnimatedPressable>
        </View>

        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>"Small progress every day creates lasting change."</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={22} color="#746D87" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function UsageRow({ icon, app, time }: { icon: string; app: string; time: string }) {
  return (
    <View style={styles.usageRow}>
      <View style={styles.usageIcon}>
        <Ionicons name={icon as any} size={19} color="#2B2930" />
      </View>
      <Text style={styles.usageApp}>{app}</Text>
      <Text style={styles.usageTime}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FBF9FA',
  },
  topGlow: {
    position: 'absolute',
    top: -150,
    right: -170,
    width: 360,
    height: 420,
    borderRadius: 180,
    backgroundColor: 'rgba(232, 224, 255, 0.58)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 42,
  },
  midGlow: {
    position: 'absolute',
    top: 470,
    left: -170,
    width: 320,
    height: 360,
    borderRadius: 160,
    backgroundColor: 'rgba(244, 240, 255, 0.72)',
  },
  scrollContent: {
    paddingHorizontal: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    color: '#202025',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  userName: {
    color: '#202025',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#746F7E',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarShell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8DFFF',
    padding: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  hero: {
    height: 270,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 22,
  },
  breakLoopButton: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: '#E7DFFF',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 12,
  },
  breakLoopText: {
    color: '#6D6879',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  stopwatchText: {
    color: '#343039',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  scoreCardContainer: {
    position: 'relative',
    width: '100%',
  },
  floatingScoreCharacter: {
    position: 'absolute',
    left: 8,
    top: -125,
    width: 160,
    height: 170,
    zIndex: 1,
    elevation: 1,
  },
  floatingCharacterImage: {
    width: '100%',
    height: '100%',
  },
  simRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  simButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0EEF1',
    borderWidth: 1,
    borderColor: '#ECEAEF',
    gap: 4,
  },
  simButtonText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '700',
  },
  characterAura: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#F0EAFF',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
  },
  characterImage: {
    width: 118,
    height: 128,
  },
  heroCaption: {
    color: '#746F7E',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    marginTop: 52,
  },
  scoreCard: {
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ECE9EF',
    shadowColor: '#D8D3DE',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    zIndex: 2,
    elevation: 2,
  },
  scoreTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: '#746F7E',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreValue: {
    color: '#69627C',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    marginRight: 12,
  },
  scorePill: {
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E9DFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  scorePillText: {
    color: '#746D87',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
  ring: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 7,
    borderColor: '#CEC5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#ECE9EF',
    marginVertical: 18,
  },
  scoreTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendText: {
    color: '#746F7E',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  burnoutGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  burnoutCard: {
    flex: 1,
    minHeight: 116,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE9EF',
    padding: 18,
    justifyContent: 'center',
    shadowColor: '#D8D3DE',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  burnoutValue: {
    color: '#69627C',
    fontSize: 33,
    lineHeight: 38,
    fontWeight: '900',
    marginTop: 6,
  },
  burnoutMeta: {
    color: '#8B8695',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  causeText: {
    color: '#343039',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  statCard: {
    width: '31%',
    minHeight: 82,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE9EF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D8D3DE',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  statValue: {
    color: '#343039',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    marginTop: 5,
  },
  statLabel: {
    color: '#8B8695',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  challengeCard: {
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#ECE9EF',
    shadowColor: '#D8D3DE',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  planCard: {
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#ECE9EF',
    shadowColor: '#D8D3DE',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  planTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  planActions: {
    flexDirection: 'row',
    gap: 10,
  },
  planButton: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#202025',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
  },
  challengeBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E9DFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  challengeCopy: {
    flex: 1,
  },
  challengeTitle: {
    color: '#202025',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    marginBottom: 6,
  },
  miniLabel: {
    color: '#746F7E',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    marginBottom: 5,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E7E2E7',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#746D87',
  },
  progressText: {
    width: 70,
    color: '#746D87',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    textAlign: 'right',
  },
  outlineButton: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#BDB7C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    color: '#746D87',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  digitalCard: {
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#ECE9EF',
    shadowColor: '#D8D3DE',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  digitalTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  screenTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  screenTime: {
    color: '#202025',
    fontSize: 40,
    lineHeight: 45,
    fontWeight: '900',
    marginRight: 10,
  },
  screenTimeLabel: {
    color: '#746F7E',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 5,
  },
  usageRow: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#F0EEF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  usageApp: {
    flex: 1,
    color: '#2B2930',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  usageTime: {
    color: '#2B2930',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  insightBox: {
    borderRadius: 25,
    backgroundColor: '#F6F2FF',
    padding: 18,
    marginTop: 18,
    marginBottom: 18,
  },
  insightText: {
    color: '#5D5869',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  darkButton: {
    height: 52,
    borderRadius: 24,
    backgroundColor: '#716B83',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#393447',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
  },
  darkButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  buddyCard: {
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#ECE9EF',
    shadowColor: '#D8D3DE',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  onlineText: {
    color: '#746F7E',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  buddyProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  buddyAvatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    marginRight: 18,
  },
  buddyName: {
    color: '#202025',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  buddyStatus: {
    color: '#746F7E',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
  },
  buddyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  buddyStatBlock: {
    flex: 1,
  },
  buddyLabel: {
    color: '#8B8695',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  buddyValue: {
    color: '#3A3546',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#DAD6E1',
    marginHorizontal: 20,
  },
  quoteCard: {
    minHeight: 99,
    borderRadius: 25,
    backgroundColor: '#777287',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    marginBottom: 8,
  },
  quoteText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '700',
    textAlign: 'center',
  },
});
