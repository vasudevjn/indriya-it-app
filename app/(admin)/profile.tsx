import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, Avatar } from 'react-native-paper';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { signOut } from '../../lib/auth/session';
import { ROLE_LABELS } from '../../constants/roles';

export default function AdminProfile() {
  const { profile } = useCurrentUser();
  if (!profile) return null;

  const initials = profile.full_name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="Admin Profile" />
      <View style={styles.container}>
        <View style={styles.avatarWrap}>
          <Avatar.Text size={80} label={initials} style={styles.avatar} />
          <Text variant="headlineSmall" style={styles.name}>{profile.full_name}</Text>
          <Text variant="bodyMedium" style={styles.role}>{ROLE_LABELS[profile.role]}</Text>
        </View>

        <Card style={styles.card} mode="outlined">
          <Card.Content style={styles.cardContent}>
            {[
              { label: 'Phone', value: profile.phone ?? '-' },
              { label: 'Designation', value: profile.designation ?? '-' },
            ].map(({ label, value }) => (
              <View key={label} style={styles.infoRow}>
                <Text variant="labelMedium" style={styles.infoLabel}>{label}</Text>
                <Text variant="bodyMedium" style={styles.infoValue}>{value}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={signOut}
          buttonColor="#EF4444"
          style={styles.signOutBtn}
          icon="logout"
        >
          Sign Out
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  avatarWrap: { alignItems: 'center', marginVertical: 24, gap: 8 },
  avatar: { backgroundColor: '#1B3A7A' },
  name: { fontWeight: '700', color: '#111827' },
  role: { color: '#6B7280' },
  card: { backgroundColor: '#fff', marginBottom: 16 },
  cardContent: { gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { color: '#6B7280' },
  infoValue: { color: '#111827', fontWeight: '500' },
  signOutBtn: { borderRadius: 8, marginTop: 'auto' },
});
