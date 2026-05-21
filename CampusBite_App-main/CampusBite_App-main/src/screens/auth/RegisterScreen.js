import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '../../stores/authStore';
import { api } from '../../api';

const PRIMARY  = '#E85D04';
const CARD     = '#FFFFFF';
const MUTED    = '#9CA3AF';
const TEXT     = '#111827';
const SUBTEXT  = '#6B7280';
const BORDER   = '#F0F0F0';
const INPUT_BG = '#F8F9FA';

const ROLES = [
  { key: 'consumer',     label: 'Consumer',     icon: 'person-outline',   desc: 'Order food'       },
  { key: 'vendor',       label: 'Vendor',        icon: 'storefront-outline', desc: 'Sell food'      },
  { key: 'food_courier', label: 'Food Courier',  icon: 'bicycle-outline',  desc: 'Deliver orders'   },
];

function Field({ icon, placeholder, value, onChangeText, keyboardType, secureTextEntry, autoCapitalize }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow]       = useState(false);
  const isSecure              = secureTextEntry;
  return (
    <View style={[fStyles.wrap, focused && fStyles.focused]}>
      <View style={fStyles.iconBox}>
        <Ionicons name={icon} size={16} color={focused ? PRIMARY : MUTED} />
      </View>
      <TextInput
        style={fStyles.input}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        secureTextEntry={isSecure && !show}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {isSecure && (
        <TouchableOpacity onPress={() => setShow(!show)} style={fStyles.eye}>
          <Ionicons name={show ? 'eye' : 'eye-off'} size={17} color={MUTED} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 4, marginBottom: 16, height: 48,
  },
  focused: { borderColor: PRIMARY },
  iconBox: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#FFF5F0', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  input:   { flex: 1, fontSize: 15, color: TEXT, fontWeight: '500', ...Platform.select({ web: { outlineStyle: 'none' } }) },
  eye:     { padding: 4, marginLeft: 4 },
});

const DOC_TYPES = [
  { key: 'national_id', label: 'National ID',  icon: 'card-outline',  desc: 'Front + back of your national ID card' },
  { key: 'passport',    label: 'Passport',      icon: 'book-outline',  desc: 'Photo page of your valid passport'     },
];

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    role: 'consumer', business_name: '', vendor_type: 'home_based', location: '',
  });
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [docType, setDocType]     = useState('national_id');
  const [pickedFile, setPickedFile] = useState(null);
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingUser,  setPendingUser]  = useState(null);
  const btnScale                  = useRef(new Animated.Value(1)).current;
  const setSession                = useAuthStore((s) => s.setSession);

  const set      = (field, val) => setForm((f) => ({ ...f, [field]: val }));
  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: false }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: false }).start();

  const needsVerification = form.role === 'vendor' || form.role === 'food_courier';

  /* ── Step 1: submit basic details ── */
  const handleStep1 = async () => {
    if (!form.name || !form.email || !form.phone || !form.password)
      return Alert.alert('Missing fields', 'Please fill in all required fields.');
    if (form.role === 'vendor' && !form.business_name)
      return Alert.alert('Missing fields', 'Business name is required for vendors.');
    setLoading(true);
    try {
      const { data } = await api.auth.register(form);
      if (!data.token || !data.user) throw new Error('Invalid registration response.');

      if (needsVerification) {
        /* Save token to AsyncStorage so the upload API can use it, but DON'T
           commit to Zustand state yet — that would switch the navigator away. */
        await AsyncStorage.setItem('token', data.token);
        setPendingToken(data.token);
        setPendingUser(data.user);
        setStep(2);
      } else {
        await setSession(data.token, data.user);
      }
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Pick document from gallery ── */
  const pickFromGallery = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission required', 'Allow access to your photo library.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets?.length > 0) setPickedFile(result.assets[0]);
  };

  /* ── Pick document from camera ── */
  const pickFromCamera = async () => {
    if (Platform.OS === 'web') return Alert.alert('Not supported', 'Use gallery on web.');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission required', 'Allow camera access.');
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets?.length > 0) setPickedFile(result.assets[0]);
  };

  /* ── Step 2: upload doc then commit session ── */
  const handleStep2 = async (skip = false) => {
    setLoading(true);
    try {
      if (!skip && pickedFile) {
        const formData = new FormData();
        formData.append('document_type', docType);
        if (Platform.OS === 'web') {
          const res  = await fetch(pickedFile.uri);
          const blob = await res.blob();
          formData.append('document', blob, `verification_${Date.now()}.jpg`);
        } else {
          formData.append('document', { uri: pickedFile.uri, name: `verification_${Date.now()}.jpg`, type: 'image/jpeg' });
        }
        await api.verification.upload(formData);
      }
      /* Now commit to Zustand → switches navigator to PendingNavigator */
      await setSession(pendingToken, pendingUser);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────── RENDER ─────────────────────────── */
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.blob1} />
        <View style={styles.blob2} />

        {/* ── Header row ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={step === 2 ? () => setStep(1) : () => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={PRIMARY} />
          </TouchableOpacity>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Ionicons name="pizza" size={22} color={CARD} />
            </View>
          </View>
        </View>

        {/* ── Step indicator ── */}
        {needsVerification && (
          <View style={styles.stepIndicator}>
            {['Account Info', 'Verify ID'].map((label, i) => (
              <View key={label} style={styles.stepItem}>
                <View style={[styles.stepDot, i + 1 === step && styles.stepDotActive, i + 1 < step && styles.stepDotDone]}>
                  {i + 1 < step
                    ? <Ionicons name="checkmark" size={11} color={CARD} />
                    : <Text style={[styles.stepNum, i + 1 === step && styles.stepNumActive]}>{i + 1}</Text>
                  }
                </View>
                <Text style={[styles.stepLabel, i + 1 === step && styles.stepLabelActive]}>{label}</Text>
                {i < 1 && <View style={[styles.stepLine, step > 1 && styles.stepLineDone]} />}
              </View>
            ))}
          </View>
        )}

        {/* ── Title ── */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{step === 1 ? 'Create account' : 'Verify your identity'}</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Join thousands of students on CampusBite'
              : `Upload a valid ID for your ${form.role === 'vendor' ? 'Vendor' : 'Food Courier'} account`}
          </Text>
        </View>

        {/* ══════════════ STEP 1 ══════════════ */}
        {step === 1 && (
          <View style={styles.card}>
            <View style={styles.cardAccent} />

            <Text style={styles.sectionLabel}>I AM A</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity key={r.key} style={[styles.roleBtn, form.role === r.key && styles.roleBtnActive]} onPress={() => set('role', r.key)} activeOpacity={0.8}>
                  <Ionicons name={r.icon} size={20} color={form.role === r.key ? CARD : MUTED} />
                  <Text style={[styles.roleBtnLabel, form.role === r.key && styles.roleBtnLabelActive]}>{r.label}</Text>
                  <Text style={[styles.roleBtnDesc,  form.role === r.key && styles.roleBtnDescActive]}>{r.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>PERSONAL INFO</Text>
            <Field icon="person-outline"      placeholder="Full Name"               value={form.name}     onChangeText={(v) => set('name', v)} />
            <Field icon="mail-outline"        placeholder="Email address"           value={form.email}    onChangeText={(v) => set('email', v)}    keyboardType="email-address" autoCapitalize="none" />
            <Field icon="call-outline"        placeholder="Phone (e.g. 0712345678)" value={form.phone}    onChangeText={(v) => set('phone', v)}    keyboardType="phone-pad" autoCapitalize="none" />
            <Field icon="lock-closed-outline" placeholder="Password (min 6 chars)"  value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry />

            {form.role === 'vendor' && (
              <View>
                <Text style={styles.sectionLabel}>BUSINESS INFO</Text>
                <Field icon="storefront-outline" placeholder="Business Name"       value={form.business_name} onChangeText={(v) => set('business_name', v)} />
                <Field icon="location-outline"   placeholder="Location (optional)" value={form.location}      onChangeText={(v) => set('location', v)} />
                <Text style={styles.sectionLabel}>VENDOR TYPE</Text>
                <View style={styles.typeRow}>
                  {[{ key: 'home_based', label: 'Home Based', icon: 'home-outline' }, { key: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline' }].map((t) => (
                    <TouchableOpacity key={t.key} style={[styles.typeBtn, form.vendor_type === t.key && styles.typeBtnActive]} onPress={() => set('vendor_type', t.key)} activeOpacity={0.8}>
                      <Ionicons name={t.icon} size={18} color={form.vendor_type === t.key ? CARD : MUTED} />
                      <Text style={[styles.typeBtnText, form.vendor_type === t.key && styles.typeBtnTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {needsVerification && (
              <View style={styles.noticeBadge}>
                <Ionicons name="information-circle" size={14} color="#2563EB" />
                <Text style={styles.noticeText}>You'll upload your ID on the next step. Account requires admin approval before activation.</Text>
              </View>
            )}

            <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 8 }}>
              <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.8 }]} onPress={handleStep1} onPressIn={pressIn} onPressOut={pressOut} disabled={loading} activeOpacity={1}>
                {loading ? <ActivityIndicator color={CARD} size="small" /> : (
                  <View style={styles.submitInner}>
                    <Text style={styles.submitText}>{needsVerification ? 'Continue' : 'Create Account'}</Text>
                    <View style={styles.arrowBadge}>
                      <Ionicons name={needsVerification ? 'arrow-forward' : 'checkmark'} size={16} color={PRIMARY} />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* ══════════════ STEP 2 — Document Upload ══════════════ */}
        {step === 2 && (
          <View style={styles.card}>
            <View style={styles.cardAccent} />

            {/* Document type */}
            <Text style={styles.sectionLabel}>DOCUMENT TYPE</Text>
            <View style={styles.docTypeRow}>
              {DOC_TYPES.map((d) => (
                <TouchableOpacity key={d.key} style={[styles.docTypeBtn, docType === d.key && styles.docTypeBtnActive]} onPress={() => setDocType(d.key)} activeOpacity={0.8}>
                  <Ionicons name={d.icon} size={22} color={docType === d.key ? CARD : MUTED} />
                  <Text style={[styles.docTypeLabel, docType === d.key && styles.docTypeLabelActive]}>{d.label}</Text>
                  <Text style={[styles.docTypeDesc,  docType === d.key && styles.docTypeDescActive]} numberOfLines={2}>{d.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Upload area */}
            <Text style={styles.sectionLabel}>UPLOAD DOCUMENT</Text>
            {pickedFile ? (
              <View style={styles.previewBox}>
                <View style={styles.previewIcon}>
                  <Ionicons name="document-text" size={32} color={PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewName}>Document selected ✓</Text>
                  <Text style={styles.previewSize}>{Math.round((pickedFile.fileSize || 0) / 1024)} KB</Text>
                </View>
                <TouchableOpacity onPress={() => setPickedFile(null)}>
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadArea}>
                <View style={styles.uploadIconRing}>
                  <Ionicons name="cloud-upload-outline" size={30} color={PRIMARY} />
                </View>
                <Text style={styles.uploadTitle}>Upload your document</Text>
                <Text style={styles.uploadSub}>JPEG or PNG · Max 8 MB</Text>
                <View style={styles.uploadBtnRow}>
                  <TouchableOpacity style={styles.uploadBtn} onPress={pickFromGallery} activeOpacity={0.8}>
                    <Ionicons name="images-outline" size={17} color={PRIMARY} />
                    <Text style={styles.uploadBtnText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadBtn} onPress={pickFromCamera} activeOpacity={0.8}>
                    <Ionicons name="camera-outline" size={17} color={PRIMARY} />
                    <Text style={styles.uploadBtnText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Guidelines */}
            <View style={styles.guidelines}>
              {['Document must be valid and not expired', 'All four corners clearly visible', 'Text must be sharp and easy to read'].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle-outline" size={13} color="#10B981" />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Submit step 2 */}
            <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 8 }}>
              <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.8 }]} onPress={() => handleStep2(false)} onPressIn={pressIn} onPressOut={pressOut} disabled={loading} activeOpacity={1}>
                {loading ? <ActivityIndicator color={CARD} size="small" /> : (
                  <View style={styles.submitInner}>
                    <Ionicons name="cloud-upload" size={17} color={CARD} style={{ marginRight: 8 }} />
                    <Text style={styles.submitText}>{pickedFile ? 'Submit & Continue' : 'Continue without document'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            {pickedFile && (
              <TouchableOpacity onPress={() => handleStep2(true)} style={styles.skipRow} disabled={loading} activeOpacity={0.7}>
                <Text style={styles.skipText}>Skip for now</Text>
                <Ionicons name="arrow-forward" size={13} color={MUTED} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {step === 1 && (
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Text style={styles.loginLink}>Log in</Text>
          </TouchableOpacity>
        )}

        <View style={styles.blob3} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#FFF5F0' },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 52, paddingBottom: 48 },

  // ── Decorative blobs ──
  blob1: { position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: '#FDDCC8', opacity: 0.45 },
  blob2: { position: 'absolute', top: 50,  left: -70,  width: 150, height: 150, borderRadius: 75, backgroundColor: '#FDDCC8', opacity: 0.28 },
  blob3: { position: 'absolute', bottom: -60, right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: '#FDDCC8', opacity: 0.25 },

  // ── Header row ──
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20, zIndex: 1 },
  backBtn:   { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FDDCC8', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FCCEB4' },
  logoRing:  { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FDDCC8', alignItems: 'center', justifyContent: 'center', shadowColor: PRIMARY, shadowOpacity: 0.18, shadowRadius: 8, elevation: 3 },
  logoInner: { width: 42, height: 42, borderRadius: 21, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },

  // ── Title ──
  titleSection: { width: '100%', marginBottom: 20, zIndex: 1 },
  title:        { fontSize: 27, fontWeight: '800', color: TEXT, letterSpacing: -0.5, marginBottom: 4 },
  subtitle:     { fontSize: 14, color: SUBTEXT, fontWeight: '500' },

  // ── Card ──
  card: {
    width: '100%', backgroundColor: CARD, borderRadius: 28,
    paddingHorizontal: 22, paddingTop: 0, paddingBottom: 24,
    marginBottom: 20, overflow: 'hidden',
    shadowColor: '#C44D00', shadowOpacity: 0.09, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  cardAccent:   { height: 4, backgroundColor: PRIMARY, marginHorizontal: -22, marginBottom: 22 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: SUBTEXT, letterSpacing: 1.2, marginBottom: 10 },

  // ── Role selector ──
  roleRow: { flexDirection: 'row', columnGap: 8, marginBottom: 20 },
  roleBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: INPUT_BG,
  },
  roleBtnActive:      { backgroundColor: PRIMARY, borderColor: PRIMARY, shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  roleBtnLabel:       { fontSize: 11, fontWeight: '700', color: SUBTEXT, marginTop: 4 },
  roleBtnLabelActive: { color: CARD },
  roleBtnDesc:        { fontSize: 10, color: MUTED, marginTop: 1 },
  roleBtnDescActive:  { color: 'rgba(255,255,255,0.8)' },

  // ── Vendor type ──
  typeRow: { flexDirection: 'row', columnGap: 10, marginBottom: 14 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, backgroundColor: INPUT_BG,
  },
  typeBtnActive:    { backgroundColor: PRIMARY, borderColor: PRIMARY },
  typeBtnText:      { fontSize: 13, fontWeight: '700', color: SUBTEXT, marginLeft: 6 },
  typeBtnTextActive:{ color: CARD },

  // ── Submit ──
  submitBtn: {
    backgroundColor: PRIMARY, borderRadius: 16, paddingVertical: 17,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  submitInner: { flexDirection: 'row', alignItems: 'center' },
  submitText:  { color: CARD, fontSize: 17, fontWeight: '800', marginRight: 10, letterSpacing: 0.2 },
  arrowBadge:  { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },

  // ── Login link ──
  loginRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  loginText: { fontSize: 14, color: SUBTEXT },
  loginLink: { fontSize: 14, color: PRIMARY, fontWeight: '800' },

  // ── Approval notice ──
  noticeBadge: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#EFF6FF', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, marginTop: 12,
    borderWidth: 1, borderColor: '#BFDBFE', width: '100%',
  },
  noticeText: { fontSize: 12, color: '#1D4ED8', marginLeft: 8, flex: 1, lineHeight: 17, fontWeight: '500' },

  // ── Step indicator ──
  stepIndicator:  { flexDirection: 'row', alignItems: 'center', marginBottom: 18, zIndex: 1 },
  stepItem:       { flexDirection: 'row', alignItems: 'center' },
  stepDot:        { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  stepDotActive:  { backgroundColor: PRIMARY, shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  stepDotDone:    { backgroundColor: '#10B981' },
  stepNum:        { fontSize: 11, fontWeight: '700', color: MUTED },
  stepNumActive:  { color: CARD },
  stepLabel:      { fontSize: 11, color: MUTED, fontWeight: '600', marginLeft: 6 },
  stepLabelActive:{ color: PRIMARY, fontWeight: '700' },
  stepLine:       { width: 28, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 6 },
  stepLineDone:   { backgroundColor: '#10B981' },

  // ── Document type ──
  docTypeRow:          { flexDirection: 'row', columnGap: 12, marginBottom: 20 },
  docTypeBtn:          { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, backgroundColor: INPUT_BG },
  docTypeBtnActive:    { backgroundColor: PRIMARY, borderColor: PRIMARY, shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  docTypeLabel:        { fontSize: 12, fontWeight: '700', color: SUBTEXT, marginTop: 6, marginBottom: 2 },
  docTypeLabelActive:  { color: CARD },
  docTypeDesc:         { fontSize: 10, color: MUTED, textAlign: 'center', paddingHorizontal: 4 },
  docTypeDescActive:   { color: 'rgba(255,255,255,0.8)' },

  // ── Upload area ──
  uploadArea: {
    borderWidth: 2, borderColor: BORDER, borderStyle: 'dashed',
    borderRadius: 16, paddingVertical: 24, alignItems: 'center',
    backgroundColor: INPUT_BG, marginBottom: 16,
  },
  uploadIconRing: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF0E7', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  uploadTitle:    { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 4 },
  uploadSub:      { fontSize: 12, color: MUTED, marginBottom: 14 },
  uploadBtnRow:   { flexDirection: 'row', columnGap: 10 },
  uploadBtn:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: PRIMARY, backgroundColor: CARD },
  uploadBtnText:  { fontSize: 13, fontWeight: '700', color: PRIMARY, marginLeft: 6 },

  // ── Preview ──
  previewBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1.5, borderColor: '#86EFAC', padding: 12, marginBottom: 16 },
  previewIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  previewName: { fontSize: 14, fontWeight: '700', color: '#166534' },
  previewSize: { fontSize: 12, color: '#4ADE80', marginTop: 2 },

  // ── Guidelines ──
  guidelines: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 16 },
  tipRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  tipText:    { fontSize: 12, color: SUBTEXT, marginLeft: 6, flex: 1 },

  // ── Skip ──
  skipRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  skipText: { fontSize: 13, color: MUTED, fontWeight: '500' },
});
