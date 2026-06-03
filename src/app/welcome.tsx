import React from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const float = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [float]);

  const characterY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const handleNext = () => {
    router.push('/onboarding');
  };

  return (
    <View style={styles.stage}>
      <View style={styles.topGlow} pointerEvents="none" />
      <View style={styles.bottomGlow} pointerEvents="none" />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 18, 30),
            paddingBottom: Math.max(insets.bottom + 18, 28),
          },
        ]}
      >
        <View style={styles.screenContent}>
          <View style={styles.header}>
            <View style={styles.brandBlock}>
              <View style={styles.brandIcon}>
                <Ionicons name="leaf-outline" size={17} color="#6E6388" />
              </View>
              <Text style={styles.brandText}>Demb</Text>
            </View>
            <View style={styles.helpIcon}>
              <Ionicons name="help" size={17} color="#343239" />
            </View>
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.title}>Welcome to Demb</Text>
            <Text style={styles.subtitle}>Protect your time, energy, and focus.</Text>
          </View>

          <View style={styles.characterWrap}>
            <View style={styles.characterAura} />
            <View style={styles.characterShadow} />
            <Animated.View style={[styles.characterMotion, { transform: [{ translateY: characterY }] }]}>
              <Image
                source={require('../../assets/images/demb-character.png')}
                style={styles.character}
                contentFit="contain"
              />
            </Animated.View>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.googleButton} onPress={handleNext}>
            <Text style={styles.googleWord}>GOOGLE</Text>
            <Text style={styles.googleText}>Continue with{'\n'}Google</Text>
          </Pressable>

          <Pressable style={styles.phoneButton} onPress={handleNext}>
            <Ionicons name="phone-portrait-outline" size={21} color="#252329" />
            <Text style={styles.phoneText}>Continue with Phone Number</Text>
          </Pressable>

          <Pressable onPress={handleNext} style={styles.accountLink}>
            <Text style={styles.accountText}>I already have an account</Text>
          </Pressable>

          <View style={styles.privacyRow}>
            <Ionicons name="lock-closed" size={13} color="#77757F" />
            <Text style={styles.privacyText}>Your journey stays private.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: '#F8F7FA',
    overflow: 'hidden',
  },
  scrollContent: {
    minHeight: '100%',
    alignItems: 'center',
  },
  topGlow: {
    position: 'absolute',
    top: -190,
    right: -130,
    width: 420,
    height: 540,
    borderRadius: 210,
    backgroundColor: 'rgba(234, 226, 255, 0.92)',
    shadowColor: '#8D6DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 55,
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -260,
    left: -170,
    width: 320,
    height: 440,
    borderRadius: 160,
    backgroundColor: 'rgba(239, 236, 249, 0.95)',
    shadowColor: '#9C82FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 44,
  },
  screenContent: {
    width: 390,
    maxWidth: '100%',
    paddingHorizontal: 24,
  },
  header: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 46,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E9E2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandText: {
    color: '#222127',
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '800',
  },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECEAEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBlock: {
    marginBottom: 18,
  },
  title: {
    color: '#222127',
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#686174',
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
  },
  characterWrap: {
    height: 310,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  characterAura: {
    position: 'absolute',
    width: 286,
    height: 232,
    borderRadius: 44,
    backgroundColor: '#EEE7FF',
    shadowColor: '#8D6DFF',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 34,
  },
  characterShadow: {
    position: 'absolute',
    bottom: 26,
    width: 214,
    height: 28,
    borderRadius: 107,
    backgroundColor: 'rgba(54, 42, 82, 0.16)',
    transform: [{ scaleX: 1.05 }],
  },
  characterMotion: {
    width: '100%',
    height: 300,
  },
  character: {
    width: '100%',
    height: '100%',
  },
  primaryButton: {
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8DFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#C8B7FF',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  primaryButtonText: {
    color: '#242229',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E4E2E8',
  },
  dividerText: {
    color: '#77727E',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '500',
    marginHorizontal: 16,
  },
  googleButton: {
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#E3E1E6',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 54,
    marginBottom: 12,
  },
  googleWord: {
    color: '#232126',
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '400',
    letterSpacing: 2.2,
  },
  googleText: {
    color: '#232126',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  phoneButton: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E3E1E6',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  phoneText: {
    color: '#232126',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '500',
    marginLeft: 10,
  },
  accountLink: {
    alignSelf: 'center',
    marginBottom: 28,
  },
  accountText: {
    color: '#686174',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyText: {
    color: '#74717B',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    marginLeft: 5,
  },
});
