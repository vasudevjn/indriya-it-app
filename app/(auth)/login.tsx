import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { Screen } from '../../components/common/Screen';
import { supabase } from '../../lib/supabase';
import { isValidEmail } from '../../lib/utils/validation';
import { extractErrorMessage } from '../../lib/utils/error';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!isValidEmail(email)) { setError('Enter a valid email address'); return; }
    if (!password) { setError('Password is required'); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) setError(extractErrorMessage(authError));
  };

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Hero header with navy gradient feel */}
          <View style={styles.hero}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text variant="headlineMedium" style={styles.brand}>Indriya IT</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>IT Support - Indriya Jewellery</Text>
          </View>

          <View style={styles.card}>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
              outlineColor="#D1D5DB"
              activeOutlineColor="#1B3A7A"
              left={<TextInput.Icon icon="email-outline" color="#1B3A7A" />}
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              mode="outlined"
              style={styles.input}
              outlineColor="#D1D5DB"
              activeOutlineColor="#1B3A7A"
              left={<TextInput.Icon icon="lock-outline" color="#1B3A7A" />}
              right={<TextInput.Icon icon={showPass ? 'eye-off' : 'eye'} onPress={() => setShowPass((v) => !v)} />}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              buttonColor="#1B3A7A"
              style={styles.btn}
              contentStyle={{ paddingVertical: 6 }}
            >
              Sign In
            </Button>

            <Button
              mode="text"
              onPress={() => router.push('/(auth)/forgot-password')}
              textColor="#6B7280"
            >
              Forgot password?
            </Button>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            <Button
              mode="outlined"
              onPress={() => router.push('/(auth)/register-requester')}
              style={styles.registerBtn}
              textColor="#1B3A7A"
            >
              Register as Store Staff
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.push('/(auth)/register-technician')}
              style={[styles.registerBtn, { marginTop: 8 }]}
              textColor="#1B3A7A"
            >
              Register as IT Technician
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#1B3A7A',
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 12,
  },
  brand: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
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
    marginTop: 4,
    marginBottom: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  registerBtn: {
    borderColor: '#1B3A7A',
    borderRadius: 8,
  },
});
