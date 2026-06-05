import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppStore } from '@/store';
import type { RecoveryTask } from '@/types/burnout';

const durations = [3, 5, 10];

export default function SoundTherapyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const completeRecoveryTask = useAppStore(state => state.completeRecoveryTask);
  const [duration, setDuration] = React.useState(5);
  const [playing, setPlaying] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(5 * 60);

  React.useEffect(() => {
    setSecondsLeft(duration * 60);
  }, [duration]);

  React.useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setSecondsLeft(current => {
        if (current <= 1) {
          clearInterval(timer);
          setPlaying(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [playing]);

  const complete = () => {
    const task: RecoveryTask = {
      id: `sound_${duration}`,
      type: 'sound_therapy',
      title: `${duration} Minute Calm Sound Reset`,
      target: `${duration} minutes`,
      durationMinutes: duration,
      verification: 'timer',
      rewardPoints: duration === 10 ? 30 : duration === 5 ? 20 : 12,
      recoveryValue: duration === 10 ? 34 : duration === 5 ? 22 : 14,
    };
    completeRecoveryTask(task);
    router.replace('/(tabs)');
  };

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.three }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </Pressable>
          <Text style={styles.headerLabel}>Sound Therapy</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.soundOrb}>
            <Ionicons name={playing ? 'pause' : 'musical-notes-outline'} size={48} color={Colors.light.primary} />
          </View>
          <Text style={styles.title}>Calm Sound Reset</Text>
          <Text style={styles.subtitle}>Use this when you feel stressed or overloaded. This is stress regulation support.</Text>
          <Text style={styles.timerText}>{mins}:{secs}</Text>
          <Pressable style={styles.playButton} onPress={() => setPlaying(current => !current)}>
            <Ionicons name={playing ? 'pause' : 'play'} size={20} color={Colors.light.onPrimary} />
            <Text style={styles.playText}>{playing ? 'Pause Session' : 'Play Session'}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Duration</Text>
        <View style={styles.durationRow}>
          {durations.map(item => (
            <Pressable
              key={item}
              onPress={() => setDuration(item)}
              style={[styles.durationChip, duration === item && styles.durationSelected]}
            >
              <Text style={[styles.durationText, duration === item && styles.durationTextSelected]}>{item} min</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.primaryButton} onPress={complete}>
          <Text style={styles.primaryText}>Complete Session</Text>
        </Pressable>
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
  heroCard: { borderRadius: Radius.xl, backgroundColor: Colors.light.surface, padding: Spacing.four, alignItems: 'center', ...Shadows.card },
  soundOrb: { width: 132, height: 132, borderRadius: 66, backgroundColor: Colors.light.primaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
  title: { color: Colors.light.textPrimary, fontSize: 28, fontWeight: '900', marginBottom: Spacing.two },
  subtitle: { color: Colors.light.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.three },
  timerText: { color: Colors.light.textPrimary, fontSize: 48, fontWeight: '900', marginBottom: Spacing.three },
  playButton: { height: 52, borderRadius: Radius.full, backgroundColor: Colors.light.primary, paddingHorizontal: Spacing.four, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  playText: { color: Colors.light.onPrimary, fontSize: 14, fontWeight: '900' },
  sectionTitle: { color: Colors.light.textPrimary, fontSize: 18, fontWeight: '900' },
  durationRow: { flexDirection: 'row', gap: Spacing.two },
  durationChip: { flex: 1, height: 48, borderRadius: Radius.full, backgroundColor: Colors.light.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  durationSelected: { backgroundColor: Colors.light.primaryContainer },
  durationText: { color: Colors.light.textSecondary, fontSize: 13, fontWeight: '900' },
  durationTextSelected: { color: Colors.light.primary },
  primaryButton: { height: 58, borderRadius: Radius.full, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.two },
  primaryText: { color: Colors.light.onPrimary, fontSize: 15, fontWeight: '900' },
});
