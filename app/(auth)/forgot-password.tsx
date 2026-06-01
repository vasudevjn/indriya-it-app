import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { supabase } from '../../lib/supabase';
import { isValidEmail } from '../../lib/utils/validation';
import { extractErrorMessage } from '../../lib/utils/error';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!isValidEmail(email)) { setError('Enter a valid email address'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (err) { setError(extractErrorMessage(err)); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <Screen>
        <View style={styles.successContainer}>
          <Ionicons name="mail-outline" size={64} color="#1B3A7A" />
          <Text variant="titleLarge" style={styles.successTitle}>Check your email</Text>
          <Text variant="bodyMedium" style={styles.successBody}>
            We've sent a password reset link to {email}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="Forgot Password" showBack />
      <View style={styles.container}>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          mode="outlined"
          style={styles.input}
          outlineColor="#E5E7EB"
          activeOutlineColor="#1B3A7A"
          left={<TextInput.Icon icon="email-outline" />}
        />
        <Button
          mode="contained"
          onPress={handleReset}
          loading={loading}
          disabled={loading}
          buttonColor="#1B3A7A"
          style={styles.btn}
        >
          Send Reset Link
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  subtitle: {
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 22,
  },
  error: {
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  btn: {
    borderRadius: 8,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  successTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  successBody: {
    color: '#6B7280',
    textAlign: 'center',
  },
});
