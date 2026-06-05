import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppStore } from '@/store';
import AnimatedPressable from '@/components/AnimatedPressable';

export default function BurnoutPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recoveryPlan, burnoutRisk, generateRecoveryPlan, activateRecoveryPlan } = useAppStore();

  React.useEffect(() => {
    if (!recoveryPlan) {
      generateRecoveryPlan();
    }
  }, [recoveryPlan, generateRecoveryPlan]);

  const plan = recoveryPlan;

  const handleActivate = () => {
    activateRecoveryPlan();
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.three }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </Pressable>
          <Text style={styles.headerLabel}>Personal Plan</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>AI Plan</Text>
          <Text style={styles.title}>Recovery plan ready.</Text>
          <Text style={styles.subtitle}>Rules, tasks, support.</Text>
          <View style={styles.statusPill}>
            <Ionicons name="analytics-outline" size={16} color={Colors.light.primary} />
            <Text style={styles.statusText}>{burnoutRisk.status} · {burnoutRisk.burnoutRiskScore}% risk indicators</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Causes</Text>
        <View style={styles.chipRow}>
          {(plan?.primaryCauses.length ? plan.primaryCauses : burnoutRisk.causes).map(cause => (
            <View key={cause} style={styles.causeChip}>
              <Text style={styles.causeText}>{cause}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Tasks</Text>
        {plan?.recoveryTasks.map(task => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskIcon}>
              <Ionicons
                name={task.type === 'walking' ? 'walk-outline' : task.type === 'sound_therapy' ? 'musical-notes-outline' : 'leaf-outline'}
                size={22}
                color={Colors.light.primary}
              />
            </View>
            <View style={styles.taskCopy}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDetail}>{task.target} · +{task.rewardPoints} points</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Rules</Text>
        {plan?.digitalRules.map(rule => (
          <View key={rule.id} style={styles.ruleCard}>
            <Text style={styles.ruleTitle}>{rule.appName}</Text>
            <Text style={styles.ruleDetail}>
              {rule.allowedMinutes}m per {rule.windowMinutes}m window.
            </Text>
          </View>
        ))}

        <AnimatedPressable lifted style={styles.primaryButton} onPress={handleActivate}>
          <Text style={styles.primaryText}>Activate Plan</Text>
        </AnimatedPressable>
      </ScrollView>
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
  eyebrow: { color: Colors.light.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: Spacing.two },
  title: { color: Colors.light.textPrimary, fontSize: 28, lineHeight: 34, fontWeight: '900', marginBottom: Spacing.two },
  subtitle: { color: Colors.light.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: '600', marginBottom: Spacing.three },
  statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: Spacing.one, borderRadius: Radius.full, backgroundColor: Colors.light.primaryContainer, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  statusText: { color: Colors.light.primary, fontSize: 12, fontWeight: '800' },
  sectionTitle: { color: Colors.light.textPrimary, fontSize: 18, fontWeight: '900' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  causeChip: { borderRadius: Radius.full, backgroundColor: Colors.light.surfaceContainer, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  causeText: { color: Colors.light.textSecondary, fontSize: 12, fontWeight: '800' },
  taskCard: { minHeight: 76, borderRadius: Radius.lg, backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.outlineVariant + '30', padding: Spacing.three, flexDirection: 'row', alignItems: 'center' },
  taskIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.light.primaryContainer, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.three },
  taskCopy: { flex: 1 },
  taskTitle: { color: Colors.light.textPrimary, fontSize: 15, fontWeight: '900', marginBottom: 4 },
  taskDetail: { color: Colors.light.textMuted, fontSize: 12, fontWeight: '700' },
  ruleCard: { borderRadius: Radius.lg, backgroundColor: Colors.light.surfaceContainerLow, padding: Spacing.three },
  ruleTitle: { color: Colors.light.textPrimary, fontSize: 15, fontWeight: '900', marginBottom: 4 },
  ruleDetail: { color: Colors.light.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  primaryButton: { height: 58, borderRadius: Radius.full, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.two },
  primaryText: { color: Colors.light.onPrimary, fontSize: 15, fontWeight: '900' },
});
