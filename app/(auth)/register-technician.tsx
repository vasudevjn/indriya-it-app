import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
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
  rightElement?: React.ReactNode;
}

function FormField({
  iconName, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize, rightElement,
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
        onBlur={() => setFocused(false)}
      />
      {rightElement}
    </View>
  );
}

export default function RegisterTechnician() {
  const insets = useSafeAreaInsets();
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
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={80} color={theme.statusColors.resolved.text} />
          <Text style={styles.successTitle}>Registration submitted</Text>
          <Text style={styles.successBody}>
            Your technician account is pending admin approval. You will receive a notification once
            your account is approved and you can start resolving tickets.
          </Text>
          <TouchableOpacity
            style={styles.backToLoginBtn}
            onPress={() => setSuccess(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.6)" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register as Technician</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={theme.colors.brand} />
            <Text style={styles.infoBannerText}>
              Technician accounts require admin approval before you can log in.
            </Text>
          </View>

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
            placeholder="Designation"
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

          <TouchableOpacity
            style={[styles.submitBtn, theme.shadows.md, loading && styles.submitBtnLoading]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>Submit for Approval</Text>
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

  // Info banner (technician only)
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.brand + '14',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.brand + '33',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoBannerText: {
    flex: 1,
    color: theme.colors.brand,
    fontSize: 13,
    lineHeight: 18,
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

  // Success screen
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
    fontSize: 22,
    textAlign: 'center',
  },
  successBody: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
  },
  backToLoginBtn: {
    borderWidth: 1.5,
    borderColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxl,
    marginTop: theme.spacing.sm,
  },
  backToLoginText: {
    color: theme.colors.brand,
    fontWeight: '700',
    fontSize: 15,
  },
});
