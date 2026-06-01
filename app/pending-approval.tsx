import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/common/Screen';
import { signOut } from '../lib/auth/session';

export default function PendingApproval() {
  return (
    <Screen>
      <View style={styles.container}>
        <Ionicons name="time-outline" size={80} color="#F59E0B" />
        <Text variant="headlineSmall" style={styles.title}>Awaiting Approval</Text>
        <Text variant="bodyMedium" style={styles.body}>
          Your technician account is pending admin approval. You will be notified once your account
          is approved and you can start resolving tickets.
        </Text>
        <Button mode="outlined" onPress={signOut} style={styles.btn} textColor="#EF4444">
          Sign Out
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
    padding: 32,
    gap: 16,
  },
  title: {
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  body: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: 8,
    borderColor: '#EF4444',
  },
});
