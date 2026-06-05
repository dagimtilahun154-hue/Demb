import React, { useMemo, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabInset, Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import AnimatedPressable from '@/components/AnimatedPressable';
import NeomorphicCard from '@/components/NeomorphicCard';
import { useAppStore } from '@/store';
import type { Buddy } from '@/types/burnout';

type BuddyDisplay = Buddy & { pending?: boolean };

type FlamePalette = {
  outer: string;
  mid: string;
  core: string;
  glow: string;
  haze: string;
  focus: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
};

const SUPPORT_MESSAGE = 'Take a soft reset with me.';

export default function WellnessCirclesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';
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
  const isCritical =
    burnoutRisk.status === 'Critical' ||
    buddyGroup.members.some(member => member.currentState === 'Critical');
  const averageRecovery = Math.round(
    buddyGroup.members.reduce((sum, member) => sum + member.recoveryScore, 0) / Math.max(1, buddyGroup.members.length)
  );
  const effortScore = Math.min(
    100,
    Math.round(
      averageRecovery * 0.65 +
        Math.min(buddyGroup.groupStreak, 14) * 1.8 +
        Math.min(recoveryTree.level, 10) * 1.1
    )
  );
  const palette = getFlamePalette({ colors, isDark, isCritical, streakUnlocked, effortScore });
  const smallFlameCount = streakUnlocked ? Math.min(4, buddyMembers.length) : 0;
  const mainFlameSize = streakUnlocked
    ? Math.min(420, 285 + effortScore * 1.18 + Math.min(personalStreak, 14) * 3)
    : 250;
  const friendStreak = buddyGroup.groupStreak;

  const label = isCritical
    ? 'Critical'
    : !streakUnlocked
      ? 'Day 1'
      : effortScore >= 76
        ? 'Green'
        : 'Violet';

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
    <View style={[styles.container, { backgroundColor: palette.surface }]}>
      <FlameBackground
        palette={palette}
        members={visibleBuddies}
        effortScore={effortScore}
        mainSize={mainFlameSize}
        smallFlameCount={smallFlameCount}
        streakUnlocked={streakUnlocked}
        personalStreak={streakUnlocked ? personalStreak : 1}
        friendStreak={friendStreak}
      />

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
            <Text style={[styles.title, { color: palette.text }]}>Buddies</Text>
            <Text style={[styles.microLabel, { color: palette.muted }]}>{label} flame</Text>
          </View>
        </View>

        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? 'rgba(42,39,48,0.78)' : 'rgba(255,255,255,0.82)',
              borderColor: palette.border,
            },
          ]}
        >
          <Ionicons name="search-outline" size={19} color={palette.muted} />
          <TextInput
            style={[styles.searchInput, { color: palette.text }]}
            placeholder="Search or add"
            placeholderTextColor={palette.muted}
            value={searchValue}
            onChangeText={setSearchValue}
            returnKeyType="send"
            onSubmitEditing={handleAddBuddy}
          />
          <AnimatedPressable
            onPress={handleAddBuddy}
            disabled={!canAddBuddy}
            lifted={canAddBuddy}
            style={[
              styles.addButton,
              { backgroundColor: canAddBuddy ? palette.outer : palette.haze },
            ]}
          >
            <Ionicons name="person-add-outline" size={18} color={canAddBuddy ? '#ffffff' : palette.muted} />
          </AnimatedPressable>
        </View>

        <View style={styles.flameSpace} pointerEvents="none" />

        <View style={styles.statsRow}>
          <MiniStat value={`${effortScore}%`} label="Effort" color={palette.text} muted={palette.muted} />
          <MiniStat value={`${buddyMembers.length}`} label="Buddies" color={palette.text} muted={palette.muted} />
          <MiniStat value={`${burnoutRisk.recoveryScore}%`} label="Score" color={palette.text} muted={palette.muted} />
        </View>

        {pendingIncoming.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Requests</Text>
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Updates</Text>
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
      </ScrollView>
    </View>
  );
}

function FlameBackground({
  palette,
  members,
  effortScore,
  mainSize,
  smallFlameCount,
  streakUnlocked,
  personalStreak,
  friendStreak,
}: {
  palette: FlamePalette;
  members: BuddyDisplay[];
  effortScore: number;
  mainSize: number;
  smallFlameCount: number;
  streakUnlocked: boolean;
  personalStreak: number;
  friendStreak: number;
}) {
  const stageMembers = members.slice(0, 6);
  const clusterFlames = [
    { xOffset: -172, top: 378, size: 124 },
    { xOffset: 54, top: 382, size: 126 },
    { xOffset: -118, top: 462, size: 96 },
    { xOffset: 76, top: 464, size: 96 },
  ];

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <View style={[styles.fireFocusPanel, { backgroundColor: palette.focus, borderColor: palette.border }]} />
      <View style={[styles.backgroundWash, { backgroundColor: palette.haze }]} />
      <AnimatedFlame
        id="main"
        palette={palette}
        size={mainSize}
        left="50%"
        top={170}
        xOffset={-mainSize / 2}
        intensity={0.95 + effortScore / 360}
      />
      {streakUnlocked &&
        clusterFlames.slice(0, smallFlameCount).map((flame, index) => (
          <AnimatedFlame
            key={`${flame.xOffset}-${index}`}
            id={`small_${index}`}
            palette={palette}
            size={flame.size}
            left="50%"
            top={flame.top}
            xOffset={flame.xOffset}
            intensity={0.8 + index * 0.07}
            delay={index * 180}
          />
        ))}
      <CampfireStreaks palette={palette} personalStreak={personalStreak} friendStreak={friendStreak} />
      <CampfireLogs palette={palette} />
      {stageMembers.map((member, index) => (
        <FloatingBuddyName key={member.id} member={member} index={index} palette={palette} />
      ))}
    </View>
  );
}

function AnimatedFlame({
  id,
  palette,
  size,
  left,
  top,
  xOffset,
  intensity,
  delay = 0,
}: {
  id: string;
  palette: FlamePalette;
  size: number;
  left: string;
  top: number;
  xOffset: number;
  intensity: number;
  delay?: number;
}) {
  const flicker = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, {
          toValue: 1,
          duration: 1350 + delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0,
          duration: 1350 + delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, flicker]);

  const animatedStyle = {
    transform: [
      {
        translateX: flicker.interpolate({
          inputRange: [0, 1],
          outputRange: [xOffset - 4, xOffset + 5],
        }),
      },
      {
        translateY: flicker.interpolate({
          inputRange: [0, 1],
          outputRange: [2, -7],
        }),
      },
      {
        scaleX: flicker.interpolate({
          inputRange: [0, 1],
          outputRange: [0.97 * intensity, 1.05 * intensity],
        }),
      },
      {
        scaleY: flicker.interpolate({
          inputRange: [0, 1],
          outputRange: [1.03 * intensity, 0.97 * intensity],
        }),
      },
      {
        rotate: flicker.interpolate({
          inputRange: [0, 1],
          outputRange: ['-1.5deg', '1.8deg'],
        }),
      },
    ],
    opacity: flicker.interpolate({
      inputRange: [0, 1],
      outputRange: [0.92, 1],
    }),
  };

  return (
    <Animated.View
      style={[
        styles.flameLayer,
        {
          left: left as any,
          top,
          width: size,
          height: size * 1.2,
        },
        animatedStyle,
      ]}
    >
      <FlameSvg id={id} palette={palette} />
    </Animated.View>
  );
}

function FlameSvg({ id, palette }: { id: string; palette: FlamePalette }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 220 264">
      <Defs>
        <RadialGradient id={`glow_${id}`} cx="50%" cy="58%" r="56%">
          <Stop offset="0%" stopColor={palette.glow} stopOpacity="0.68" />
          <Stop offset="62%" stopColor={palette.glow} stopOpacity="0.22" />
          <Stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id={`outer_${id}`} x1="50%" y1="4%" x2="55%" y2="100%">
          <Stop offset="0%" stopColor={palette.core} />
          <Stop offset="36%" stopColor={palette.mid} />
          <Stop offset="100%" stopColor={palette.outer} />
        </LinearGradient>
        <LinearGradient id={`inner_${id}`} x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.86" />
          <Stop offset="100%" stopColor={palette.core} stopOpacity="0.7" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="110" cy="150" rx="96" ry="98" fill={`url(#glow_${id})`} />
      <G transform="translate(110 141)">
        <Path
          d="M0 -112 C-40 -76 -66 -35 -54 16 C-42 70 6 98 52 67 C94 38 100 -10 66 -50 C45 -74 33 -88 37 -111 C25 -94 11 -80 -7 -66 C-16 -91 -6 -107 0 -112 Z"
          fill={`url(#outer_${id})`}
        />
        <Path
          d="M4 -67 C-23 -38 -34 -12 -26 22 C-18 58 12 72 38 47 C62 24 51 -6 29 -34 C16 -50 10 -61 14 -78 C10 -74 7 -70 4 -67 Z"
          fill={palette.core}
          opacity="0.86"
        />
        <Path
          d="M9 -30 C-8 -11 -13 12 -4 30 C4 49 24 50 35 32 C45 16 32 1 21 -13 C14 -22 11 -29 12 -39 C11 -35 10 -32 9 -30 Z"
          fill={`url(#inner_${id})`}
        />
      </G>
    </Svg>
  );
}

function CampfireStreaks({
  palette,
  personalStreak,
  friendStreak,
}: {
  palette: FlamePalette;
  personalStreak: number;
  friendStreak: number;
}) {
  return (
    <View style={styles.streakCenter}>
      <View style={[styles.streakCenterPill, { backgroundColor: 'rgba(255,255,255,0.76)', borderColor: palette.border }]}>
        <Text style={[styles.streakNumber, { color: palette.text }]}>{personalStreak}</Text>
        <Text style={[styles.streakLabel, { color: palette.muted }]}>You</Text>
      </View>
      <View style={[styles.streakCenterPill, { backgroundColor: 'rgba(255,255,255,0.76)', borderColor: palette.border }]}>
        <Text style={[styles.streakNumber, { color: palette.text }]}>{friendStreak}</Text>
        <Text style={[styles.streakLabel, { color: palette.muted }]}>Friends</Text>
      </View>
    </View>
  );
}

function CampfireLogs({ palette }: { palette: FlamePalette }) {
  return (
    <View style={styles.logsLayer}>
      <Svg width="240" height="96" viewBox="0 0 240 96">
        <Defs>
          <LinearGradient id="logA" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#9a6a42" />
            <Stop offset="56%" stopColor="#6c4328" />
            <Stop offset="100%" stopColor="#3c2418" />
          </LinearGradient>
          <LinearGradient id="logB" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#b17b4b" />
            <Stop offset="62%" stopColor="#75462b" />
            <Stop offset="100%" stopColor="#3f271a" />
          </LinearGradient>
        </Defs>
        <Ellipse cx="120" cy="76" rx="92" ry="14" fill={palette.outer} opacity="0.14" />
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

function FloatingBuddyName({ member, index, palette }: { member: BuddyDisplay; index: number; palette: FlamePalette }) {
  const drift = React.useRef(new Animated.Value(0)).current;
  const positions = [
    { left: '9%', top: 338 },
    { left: '61%', top: 332 },
    { left: '15%', top: 500 },
    { left: '58%', top: 510 },
    { left: '34%', top: 266 },
    { left: '35%', top: 612 },
  ];
  const position = positions[index % positions.length];

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 2400 + index * 260,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 2400 + index * 260,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [drift, index]);

  const animatedStyle = {
    transform: [
      {
        translateY: drift.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -12 - (index % 2) * 5],
        }),
      },
      {
        translateX: drift.interpolate({
          inputRange: [0, 1],
          outputRange: [0, index % 2 === 0 ? 8 : -8],
        }),
      },
    ],
  };

  return (
    <Animated.View
      style={[
        styles.nameFloat,
        {
          left: position.left as any,
          top: position.top,
          backgroundColor: 'rgba(255,255,255,0.72)',
          borderColor: palette.border,
        },
        animatedStyle,
      ]}
    >
      <Text style={[styles.nameFloatText, { color: palette.text }]}>{member.name}</Text>
    </Animated.View>
  );
}

function MiniStat({ value, label, color, muted }: { value: string; label: string; color: string; muted: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniStatValue, { color }]}>{value}</Text>
      <Text style={[styles.miniStatLabel, { color: muted }]}>{label}</Text>
    </View>
  );
}

function getFlamePalette({
  colors,
  isDark,
  isCritical,
  streakUnlocked,
  effortScore,
}: {
  colors: typeof Colors.light | typeof Colors.dark;
  isDark: boolean;
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
      haze: isDark ? 'rgba(255, 180, 171, 0.16)' : 'rgba(255, 218, 214, 0.82)',
      focus: isDark ? 'rgba(96, 51, 56, 0.52)' : '#fff0ef',
      surface: isDark ? '#241318' : '#fff8f8',
      border: isDark ? '#603338' : '#ffe1df',
      text: isDark ? '#ffdad6' : '#7f1616',
      muted: isDark ? '#ffb4ab' : '#a84545',
    };
  }

  if (!streakUnlocked) {
    return {
      outer: colors.primaryLight,
      mid: '#c8b8ff',
      core: '#fbf7ff',
      glow: '#d8ccff',
      haze: isDark ? 'rgba(206, 189, 255, 0.14)' : 'rgba(232, 221, 255, 0.86)',
      focus: isDark ? 'rgba(62, 52, 86, 0.58)' : '#f4edff',
      surface: isDark ? colors.surfaceContainer : '#fbf8ff',
      border: isDark ? colors.outlineVariant : '#f0e8ff',
      text: colors.textPrimary,
      muted: colors.textMuted,
    };
  }

  if (effortScore >= 76) {
    return {
      outer: colors.secondary,
      mid: '#34d399',
      core: '#ecfdf5',
      glow: '#a6f2cf',
      haze: isDark ? 'rgba(139, 214, 180, 0.18)' : 'rgba(166, 242, 207, 0.72)',
      focus: isDark ? 'rgba(28, 71, 55, 0.58)' : '#edfff6',
      surface: isDark ? '#122a22' : '#f6fff9',
      border: isDark ? '#2e5f4b' : '#d9fbe9',
      text: isDark ? '#dff8ea' : '#0f513d',
      muted: isDark ? '#a6f2cf' : '#2f765d',
    };
  }

  return {
    outer: colors.primary,
    mid: colors.primaryLight,
    core: '#f7f1ff',
    glow: '#d8ccff',
    haze: isDark ? 'rgba(206, 189, 255, 0.16)' : 'rgba(232, 221, 255, 0.82)',
    focus: isDark ? 'rgba(68, 55, 98, 0.6)' : '#f3edff',
    surface: isDark ? '#2f2940' : '#fbf8ff',
    border: isDark ? '#514473' : '#efe8ff',
    text: isDark ? '#efe8ff' : colors.primaryDark,
    muted: isDark ? '#cebdff' : colors.primary,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundWash: {
    position: 'absolute',
    top: 150,
    left: 32,
    right: 32,
    height: 500,
    opacity: 0.72,
    borderRadius: 56,
  },
  fireFocusPanel: {
    position: 'absolute',
    top: 118,
    left: Spacing.three,
    right: Spacing.three,
    height: 610,
    borderRadius: 52,
    borderWidth: 1,
    shadowColor: '#4f319c',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 34,
  },
  flameLayer: {
    position: 'absolute',
  },
  logsLayer: {
    position: 'absolute',
    top: 585,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  streakCenter: {
    position: 'absolute',
    top: 374,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  streakCenterPill: {
    width: 82,
    height: 68,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3A3546',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  streakNumber: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  nameFloat: {
    position: 'absolute',
    minHeight: 38,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  nameFloatText: {
    fontSize: 13,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    minHeight: 920,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  streakBadge: {
    minWidth: 66,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  streakText: {
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
  flameSpace: {
    height: 640,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  miniStat: {
    flex: 1,
    minHeight: 72,
    borderRadius: Radius.lg,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ECE9EF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  miniStatLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 17,
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
