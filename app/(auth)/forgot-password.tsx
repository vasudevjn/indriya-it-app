import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { supabase } from '../../lib/supabase';
import { isValidEmail } from '../../lib/utils/validation';
import { extractErrorMessage } from '../../lib/utils/error';
import { theme } from '../../constants/theme';

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
          <Ionicons name="mail-outline" size={64} color={theme.colors.brand} />
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
      <AppHeader title="Forgot password" showBack />
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
          outlineColor={theme.colors.border}
          activeOutlineColor={theme.colors.brand}
          left={<TextInput.Icon icon="email-outline" />}
        />
        <Button
          mode="contained"
          onPress={handleReset}
          loading={loading}
          disabled={loading}
          buttonColor={theme.colors.brand}
          style={styles.btn}
        >
          Send reset link
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xxl,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  error: {
    color: theme.colors.error,
    backgroundColor: theme.colors.errorBg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.md,
    fontSize: 14,
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  btn: {
    borderRadius: theme.radius.sm,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg * 2,
    gap: theme.spacing.lg,
  },
  successTitle: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  successBody: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
