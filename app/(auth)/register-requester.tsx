import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { getStoreByCode } from '../../lib/api/stores';
import { isValidEmail, isStrongPassword } from '../../lib/utils/validation';
import { extractErrorMessage } from '../../lib/utils/error';
import { theme } from '../../constants/theme';

interface FormFieldProps {
  iconName: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  onBlur?: () => void;
  rightElement?: React.ReactNode;
}

function FormField({
  iconName, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize, onBlur: externalOnBlur, rightElement,
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.fieldWrap, theme.shadows.sm, focused && styles.fieldFocused]}>
      <Ionicons
        name={iconName as keyof typeof Ionicons.glyphMap}
        size={18}
        color={theme.colors.textTertiary}
      />
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); externalOnBlur?.(); }}
      />
      {rightElement}
    </View>
  );
}

export default function RegisterRequester() {
  const insets = useSafeAreaInsets();
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
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.6)" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register as Store Staff</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <FormField
            iconName="person-outline"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            autoCapitalize="words"
          />
          <FormField
            iconName="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            iconName="call-outline"
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone"
            keyboardType="phone-pad"
          />
          <FormField
            iconName="briefcase-outline"
            value={designation}
            onChangeText={setDesignation}
            placeholder="Designation / job title"
            autoCapitalize="words"
          />
          <FormField
            iconName="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry={!showPass}
            autoCapitalize="none"
            rightElement={
              <TouchableOpacity
                onPress={() => setShowPass((v) => !v)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
            }
          />
          <FormField
            iconName="storefront-outline"
            value={storeCode}
            onChangeText={(v) => setStoreCode(v.toUpperCase())}
            placeholder="Store code (e.g. MUM001)"
            autoCapitalize="characters"
            onBlur={handleCodeBlur}
            rightElement={
              lookingUp
                ? <ActivityIndicator size="small" color={theme.colors.brand} />
                : undefined
            }
          />
          {storeError ? (
            <Text style={styles.helperError}>{storeError}</Text>
          ) : null}
          {storeName ? (
            <View style={styles.storeInfo}>
              <Text style={styles.storeNameText}>{storeName}</Text>
              {storeCity ? <Text style={styles.storeCityText}>{storeCity}</Text> : null}
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, theme.shadows.md, loading && styles.submitBtnLoading]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>Create Account</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },

  // Header
  header: {
    backgroundColor: theme.colors.brand,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  backText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  // Body
  scroll: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl + theme.spacing.lg,
  },
  errorBanner: {
    color: theme.colors.error,
    backgroundColor: theme.colors.errorBg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.md,
    fontSize: 14,
  },

  // Form fields
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  fieldFocused: {
    borderColor: theme.colors.brand,
  },
  fieldInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    padding: 0,
  },

  // Store validation
  helperError: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  storeInfo: {
    backgroundColor: theme.statusColors.resolved.bg,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.statusColors.resolved.accent,
    gap: theme.spacing.xs,
  },
  storeNameText: {
    color: theme.statusColors.resolved.text,
    fontWeight: '700',
    fontSize: 14,
  },
  storeCityText: {
    color: theme.statusColors.resolved.text,
    fontSize: 13,
  },

  // Submit button
  submitBtn: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md + theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  submitBtnLoading: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
