import React from 'react';
import { StyleSheet, Text, View, useColorScheme, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import NeomorphicCard from '@/components/NeomorphicCard';

export default function WelcomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';

  // Animation values for moving background blobs
  const bounceAnim1 = React.useRef(new Animated.Value(0)).current;
  const bounceAnim2 = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(bounceAnim1, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim1, {
            toValue: 0,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(bounceAnim2, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim2, {
            toValue: 0,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const transX1 = bounceAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 40],
  });
  const transY1 = bounceAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 20],
  });

  const transX2 = bounceAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [40, -40],
  });
  const transY2 = bounceAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [20, -20],
  });

  const handleNext = () => {
    router.push('/onboarding');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Background Blobs */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View 
          style={[
            styles.blurBlob, 
            { 
              backgroundColor: isDark ? '#3d256d' : '#e8ddff',
              top: '15%', 
              left: '10%',
              transform: [{ translateX: transX1 }, { translateY: transY1 }] 
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.blurBlob, 
            { 
              backgroundColor: isDark ? '#1a4f3b' : '#a6f2cf',
              bottom: '25%', 
              right: '10%',
              transform: [{ translateX: transX2 }, { translateY: transY2 }] 
            }
          ]} 
        />
      </View>

      <View style={[styles.contentContainer, { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.four }]}>
        {/* Upper Logo Section */}
        <View style={styles.logoSection}>
          <NeomorphicCard style={styles.logoCard} glowColor={colors.primaryLight}>
            <Image
              source={require('../../assets/images/logo.jpg')}
              style={styles.logo}
              contentFit="cover"
            />
          </NeomorphicCard>
          
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Welcome to</Text>
          <Text style={[styles.appNameText, { color: colors.textPrimary }]}>Demb</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            Your personal equilibrium guardian. Reclaim focus, balance your energy.
          </Text>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.actionsSection}>
          <NeomorphicCard 
            onPress={handleNext}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            bgColor={colors.primary}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Sign In</Text>
          </NeomorphicCard>

          <NeomorphicCard 
            onPress={handleNext} 
            style={styles.secondaryButton}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Create Account</Text>
          </NeomorphicCard>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant }]} />
          </View>

          {/* Third Party Login (Tactile Outline Buttons) */}
          <NeomorphicCard 
            onPress={handleNext} 
            style={styles.socialButton}
          >
            <Ionicons name="logo-apple" size={20} color={colors.textPrimary} style={styles.socialIcon} />
            <Text style={[styles.socialButtonText, { color: colors.textPrimary }]}>Continue with Apple</Text>
          </NeomorphicCard>

          <NeomorphicCard 
            onPress={handleNext} 
            style={styles.socialButton}
          >
            <Ionicons name="logo-google" size={20} color={colors.textPrimary} style={styles.socialIcon} />
            <Text style={[styles.socialButtonText, { color: colors.textPrimary }]}>Continue with Google</Text>
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
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.45,
  },
  logoSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.one,
  },
  logoCard: {
    padding: Spacing.one,
    borderRadius: Radius.xxl,
    marginBottom: Spacing.two,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: Radius.xl,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: -0.5,
  },
  appNameText: {
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
    lineHeight: 20,
  },
  actionsSection: {
    gap: Spacing.two,
    width: '100%',
  },
  primaryButton: {
    height: 56,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    borderWidth: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 56,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  socialButton: {
    height: 54,
    borderRadius: Radius.full,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  socialIcon: {
    marginRight: Spacing.two,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.one,
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.15,
  },
  dividerText: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
