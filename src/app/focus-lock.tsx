import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, Alert, Modal, useColorScheme, ScrollView, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';

export default function FocusLockScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const {
    restrictedApp,
    balance,
    missions,
    socialUsage,
    buddies,
    points,
    releaseFocusLock,
    startMission,
    isTimeTampered,
    user
  } = useAppStore();

  // Hardware Back Button Bypass Prevention
  useEffect(() => {
    const onBackPress = () => {
      // Returning true blocks the default back action
      return true;
    };
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, []);

  const [showQuiz, setShowQuiz] = useState(false);
  const [showBreathe, setShowBreathe] = useState(false);
  const [breatheSeconds, setBreatheSeconds] = useState(600); // 10 minutes breathing
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const isNightTime = () => {
    const hours = new Date().getHours();
    return hours >= 20 || hours < 6;
  };

  // Get social time for the active app
  const currentAppTime = restrictedApp === 'Instagram' ? '2h 14m' : '1h 40m';

  // Handle critical notifications to buddies
  useEffect(() => {
    if (balance.balanceScore < -50 || balance.recoveryDebt > 50) {
      // Critical usage! Send warning alert about notifying buddy
      Alert.alert(
        "Critical Usage Alert",
        `Your recovery score is critical. We've sent an urgent notification to your buddy Abel: "Dagim is scrolling excessively. Give them a task, call them, or meet them."`,
        [{ text: "Acknowledge" }]
      );
      
      // Post directly to online buddy feed
      const store = useAppStore.getState();
      const urgentItem = {
        id: `urgent_${Date.now()}`,
        name: 'Alert',
        event: 'lock' as const,
        detail: `Dagim is in critical screen usage! Abel is urged to call/meet them.`,
        timestamp: 'Just now'
      };
      useAppStore.setState({ buddyFeed: [urgentItem, ...store.buddyFeed] });
    }
  }, []);

  const handleStartRecovery = () => {
    if (isNightTime()) {
      // Night time breathing gap
      setShowBreathe(true);
    } else {
      // Daytime walking mission
      const walkMission = missions.find(m => m.id === 'm2') || missions[0];
      router.push({ pathname: '/mission', params: { missionId: walkMission.id } });
    }
  };

  const handleContinuePrevious = () => {
    // Awareness quiz to make them mindful of scrolling
    setShowQuiz(true);
    setCurrentQuestion(0);
    setQuizScore(0);
  };

  // 10 minutes breathing exercise runner
  useEffect(() => {
    let interval: any = null;
    if (showBreathe && breatheSeconds > 0) {
      interval = setInterval(() => {
        setBreatheSeconds(prev => prev - 1);
      }, 1000);
    } else if (breatheSeconds === 0) {
      setShowBreathe(false);
      Alert.alert("Recovery Complete", "Nice job! Focus restored.");
      releaseFocusLock();
    }
    return () => clearInterval(interval);
  }, [showBreathe, breatheSeconds]);

  const quizQuestions = [
    {
      q: "What is your main goal for today?",
      options: ["Finish project tasks", "Take more breaks", "Exercise/Walk", "Get enough sleep"]
    },
    {
      q: "How does your body feel right now?",
      options: ["Tense/Tired", "Energetic", "Relaxed", "Anxious"]
    },
    {
      q: "Why did you open this app just now?",
      options: ["Habit/Boredom", "Need to check something", "Escape work pressure", "Avoid sleep"]
    }
  ];

  const handleQuizAnswer = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowQuiz(false);
      Alert.alert(
        "Mindfulness Quiz Completed",
        "You've restored screen awareness. Use your screen time mindfully now!",
        [
          {
            text: "Unlock App",
            onPress: () => releaseFocusLock()
          }
        ]
      );
    }
  };

  const formatBreatheTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Render Clock Tampering Lockout View
  if (isTimeTampered) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={styles.topGradientGlow} />
        <Ionicons name="warning" size={80} color="#EF4444" style={{ marginBottom: 24 }} />
        <Text style={[styles.shieldTitle, { textAlign: 'center', color: '#EF4444' }]}>Tamper Lockout Activated</Text>
        <Text style={[styles.shieldDescription, { textAlign: 'center', marginBottom: 20 }]}>
          Officer Demb detected manual manipulation of the system clock. Bypassing wellness limits is not permitted.
        </Text>
        <Text style={[styles.shieldSubDescription, { textAlign: 'center', color: '#EF4444', fontWeight: 'bold' }]}>
          Incident logged and reported to your buddy Abel.
        </Text>
        <Pressable 
          style={[styles.primaryBtn, { backgroundColor: '#EF4444', marginTop: 32 }]} 
          onPress={() => {
            Alert.alert("Clock Sync Required", "Align your system clock with real network time to verify and restore access.");
          }}
        >
          <Text style={styles.primaryBtnText}>Verify Clock Sync</Text>
        </Pressable>
      </View>
    );
  }

  // 2. Render Midnight Sleep Lockout View
  if (restrictedApp === 'Sleep Lockout') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <View style={styles.topGradientGlow} />
        <View style={styles.bottomGradientGlow} />
        
        <View style={[styles.plantContainer, { backgroundColor: 'rgba(108, 99, 255, 0.08)', borderColor: 'rgba(108, 99, 255, 0.2)', width: 140, height: 140, borderRadius: 70, marginBottom: 28 }]}>
          <Ionicons name="moon" size={72} color="#6C63FF" />
        </View>

        <Text style={[styles.shieldTitle, { fontSize: 26, marginBottom: 16 }]}>Midnight Recovery Lock</Text>
        <Text style={[styles.shieldDescription, { fontSize: 16, lineHeight: 24, marginBottom: 24 }]}>
          It is near midnight. Your recovery plan restricts all social media and notifications between 11:00 PM and 6:00 AM to secure your rest.
        </Text>
        
        <View style={[styles.timeBadge, { backgroundColor: 'rgba(108, 99, 255, 0.15)', borderColor: 'rgba(108, 99, 255, 0.25)' }]}>
          <Ionicons name="lock-closed-outline" size={16} color="#FFE4E1" style={{ marginRight: 6 }} />
          <Text style={styles.timeBadgeText}>Locked Until 6:00 AM</Text>
        </View>

        <Text style={[styles.shieldSubDescription, { marginTop: 24, fontStyle: 'italic' }]}>
          "Rest is the foundation of digital balance. Let's recharge."
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Glows */}
      <View style={styles.topGradientGlow} />
      <View style={styles.bottomGradientGlow} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Plant Circle Illustration */}
        <View style={styles.puckWrapper}>
          <View style={styles.outerOrbit}>
            <View style={styles.orbitDot1} />
            <View style={styles.orbitDot2} />
            <View style={styles.plantContainer}>
              <Ionicons name="leaf" size={62} color="#78CA2A" />
            </View>
          </View>
        </View>

        {/* Title Block */}
        <Text style={styles.shieldTitle}>Demb Shield</Text>
        <Text style={styles.shieldDescription}>
          Pause first. Take a quick recovery break.
        </Text>
        <Text style={styles.shieldSubDescription}>
          Protect your time and focus.
        </Text>

        {/* Time Limit Badge */}
        <View style={styles.timeBadge}>
          <Ionicons name="time-outline" size={16} color="#FFE4E1" style={{ marginRight: 6 }} />
          <Text style={styles.timeBadgeText}>{currentAppTime} On {restrictedApp || 'Social Media'} Today</Text>
        </View>

        {/* Buddy Streak Banner */}
        <View style={styles.buddyStreakRow}>
          <View style={styles.buddyIcon}>
            <Text style={styles.buddyIconText}>A</Text>
          </View>
          <Text style={styles.buddyStreakText}>
            👥 Abel is protecting today's streak with you.{"\n"}
            <Text style={styles.boldText}>Shared Streak: 12 Days</Text>
          </Text>
        </View>

        {/* Recovery Challenge Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.challengeIconBg}>
              <Ionicons name="leaf-outline" size={18} color="#6C63FF" />
            </View>
            <Text style={styles.cardHeaderTitle}>Recovery Challenge</Text>
          </View>
          <Text style={styles.cardBodyText}>
            Complete a reset task to unlock.
          </Text>
          
          <View style={styles.iconSelectionRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="walk" size={20} color="#6C63FF" />
            </View>
            <View style={styles.iconCircle}>
              <Ionicons name="body" size={20} color="#6C63FF" />
            </View>
            <View style={styles.iconCircle}>
              <Ionicons name="water-outline" size={20} color="#6C63FF" />
            </View>
          </View>

          <Pressable style={styles.primaryBtn} onPress={handleStartRecovery}>
            <Text style={styles.primaryBtnText}>Start Recovery</Text>
          </Pressable>
        </View>

        {/* Return to What Matters Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.restoreIconBg}>
              <Ionicons name="time-outline" size={18} color="#6C63FF" />
            </View>
            <Text style={styles.cardHeaderTitle}>Return To What Matters</Text>
          </View>
          <Text style={styles.cardBodyText}>
            Return to offline balance.
          </Text>

          <View style={styles.iconSelectionRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="book-outline" size={20} color="#6C63FF" />
            </View>
            <View style={styles.iconCircle}>
              <Ionicons name="desktop-outline" size={20} color="#6C63FF" />
            </View>
            <View style={styles.iconCircle}>
              <Ionicons name="bookmark-outline" size={20} color="#6C63FF" />
            </View>
          </View>

          <Pressable style={styles.secondaryBtn} onPress={handleContinuePrevious}>
            <Text style={styles.secondaryBtnText}>Continue Previous Activity</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={styles.footerNote}>
          Demb helps you return to life.
        </Text>
      </ScrollView>

      {/* Breathing Task Overlay Modal */}
      <Modal visible={showBreathe} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <Ionicons name="hourglass-outline" size={64} color="#6C63FF" />
            <Text style={styles.modalTitle}>Breathing Exercise</Text>
            <Text style={styles.modalSubtitle}>Relax. Inhale and exhale deeply...</Text>
            <Text style={styles.breatheTimer}>{formatBreatheTime(breatheSeconds)}</Text>
            <Pressable style={styles.skipBtn} onPress={() => { setShowBreathe(false); releaseFocusLock(); }}>
              <Text style={styles.skipBtnText}>Skip Recovery</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Mindful Quiz Overlay Modal */}
      <Modal visible={showQuiz} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <Ionicons name="bulb-outline" size={48} color="#6C63FF" style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Mindfulness Check</Text>
            <Text style={styles.quizQ}>{quizQuestions[currentQuestion].q}</Text>
            
            <View style={styles.quizOptions}>
              {quizQuestions[currentQuestion].options.map((opt, i) => (
                <Pressable key={i} style={styles.quizOptionBtn} onPress={handleQuizAnswer}>
                  <Text style={styles.quizOptionText}>{opt}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A080D', // dark premium styling matching the design mockup image
  },
  topGradientGlow: {
    position: 'absolute',
    top: -150,
    width: '100%',
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
  },
  bottomGradientGlow: {
    position: 'absolute',
    bottom: -150,
    width: '100%',
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 60,
    alignItems: 'center',
  },
  puckWrapper: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  outerOrbit: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
    borderColor: '#7a768f',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  orbitDot1: {
    position: 'absolute',
    top: 15,
    left: 30,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a5a2b0',
  },
  orbitDot2: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a5a2b0',
  },
  plantContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(120, 202, 42, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(120, 202, 42, 0.2)',
  },
  shieldTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  shieldDescription: {
    color: '#E6E5EA',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  shieldSubDescription: {
    color: '#8A869C',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 18,
  },
  timeBadgeText: {
    color: '#E6E5EA',
    fontSize: 14,
    fontWeight: '600',
  },
  buddyStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    width: '100%',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  buddyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE4C4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  buddyIconText: {
    color: '#2E221E',
    fontWeight: '800',
    fontSize: 14,
  },
  buddyStreakText: {
    color: '#D1CFDB',
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: '#FFF',
  },
  card: {
    backgroundColor: '#F5F4F7', // soft grey/white container matching mockup design
    borderRadius: 28,
    width: '100%',
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E6E2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  restoreIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E6E2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardHeaderTitle: {
    color: '#1F1E24',
    fontSize: 18,
    fontWeight: '700',
  },
  cardBodyText: {
    color: '#555263',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  iconSelectionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ECEAEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtn: {
    height: 52,
    width: '100%',
    backgroundColor: '#605873', // deep purple CTA style
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 52,
    width: '100%',
    backgroundColor: '#ECEAEF',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#D0CDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#403B4C',
    fontSize: 14,
    fontWeight: '700',
  },
  footerNote: {
    color: '#767385',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(10,8,13,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBody: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 30,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F1E24',
    marginTop: 12,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6F6C7D',
    textAlign: 'center',
    marginBottom: 20,
  },
  breatheTimer: {
    fontSize: 48,
    fontWeight: '800',
    color: '#6C63FF',
    marginBottom: 30,
  },
  skipBtn: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#C0BDC8',
    justifyContent: 'center',
  },
  skipBtnText: {
    color: '#6C63FF',
    fontWeight: '700',
    fontSize: 14,
  },
  quizQ: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1E24',
    textAlign: 'center',
    marginVertical: 18,
  },
  quizOptions: {
    width: '100%',
    gap: 10,
  },
  quizOptionBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F4F7',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E6E5EA',
  },
  quizOptionText: {
    color: '#403B4C',
    fontSize: 14,
    fontWeight: '600',
  },
});
