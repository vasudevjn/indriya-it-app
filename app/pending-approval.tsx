import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/common/Screen';
import { signOut } from '../lib/auth/session';
import { theme } from '../constants/theme';

export default function PendingApproval() {
  return (
    <Screen>
      <View style={styles.container}>
        <Ionicons name="time-outline" size={80} color={theme.statusColors.in_progress.text} />
        <Text variant="headlineSmall" style={styles.title}>Awaiting approval</Text>
        <Text variant="bodyMedium" style={styles.body}>
          Your technician account is pending admin approval. You will be notified once your account
          is approved and you can start resolving tickets.
        </Text>
        <Button mode="outlined" onPress={signOut} style={styles.btn} textColor={theme.colors.error}>
          Sign out
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg * 2,
    gap: theme.spacing.lg,
  },
  title: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: theme.spacing.sm,
    borderColor: theme.colors.error,
  },
});
