import { useLoginWithEmail, usePrivy } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignInScreen() {
  const router = useRouter();
  const { user, isReady } = usePrivy();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  // Use the email login hook from Privy
  const { state, sendCode, loginWithCode } = useLoginWithEmail({
    onSendCodeSuccess: ({ email }) => {
      console.log(`Code sent successfully to ${email}`);
      Alert.alert('Success', `Verification code sent to ${email}`);
    },
    onLoginSuccess: (user) => {
      console.log(`User logged in successfully: ${user.id}`);
      router.replace('/(app)');
    },
    onError: (error) => {
      console.error('Login error:', error);
      Alert.alert('Login Error', error.message);
    },
  });

  // Check if user is already logged in and redirect if needed
  useEffect(() => {
    if (isReady && user) {
      console.log('User already logged in, redirecting to app');
      router.replace('/(app)');
    }
  }, [isReady, user, router]);

  // Handle sending code to the provided email
  const handleSendCode = async () => {
    if (!email) return;

    try {
      await sendCode({ email });
    } catch (error) {
      console.error('Error sending code:', error);
    }
  };

  // Handle verification with the OTP code
  const handleVerifyCode = async () => {
    if (!code) return;

    try {
      await loginWithCode({
        code,
        email,
      });
    } catch (error) {
      console.error('Error verifying code:', error);
    }
  };

  // If we're checking the user's auth state, show a minimal loading indicator
  if (isReady === false) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FitStake</Text>
      <Text style={styles.subtitle}>Stake on your fitness goals</Text>

      <View style={styles.card}>
        <Text style={styles.cardText}>
          Join FitStake to commit to your fitness goals, stake your tokens, and
          compete with others.
        </Text>

        {state.status === 'error' && state.error && (
          <Text style={styles.errorText}>{state.error.message}</Text>
        )}

        {/* Email Input Section */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[
              styles.button,
              (state.status === 'sending-code' || !email) &&
                styles.buttonDisabled,
            ]}
            onPress={handleSendCode}
            disabled={state.status === 'sending-code' || !email}
          >
            <Text style={styles.buttonText}>
              {state.status === 'sending-code' ? 'Sending...' : 'Send Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Code Input Section - Only show after code has been sent */}
        {(state.status === 'awaiting-code-input' ||
          state.status === 'submitting-code') && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="Enter verification code"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[
                styles.button,
                (state.status === 'submitting-code' || !code) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleVerifyCode}
              disabled={state.status === 'submitting-code' || !code}
            >
              <Text style={styles.buttonText}>
                {state.status === 'submitting-code' ? 'Verifying...' : 'Verify'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status message */}
        {state.status === 'sending-code' && (
          <Text style={styles.statusText}>Sending verification code...</Text>
        )}

        {state.status === 'awaiting-code-input' && (
          <Text style={styles.statusText}>
            Check your email for a verification code
          </Text>
        )}

        {state.status === 'submitting-code' && (
          <Text style={styles.statusText}>Verifying your code...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    width: '100%',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#3f3f5f',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    color: '#aaa',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
});
