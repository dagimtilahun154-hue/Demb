import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedPressable from '@/components/AnimatedPressable';
import { BottomTabInset, Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppStore } from '@/store';
import type { SupportChatMessage } from '@/types/burnout';

const quickActions = [
  { key: 'drained', label: 'Drained', icon: 'battery-dead-outline' },
  { key: 'urge', label: 'Urge', icon: 'phone-portrait-outline' },
  { key: 'recovered', label: 'Recovered', icon: 'leaf-outline' },
] as const;

export default function SupportChatScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const {
    supportChatMessages,
    burnoutRisk,
    recoveryPlan,
    quickSupportCheckIn,
    sendSupportMessage,
  } = useAppStore();

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const messages = useMemo(() => {
    if (supportChatMessages.length > 0) {
      return supportChatMessages;
    }
    const welcome: SupportChatMessage = {
      id: 'support_welcome',
      role: 'assistant',
      text: recoveryPlan?.supportPrompts?.[0] ?? 'You can say it here. I will listen first and help you make sense of what feels heavy.',
      createdAt: new Date().toISOString(),
      synced: true,
      source: 'local',
    };
    return [welcome];
  }, [supportChatMessages, recoveryPlan?.supportPrompts]);

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    const text = draft;
    setDraft('');
    setSending(true);
    await sendSupportMessage(text);
    setSending(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={[styles.orb, styles.orbTop, { backgroundColor: colors.secondaryLight }]} />
        <View style={[styles.orb, styles.orbBottom, { backgroundColor: colors.primaryContainer }]} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, paddingTop: insets.top + Spacing.three }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.secondary }]}>Support</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Talk it through</Text>
            <Text style={[styles.privacyLine, { color: colors.textMuted }]}>Private space. Chats expire after 24h.</Text>
          </View>
          <View style={[styles.riskPill, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '55' }]}>
            <Ionicons name="pulse-outline" size={16} color={colors.primary} />
            <Text style={[styles.riskText, { color: colors.textSecondary }]}>{burnoutRisk.status}</Text>
          </View>
        </View>

        <View style={styles.quickRow}>
          {quickActions.map((item) => (
            <AnimatedPressable
              key={item.key}
              onPress={() => quickSupportCheckIn(item.key)}
              style={[styles.quickChip, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}
            >
              <Ionicons name={item.icon} size={17} color={colors.primary} />
              <Text style={[styles.quickText, { color: colors.textPrimary }]}>{item.label}</Text>
            </AnimatedPressable>
          ))}
        </View>

        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View style={[styles.messageWrap, isUser ? styles.messageUserWrap : styles.messageAssistantWrap]}>
                <View
                  style={[
                    styles.messageBubble,
                    {
                      backgroundColor: isUser ? colors.primary : colors.surface,
                      borderColor: isUser ? colors.primary : colors.outlineVariant + '45',
                    },
                    !isUser && Shadows.card,
                  ]}
                >
                  <Text style={[styles.messageText, { color: isUser ? colors.onPrimary : colors.textPrimary }]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '45', marginBottom: BottomTabInset + Spacing.one }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            value={draft}
            onChangeText={setDraft}
            placeholder="What are you feeling?"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <AnimatedPressable
            onPress={handleSend}
            disabled={!draft.trim() || sending}
            style={[
              styles.sendButton,
              { backgroundColor: draft.trim() ? colors.primary : colors.surfaceContainerHigh },
            ]}
          >
            <Ionicons name={sending ? 'hourglass-outline' : 'send'} size={18} color={draft.trim() ? colors.onPrimary : colors.textMuted} />
          </AnimatedPressable>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  orb: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.28,
  },
  orbTop: {
    right: -90,
    top: 110,
  },
  orbBottom: {
    left: -100,
    bottom: 90,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  privacyLine: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
  },
  riskPill: {
    minHeight: 38,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '800',
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  quickChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
  },
  quickText: {
    fontSize: 12,
    fontWeight: '800',
  },
  messagesContent: {
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  messageWrap: {
    width: '100%',
    marginBottom: Spacing.two,
  },
  messageUserWrap: {
    alignItems: 'flex-end',
  },
  messageAssistantWrap: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '86%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  suggestionButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '900',
  },
  composer: {
    minHeight: 58,
    maxHeight: 118,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  input: {
    flex: 1,
    maxHeight: 90,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: Spacing.two,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
