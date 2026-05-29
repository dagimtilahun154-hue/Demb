import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, useColorScheme, Pressable, FlatList, Modal, TextInput, ScrollView, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadows, BottomTabInset } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import NeomorphicCard from '@/components/NeomorphicCard';

export default function ActivityLogScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';

  const {
    energyLogs,
    addEnergyLog,
    deleteEnergyLog,
    priorities,
    setPriorities,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'spent' | 'recovered'>('spent');
  const [modalVisible, setModalVisible] = useState(false);
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);

  // Activity Log Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Social Media');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [notes, setNotes] = useState('');

  // Priority Form State
  const [mainTask, setMainTask] = useState(priorities?.mainTask || '');
  const [healthGoal, setHealthGoal] = useState(priorities?.healthGoal || '');
  const [recoveryGoal, setRecoveryGoal] = useState(priorities?.recoveryGoal || '');

  const filteredLogs = energyLogs.filter(log => log.type === activeTab);

  // Moving background blobs
  const bounceAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 9500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 9500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const transX = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-25, 25],
  });
  const transY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 15],
  });

  const handleAddLog = () => {
    if (!title || !duration) {
      Alert.alert('Missing Details', 'Please fill in Title and Duration.');
      return;
    }

    addEnergyLog({
      type: activeTab,
      category,
      title,
      durationMinutes: parseInt(duration) || 10,
      intensity,
      notes,
    });

    // Reset Form
    setTitle('');
    setDuration('');
    setNotes('');
    setModalVisible(false);
  };

  const handleSavePriorities = () => {
    if (!mainTask || !healthGoal || !recoveryGoal) {
      Alert.alert('Missing Details', 'Please fill in all three priorities.');
      return;
    }

    setPriorities({
      mainTask,
      healthGoal,
      recoveryGoal,
    });
    setPriorityModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background aurora */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View 
          style={[
            styles.blurBlob, 
            { 
              backgroundColor: isDark ? '#1a4f3b' : '#a6f2cf',
              top: '25%', 
              right: '-10%',
              transform: [{ translateX: transX }, { translateY: transY }] 
            }
          ]} 
        />
      </View>

      <View style={[styles.contentContainer, { paddingTop: insets.top + Spacing.two }]}>
        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>Balance Log</Text>

        {/* Priorities Header Card */}
        <NeomorphicCard 
          onPress={() => {
            setMainTask(priorities?.mainTask || '');
            setHealthGoal(priorities?.healthGoal || '');
            setRecoveryGoal(priorities?.recoveryGoal || '');
            setPriorityModalVisible(true);
          }}
          style={styles.priorityCard}
        >
          <View style={styles.priorityCardHeader}>
            <Text style={[styles.priorityCardLabel, { color: colors.primary }]}>DAILY PRIORITIES</Text>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.priorityCardTitle, { color: colors.textPrimary }]}>
            {priorities ? 'Tap to edit daily goals' : 'Configure your 3 priorities for today'}
          </Text>
        </NeomorphicCard>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surfaceContainer }]}>
          <Pressable
            onPress={() => setActiveTab('spent')}
            style={[
              styles.tabButton,
              activeTab === 'spent' && { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'spent' ? colors.onPrimary : colors.textSecondary }]}>
              Energy Spent
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('recovered')}
            style={[
              styles.tabButton,
              activeTab === 'recovered' && { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'recovered' ? colors.onPrimary : colors.textSecondary }]}>
              Energy Restored
            </Text>
          </Pressable>
        </View>

        {/* Logs List */}
        <FlatList
          data={filteredLogs}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.six }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No logs in this category today.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <NeomorphicCard style={styles.logCard}>
              <View style={styles.logLeft}>
                <View 
                  style={[
                    styles.logIndicator, 
                    { backgroundColor: activeTab === 'spent' ? colors.tertiaryLight : colors.secondaryLight }
                  ]} 
                />
                <View style={styles.logTextContainer}>
                  <Text style={[styles.logTitleText, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.logMeta, { color: colors.textMuted }]}>
                    {item.category} • {item.durationMinutes} mins • {item.intensity}
                  </Text>
                </View>
              </View>

              <View style={styles.logRight}>
                <Text 
                  style={[
                    styles.scoreChange, 
                    { color: activeTab === 'spent' ? colors.error : colors.success }
                  ]}
                >
                  {activeTab === 'spent' ? '-' : '+'}{item.scoreValue}
                </Text>
                <Pressable onPress={() => deleteEnergyLog(item.id)} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </Pressable>
              </View>
            </NeomorphicCard>
          )}
        />

        {/* Floating Action Button */}
        <Pressable
          onPress={() => {
            setCategory(activeTab === 'spent' ? 'Social Media' : 'Sleep');
            setModalVisible(true);
          }}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>

        {/* Activity Logging Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    Log {activeTab === 'spent' ? 'Distraction' : 'Recovery'}
                  </Text>
                  <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                  </Pressable>
                </View>

                {/* Title Form */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Title</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: isDark ? colors.surface : '#f2ebf6', color: colors.textPrimary, borderColor: isDark ? colors.outlineVariant : '#ffffff', borderWidth: isDark ? 1 : 2 }]}
                    placeholder="e.g. Browsing Instagram, Meditation Break"
                    placeholderTextColor={colors.textMuted}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                {/* Category Picker */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Category</Text>
                  <View style={styles.pillsRow}>
                    {(activeTab === 'spent'
                      ? ['Social Media', 'Work', 'Study', 'Gaming', 'Meetings', 'Stress']
                      : ['Sleep', 'Walking', 'Exercise', 'Meditation', 'Prayer', 'Hobbies']
                    ).map(cat => {
                      const isSelected = category === cat;
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => setCategory(cat)}
                          style={[
                            styles.categoryPill,
                            { borderColor: colors.outlineVariant + '30', backgroundColor: isSelected ? colors.primary : (isDark ? colors.surface : '#ffffff') },
                          ]}
                        >
                          <Text style={[styles.categoryPillText, { color: isSelected ? colors.onPrimary : colors.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                            {cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Duration Form */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Duration (minutes)</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: isDark ? colors.surface : '#f2ebf6', color: colors.textPrimary, borderColor: isDark ? colors.outlineVariant : '#ffffff', borderWidth: isDark ? 1 : 2 }]}
                    keyboardType="number-pad"
                    placeholder="e.g. 15"
                    placeholderTextColor={colors.textMuted}
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>

                {/* Intensity Picker */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Intensity / Impact</Text>
                  <View style={[styles.tabContainer, { backgroundColor: colors.surfaceContainer, marginBottom: 0 }]}>
                    {['Low', 'Medium', 'High'].map((lvl: any) => {
                      const isSelected = intensity === lvl;
                      return (
                        <Pressable
                          key={lvl}
                          onPress={() => setIntensity(lvl)}
                          style={[
                            styles.tabButton,
                            isSelected && { backgroundColor: colors.primary },
                          ]}
                        >
                          <Text style={[styles.tabText, { color: isSelected ? colors.onPrimary : colors.textSecondary }]}>
                            {lvl}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Notes (optional)</Text>
                  <TextInput
                    style={[styles.modalInput, { height: 80, paddingVertical: 12, backgroundColor: isDark ? colors.surface : '#f2ebf6', color: colors.textPrimary, borderColor: isDark ? colors.outlineVariant : '#ffffff', borderWidth: isDark ? 1 : 2 }]}
                    multiline
                    placeholder="Add details..."
                    placeholderTextColor={colors.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>

                <NeomorphicCard
                  onPress={handleAddLog}
                  style={styles.submitButton}
                  bgColor={colors.primary}
                >
                  <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>Log Activity</Text>
                </NeomorphicCard>

              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Priorities Editing Modal */}
        <Modal visible={priorityModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Daily Priorities</Text>
                  <Pressable onPress={() => setPriorityModalVisible(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                  </Pressable>
                </View>

                {/* Main Task */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Main Work/Study Goal</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: isDark ? colors.surface : '#f2ebf6', color: colors.textPrimary, borderColor: isDark ? colors.outlineVariant : '#ffffff', borderWidth: isDark ? 1 : 2 }]}
                    placeholder="e.g. Build the React Native app layout"
                    placeholderTextColor={colors.textMuted}
                    value={mainTask}
                    onChangeText={setMainTask}
                  />
                </View>

                {/* Health Goal */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Health / Physical Goal</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: isDark ? colors.surface : '#f2ebf6', color: colors.textPrimary, borderColor: isDark ? colors.outlineVariant : '#ffffff', borderWidth: isDark ? 1 : 2 }]}
                    placeholder="e.g. Complete 10,000 steps"
                    placeholderTextColor={colors.textMuted}
                    value={healthGoal}
                    onChangeText={setHealthGoal}
                  />
                </View>

                {/* Recovery Goal */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Mental Recovery / Screen Off Goal</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: isDark ? colors.surface : '#f2ebf6', color: colors.textPrimary, borderColor: isDark ? colors.outlineVariant : '#ffffff', borderWidth: isDark ? 1 : 2 }]}
                    placeholder="e.g. No social media after 9 PM"
                    placeholderTextColor={colors.textMuted}
                    value={recoveryGoal}
                    onChangeText={setRecoveryGoal}
                  />
                </View>

                <NeomorphicCard
                  onPress={handleSavePriorities}
                  style={styles.submitButton}
                  bgColor={colors.primary}
                >
                  <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>Save Priorities</Text>
                </NeomorphicCard>

              </ScrollView>
            </View>
          </View>
        </Modal>
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
  },
  blurBlob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.35,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: Spacing.two,
  },
  priorityCard: {
    marginBottom: Spacing.three,
    gap: Spacing.half,
  },
  priorityCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  priorityCardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: Spacing.one,
    marginBottom: Spacing.three,
  },
  tabButton: {
    flex: 1,
    height: 42,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    gap: Spacing.two,
  },
  emptyText: {
    fontSize: 14,
  },
  logCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  logIndicator: {
    width: 6,
    height: 36,
    borderRadius: Radius.full,
  },
  logTextContainer: {
    flex: 1,
    gap: 2,
  },
  logTitleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  logMeta: {
    fontSize: 11,
  },
  logRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  scoreChange: {
    fontSize: 16,
    fontWeight: '800',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
  },
  fab: {
    position: 'absolute',
    bottom: BottomTabInset + Spacing.four,
    right: Spacing.four,
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    ...Shadows.elevated,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  formGroup: {
    marginBottom: Spacing.three,
    gap: Spacing.one,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalInput: {
    height: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  categoryPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
  },
  submitButton: {
    height: 56,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
    borderWidth: 0,
    padding: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
