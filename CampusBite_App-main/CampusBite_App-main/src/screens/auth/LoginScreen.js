import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../stores/authStore';
import { COLORS } from '../../constants';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusEmail, setFocusEmail]     = useState(false);
  const [focusPass, setFocusPass]       = useState(false);
  const [loading, setLoading]           = useState(false);
  const [pendingMsg, setPendingMsg]     = useState(null);
  const btnScale                        = useRef(new Animated.Value(1)).current;
  const login                           = useAuthStore((s) => s.login);

  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: false }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: false }).start();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Missing fields', 'Please enter your email and password.');
    setPendingMsg(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err.message?.toLowerCase().includes('pending') || err.message?.toLowerCase().includes('approval')) {
        setPendingMsg(err.message);
      } else {
        Alert.alert('Login Failed', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      await login('mark@campusbite.com', 'password123');
    } catch (err) {
      Alert.alert(`${provider} Login Failed`, err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{__html: `
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #FFFFFF inset !important;
          }
        `}} />
      )}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Decorative blobs ── */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        {/* ── Brand section ── */}
        <View style={styles.brandSection}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Ionicons name="pizza" size={30} color={COLORS.card} />
            </View>
          </View>
          <Text style={styles.brandName}>CampusBite</Text>
          <Text style={styles.tagline}>Order food within minutes</Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <View style={styles.cardAccent} />

          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeSub}>Log in to continue your order.</Text>

          {/* ── Pending approval banner ── */}
          {pendingMsg && (
            <View style={styles.pendingBanner}>
              <View style={styles.pendingBannerLeft}>
                <Ionicons name="time" size={22} color={COLORS.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingBannerTitle}>Awaiting Approval</Text>
                <Text style={styles.pendingBannerText}>{pendingMsg}</Text>
              </View>
              <TouchableOpacity onPress={() => setPendingMsg(null)}>
                <Ionicons name="close" size={18} color={COLORS.warningText} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Email ── */}
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View style={[styles.inputWrap, focusEmail && styles.inputFocused]}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail" size={16} color={focusEmail ? COLORS.primary : COLORS.muted} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusEmail(true)}
              onBlur={() => setFocusEmail(false)}
            />
          </View>

          {/* ── Password ── */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>PASSWORD</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.inputWrap, focusPass && styles.inputFocused]}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={16} color={focusPass ? COLORS.primary : COLORS.muted} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setFocusPass(true)}
              onBlur={() => setFocusPass(false)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} activeOpacity={0.7}>
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={18} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          {/* ── Login Button ── */}
          <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.8 }]}
              onPress={handleLogin}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={loading}
              activeOpacity={1}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.card} size="small" />
              ) : (
                <View style={styles.loginBtnInner}>
                  <Text style={styles.loginBtnText}>Log In</Text>
                  <View style={styles.arrowBadge}>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── Divider ── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerPill}><Text style={styles.dividerText}>OR</Text></View>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Social ── */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('Google')} activeOpacity={0.8}>
              <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 8 }} />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('Apple')} activeOpacity={0.8}>
              <Ionicons name="logo-apple" size={18} color={COLORS.text} />
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Sign Up ── */}
        <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7} style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <Text style={styles.signupLink}>Sign up</Text>
        </TouchableOpacity>

        {/* ── Trust badge ── */}
        <View style={styles.trustBadge}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
          <Text style={styles.trustText}>Trusted by thousands of students across campus</Text>
        </View>

        <View style={styles.blob3} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: COLORS.backgroundAlt },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 56, paddingBottom: 48 },

  // ── Decorative blobs ──
  blob1: { position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.blob, opacity: 0.45 },
  blob2: { position: 'absolute', top: 50,  left: -70,  width: 150, height: 150, borderRadius: 75, backgroundColor: COLORS.blob, opacity: 0.28 },
  blob3: { position: 'absolute', bottom: -60, right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: COLORS.blob, opacity: 0.25 },

  // ── Brand ──
  brandSection: { alignItems: 'center', marginBottom: 28, zIndex: 1 },
  logoRing: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: COLORS.blob,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.primary, shadowOpacity: 0.20, shadowRadius: 10, elevation: 5,
  },
  logoInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 31, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5, marginBottom: 6 },
  tagline:   { fontSize: 14, color: COLORS.subtext, fontWeight: '500' },

  // ── Card ──
  card: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 26,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: 'hidden',
  },
  cardAccent:   { height: 4, backgroundColor: COLORS.primary, marginHorizontal: -24, marginBottom: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  welcomeTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 4, letterSpacing: -0.3 },
  welcomeSub:   { fontSize: 13, color: COLORS.subtext, marginBottom: 24, lineHeight: 18 },

  // ── Form ──
  labelRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label:      { fontSize: 10, fontWeight: '700', color: COLORS.subtext, letterSpacing: 1.2, marginBottom: 8 },
  forgotText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 4, marginBottom: 16, height: 48,
  },
  inputFocused: { borderColor: COLORS.primary },
  iconCircle: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: COLORS.backgroundAlt, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  input:  { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500', ...Platform.select({ web: { outlineStyle: 'none' } }) },
  eyeBtn: { padding: 4, marginLeft: 4 },

  // ── Button ──
  loginBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 17,
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 7,
  },
  loginBtnInner: { flexDirection: 'row', alignItems: 'center' },
  loginBtnText:  { color: COLORS.card, fontSize: 17, fontWeight: '800', marginRight: 10, letterSpacing: 0.2 },
  arrowBadge:    { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },

  // ── Divider ──
  divider:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginHorizontal: 10 },
  dividerText: { fontSize: 10, color: COLORS.muted, fontWeight: '700', letterSpacing: 1 },

  // ── Social ──
  socialRow: { flexDirection: 'row', columnGap: 12 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border,
    paddingVertical: 13, backgroundColor: COLORS.card,
    shadowColor: COLORS.black, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  socialText: { fontSize: 14, fontWeight: '700', color: COLORS.text },

  // ── Pending banner ──
  pendingBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.warningBg, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.warningBorder,
    padding: 12, marginBottom: 16,
  },
  pendingBannerLeft:  { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.warningIconBg, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  pendingBannerTitle: { fontSize: 13, fontWeight: '700', color: COLORS.warningText, marginBottom: 2 },
  pendingBannerText:  { fontSize: 12, color: COLORS.warningTextMid, lineHeight: 16 },

  // ── Sign up ──
  signupRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  signupText: { fontSize: 14, color: COLORS.subtext },
  signupLink: { fontSize: 14, color: COLORS.primary, fontWeight: '800' },

  // ── Trust ──
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.backgroundAlt, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: COLORS.borderAccent,
    alignSelf: 'center',
  },
  trustText: { fontSize: 11, color: COLORS.subtext, marginLeft: 6, fontWeight: '500' },
});
