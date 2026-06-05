import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { ENCOURAGEMENT_MESSAGES, useAppStore } from '@/store';

export default function BuddyTreeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { buddyGroup, recoveryTree, sendEncouragementMessage } = useAppStore();
  const buddyNeedingSupport = buddyGroup.members.find(member => member.currentState === 'Critical' || member.currentState === 'At Risk');

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.three }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </Pressable>
          <Text style={styles.headerLabel}>Buddy Tree</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.treeCard}>
          <View style={styles.treeCanopy}>
            <Ionicons name="leaf" size={74} color={Colors.light.secondary} />
          </View>
          <Text style={styles.title}>Shared Recovery Tree</Text>
          <Text style={styles.subtitle}>
            Every recovery session grows a leaf. Shared streaks grow branches, flowers, and fruit.
          </Text>
          <View style={styles.treeStats}>
            <TreeMetric value={`${recoveryTree.level}`} label="Level" />
            <TreeMetric value={`${recoveryTree.leavesCount}`} label="Leaves" />
            <TreeMetric value={`${buddyGroup.groupStreak}`} label="Day streak" />
          </View>
        </View>

        {buddyNeedingSupport && (
          <View style={styles.supportCard}>
            <Ionicons name="heart-outline" size={22} color={Colors.light.primary} />
            <Text style={styles.supportText}>
              Your buddy may need support. Send encouragement or start a shared recovery session.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Members</Text>
        {buddyGroup.members.slice(0, 6).map(member => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{member.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.memberCopy}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberMeta}>{member.currentState} · {member.recoveryScore}% recovery</Text>
            </View>
            <Text style={styles.leafText}>+{member.treeContribution}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Encouragement</Text>
        {ENCOURAGEMENT_MESSAGES.map(message => (
          <Pressable
            key={message}
            style={styles.messageCard}
            onPress={() => sendEncouragementMessage(buddyNeedingSupport?.name ?? 'Alex', message)}
          >
            <Text style={styles.messageText}>{message}</Text>
            <Ionicons name="send-outline" size={18} color={Colors.light.primary} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function TreeMetric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.treeMetric}>
      <Text style={styles.treeMetricValue}>{value}</Text>
      <Text style={styles.treeMetricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  headerLabel: { color: Colors.light.textMuted, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  treeCard: { borderRadius: Radius.xl, backgroundColor: Colors.light.surface, padding: Spacing.four, alignItems: 'center', ...Shadows.card },
  treeCanopy: { width: 142, height: 142, borderRadius: 71, backgroundColor: Colors.light.secondaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
  title: { color: Colors.light.textPrimary, fontSize: 27, fontWeight: '900', marginBottom: Spacing.two },
  subtitle: { color: Colors.light.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.three },
  treeStats: { width: '100%', flexDirection: 'row', gap: Spacing.two },
  treeMetric: { flex: 1, minHeight: 74, borderRadius: Radius.lg, backgroundColor: Colors.light.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  treeMetricValue: { color: Colors.light.textPrimary, fontSize: 21, fontWeight: '900' },
  treeMetricLabel: { color: Colors.light.textMuted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 },
  supportCard: { borderRadius: Radius.lg, backgroundColor: Colors.light.primaryContainer, padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  supportText: { flex: 1, color: Colors.light.primary, fontSize: 13, lineHeight: 19, fontWeight: '800' },
  sectionTitle: { color: Colors.light.textPrimary, fontSize: 18, fontWeight: '900' },
  memberCard: { minHeight: 72, borderRadius: Radius.lg, backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.outlineVariant + '25', padding: Spacing.three, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.three },
  avatarText: { color: Colors.light.onPrimary, fontSize: 11, fontWeight: '900' },
  memberCopy: { flex: 1 },
  memberName: { color: Colors.light.textPrimary, fontSize: 15, fontWeight: '900', marginBottom: 3 },
  memberMeta: { color: Colors.light.textMuted, fontSize: 12, fontWeight: '700' },
  leafText: { color: Colors.light.secondary, fontSize: 13, fontWeight: '900' },
  messageCard: { minHeight: 52, borderRadius: Radius.full, backgroundColor: Colors.light.surfaceContainerLow, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  messageText: { flex: 1, color: Colors.light.textSecondary, fontSize: 13, fontWeight: '800', paddingRight: Spacing.two },
});
