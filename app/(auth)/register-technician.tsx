import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { supabase } from '../../lib/supabase';
import { isValidEmail, isStrongPassword } from '../../lib/utils/validation';
import { extractErrorMessage } from '../../lib/utils/error';

export default function RegisterTechnician() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validate = () => {
    if (!fullName.trim()) return 'Full name is required';
    if (!isValidEmail(email)) return 'Enter a valid email';
    if (!isStrongPassword(password)) return 'Password must be at least 8 characters';
    if (!phone.trim()) return 'Phone number is required';
    if (!designation.trim()) return 'Designation is required';
    return null;
  };

  const handleRegister = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          designation,
          role: 'technician',
        },
      },
    });
    setLoading(false);
    if (authError) { setError(extractErrorMessage(authError)); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <Screen>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          <Text variant="headlineSmall" style={styles.successTitle}>Registration Submitted</Text>
          <Text variant="bodyMedium" style={styles.successBody}>
            Your technician account is pending admin approval. You will receive a notification once
            your account is approved and you can start resolving tickets.
          </Text>
          <Button mode="outlined" onPress={() => setSuccess(false)} textColor="#1B3A7A" style={styles.backBtn}>
            Back to Login
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="Register as IT Technician" showBack />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
            <Text variant="bodySmall" style={styles.noticeText}>
              Technician accounts require admin approval before you can log in.
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput label="Full Name" value={fullName} onChangeText={setFullName} mode="outlined" style={styles.input} outlineColor="#E5E7EB" activeOutlineColor="#1B3A7A" autoCapitalize="words" left={<TextInput.Icon icon="account-outline" />} />
          <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" style={styles.input} outlineColor="#E5E7EB" activeOutlineColor="#1B3A7A" keyboardType="email-address" autoCapitalize="none" left={<TextInput.Icon icon="email-outline" />} />
          <TextInput label="Phone" value={phone} onChangeText={setPhone} mode="outlined" style={styles.input} outlineColor="#E5E7EB" activeOutlineColor="#1B3A7A" keyboardType="phone-pad" left={<TextInput.Icon icon="phone-outline" />} />
          <TextInput label="Designation" value={designation} onChangeText={setDesignation} mode="outlined" style={styles.input} outlineColor="#E5E7EB" activeOutlineColor="#1B3A7A" autoCapitalize="words" left={<TextInput.Icon icon="briefcase-outline" />} />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            mode="outlined"
            style={styles.input}
            outlineColor="#E5E7EB"
            activeOutlineColor="#1B3A7A"
            left={<TextInput.Icon icon="lock-outline" />}
            right={<TextInput.Icon icon={showPass ? 'eye-off' : 'eye'} onPress={() => setShowPass((v) => !v)} />}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            buttonColor="#1B3A7A"
            style={styles.btn}
            contentStyle={{ paddingVertical: 6 }}
          >
            Submit for Approval
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    color: '#1D4ED8',
    flex: 1,
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
    marginTop: 8,
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
    textAlign: 'center',
  },
  successBody: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  backBtn: {
    borderColor: '#1B3A7A',
    marginTop: 8,
  },
});
