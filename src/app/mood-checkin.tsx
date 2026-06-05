import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppStore } from '@/store';

const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function MoodCheckInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const submitMoodCheckIn = useAppStore(state => state.submitMoodCheckIn);
  const [moodScore, setMoodScore] = React.useState(6);
  const [energyScore, setEnergyScore] = React.useState(5);
  const [stressScore, setStressScore] = React.useState(7);
  const [focusScore, setFocusScore] = React.useState(5);
  const [overwhelmed, setOverwhelmed] = React.useState(false);
  const [note, setNote] = React.useState('');

  const submit = () => {
    submitMoodCheckIn({ moodScore, energyScore, stressScore, focusScore, overwhelmed, note });
    router.back();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.three }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="close" size={22} color={Colors.light.textPrimary} />
          </Pressable>
          <Text style={styles.headerLabel}>Mood Check-In</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.title}>How are you feeling now?</Text>
          <Text style={styles.subtitle}>
            A quick check-in helps Demb understand your wellness pattern with more care.
          </Text>
        </View>

        <ScorePicker label="Mood level" value={moodScore} onChange={setMoodScore} />
        <ScorePicker label="Energy level" value={energyScore} onChange={setEnergyScore} />
        <ScorePicker label="Stress level" value={stressScore} onChange={setStressScore} reverse />
        <ScorePicker label="Focus level" value={focusScore} onChange={setFocusScore} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Feeling overwhelmed?</Text>
          <View style={styles.binaryRow}>
            <Pressable
              onPress={() => setOverwhelmed(false)}
              style={[styles.choiceButton, !overwhelmed && styles.choiceSelected]}
            >
              <Text style={[styles.choiceText, !overwhelmed && styles.choiceTextSelected]}>Not right now</Text>
            </Pressable>
            <Pressable
              onPress={() => setOverwhelmed(true)}
              style={[styles.choiceButton, overwhelmed && styles.choiceSelected]}
            >
              <Text style={[styles.choiceText, overwhelmed && styles.choiceTextSelected]}>A little</Text>
            </Pressable>
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note"
            placeholderTextColor={Colors.light.textMuted}
            style={styles.input}
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={submit}>
          <Text style={styles.primaryText}>Save Check-In</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ScorePicker({
  label,
  value,
  onChange,
  reverse,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  reverse?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{label}</Text>
      <View style={styles.scoreRow}>
        {scores.map(score => {
          const selected = value === score;
          return (
            <Pressable key={score} onPress={() => onChange(score)} style={[styles.scoreChip, selected && styles.scoreSelected]}>
              <Text style={[styles.scoreText, selected && styles.scoreTextSelected]}>{score}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.helperText}>{reverse ? 'Higher means more pressure.' : 'Higher means more steady.'}</Text>
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
  subtitle: { color: Colors.light.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  card: { borderRadius: Radius.xl, backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.outlineVariant + '25', padding: Spacing.three },
  cardTitle: { color: Colors.light.textPrimary, fontSize: 16, fontWeight: '900', marginBottom: Spacing.two },
  scoreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  scoreChip: { width: 31, height: 31, borderRadius: 16, backgroundColor: Colors.light.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  scoreSelected: { backgroundColor: Colors.light.primary },
  scoreText: { color: Colors.light.textSecondary, fontSize: 12, fontWeight: '800' },
  scoreTextSelected: { color: Colors.light.onPrimary },
  helperText: { color: Colors.light.textMuted, fontSize: 11, fontWeight: '700', marginTop: Spacing.two },
  binaryRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  choiceButton: { flex: 1, height: 44, borderRadius: Radius.full, backgroundColor: Colors.light.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  choiceSelected: { backgroundColor: Colors.light.primaryContainer },
  choiceText: { color: Colors.light.textSecondary, fontSize: 13, fontWeight: '800' },
  choiceTextSelected: { color: Colors.light.primary },
  input: { minHeight: 54, borderRadius: Radius.md, backgroundColor: Colors.light.surfaceContainerLow, paddingHorizontal: Spacing.three, color: Colors.light.textPrimary, fontSize: 14 },
  primaryButton: { height: 58, borderRadius: Radius.full, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: Colors.light.onPrimary, fontSize: 15, fontWeight: '900' },
});
