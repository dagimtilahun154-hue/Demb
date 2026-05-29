import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useColorScheme, ScrollView, Pressable, Alert, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadows, BottomTabInset } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import NeomorphicCard from '@/components/NeomorphicCard';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';

  const {
    user,
    points,
    streakCount,
    resetAllData,
  } = useAppStore();

  const bounceAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 11000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 11000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const transX = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 20],
  });
  const transY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 15],
  });

  const getRank = () => {
    if (points < 100) return 'Balance Cadet';
    if (points < 250) return 'Recovery Sergeant';
    if (points < 500) return 'Focus Captain';
    return 'Serenity Sheriff';
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to delete all energy logs, streaks, and user settings? This action is permanent.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Everything', style: 'destructive', onPress: () => resetAllData() }
      ]
    );
  };

  const badges = [
    { title: 'First Log', desc: 'Arrested first distraction', icon: 'shield-outline', unlocked: true, color: '#ece6f0' },
    { title: '3-Day Patrol', desc: 'Maintained 3-day streak', icon: 'flame-outline', unlocked: true, color: '#a6f2cf' },
    { title: 'Mission Cadet', desc: 'Completed first mission', icon: 'checkmark-circle-outline', unlocked: true, color: '#ffdcbd' },
    { title: 'Focus Captain', desc: 'Reach 250 points', unlocked: points >= 250, icon: 'medal-outline', color: '#ffdad6' },
    { title: 'Sheriff Badge', desc: 'Reach 500 points', unlocked: points >= 500, icon: 'trophy-outline', color: '#e8ddff' },
    { title: 'Balance Master', desc: 'Maintained 80+ Score', unlocked: false, icon: 'infinite-outline', color: '#cac4d4' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background aurora */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View 
          style={[
            styles.blurBlob, 
            { 
              backgroundColor: isDark ? '#3d256d' : '#e8ddff',
              top: '15%', 
              right: '-10%',
              transform: [{ translateX: transX }, { translateY: transY }] 
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
            paddingBottom: BottomTabInset + Spacing.six,
          },
        ]}
      >
        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>Officer Profile</Text>

        {/* Profile Card Header with Mascot Celebrate */}
        <NeomorphicCard style={styles.profileHeaderCard} bgColor={colors.surface}>
          <Image
            source={require('../../../assets/images/logo.jpg')}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.profileInfoContainer}>
            <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
              {user.name || 'Demb Cadet'}
            </Text>
            <View style={[styles.rankBadge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.rankText, { color: colors.primary }]}>{getRank()}</Text>
            </View>
          </View>
          <Image
            source={require('../../../assets/images/demb_celebrate.png')}
            style={styles.mascotCelebrate}
            contentFit="contain"
          />
        </NeomorphicCard>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <NeomorphicCard style={styles.statCard}>
            <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{points}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Points</Text>
          </NeomorphicCard>

          <NeomorphicCard style={styles.statCard}>
            <Ionicons name="flame-outline" size={22} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{streakCount} days</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Active Streak</Text>
          </NeomorphicCard>
        </View>

        {/* Badge Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Achievements & Badges</Text>
        <View style={styles.badgeGrid}>
          {badges.map(badge => (
            <NeomorphicCard 
              key={badge.title} 
              style={[
                styles.badgeTile,
                !badge.unlocked && { opacity: 0.35 }
              ]}
              bgColor={badge.unlocked ? badge.color + '25' : colors.surface}
            >
              <View style={[styles.badgeIconWrapper, { backgroundColor: badge.unlocked ? badge.color : colors.surfaceContainer }]}>
                <Ionicons 
                  name={badge.icon as any} 
                  size={22} 
                  color={badge.unlocked ? colors.primary : colors.textMuted} 
                />
              </View>
              <Text style={[styles.badgeTitleText, { color: colors.textPrimary }]}>{badge.title}</Text>
              <Text style={[styles.badgeDescText, { color: colors.textSecondary }]}>{badge.desc}</Text>
            </NeomorphicCard>
          ))}
        </View>

        {/* Settings / Actions */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Settings</Text>
        <NeomorphicCard style={styles.settingsCard}>
          {[
            { title: 'Account Settings', icon: 'person-outline', action: () => {} },
            { title: 'Notification Alerts', icon: 'notifications-outline', action: () => {} },
            { title: 'Privacy Patrol', icon: 'lock-closed-outline', action: () => {} },
            { title: 'Help & Feedback', icon: 'help-circle-outline', action: () => {} },
          ].map((item, index) => (
            <Pressable 
              key={item.title} 
              onPress={item.action} 
              style={({ pressed }) => [
                styles.settingsRow,
                pressed && styles.rowPressed,
                index < 3 && { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '20' }
              ]}
            >
              <View style={styles.settingsRowLeft}>
                <Ionicons name={item.icon as any} size={18} color={colors.textSecondary} />
                <Text style={[styles.settingsRowText, { color: colors.textPrimary }]}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ))}

          {/* Reset Action */}
          <Pressable 
            onPress={handleReset} 
            style={({ pressed }) => [
              styles.settingsRow,
              { borderTopWidth: 1, borderTopColor: colors.outlineVariant + '30', marginTop: Spacing.one },
              pressed && styles.rowPressed
            ]}
          >
            <View style={styles.settingsRowLeft}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={[styles.settingsRowText, { color: colors.error }]}>Reset Local State</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </NeomorphicCard>

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
    opacity: 0.3,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
    position: 'relative',
    overflow: 'visible',
    marginTop: Spacing.two,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: '#674bb5',
  },
  profileInfoContainer: {
    flex: 1,
    gap: Spacing.half,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  rankBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mascotCelebrate: {
    position: 'absolute',
    top: -30,
    right: -5,
    width: 78,
    height: 78,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: Spacing.one,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  badgeTile: {
    width: '47.5%',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.one,
  },
  badgeIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  badgeTitleText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeDescText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  settingsCard: {
    padding: Spacing.one,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  settingsRowText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rowPressed: {
    opacity: 0.7,
  },
});
