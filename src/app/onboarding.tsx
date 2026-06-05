import React, { useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';

type Challenge = 'scroll' | 'burnout' | 'focus' | 'sleep' | 'drained' | 'accountability';
type Goal = 'balance' | 'focus' | 'sleep' | 'movement' | 'habits' | 'wellbeing' | 'friends' | '';

const challenges: Array<{ id: Challenge; label: string; icon: string; color: string }> = [
  { id: 'scroll', label: 'I scroll too much', icon: 'phone-portrait-outline', color: '#6C63FF' },
  { id: 'burnout', label: 'Burned out', icon: 'cloudy-night-outline', color: '#F59E0B' },
  { id: 'focus', label: 'Lose focus', icon: 'locate-outline', color: '#EF4444' },
  { id: 'sleep', label: 'Sleep late', icon: 'moon-outline', color: '#F6C344' },
  { id: 'drained', label: 'Drained', icon: 'flash-outline', color: '#F59E0B' },
  { id: 'accountability', label: 'Need support', icon: 'people-outline', color: '#22C55E' },
];

const goals: Array<{ id: Goal; title: string; subtitle: string; icon: string }> = [
  { id: 'balance', title: 'Better Digital Balance', subtitle: 'Regain control of your time.', icon: 'git-branch-outline' },
  { id: 'focus', title: 'Better Focus', subtitle: 'Sharpen your attention.', icon: 'locate-outline' },
  { id: 'sleep', title: 'Better Sleep', subtitle: 'Wake up refreshed.', icon: 'cloudy-night-outline' },
  { id: 'movement', title: 'More Movement', subtitle: 'Add gentle activity.', icon: 'walk-outline' },
  { id: 'habits', title: 'Healthier Daily Habits', subtitle: 'Build actions that stick.', icon: 'water-outline' },
  { id: 'wellbeing', title: 'Better Emotional Wellbeing', subtitle: 'Feel calmer daily.', icon: 'happy-outline' },
  { id: 'friends', title: 'Accountability With Friends', subtitle: 'Stay motivated together.', icon: 'people-outline' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setOnboarding = useAppStore(state => state.setOnboarding);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedChallenges, setSelectedChallenges] = useState<Challenge[]>([]);
  const [goal, setGoal] = useState<Goal>('balance');
  const glow = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 4200,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 4200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glow]);

  const glowY = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });

  const isDisabled = step === 1 ? selectedChallenges.length === 0 : !goal;

  const toggleChallenge = (id: Challenge) => {
    setSelectedChallenges(current =>
      current.includes(id) ? current.filter(item => item !== id) : [...current, id]
    );
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      return;
    }
    router.back();
  };

  const handleNext = () => {
    if (step === 1) {
      if (selectedChallenges.length === 0) return;
      setStep(2);
      return;
    }

    if (!goal) return;
    
    let intensity: 'low' | 'medium' | 'high' = 'medium';
    if (selectedChallenges.includes('scroll') && selectedChallenges.includes('sleep')) {
      intensity = 'high';
    } else if (selectedChallenges.length >= 3) {
      intensity = 'high';
    } else if (selectedChallenges.length === 1) {
      intensity = 'low';
    }

    setOnboarding({
      name: 'Demb Cadet',
      profileType: 'other',
      biggestProblem: selectedChallenges.join(', '),
      dailyGoal: goal,
      recoveryIntensity: intensity,
    });
    router.replace('/observation');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backgroundGlow, { transform: [{ translateY: glowY }] }]} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top + 18, 34) }]}>
        <Pressable onPress={handleBack} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color="#25232C" />
        </Pressable>
        <Text style={styles.logoText}>Demb</Text>
        <Text style={styles.stepText}>Step {step} of 2</Text>
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          step === 1 ? styles.stepOneScroll : styles.stepTwoScroll,
        ]}
      >
        <View style={styles.intro}>
          <Text style={styles.title}>
            {step === 1 ? 'What would you like help with?' : 'What would you like to improve?'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1 ? 'Pick one or more challenges.' : 'Choose your recovery goal.'}
          </Text>
        </View>

        {step === 1 ? (
          <View style={styles.challengeGrid}>
            {challenges.map(item => {
              const isSelected = selectedChallenges.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleChallenge(item.id)}
                  style={[styles.challengeCard, isSelected && styles.challengeCardSelected]}
                >
                  <View style={[styles.challengeIcon, isSelected && styles.iconSelected]}>
                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                  </View>
                  <Text style={styles.challengeText}>{item.label}</Text>
                  <View style={[styles.checkBubble, isSelected && styles.checkBubbleSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.goalList}>
            {goals.map(item => {
              const isSelected = goal === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setGoal(item.id)}
                  style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                >
                  <View style={[styles.goalIcon, isSelected && styles.goalIconSelected]}>
                    <Ionicons name={item.icon as any} size={26} color="#222127" />
                  </View>
                  <View style={styles.goalCopy}>
                    <Text style={styles.goalTitle}>{item.title}</Text>
                    <Text style={styles.goalSubtitle}>{item.subtitle}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
        {step === 1 && (
          <View style={styles.progressRow}>
            <View style={[styles.progressPill, styles.progressActive]} />
            <View style={styles.progressPill} />
          </View>
        )}
        <Pressable
          disabled={isDisabled}
          onPress={handleNext}
          style={[styles.continueButton, isDisabled && styles.continueDisabled]}
        >
          <Text style={styles.continueText}>{step === 1 ? 'Continue' : 'Create My Recovery Plan'}</Text>
        </Pressable>
        {step === 2 && <Text style={styles.footerHint}>You can update your goals anytime.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9FA',
    overflow: 'hidden',
  },
  backgroundGlow: {
    position: 'absolute',
    top: 126,
    right: -150,
    width: 290,
    height: 430,
    borderRadius: 145,
    backgroundColor: 'rgba(233, 224, 255, 0.58)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 42,
  },
  header: {
    minHeight: 96,
    paddingHorizontal: 24,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: 50,
    height: 44,
    justifyContent: 'center',
  },
  logoText: {
    flex: 1,
    color: '#656074',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  stepText: {
    width: 92,
    color: '#656074',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'right',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  stepOneScroll: {
    paddingTop: 18,
    paddingBottom: 16,
  },
  stepTwoScroll: {
    paddingTop: 18,
    paddingBottom: 18,
  },
  intro: {
    marginBottom: 24,
  },
  title: {
    color: '#202025',
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    color: '#777181',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '500',
  },
  challengeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  challengeCard: {
    width: '48%',
    minHeight: 132,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE9EF',
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#D8D3DE',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
  },
  challengeCardSelected: {
    backgroundColor: '#EAE2FF',
    borderColor: '#D8CCFF',
    shadowColor: '#BCA9FF',
    shadowOpacity: 0.26,
  },
  challengeIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5F3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSelected: {
    backgroundColor: '#F6F2FF',
  },
  challengeText: {
    color: '#252329',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    paddingRight: 8,
  },
  checkBubble: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E1DDE7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBubbleSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#6C63FF',
  },
  goalList: {
    gap: 14,
  },
  goalCard: {
    minHeight: 112,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE9EF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    shadowColor: '#D8D3DE',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
  },
  goalCardSelected: {
    backgroundColor: '#E8E0FF',
    borderColor: '#E3D8FF',
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  goalIconSelected: {
    backgroundColor: '#EFE9FF',
  },
  goalCopy: {
    flex: 1,
  },
  goalTitle: {
    color: '#202025',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    marginBottom: 8,
  },
  goalSubtitle: {
    color: '#57515F',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: '#FBF9FA',
  },
  progressRow: {
    height: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  progressPill: {
    width: 31,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DFDDE2',
  },
  progressActive: {
    backgroundColor: '#655F78',
  },
  continueButton: {
    height: 64,
    borderRadius: 28,
    backgroundColor: '#E8DFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9B7FF',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 26,
  },
  continueDisabled: {
    opacity: 0.48,
  },
  continueText: {
    color: '#4B455F',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
  },
  footerHint: {
    color: '#57515F',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
  },
});
