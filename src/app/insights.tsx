import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppStore } from '@/store';

export default function RecoveryInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { burnoutRisk, screenUsageSnapshots, activitySnapshots, moodCheckIns, recoverySessions } = useAppStore();
  const screen = screenUsageSnapshots[0];
  const activity = activitySnapshots[0];
  const mood = moodCheckIns[0];

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.three }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </Pressable>
          <Text style={styles.headerLabel}>Recovery Insights</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.title}>Pattern</Text>
          <Text style={styles.subtitle} numberOfLines={2}>{burnoutRisk.explanation}</Text>
          <View style={styles.scoreRow}>
            <Score value={`${burnoutRisk.burnoutRiskScore}%`} label="Burnout risk" />
            <Score value={`${burnoutRisk.recoveryScore}%`} label="Recovery" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Signals</Text>
        <Signal icon="phone-portrait-outline" label="Screen time" value={`${screen?.screenTimeMinutes ?? 414} minutes`} />
        <Signal icon="swap-horizontal-outline" label="App switching" value={`${screen?.appSwitchCount ?? 72} switches`} />
        <Signal icon="walk-outline" label="Movement" value={`${activity?.stepCount ?? 2200} steps`} />
        <Signal icon="moon-outline" label="Sleep estimate" value={`${activity?.sleepHours ?? 6.2} hours`} />
        <Signal icon="pulse-outline" label="Stress check-in" value={`${mood?.stressScore ?? 7}/10`} />
        <Signal icon="leaf-outline" label="Recovery sessions" value={`${recoverySessions.length} completed`} />

        <Text style={styles.sectionTitle}>Actions</Text>
        {burnoutRisk.recommendedActions.slice(0, 3).map(action => (
          <View key={action} style={styles.actionCard}>
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.light.secondary} />
            <Text style={styles.actionText} numberOfLines={2}>{action}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Score({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.scoreCard}>
      <Text style={styles.scoreValue}>{value}</Text>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

function Signal({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.signalCard}>
      <View style={styles.signalIcon}>
        <Ionicons name={icon as any} size={19} color={Colors.light.primary} />
      </View>
      <Text style={styles.signalLabel}>{label}</Text>
      <Text style={styles.signalValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  headerLabel: { color: Colors.light.textMuted, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  heroCard: { borderRadius: Radius.xl, backgroundColor: Colors.light.surface, padding: Spacing.four, ...Shadows.card },
  title: { color: Colors.light.textPrimary, fontSize: 28, lineHeight: 34, fontWeight: '900', marginBottom: Spacing.two },
  subtitle: { color: Colors.light.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '600', marginBottom: Spacing.three },
  scoreRow: { flexDirection: 'row', gap: Spacing.two },
  scoreCard: { flex: 1, minHeight: 82, borderRadius: Radius.lg, backgroundColor: Colors.light.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  scoreValue: { color: Colors.light.textPrimary, fontSize: 23, fontWeight: '900' },
  scoreLabel: { color: Colors.light.textMuted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 },
  sectionTitle: { color: Colors.light.textPrimary, fontSize: 18, fontWeight: '900' },
  signalCard: { minHeight: 58, borderRadius: Radius.lg, backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.outlineVariant + '25', paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center' },
  signalIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.light.primaryContainer, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.two },
  signalLabel: { flex: 1, color: Colors.light.textSecondary, fontSize: 13, fontWeight: '800' },
  signalValue: { color: Colors.light.textPrimary, fontSize: 13, fontWeight: '900' },
  actionCard: { borderRadius: Radius.lg, backgroundColor: Colors.light.surfaceContainerLow, padding: Spacing.three, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  actionText: { flex: 1, color: Colors.light.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: '700' },
});
