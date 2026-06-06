import React, { useMemo, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedPressable from '@/components/AnimatedPressable';
import NeomorphicCard from '@/components/NeomorphicCard';
import { BottomTabInset, Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppStore } from '@/store';
import type { Buddy } from '@/types/burnout';

type BuddyDisplay = Buddy & { pending?: boolean };

type FlamePalette = {
  outer: string;
  mid: string;
  core: string;
  glow: string;
  focus: string;
  border: string;
  text: string;
  muted: string;
};

const SUPPORT_MESSAGE = 'Take a soft reset with me.';

export default function WellnessCirclesScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const {
    buddies,
    buddyRequests,
    buddyFeed,
    buddyGroup,
    burnoutRisk,
    recoveryTree,
    streakCount,
    sendBuddyRequest,
    acceptBuddyRequest,
    declineBuddyRequest,
    sendCheerToBuddy,
    sendEncouragementMessage,
  } = useAppStore();

  const [searchValue, setSearchValue] = useState('');

  const pendingIncoming = buddyRequests.filter(request => request.type === 'incoming' && request.status === 'pending');
  const pendingOutgoing = buddyRequests.filter(request => request.type === 'outgoing' && request.status === 'pending');

  const buddyMembers = useMemo<BuddyDisplay[]>(() => {
    const byName = new Map<string, BuddyDisplay>();

    buddyGroup.members
      .filter(member => member.id !== 'me')
      .forEach(member => byName.set(member.name.toLowerCase(), member));

    buddies.forEach((name, index) => {
      const key = name.toLowerCase();
      if (!byName.has(key)) {
        byName.set(key, {
          id: `buddy_${key.replace(/\s+/g, '_')}`,
          name,
          personalStreak: Math.max(0, streakCount - index),
          recoveryScore: Math.max(45, 72 - index * 6),
          currentState: 'Balanced',
          treeContribution: Math.max(1, recoveryTree.level - index),
        });
      }
    });

    return Array.from(byName.values());
  }, [buddies, buddyGroup.members, recoveryTree.level, streakCount]);

  const query = searchValue.trim().toLowerCase();
  const visibleBuddies = query
    ? buddyMembers.filter(member => member.name.toLowerCase().includes(query))
    : buddyMembers;
  const exactBuddyExists =
    query.length > 0 &&
    (buddyMembers.some(member => member.name.toLowerCase() === query) ||
      pendingOutgoing.some(request => request.name.toLowerCase() === query));
  const canAddBuddy = query.length > 0 && !exactBuddyExists;

  const myMember = buddyGroup.members.find(member => member.id === 'me');
  const personalStreak = myMember?.personalStreak ?? streakCount;
  const streakUnlocked = personalStreak >= 3;
  const isCritical = burnoutRisk.status === 'Critical';
  const effortScore = Math.min(100, Math.round(burnoutRisk.recoveryScore * 0.72 + Math.min(personalStreak, 14) * 2));
  const palette = getFlamePalette({ colors, isCritical, streakUnlocked, effortScore });
  const flameSize = streakUnlocked
    ? Math.min(292, 208 + effortScore * 0.62 + Math.min(personalStreak, 14) * 2.2)
    : 188;

  const leaderboard = useMemo(() => {
    const me: BuddyDisplay = {
      id: 'me',
      name: 'You',
      personalStreak,
      recoveryScore: burnoutRisk.recoveryScore,
      currentState: burnoutRisk.status,
      treeContribution: recoveryTree.leavesCount,
    };
    return [me, ...buddyMembers]
      .sort((a, b) => b.personalStreak - a.personalStreak || b.recoveryScore - a.recoveryScore)
      .slice(0, 8);
  }, [buddyMembers, personalStreak, burnoutRisk.recoveryScore, burnoutRisk.status, recoveryTree.leavesCount]);

  const handleAddBuddy = () => {
    if (!canAddBuddy) return;
    sendBuddyRequest(searchValue);
    setSearchValue('');
  };

  const handleSupportBuddy = (buddyName: string) => {
    sendCheerToBuddy(buddyName);
    sendEncouragementMessage(buddyName, SUPPORT_MESSAGE);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <AnimatedGlow color={palette.glow} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.two,
            paddingBottom: BottomTabInset + Spacing.six,
          },
        ]}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Buddies</Text>
            <Text style={[styles.microLabel, { color: colors.textMuted }]}>Streak competition</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: palette.focus, borderColor: palette.border }]}>
            <Ionicons name="flame" size={16} color={palette.outer} />
            <Text style={[styles.statusPillText, { color: palette.text }]}>{personalStreak} days</Text>
          </View>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '55' }]}>
          <Ionicons name="search-outline" size={19} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search or add buddy"
            placeholderTextColor={colors.textMuted}
            value={searchValue}
            onChangeText={setSearchValue}
            returnKeyType="send"
            onSubmitEditing={handleAddBuddy}
          />
          <AnimatedPressable
            onPress={handleAddBuddy}
            disabled={!canAddBuddy}
            lifted={canAddBuddy}
            style={[styles.addButton, { backgroundColor: canAddBuddy ? colors.primary : colors.surfaceContainerHigh }]}
          >
            <Ionicons name="person-add-outline" size={18} color={canAddBuddy ? '#ffffff' : colors.textMuted} />
          </AnimatedPressable>
        </View>

        <NeomorphicCard style={styles.streakCard} bgColor={palette.focus}>
          <View style={styles.streakCardHeader}>
            <View>
              <Text style={[styles.cardEyebrow, { color: palette.muted }]}>Your streak flame</Text>
              <Text style={[styles.cardTitle, { color: palette.text }]}>Owner streak only</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: colors.surface, borderColor: palette.border }]}>
              <Text style={[styles.scoreBadgeValue, { color: palette.text }]}>{effortScore}%</Text>
            </View>
          </View>

          <View style={styles.fireStage}>
            <AnimatedFlame palette={palette} size={flameSize} />
            <CampfireLogs palette={palette} />
            <View style={[styles.streakInsideFlame, { borderColor: palette.border }]}>
              <Text style={[styles.streakInsideNumber, { color: palette.text }]}>{Math.max(1, personalStreak)}</Text>
              <Text style={[styles.streakInsideLabel, { color: palette.muted }]}>days</Text>
            </View>
          </View>
        </NeomorphicCard>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Leaderboard</Text>
            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>{leaderboard.length} players</Text>
          </View>
          <NeomorphicCard style={styles.leaderboardCard} bgColor={colors.surface}>
            {leaderboard.map((member, index) => {
              const isMe = member.id === 'me';
              return (
                <View
                  key={member.id}
                  style={[
                    styles.leaderRow,
                    index < leaderboard.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '25' },
                  ]}
                >
                  <View style={[styles.rankCircle, { backgroundColor: isMe ? colors.primaryContainer : colors.surfaceContainer }]}>
                    <Text style={[styles.rankText, { color: isMe ? colors.primary : colors.textSecondary }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.leaderNameBlock}>
                    <Text style={[styles.leaderName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {member.name}
                    </Text>
                    <Text style={[styles.leaderSub, { color: colors.textMuted }]}>
                      {member.recoveryScore}% recovery
                    </Text>
                  </View>
                  <View style={styles.leaderScore}>
                    <Ionicons name="flame" size={16} color={isMe ? palette.outer : colors.textMuted} />
                    <Text style={[styles.leaderDays, { color: isMe ? palette.text : colors.textSecondary }]}>
                      {member.personalStreak}
                    </Text>
                  </View>
                </View>
              );
            })}
          </NeomorphicCard>
        </View>

        {visibleBuddies.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Buddy Names</Text>
            <View style={styles.nameWrap}>
              {visibleBuddies.map((member, index) => (
                <FloatingNameChip key={member.id} name={member.name} index={index} color={palette.outer} />
              ))}
            </View>
          </View>
        )}

        {pendingIncoming.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Requests</Text>
            {pendingIncoming.map(request => (
              <NeomorphicCard key={request.id} style={styles.requestCard}>
                <Text style={[styles.requestName, { color: colors.textPrimary }]}>{request.name}</Text>
                <View style={styles.requestActions}>
                  <AnimatedPressable
                    onPress={() => acceptBuddyRequest(request.id)}
                    lifted
                    style={[styles.requestAction, { backgroundColor: colors.successContainer }]}
                  >
                    <Ionicons name="checkmark" size={18} color={colors.secondary} />
                  </AnimatedPressable>
                  <AnimatedPressable
                    onPress={() => declineBuddyRequest(request.id)}
                    lifted
                    style={[styles.requestAction, { backgroundColor: colors.errorContainer }]}
                  >
                    <Ionicons name="close" size={18} color={colors.error} />
                  </AnimatedPressable>
                </View>
              </NeomorphicCard>
            ))}
          </View>
        )}

        {buddyFeed.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Updates</Text>
            {buddyFeed.slice(0, 2).map(feed => (
              <NeomorphicCard key={feed.id} style={styles.feedCard}>
                <View style={styles.feedTop}>
                  <Text style={[styles.feedName, { color: colors.textPrimary }]}>{feed.name}</Text>
                  <Text style={[styles.feedTime, { color: colors.textMuted }]}>{feed.timestamp}</Text>
                </View>
                <Text style={[styles.feedDetail, { color: colors.textSecondary }]} numberOfLines={1}>
                  {feed.detail}
                </Text>
                {feed.event === 'lock' && (
                  <AnimatedPressable
                    lifted
                    onPress={() => handleSupportBuddy(feed.name)}
                    style={[styles.supportButton, { backgroundColor: colors.primaryContainer }]}
                  >
                    <Ionicons name="heart-outline" size={15} color={colors.primary} />
                    <Text style={[styles.supportText, { color: colors.primary }]}>Support</Text>
                  </AnimatedPressable>
                )}
              </NeomorphicCard>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function AnimatedGlow({ color }: { color: string }) {
  const drift = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  return (
    <Animated.View
      style={[
        styles.pageGlow,
        {
          backgroundColor: color,
          transform: [
            { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] }) },
            { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [-12, 12] }) },
          ],
        },
      ]}
    />
  );
}

function AnimatedFlame({ palette, size }: { palette: FlamePalette; size: number }) {
  const flicker = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 1250, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: 1180, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flicker]);

  return (
    <Animated.View
      style={[
        styles.flameLayer,
        {
          width: size,
          height: size * 1.12,
          transform: [
            { translateY: flicker.interpolate({ inputRange: [0, 1], outputRange: [3, -6] }) },
            { scaleX: flicker.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.05] }) },
            { scaleY: flicker.interpolate({ inputRange: [0, 1], outputRange: [1.04, 0.98] }) },
            { rotate: flicker.interpolate({ inputRange: [0, 1], outputRange: ['-1deg', '1.5deg'] }) },
          ],
        },
      ]}
    >
      <FlameSvg palette={palette} />
    </Animated.View>
  );
}

function FlameSvg({ palette }: { palette: FlamePalette }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 220 264">
      <Defs>
        <RadialGradient id="cardGlow" cx="50%" cy="58%" r="56%">
          <Stop offset="0%" stopColor={palette.glow} stopOpacity="0.68" />
          <Stop offset="64%" stopColor={palette.glow} stopOpacity="0.22" />
          <Stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="cardOuter" x1="50%" y1="4%" x2="55%" y2="100%">
          <Stop offset="0%" stopColor={palette.core} />
          <Stop offset="38%" stopColor={palette.mid} />
          <Stop offset="100%" stopColor={palette.outer} />
        </LinearGradient>
        <LinearGradient id="cardInner" x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.88" />
          <Stop offset="100%" stopColor={palette.core} stopOpacity="0.72" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="110" cy="150" rx="96" ry="98" fill="url(#cardGlow)" />
      <G transform="translate(110 141)">
        <Path
          d="M0 -112 C-40 -76 -66 -35 -54 16 C-42 70 6 98 52 67 C94 38 100 -10 66 -50 C45 -74 33 -88 37 -111 C25 -94 11 -80 -7 -66 C-16 -91 -6 -107 0 -112 Z"
          fill="url(#cardOuter)"
        />
        <Path
          d="M4 -67 C-23 -38 -34 -12 -26 22 C-18 58 12 72 38 47 C62 24 51 -6 29 -34 C16 -50 10 -61 14 -78 C10 -74 7 -70 4 -67 Z"
          fill={palette.core}
          opacity="0.86"
        />
        <Path
          d="M9 -30 C-8 -11 -13 12 -4 30 C4 49 24 50 35 32 C45 16 32 1 21 -13 C14 -22 11 -29 12 -39 C11 -35 10 -32 9 -30 Z"
          fill="url(#cardInner)"
        />
      </G>
    </Svg>
  );
}

function CampfireLogs({ palette }: { palette: FlamePalette }) {
  return (
    <View style={styles.logsLayer}>
      <Svg width="230" height="92" viewBox="0 0 240 96">
        <Defs>
          <LinearGradient id="logA" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#9a6a42" />
            <Stop offset="58%" stopColor="#6c4328" />
            <Stop offset="100%" stopColor="#3c2418" />
          </LinearGradient>
          <LinearGradient id="logB" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#b17b4b" />
            <Stop offset="62%" stopColor="#75462b" />
            <Stop offset="100%" stopColor="#3f271a" />
          </LinearGradient>
        </Defs>
        <Ellipse cx="120" cy="76" rx="88" ry="13" fill={palette.outer} opacity="0.14" />
        <G transform="rotate(-13 118 62)">
          <Path d="M44 50 H188 C199 50 208 58 208 68 C208 78 199 86 188 86 H44 C33 86 24 78 24 68 C24 58 33 50 44 50 Z" fill="url(#logA)" />
          <Ellipse cx="44" cy="68" rx="20" ry="18" fill="#c08b5d" />
          <Ellipse cx="44" cy="68" rx="11" ry="10" fill="#6e4328" opacity="0.68" />
        </G>
        <G transform="rotate(13 122 62)">
          <Path d="M52 44 H196 C207 44 216 52 216 62 C216 72 207 80 196 80 H52 C41 80 32 72 32 62 C32 52 41 44 52 44 Z" fill="url(#logB)" />
          <Ellipse cx="196" cy="62" rx="20" ry="18" fill="#c99461" />
          <Ellipse cx="196" cy="62" rx="11" ry="10" fill="#6d4228" opacity="0.7" />
        </G>
        <Path d="M92 34 C112 20 131 20 150 34" stroke={palette.mid} strokeWidth="6" strokeLinecap="round" opacity="0.32" />
      </Svg>
    </View>
  );
}

function FloatingNameChip({ name, index, color }: { name: string; index: number; color: string }) {
  const drift = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 2300 + index * 180, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 2300 + index * 180, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [drift, index]);

  return (
    <Animated.View
      style={[
        styles.nameChip,
        {
          borderColor: `${color}33`,
          transform: [
            { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
          ],
        },
      ]}
    >
      <Text style={styles.nameChipText}>{name}</Text>
    </Animated.View>
  );
}

function getFlamePalette({
  colors,
  isCritical,
  streakUnlocked,
  effortScore,
}: {
  colors: typeof Colors.light;
  isCritical: boolean;
  streakUnlocked: boolean;
  effortScore: number;
}): FlamePalette {
  if (isCritical) {
    return {
      outer: '#ba1a1a',
      mid: '#f97373',
      core: '#ffe4e6',
      glow: '#fca5a5',
      focus: '#fff0ef',
      border: '#ffe1df',
      text: '#7f1616',
      muted: '#a84545',
    };
  }
  if (!streakUnlocked) {
    return {
      outer: colors.primaryLight,
      mid: '#c8b8ff',
      core: '#fbf7ff',
      glow: '#d8ccff',
      focus: '#f4edff',
      border: '#f0e8ff',
      text: colors.primaryDark,
      muted: colors.primary,
    };
  }
  if (effortScore >= 76) {
    return {
      outer: colors.secondary,
      mid: '#34d399',
      core: '#ecfdf5',
      glow: '#a6f2cf',
      focus: '#edfff6',
      border: '#d9fbe9',
      text: '#0f513d',
      muted: '#2f765d',
    };
  }
  return {
    outer: colors.primary,
    mid: colors.primaryLight,
    core: '#f7f1ff',
    glow: '#d8ccff',
    focus: '#f3edff',
    border: '#efe8ff',
    text: colors.primaryDark,
    muted: colors.primary,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageGlow: {
    position: 'absolute',
    right: -96,
    top: 140,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.28,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
  },
  microLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statusPill: {
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '900',
  },
  searchBar: {
    minHeight: 58,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: Spacing.two,
    fontSize: 15,
    fontWeight: '800',
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCard: {
    padding: Spacing.three,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  streakCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 3,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  scoreBadge: {
    minWidth: 62,
    height: 38,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  fireStage: {
    height: 338,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
  },
  flameLayer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  logsLayer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  streakInsideFlame: {
    position: 'absolute',
    top: 132,
    minWidth: 82,
    height: 70,
    borderRadius: Radius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.70)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakInsideNumber: {
    fontSize: 26,
    lineHeight: 29,
    fontWeight: '900',
  },
  streakInsideLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '800',
  },
  leaderboardCard: {
    padding: 0,
    overflow: 'hidden',
  },
  leaderRow: {
    minHeight: 66,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rankCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '900',
  },
  leaderNameBlock: {
    flex: 1,
  },
  leaderName: {
    fontSize: 15,
    fontWeight: '900',
  },
  leaderSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  leaderScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  leaderDays: {
    fontSize: 16,
    fontWeight: '900',
  },
  nameWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  nameChip: {
    minHeight: 38,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  nameChipText: {
    color: '#1d1a21',
    fontSize: 13,
    fontWeight: '900',
  },
  requestCard: {
    minHeight: 66,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestName: {
    fontSize: 15,
    fontWeight: '900',
  },
  requestActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  requestAction: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedCard: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  feedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feedName: {
    fontSize: 14,
    fontWeight: '900',
  },
  feedTime: {
    fontSize: 11,
    fontWeight: '700',
  },
  feedDetail: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  supportButton: {
    alignSelf: 'flex-start',
    height: 34,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  supportText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
