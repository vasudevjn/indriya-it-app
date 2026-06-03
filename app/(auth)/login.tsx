import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '../../components/common/Screen';
import { supabase } from '../../lib/supabase';
import { isValidEmail } from '../../lib/utils/validation';
import { extractErrorMessage } from '../../lib/utils/error';
import { theme } from '../../constants/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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

          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brand}>Indriya IT</Text>
            <Text style={styles.subtitle}>IT Support · Indriya Jewellery</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Email */}
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <View style={[styles.inputWrapper, emailFocused ? styles.inputWrapperFocused : null]}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={theme.colors.brand}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="your@email.com"
                placeholderTextColor={theme.colors.textTertiary}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Password */}
            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>PASSWORD</Text>
            <View style={[styles.inputWrapper, passwordFocused ? styles.inputWrapperFocused : null]}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={theme.colors.brand}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textTertiary}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowPass(v => !v)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={showPass ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Sign In */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={[styles.signInBtn, theme.shadows.md, loading ? styles.signInBtnDisabled : null]}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.signInBtnText}>Sign in</Text>
              }
            </TouchableOpacity>

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.line} />
            </View>

            {/* Register buttons */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register-requester')}
              style={styles.outlineBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.outlineBtnText}>Register as store staff</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/register-technician')}
              style={[styles.outlineBtn, styles.outlineBtnSpaced]}
              activeOpacity={0.7}
            >
              <Text style={styles.outlineBtnText}>Register as IT technician</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.brand,
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    paddingTop: theme.spacing.xxl * 2,
    paddingBottom: theme.spacing.xl + theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  logoContainer: {
    width: 84,
    height: 84,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  logo: {
    width: 60,
    height: 60,
  },
  brand: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    marginTop: -theme.spacing.lg,
    zIndex: 2,
    padding: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxl + theme.spacing.lg,
  },
  error: {
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.md,
    fontSize: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.xs,
  },
  fieldLabelSpaced: {
    marginTop: theme.spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface2,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    height: 50,
  },
  inputWrapperFocused: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.brand,
    shadowColor: '#0F1C2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  signInBtn: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  signInBtnDisabled: {
    opacity: 0.75,
  },
  signInBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotBtn: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  forgotText: {
    color: theme.colors.brandMid,
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  orText: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnSpaced: {
    marginTop: theme.spacing.sm,
  },
  outlineBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
});
