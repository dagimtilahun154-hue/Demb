import React, { useState } from 'react';
import { StyleSheet, Text, View, useColorScheme, ScrollView, TextInput, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadows, BottomTabInset } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import NeomorphicCard from '@/components/NeomorphicCard';

export default function WellnessCirclesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';

  const {
    buddies,
    buddyRequests,
    buddyFeed,
    sendBuddyRequest,
    acceptBuddyRequest,
    declineBuddyRequest,
    sendCheerToBuddy,
  } = useAppStore();

  const [newBuddyName, setNewBuddyName] = useState('');

  // Moving background blobs
  const bounceAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 12000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 12000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const transX = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 30],
  });
  const transY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 20],
  });

  const handleAddBuddy = () => {
    if (!newBuddyName.trim()) return;
    sendBuddyRequest(newBuddyName);
    setNewBuddyName('');
  };

  const pendingIncoming = buddyRequests.filter(r => r.type === 'incoming' && r.status === 'pending');
  const pendingOutgoing = buddyRequests.filter(r => r.type === 'outgoing' && r.status === 'pending');

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'lock': return 'lock-closed';
      case 'success': return 'checkmark-circle';
      case 'cheer': return 'heart-circle';
      default: return 'notifications';
    }
  };

  const getEventIconColor = (event: string) => {
    switch (event) {
      case 'lock': return colors.error;
      case 'success': return colors.success;
      case 'cheer': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background aurora */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View 
          style={[
            styles.blurBlob, 
            { 
              backgroundColor: isDark ? '#3d256d' : '#e8ddff',
              bottom: '20%', 
              left: '-10%',
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
        <Text style={[styles.title, { color: colors.textPrimary }]}>Wellness Circles</Text>

        {/* Squad Status Header Card */}
        <NeomorphicCard style={styles.groupCard} bgColor={colors.primary}>
          <View style={styles.groupHeader}>
            <Text style={[styles.groupLabel, { color: colors.onPrimary }]}>DEMB PATROL SQUAD</Text>
            <View style={styles.streakBadge}>
              <Text style={[styles.streakBadgeText, { color: colors.onPrimary }]}>🔥 {buddies.length + 1} Members</Text>
            </View>
          </View>
          <Text style={[styles.groupTitle, { color: colors.onPrimary }]}>Active Balance Circle</Text>
          
          <View style={styles.avatarRow}>
            {/* User Avatar */}
            <View style={[styles.circleAvatar, { backgroundColor: colors.primaryLight, borderColor: colors.surface }]}>
              <Text style={styles.avatarText}>ME</Text>
            </View>
            {/* Buddies Avatars */}
            {buddies.map((buddy, index) => (
              <View 
                key={buddy} 
                style={[
                  styles.circleAvatar, 
                  { 
                    backgroundColor: index % 2 === 0 ? colors.secondaryLight : colors.tertiaryLight, 
                    borderColor: colors.surface 
                  }
                ]}
              >
                <Text style={styles.avatarText}>{buddy.slice(0,2).toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </NeomorphicCard>

        {/* Add Buddy Input Row */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Add new buddy</Text>
        <View style={styles.addBuddyRow}>
          <TextInput
            style={[
              styles.addInput,
              {
                backgroundColor: isDark ? colors.surface : '#f2ebf6',
                color: colors.textPrimary,
                borderColor: isDark ? colors.outlineVariant : '#ffffff',
                borderWidth: isDark ? 1 : 2,
              },
            ]}
            placeholder="Enter buddy's name..."
            placeholderTextColor={colors.textMuted}
            value={newBuddyName}
            onChangeText={setNewBuddyName}
          />
          <NeomorphicCard onPress={handleAddBuddy} style={styles.addButton} bgColor={colors.primary}>
            <Ionicons name="person-add-outline" size={20} color={colors.onPrimary} />
          </NeomorphicCard>
        </View>

        {/* Pending Requests Section */}
        {pendingIncoming.length > 0 && (
          <View style={styles.requestsSection}>
            <Text style={[styles.sectionSubtitle, { color: colors.textPrimary }]}>Pending Buddy Requests</Text>
            {pendingIncoming.map(req => (
              <NeomorphicCard key={req.id} style={styles.requestCard}>
                <View style={styles.requestLeft}>
                  <Ionicons name="people-circle-outline" size={32} color={colors.primaryLight} />
                  <Text style={[styles.requestName, { color: colors.textPrimary }]}>{req.name}</Text>
                </View>
                <View style={styles.requestActions}>
                  <Pressable
                    onPress={() => acceptBuddyRequest(req.id)}
                    style={[styles.requestActButton, { backgroundColor: colors.successContainer }]}
                  >
                    <Ionicons name="checkmark" size={18} color={isDark ? colors.success : '#1b6b4f'} />
                  </Pressable>
                  <Pressable
                    onPress={() => declineBuddyRequest(req.id)}
                    style={[styles.requestActButton, { backgroundColor: colors.errorContainer }]}
                  >
                    <Ionicons name="close" size={18} color={colors.error} />
                  </Pressable>
                </View>
              </NeomorphicCard>
            ))}
          </View>
        )}

        {/* Outgoing Requests */}
        {pendingOutgoing.length > 0 && (
          <View style={styles.requestsSection}>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Outgoing Requests</Text>
            {pendingOutgoing.map(req => (
              <NeomorphicCard key={req.id} style={styles.requestCard}>
                <View style={styles.requestLeft}>
                  <Ionicons name="paper-plane-outline" size={20} color={colors.textMuted} />
                  <Text style={[styles.requestNameMuted, { color: colors.textSecondary }]}>{req.name}</Text>
                </View>
                <Text style={[styles.pendingText, { color: colors.primaryLight }]}>Sent</Text>
              </NeomorphicCard>
            ))}
          </View>
        )}

        {/* Buddies Roster list */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Demb Buddies</Text>
        <NeomorphicCard style={styles.buddiesCard}>
          {buddies.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No buddies added yet. Secure your circle above!</Text>
          ) : (
            buddies.map((buddy, index) => (
              <View key={buddy} style={[styles.buddyRow, index < buddies.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant + '20' }]}>
                <View style={styles.buddyLeft}>
                  <View style={[styles.statusDot, { backgroundColor: index === 1 ? colors.error : colors.success }]} />
                  <Text style={[styles.buddyName, { color: colors.textPrimary }]}>{buddy}</Text>
                </View>
                <Text style={[styles.buddyStatusText, { color: index === 1 ? colors.error : colors.success }]}>
                  {index === 1 ? 'Locked (Instagram)' : 'Active Patrol'}
                </Text>
              </View>
            ))
          )}
        </NeomorphicCard>

        {/* Dynamic Activity Feed */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Squad Feed & Alarms</Text>
        <View style={styles.feedContainer}>
          {buddyFeed.map(feed => (
            <NeomorphicCard key={feed.id} style={styles.feedCard}>
              <View style={styles.feedHeader}>
                <View style={styles.feedSender}>
                  <Ionicons name={getEventIcon(feed.event) as any} size={20} color={getEventIconColor(feed.event)} />
                  <Text style={[styles.feedName, { color: colors.textPrimary }]}>{feed.name}</Text>
                </View>
                <Text style={[styles.feedTime, { color: colors.textMuted }]}>{feed.timestamp}</Text>
              </View>
              
              <Text style={[styles.feedDetail, { color: colors.textSecondary }]}>{feed.detail}</Text>
              
              {feed.event === 'lock' && (
                <Pressable
                  onPress={() => sendCheerToBuddy(feed.name)}
                  style={({ pressed }) => [
                    styles.cheerButton,
                    { backgroundColor: colors.primaryContainer },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="heart-outline" size={16} color={colors.primary} />
                  <Text style={[styles.cheerButtonText, { color: colors.primary }]}>Send Cheer (+5 pts)</Text>
                </Pressable>
              )}
            </NeomorphicCard>
          ))}
        </View>
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
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.3,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  groupCard: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  streakBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  streakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  groupTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  circleAvatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: Spacing.one,
  },
  addBuddyRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    height: 56,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderWidth: 0,
  },
  requestsSection: {
    gap: Spacing.two,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
  },
  requestNameMuted: {
    fontSize: 14,
    fontWeight: '500',
  },
  requestActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  requestActButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  buddiesCard: {
    padding: Spacing.two,
  },
  buddyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  buddyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buddyName: {
    fontSize: 15,
    fontWeight: '600',
  },
  buddyStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  feedContainer: {
    gap: Spacing.two,
  },
  feedCard: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedSender: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  feedName: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedTime: {
    fontSize: 11,
  },
  feedDetail: {
    fontSize: 13,
    lineHeight: 18,
  },
  cheerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    height: 36,
    borderRadius: Radius.md,
    marginTop: Spacing.one,
  },
  cheerButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
});
