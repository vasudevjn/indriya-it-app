import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { DbProfile } from '../../types';
import { formatDate } from '../../lib/utils/date';

interface Props {
  profile: DbProfile;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isLoading?: boolean;
}

export function TechnicianApprovalCard({ profile, onApprove, onReject, isLoading }: Props) {
  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <Text variant="titleMedium" style={styles.name}>{profile.full_name}</Text>
        {profile.designation && (
          <Text variant="bodySmall" style={styles.meta}>{profile.designation}</Text>
        )}
        {profile.phone && (
          <Text variant="bodySmall" style={styles.meta}>Tel: {profile.phone}</Text>
        )}
        <Text variant="labelSmall" style={styles.date}>
          Registered {formatDate(profile.created_at)}
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button
          mode="outlined"
          textColor="#EF4444"
          onPress={() => onReject(profile.id)}
          disabled={isLoading}
        >
          Reject
        </Button>
        <Button
          mode="contained"
          buttonColor="#1B3A7A"
          onPress={() => onApprove(profile.id)}
          disabled={isLoading}
        >
          Approve
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#fff',
  },
  name: {
    color: '#111827',
    fontWeight: '700',
  },
  meta: {
    color: '#6B7280',
    marginTop: 2,
  },
  date: {
    color: '#9CA3AF',
    marginTop: 6,
  },
});
