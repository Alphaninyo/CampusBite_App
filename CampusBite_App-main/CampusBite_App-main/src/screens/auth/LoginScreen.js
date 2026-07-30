import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Animated, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../api';

export default function LoginScreen({ navigation }) {
  const { colors: COLORS, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusEmail, setFocusEmail]     = useState(false);
  const [focusPass, setFocusPass]       = useState(false);
  const [loading, setLoading]           = useState(false);
  const [pendingMsg, setPendingMsg]     = useState(null);
  const [errorMsg, setErrorMsg]         = useState(null);
  const btnScale                        = useRef(new Animated.Value(1)).current;
  const passwordRef                     = useRef(null);
  const login                           = useAuthStore((s) => s.login);

  // ── Application status check ──
  const [statusOpen, setStatusOpen]         = useState(false);
  const [statusEmail, setStatusEmail]       = useState('');
  const [statusPassword, setStatusPassword] = useState('');
  const [statusShowPass, setStatusShowPass] = useState(false);
  const [statusLoading, setStatusLoading]   = useState(false);
  const [statusResult, setStatusResult]     = useState(null);  // { name, role, approval_status, registered_at, rejected_at }
  const [statusError, setStatusError]       = useState(null);

  const handleCheckStatus = async () => {
    if (!statusEmail || !statusPassword) {
      setStatusError('Please enter your email and password.');
      return;
    }
    setStatusError(null);
    setStatusResult(null);
    setStatusLoading(true);
    try {
      const res = await api.auth.checkStatus({ email: statusEmail.trim(), password: statusPassword });
      setStatusResult(res.data);
    } catch (err) {
      setStatusError(err.message || 'Could not retrieve status. Check your credentials.');
    } finally {
      setStatusLoading(false);
    }
  };

  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: false }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: false }).start();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    setPendingMsg(null);
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err.message?.toLowerCase().includes('pending') || err.message?.toLowerCase().includes('approval')) {
        setPendingMsg(err.message);
      } else if (err.message?.toLowerCase().includes('suspended')) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Incorrect email or password. Please try again.');
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
            -webkit-box-shadow: 0 0 0 30px ${COLORS.card} inset !important;
            -webkit-text-fill-color: ${COLORS.text} !important;
          }
        `}} />
      )}
      <TouchableOpacity
        style={[styles.themeToggleBtn, { top: insets.top + 16 }]}
        onPress={toggleTheme}
        activeOpacity={0.7}
        accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={COLORS.primary} />
      </TouchableOpacity>
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
              <Ionicons name="pizza" size={30} color={COLORS.white} />
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

          {/* ── Error banner ── */}
          {errorMsg && (
            <View style={styles.errorBanner}>
              <View style={styles.errorBannerLeft}>
                <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
                {errorMsg.toLowerCase().includes('suspended') && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL('mailto:admin@campusbite.com?subject=Account%20Suspension%20Appeal')}
                    style={styles.contactSupportBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="mail-outline" size={13} color={COLORS.danger} />
                    <Text style={styles.contactSupportText}>Email admin@campusbite.com</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={() => setErrorMsg(null)}>
                <Ionicons name="close" size={18} color={COLORS.danger} />
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
              onChangeText={(v) => { setEmail(v); setErrorMsg(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusEmail(true)}
              onBlur={() => setFocusEmail(false)}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
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
              ref={passwordRef}
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.muted}
              value={password}
              onChangeText={(v) => { setPassword(v); setErrorMsg(null); }}
              secureTextEntry={!showPassword}
              onFocus={() => setFocusPass(true)}
              onBlur={() => setFocusPass(false)}
              returnKeyType="go"
              onSubmitEditing={() => { if (!loading) handleLogin(); }}
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
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <View style={styles.loginBtnInner}>
                  <Text style={styles.loginBtnText}>Log In</Text>
                  <View style={styles.arrowBadge}>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
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
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' }} 
                style={styles.socialIcon} 
              />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('Apple')} activeOpacity={0.8}>
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/179/179309.png' }} 
                style={[styles.socialIcon, { tintColor: COLORS.text }]} 
              />
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Sign Up ── */}
        <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7} style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <Text style={styles.signupLink}>Sign up</Text>
        </TouchableOpacity>

        {/* ── Application Status Checker ── */}
        <View style={styles.statusChecker}>
          <TouchableOpacity
            style={styles.statusToggleRow}
            onPress={() => { setStatusOpen(!statusOpen); setStatusResult(null); setStatusError(null); }}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.statusToggleText}>Check my application status</Text>
            <Ionicons name={statusOpen ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          {statusOpen && (
            <View style={styles.statusPanel}>
              <Text style={styles.statusPanelHint}>
                Enter your vendor or food courier credentials to see whether your registration was accepted or denied.
              </Text>

              {/* Status email */}
              <View style={styles.statusInputWrap}>
                <Ionicons name="mail-outline" size={15} color={COLORS.muted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.statusInput}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.muted}
                  value={statusEmail}
                  onChangeText={(v) => { setStatusEmail(v); setStatusError(null); setStatusResult(null); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Status password */}
              <View style={styles.statusInputWrap}>
                <Ionicons name="lock-closed-outline" size={15} color={COLORS.muted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.statusInput, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor={COLORS.muted}
                  value={statusPassword}
                  onChangeText={(v) => { setStatusPassword(v); setStatusError(null); setStatusResult(null); }}
                  secureTextEntry={!statusShowPass}
                />
                <TouchableOpacity onPress={() => setStatusShowPass(!statusShowPass)} activeOpacity={0.7}>
                  <Ionicons name={statusShowPass ? 'eye' : 'eye-off'} size={16} color={COLORS.muted} />
                </TouchableOpacity>
              </View>

              {/* Error */}
              {statusError && (
                <Text style={styles.statusErrorText}>{statusError}</Text>
              )}

              {/* Check button */}
              <TouchableOpacity
                style={[styles.statusCheckBtn, statusLoading && { opacity: 0.7 }]}
                onPress={handleCheckStatus}
                disabled={statusLoading}
                activeOpacity={0.8}
              >
                {statusLoading
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.statusCheckBtnText}>Check Status</Text>
                }
              </TouchableOpacity>

              {/* Result card */}
              {statusResult && (
                <View style={[
                  styles.statusResultCard,
                  statusResult.approval_status === 'rejected'      && styles.statusResultCardRejected,
                  statusResult.approval_status === 'approved'      && styles.statusResultCardApproved,
                  statusResult.approval_status === 'info_requested' && styles.statusResultCardInfo,
                ]}>
                  <View style={styles.statusResultHeader}>
                    <Ionicons
                      name={
                        statusResult.approval_status === 'approved'       ? 'checkmark-circle' :
                        statusResult.approval_status === 'rejected'       ? 'close-circle'     :
                        statusResult.approval_status === 'info_requested' ? 'alert-circle'     : 'time'
                      }
                      size={22}
                      color={
                        statusResult.approval_status === 'approved'       ? COLORS.success  :
                        statusResult.approval_status === 'rejected'       ? COLORS.danger   :
                        statusResult.approval_status === 'info_requested' ? COLORS.infoText : COLORS.warning
                      }
                    />
                    <Text style={[
                      styles.statusResultTitle,
                      statusResult.approval_status === 'rejected'       && { color: COLORS.danger },
                      statusResult.approval_status === 'approved'       && { color: COLORS.success },
                      statusResult.approval_status === 'info_requested' && { color: COLORS.infoText },
                    ]}>
                      {statusResult.approval_status === 'approved'       ? 'Application Approved'  :
                       statusResult.approval_status === 'rejected'       ? 'Application Denied'    :
                       statusResult.approval_status === 'info_requested' ? 'Information Required'  : 'Under Review'}
                    </Text>
                  </View>

                  <Text style={styles.statusResultName}>Hello, {statusResult.name}</Text>
                  <Text style={styles.statusResultRole}>
                    Role: {statusResult.role === 'food_courier' ? 'Food Courier' : 'Vendor'}
                  </Text>

                  <Text style={styles.statusResultMsg}>
                    {statusResult.approval_status === 'approved'
                      ? 'Your registration has been approved. You can now log in above.'
                      : statusResult.approval_status === 'rejected'
                      ? 'Your application was not approved by the admin. Please contact support for more details.'
                      : statusResult.approval_status === 'info_requested'
                      ? 'The admin has requested additional information before your account can be approved.'
                      : 'Your application is still being reviewed by the admin. You will be notified once a decision is made.'}
                  </Text>

                  {/* Admin note for info_requested */}
                  {statusResult.approval_status === 'info_requested' && statusResult.admin_note && (
                    <View style={styles.adminNoteBox}>
                      <Text style={styles.adminNoteLabel}>Admin's note:</Text>
                      <Text style={styles.adminNoteText}>{statusResult.admin_note}</Text>
                    </View>
                  )}

                  {/* Submit info button */}
                  {statusResult.approval_status === 'info_requested' && (
                    <TouchableOpacity
                      style={styles.submitInfoBtn}
                      onPress={() => navigation.navigate('SubmitInfo', {
                        email:         statusEmail,
                        password:      statusPassword,
                        adminNote:     statusResult.admin_note,
                        role:          statusResult.role,
                        requestedDocs: statusResult.requested_docs,
                      })}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="cloud-upload-outline" size={15} color={COLORS.white} />
                      <Text style={styles.submitInfoBtnText}>Submit Required Information</Text>
                    </TouchableOpacity>
                  )}

                  {statusResult.rejected_at && (
                    <Text style={styles.statusResultDate}>
                      Decision date: {new Date(statusResult.rejected_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

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

const makeStyles = (COLORS) => StyleSheet.create({
  root:  { flex: 1, backgroundColor: COLORS.backgroundAlt },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 56, paddingBottom: 48 },

  // ── Decorative blobs ──
  themeToggleBtn: {
    position: 'absolute', top: 16, right: 16, zIndex: 2,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.borderAccent,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },

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
  loginBtnText:  { color: COLORS.white, fontSize: 17, fontWeight: '800', marginRight: 10, letterSpacing: 0.2 },
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
  socialIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    resizeMode: 'contain',
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

  // ── Error banner ──
  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.dangerBg, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.dangerBorder,
    padding: 12, marginBottom: 16, gap: 10,
  },
  errorBannerLeft: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.dangerBorder, alignItems: 'center', justifyContent: 'center',
  },
  errorBannerText: { fontSize: 13, color: COLORS.danger, fontWeight: '600', lineHeight: 17 },
  contactSupportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  contactSupportText: { fontSize: 12, color: COLORS.danger, fontWeight: '700', textDecorationLine: 'underline' },

  // ── Trust ──
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.backgroundAlt, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: COLORS.borderAccent,
    alignSelf: 'center',
  },
  trustText: { fontSize: 11, color: COLORS.subtext, marginLeft: 6, fontWeight: '500' },

  // ── Application status checker ──
  statusChecker: {
    width: '100%', marginBottom: 20,
    backgroundColor: COLORS.card, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.borderAccent,
    overflow: 'hidden',
    shadowColor: COLORS.primary, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statusToggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  statusToggleText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  statusPanel: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: COLORS.borderAccent },
  statusPanelHint: { fontSize: 12, color: COLORS.subtext, lineHeight: 17, marginTop: 12, marginBottom: 12 },

  statusInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1.5, borderColor: COLORS.border,
    paddingVertical: 8, marginBottom: 10,
  },
  statusInput: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500', ...Platform.select({ web: { outlineStyle: 'none' } }) },

  statusErrorText: { fontSize: 12, color: COLORS.danger, marginBottom: 8, fontWeight: '600' },

  statusCheckBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 13,
    alignItems: 'center', marginTop: 4, marginBottom: 12,
  },
  statusCheckBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },

  statusResultCard: {
    borderRadius: 14, padding: 14,
    backgroundColor: COLORS.warningBg, borderWidth: 1.5, borderColor: COLORS.warningBorder,
  },
  statusResultCardRejected: { backgroundColor: COLORS.dangerBg,  borderColor: COLORS.dangerBorder },
  statusResultCardApproved: { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder },
  statusResultCardInfo:     { backgroundColor: COLORS.infoBg,    borderColor: COLORS.infoBorder },

  statusResultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  statusResultTitle:  { fontSize: 14, fontWeight: '800', color: COLORS.warningText },
  statusResultName:   { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  statusResultRole:   { fontSize: 12, color: COLORS.subtext, marginBottom: 6 },
  statusResultMsg:    { fontSize: 12, color: COLORS.subtext, lineHeight: 17, marginBottom: 4 },
  statusResultDate:   { fontSize: 11, color: COLORS.muted, marginTop: 4 },

  adminNoteBox: { backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 8, padding: 10, marginTop: 8, marginBottom: 4 },
  adminNoteLabel: { fontSize: 10, fontWeight: '800', color: COLORS.infoText, letterSpacing: 0.8, marginBottom: 3 },
  adminNoteText:  { fontSize: 12, color: COLORS.infoText, lineHeight: 17 },

  submitInfoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.info, borderRadius: 10, paddingVertical: 11, marginTop: 10,
  },
  submitInfoBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.white },
});
