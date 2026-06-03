import React from 'react';
import { Appbar } from 'react-native-paper';
import { router } from 'expo-router';

interface Props {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function AppHeader({ title, showBack = false, right }: Props) {
  return (
    <Appbar.Header
      style={{ backgroundColor: '#1B3A7A', height: 52 }}
      statusBarHeight={0}
    >
      {showBack && <Appbar.BackAction onPress={() => router.back()} color="#fff" />}
      <Appbar.Content title={title} titleStyle={{ color: '#fff', fontWeight: '700' }} />
      {right}
    </Appbar.Header>
  );
}
