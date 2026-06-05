import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppStore } from '@/store';
import AnimatedPressable from '@/components/AnimatedPressable';

export default function RecoveryModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { burnoutRisk, recoveryPlan, completeRecoveryTask } = useAppStore();
  const recommendedTask = recoveryPlan?.recoveryTasks[0];
  const progress = Math.max(0.1, burnoutRisk.recoveryScore / 100);

  const handleTask = () => {
    if (recommendedTask?.type === 'sound_therapy') {
      router.push('/sound-therapy');
      return;
    }
    if (recommendedTask) {
      completeRecoveryTask(recommendedTask);
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.three }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </Pressable>
          <Text style={styles.headerLabel}>Recovery Mode</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="leaf-outline" size={38} color={Colors.light.primary} />
          </View>
          <Text style={styles.title}>Recovery Mode Active</Text>
          <Text style={styles.subtitle}>A short reset can steady your score.</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{burnoutRisk.recoveryScore}% toward a stable state</Text>
        </View>

        <Text style={styles.sectionTitle}>Causes</Text>
        <View style={styles.chipRow}>
          {burnoutRisk.causes.slice(0, 4).map(cause => (
            <View key={cause} style={styles.chip}>
              <Text style={styles.chipText}>{cause}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Reset</Text>
        {['Pause', 'Complete task', 'Get support'].map((step, index) => (
          <View key={step} style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}

        <View style={styles.taskCard}>
          <Text style={styles.taskLabel}>Recommended now</Text>
          <Text style={styles.taskTitle}>{recommendedTask?.title ?? 'Three Minute Breathing Gap'}</Text>
          <Text style={styles.taskDetail}>
            {recommendedTask?.target ?? '3 minutes'} · stress regulation and recovery support
          </Text>
          <AnimatedPressable lifted style={styles.primaryButton} onPress={handleTask}>
            <Text style={styles.primaryText}>Start Recommended Task</Text>
          </AnimatedPressable>
        </View>

        <View style={styles.softRow}>
          <AnimatedPressable lifted style={styles.softButton} onPress={() => router.push('/sound-therapy')}>
            <Ionicons name="musical-notes-outline" size={18} color={Colors.light.primary} />
            <Text style={styles.softButtonText}>Sound Therapy</Text>
          </AnimatedPressable>
        </View>
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
  heroIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.light.primaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
  title: { color: Colors.light.textPrimary, fontSize: 29, lineHeight: 35, fontWeight: '900', marginBottom: Spacing.two },
  subtitle: { color: Colors.light.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: '600', marginBottom: Spacing.three },
  progressTrack: { height: 10, borderRadius: Radius.full, backgroundColor: Colors.light.surfaceContainer, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.full, backgroundColor: Colors.light.secondary },
  progressText: { color: Colors.light.textMuted, fontSize: 12, fontWeight: '800', marginTop: Spacing.two },
  sectionTitle: { color: Colors.light.textPrimary, fontSize: 18, fontWeight: '900' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderRadius: Radius.full, backgroundColor: Colors.light.surfaceContainer, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  chipText: { color: Colors.light.textSecondary, fontSize: 12, fontWeight: '800' },
  stepCard: { minHeight: 62, borderRadius: Radius.lg, backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.outlineVariant + '30', flexDirection: 'row', alignItems: 'center', padding: Spacing.three },
  stepNumber: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.light.primaryContainer, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.three },
  stepNumberText: { color: Colors.light.primary, fontWeight: '900' },
  stepText: { flex: 1, color: Colors.light.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  taskCard: { borderRadius: Radius.xl, backgroundColor: Colors.light.surfaceContainerLow, padding: Spacing.four },
  taskLabel: { color: Colors.light.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: Spacing.two },
  taskTitle: { color: Colors.light.textPrimary, fontSize: 21, fontWeight: '900', marginBottom: Spacing.one },
  taskDetail: { color: Colors.light.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: '600', marginBottom: Spacing.three },
  primaryButton: { height: 54, borderRadius: Radius.full, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: Colors.light.onPrimary, fontSize: 14, fontWeight: '900' },
  softRow: { flexDirection: 'row', gap: Spacing.two },
  softButton: { flex: 1, height: 52, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.light.outlineVariant, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one },
  softButtonText: { color: Colors.light.primary, fontSize: 13, fontWeight: '900' },
});
