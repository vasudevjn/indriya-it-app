import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { router } from 'expo-router';
import { Screen } from '../../components/common/Screen';
import { AppHeader } from '../../components/common/AppHeader';
import { supabase } from '../../lib/supabase';
import { getStoreByCode } from '../../lib/api/stores';
import { isValidEmail, isStrongPassword } from '../../lib/utils/validation';
import { extractErrorMessage } from '../../lib/utils/error';

export default function RegisterRequester() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeCity, setStoreCity] = useState('');
  const [storeId, setStoreId] = useState('');
  const [storeError, setStoreError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleCodeBlur = async () => {
    const trimmed = storeCode.trim().toUpperCase();
    if (!trimmed) return;
    setLookingUp(true);
    setStoreError('');
    setStoreCode(trimmed);
    const store = await getStoreByCode(trimmed);
    setLookingUp(false);
    if (!store) {
      setStoreError(
        'Store code not found. Make sure the code is correct (e.g. MUM001). ' +
        'If you just set up the database, ensure you ran the SQL migration including the stores seed data ' +
        'and updated the RLS policy to allow public reads on the stores table.',
      );
      setStoreName('');
      setStoreCity('');
      setStoreId('');
    } else {
      setStoreName(store.name);
      setStoreCity(store.city ?? '');
      setStoreId(store.id);
    }
  };

  const validate = () => {
    if (!fullName.trim()) return 'Full name is required';
    if (!isValidEmail(email)) return 'Enter a valid email';
    if (!isStrongPassword(password)) return 'Password must be at least 8 characters';
    if (!phone.trim()) return 'Phone number is required';
    if (!designation.trim()) return 'Designation is required';
    if (!storeId) return 'Valid store code is required';
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
          store_id: storeId,
          role: 'requester',
        },
      },
    });
    setLoading(false);
    if (authError) { setError(extractErrorMessage(authError)); return; }
    router.replace('/(requester)/home');
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="Register as Store Staff" showBack />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput label="Full Name" value={fullName} onChangeText={setFullName} mode="outlined" style={styles.input} outlineColor="#E5E7EB" activeOutlineColor="#1B3A7A" autoCapitalize="words" left={<TextInput.Icon icon="account-outline" />} />
          <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" style={styles.input} outlineColor="#E5E7EB" activeOutlineColor="#1B3A7A" keyboardType="email-address" autoCapitalize="none" left={<TextInput.Icon icon="email-outline" />} />
          <TextInput label="Phone" value={phone} onChangeText={setPhone} mode="outlined" style={styles.input} outlineColor="#E5E7EB" activeOutlineColor="#1B3A7A" keyboardType="phone-pad" left={<TextInput.Icon icon="phone-outline" />} />
          <TextInput label="Designation / Job Title" value={designation} onChangeText={setDesignation} mode="outlined" style={styles.input} outlineColor="#E5E7EB" activeOutlineColor="#1B3A7A" autoCapitalize="words" left={<TextInput.Icon icon="briefcase-outline" />} />

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

          <TextInput
            label="Store Code (e.g. MUM001)"
            value={storeCode}
            onChangeText={(v) => setStoreCode(v.toUpperCase())}
            onBlur={handleCodeBlur}
            mode="outlined"
            style={styles.input}
            outlineColor="#E5E7EB"
            activeOutlineColor="#1B3A7A"
            autoCapitalize="characters"
            right={lookingUp ? <TextInput.Icon icon="loading" /> : undefined}
          />
          {storeError ? <HelperText type="error">{storeError}</HelperText> : null}

          {storeName ? (
            <View style={styles.storeInfo}>
              <Text variant="labelLarge" style={styles.storeNameText}>{storeName}</Text>
              {storeCity ? <Text variant="bodySmall" style={styles.storeCityText}>{storeCity}</Text> : null}
            </View>
          ) : null}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            buttonColor="#1B3A7A"
            style={styles.btn}
            contentStyle={{ paddingVertical: 6 }}
          >
            Create Account
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
  storeInfo: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  storeNameText: {
    color: '#166534',
    fontWeight: '700',
  },
  storeCityText: {
    color: '#16A34A',
  },
});
