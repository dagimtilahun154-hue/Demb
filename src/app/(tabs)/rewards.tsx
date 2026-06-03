import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabInset } from '@/constants/theme';
import { useAppStore } from '@/store';

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const points = useAppStore(state => state.points);
  const streakCount = useAppStore(state => state.streakCount);
  const completedMissions = useAppStore(state => state.completedMissions);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 22, 38),
            paddingBottom: BottomTabInset + 34,
          },
        ]}
      >
        <Text style={styles.title}>Rewards</Text>
        <Text style={styles.subtitle}>Small wins, stacked daily.</Text>

        <View style={styles.heroCard}>
          <Ionicons name="gift-outline" size={42} color="#6C63FF" />
          <Text style={styles.points}>{points}</Text>
          <Text style={styles.label}>Balance Points</Text>
        </View>

        <View style={styles.grid}>
          <RewardTile icon="flame-outline" value={`${streakCount} Days`} label="Streak" />
          <RewardTile icon="checkmark-circle-outline" value={`${completedMissions.length}`} label="Missions" />
          <RewardTile icon="sparkles-outline" value="3" label="Badges" />
          <RewardTile icon="people-outline" value="12" label="Buddy Wins" />
        </View>
      </ScrollView>
    </View>
  );
}

function RewardTile({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.tile}>
      <Ionicons name={icon as any} size={24} color="#746D87" />
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FBF9FA',
  },
  content: {
    paddingHorizontal: 28,
  },
  title: {
    color: '#202025',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
  },
  subtitle: {
    color: '#746F7E',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 24,
  },
  heroCard: {
    minHeight: 190,
    borderRadius: 30,
    backgroundColor: '#E8DFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  points: {
    color: '#202025',
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '900',
    marginTop: 10,
  },
  label: {
    color: '#746D87',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  tile: {
    width: '48%',
    minHeight: 124,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE9EF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D8D3DE',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  tileValue: {
    color: '#202025',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 8,
  },
  tileLabel: {
    color: '#8B8695',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
