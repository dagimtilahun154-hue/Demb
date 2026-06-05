import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const signIn = useAppStore((state) => state.signIn);
  const signUp = useAppStore((state) => state.signUp);
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-up');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === 'sign-up';
  const disabled = loading || !email.trim() || !password || (isSignUp && !name.trim());

  const submit = async () => {
    if (disabled) return;
    setLoading(true);
    const result = isSignUp
      ? await signUp({ name: name.trim(), email: email.trim(), password })
      : await signIn({ email: email.trim(), password });
    setLoading(false);

    if (!result.ok) {
      Alert.alert(isSignUp ? 'Registration failed' : 'Sign in failed', result.error || 'Check your connection and try again.');
      return;
    }

    router.replace('/onboarding');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.topGlow} />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#25232C" />
        </Pressable>
        <Text style={styles.brand}>Demb</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{isSignUp ? 'Create your account' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Registration needs internet once. After that, Demb can open offline from your saved session.' : 'Sign in online, then Demb keeps your session cached.'}
        </Text>

        <View style={styles.form}>
          {isSignUp && (
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={19} color="#6D6879" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor="#8B8796"
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={19} color="#6D6879" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#8B8796"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={19} color="#6D6879" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#8B8796"
              style={styles.input}
              secureTextEntry
            />
          </View>

          <Pressable disabled={disabled} style={[styles.primaryButton, disabled && styles.disabledButton]} onPress={submit}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>{isSignUp ? 'Sign Up' : 'Log In'}</Text>}
          </Pressable>
        </View>

        <Pressable
          style={styles.switchButton}
          onPress={() => {
            setMode(isSignUp ? 'sign-in' : 'sign-up');
          }}
        >
          <Text style={styles.switchText}>{isSignUp ? 'I already have an account' : 'Create a new account'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FA',
    paddingHorizontal: 24,
  },
  topGlow: {
    position: 'absolute',
    top: -180,
    right: -120,
    width: 380,
    height: 460,
    borderRadius: 190,
    backgroundColor: 'rgba(234, 226, 255, 0.88)',
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEAEF',
  },
  brand: {
    marginLeft: 14,
    color: '#222127',
    fontSize: 24,
    fontWeight: '900',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#222127',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    color: '#686174',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 28,
  },
  form: {
    gap: 12,
  },
  inputWrap: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFE8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    color: '#25232C',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButton: {
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.48,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  switchButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  switchText: {
    color: '#605873',
    fontSize: 15,
    fontWeight: '900',
  },
});
