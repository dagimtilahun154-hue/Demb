import React, { useState } from 'react';
import { StyleSheet, Text, View, useColorScheme, Pressable, TextInput, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import NeomorphicCard from '@/components/NeomorphicCard';

type ProfileType = 'student' | 'employee' | 'entrepreneur' | 'parent' | 'other' | '';

export default function OnboardingScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';
  
  const setOnboarding = useAppStore(state => state.setOnboarding);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [profileType, setProfileType] = useState<ProfileType>('');
  const [biggestProblem, setBiggestProblem] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');

  // Moving background blobs
  const bounceAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 10000,
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
    outputRange: [-15, 15],
  });

  const handleNext = () => {
    if (step === 1 && !profileType) return;
    if (step === 2 && !biggestProblem) return;
    if (step === 3 && !dailyGoal) return;

    if (step < 3) {
      setStep(step + 1);
    } else {
      setOnboarding({
        name: name || 'Demb Cadet',
        profileType,
        biggestProblem,
        dailyGoal,
      });
      router.replace('/(tabs)');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  // Render Onboarding steps
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Who are we protecting today?</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
              Enter your officer name and choose your primary daily role.
            </Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Officer Alias</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? colors.surface : '#f2ebf6',
                    color: colors.textPrimary,
                    borderColor: isDark ? colors.outlineVariant : '#ffffff',
                    borderWidth: isDark ? 1 : 2,
                  },
                ]}
                placeholder="e.g. Sheriff Alex"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Role Grid */}
            <View style={styles.gridContainer}>
              {[
                { type: 'student' as ProfileType, label: 'Student', icon: 'school-outline' },
                { type: 'employee' as ProfileType, label: 'Employee', icon: 'briefcase-outline' },
                { type: 'entrepreneur' as ProfileType, label: 'Entrepreneur', icon: 'trending-up-outline' },
                { type: 'parent' as ProfileType, label: 'Parent', icon: 'people-outline' },
              ].map(item => {
                const isSelected = profileType === item.type;
                return (
                  <NeomorphicCard
                    key={item.type}
                    onPress={() => setProfileType(item.type)}
                    style={[
                      styles.roleCard,
                      isSelected && { borderColor: colors.primary, borderWidth: 2.5 },
                    ]}
                    bgColor={isSelected ? (isDark ? '#3d256d' : '#e8ddff') : undefined}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={28}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.roleText,
                        { color: isSelected ? colors.primary : colors.textPrimary },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </NeomorphicCard>
                );
              })}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>What drains your focus?</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
              Identify your biggest daily struggle to configure focus alarms.
            </Text>

            <View style={styles.optionsList}>
              {[
                'Too much screen time',
                'Burnout & high stress',
                'Poor sleep patterns',
                'Lack of daily motivation',
              ].map(option => {
                const isSelected = biggestProblem === option;
                return (
                  <NeomorphicCard
                    key={option}
                    onPress={() => setBiggestProblem(option)}
                    style={[
                      styles.optionCard,
                      isSelected && { borderColor: colors.primary, borderWidth: 2.5 }
                    ]}
                    bgColor={isSelected ? (isDark ? '#3d256d' : '#e8ddff') : undefined}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? colors.primary : colors.textPrimary },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {option}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    ) : (
                      <View style={[styles.unselectedIndicator, { borderColor: colors.outlineVariant }]} />
                    )}
                  </NeomorphicCard>
                );
              })}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Set daily recovery goal</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
              How much intentional offline recovery will you commit to each day?
            </Text>

            <View style={styles.goalsContainer}>
              {[
                { value: '15 mins', label: 'Balanced Guard', desc: 'Perfect for busy schedules. Quick recovery breaks.' },
                { value: '30 mins', label: 'Recovery Sheriff', desc: 'Recommended. Ideal balance of focus & relaxation.' },
                { value: '60 mins', label: 'Serenity Master', desc: 'Complete health balance. Maximum screen downtime.' },
              ].map(goal => {
                const isSelected = dailyGoal === goal.value;
                return (
                  <NeomorphicCard
                    key={goal.value}
                    onPress={() => setDailyGoal(goal.value)}
                    style={[
                      styles.goalCard,
                      isSelected && { borderColor: colors.primary, borderWidth: 2.5 },
                    ]}
                    bgColor={isSelected ? (isDark ? '#3d256d' : '#e8ddff') : undefined}
                  >
                    <View style={styles.goalHeader}>
                      <Text style={[styles.goalValue, { color: colors.primary }]}>{goal.value}</Text>
                      <Text style={[styles.goalLabel, { color: colors.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>{goal.label}</Text>
                    </View>
                    <Text style={[styles.goalDesc, { color: colors.textSecondary }]}>{goal.desc}</Text>
                  </NeomorphicCard>
                );
              })}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const isNextDisabled = 
    (step === 1 && !profileType) ||
    (step === 2 && !biggestProblem) ||
    (step === 3 && !dailyGoal);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background aurora */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View 
          style={[
            styles.blurBlob, 
            { 
              backgroundColor: isDark ? '#3d256d' : '#e8ddff',
              top: '20%', 
              right: '-10%',
              transform: [{ translateX: transX }, { translateY: transY }] 
            }
          ]} 
        />
      </View>

      <View style={[styles.contentContainer, { paddingTop: insets.top + Spacing.two, paddingBottom: insets.bottom + Spacing.four }]}>
        {/* Onboarding Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>

          <Image
            source={require('../../assets/images/logo.jpg')}
            style={styles.smallLogo}
            contentFit="cover"
          />

          {/* Progress Dots */}
          <View style={styles.dotsContainer}>
            {[1, 2, 3].map(i => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === step ? colors.primary : colors.outlineVariant,
                    width: i === step ? 18 : 8,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Onboarding Pages */}
        <View style={styles.content}>{renderStepContent()}</View>

        {/* Bottom Nav / Continue Button */}
        <View style={styles.footer}>
          <NeomorphicCard
            onPress={handleNext}
            style={[
              styles.continueButton,
              { backgroundColor: colors.primary },
              isNextDisabled && { opacity: 0.5 }
            ]}
            bgColor={colors.primary}
            disabled={isNextDisabled}
          >
            <Text style={[styles.continueButtonText, { color: colors.onPrimary }]}>
              {step === 3 ? "Let's Go!" : 'Continue'}
            </Text>
          </NeomorphicCard>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
  },
  blurBlob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.35,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallLogo: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: Spacing.one,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: Radius.full,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  stepContainer: {
    gap: Spacing.three,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 32,
  },
  stepSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.two,
  },
  inputContainer: {
    gap: Spacing.one,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    height: 56,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    ...Shadows.glow('#00000005'),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  roleCard: {
    width: '47%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  roleText: {
    fontSize: 15,
    fontWeight: '500',
  },
  optionsList: {
    gap: Spacing.two,
  },
  optionCard: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  unselectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  goalsContainer: {
    gap: Spacing.two,
  },
  goalCard: {
    gap: Spacing.one,
    padding: Spacing.three,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  goalLabel: {
    fontSize: 14,
  },
  goalDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    marginTop: Spacing.three,
    width: '100%',
  },
  continueButton: {
    height: 56,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    borderWidth: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
