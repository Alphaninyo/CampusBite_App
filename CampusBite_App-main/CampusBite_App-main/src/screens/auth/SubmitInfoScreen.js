import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, ScrollView, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../api';
import { COLORS } from '../../constants';


export default function SubmitInfoScreen({ navigation, route }) {
  const { email, password, adminNote, role, requestedDocs: paramDocs, useAuthFlow } = route?.params || {};

  // Whether the admin explicitly specified which docs are needed
  const hasExplicitDocs = Array.isArray(paramDocs) && paramDocs.length > 0;
  const requestedDocs   = hasExplicitDocs
    ? paramDocs
    : ['passport_photo', 'national_id', 'passport'];

  const wantSelfie     = requestedDocs.includes('passport_photo');
  const wantNationalId = requestedDocs.includes('national_id');
  const wantPassport   = requestedDocs.includes('passport');
  const wantId         = wantNationalId || wantPassport;

  // Only block submit on a specific section when admin explicitly requested it.
  // If falling back (no explicit docs), just require at least one file.
  const requireSelfie = hasExplicitDocs && wantSelfie;
  const requireId     = hasExplicitDocs && wantId;

  const docType = wantPassport && !wantNationalId ? 'passport' : 'national_id';
  const [idFile, setIdFile]               = useState(null);
  const [selfieFile, setSelfieFile]       = useState(null);
  const [uploading, setUploading]         = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const [submitError, setSubmitError]     = useState('');
  const btnScale                          = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library.');
        return false;
      }
    }
    return true;
  };

  const pickFile = async (setter, useCamera = false) => {
    if (useCamera) {
      if (Platform.OS === 'web') {
        Alert.alert('Not supported', 'Camera is not available on web. Please upload from gallery.');
        return;
      }
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your camera.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
      if (!result.canceled && result.assets?.length > 0) setter(result.assets[0]);
      return;
    }
    const ok = await requestPermission();
    if (!ok) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length > 0) setter(result.assets[0]);
  };

  const handleSubmit = async () => {
    setSubmitError('');
    if (requireSelfie && !selfieFile) {
      setSubmitError('Please upload your passport-sized photo.');
      return;
    }
    if (requireId && !idFile) {
      setSubmitError('Please upload your identity document.');
      return;
    }
    if (!selfieFile && !idFile) {
      setSubmitError('Please upload at least one document.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();

      const appendFile = async (field, file) => {
        if (!file) return;
        if (Platform.OS === 'web') {
          const res  = await fetch(file.uri);
          const blob = await res.blob();
          formData.append(field, blob, `${field}_${Date.now()}.jpg`);
        } else {
          formData.append(field, { uri: file.uri, name: `${field}_${Date.now()}.jpg`, type: 'image/jpeg' });
        }
      };

      await appendFile('document',       idFile);
      await appendFile('passport_photo', selfieFile);

      if (useAuthFlow) {
        if (idFile) formData.append('document_type', docType);
        await api.verification.upload(formData);
      } else {
        formData.append('email', email);
        formData.append('password', password);
        formData.append('document_type', docType);
        await api.verification.submitInfo(formData);
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const roleLabel = role === 'food_courier' ? 'Food Courier' : 'Vendor';

  if (submitted) {
    return (
      <View style={styles.root}>
        <View style={styles.successRoot}>
          <View style={styles.successIconRing}>
            <Ionicons name="checkmark-circle" size={72} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Submitted!</Text>
          <Text style={styles.successMsg}>
            Your documents have been sent to the admin for review.{'\n'}
            You will be notified once your account is approved.
          </Text>
          <View style={styles.successSteps}>
            {[
              { icon: 'time-outline',            text: 'Admin will review your documents' },
              { icon: 'notifications-outline',   text: 'You\'ll be notified of the decision' },
              { icon: 'checkmark-circle-outline',text: 'Once approved, you can log in' },
            ].map((s, i) => (
              <View key={i} style={styles.successStep}>
                <View style={styles.successStepIcon}>
                  <Ionicons name={s.icon} size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.successStepText}>{s.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={18} color={COLORS.card} />
            <Text style={styles.successBtnText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.blobTopRight} />
        <View style={styles.blobTopLeft} />

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Header icon */}
        <View style={styles.header}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Ionicons name="cloud-upload" size={22} color={COLORS.card} />
            </View>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>Submit Required Information</Text>
          <Text style={styles.subtitle}>
            Complete your <Text style={styles.roleChip}>{roleLabel}</Text> application by providing the documents below.
          </Text>
        </View>

        {/* Admin note banner */}
        {adminNote ? (
          <View style={styles.noteBanner}>
            <View style={styles.noteIconWrap}>
              <Ionicons name="information-circle" size={20} color={COLORS.infoText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.noteTitle}>Admin's note</Text>
              <Text style={styles.noteText}>{adminNote}</Text>
            </View>
          </View>
        ) : null}

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.cardAccent} />

          {/* ── Selfie / Passport photo ── */}
          {wantSelfie && (
            <>
              <Text style={styles.sectionLabel}>PASSPORT-SIZED PHOTO (SELFIE)</Text>
              <Text style={styles.sectionHint}>A clear photo of your face — look straight at the camera, no sunglasses.</Text>
              <FileUploadBox
                file={selfieFile}
                onClear={() => setSelfieFile(null)}
                onGallery={() => pickFile(setSelfieFile)}
                onCamera={() => pickFile(setSelfieFile, true)}
                icon="person-circle-outline"
                label="Upload your photo"
              />
            </>
          )}

          {/* ── National ID ── */}
          {wantNationalId && (
            <>
              <Text style={[styles.sectionLabel, wantSelfie ? { marginTop: 16 } : {}]}>NATIONAL ID</Text>
              <Text style={styles.sectionHint}>Front of your national identity card — all four corners visible, no glare.</Text>
              <FileUploadBox
                file={idFile}
                onClear={() => setIdFile(null)}
                onGallery={() => pickFile(setIdFile)}
                onCamera={() => pickFile(setIdFile, true)}
                icon="card-outline"
                label="Upload your National ID"
              />
            </>
          )}

          {/* ── Passport (document) ── */}
          {wantPassport && (
            <>
              <Text style={[styles.sectionLabel, (wantSelfie || wantNationalId) ? { marginTop: 16 } : {}]}>PASSPORT</Text>
              <Text style={styles.sectionHint}>Photo page of your valid passport — all four corners visible.</Text>
              <FileUploadBox
                file={idFile}
                onClear={() => setIdFile(null)}
                onGallery={() => pickFile(setIdFile)}
                onCamera={() => pickFile(setIdFile, true)}
                icon="book-outline"
                label="Upload your Passport"
              />
            </>
          )}

          {/* Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Photo guidelines</Text>
            {[
              'Selfie: face clearly visible, no filters or masks',
              'ID: all four corners visible, no glare',
              'Documents must not be expired',
              'Maximum file size: 8 MB per photo',
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Ionicons name="checkmark-circle-outline" size={13} color={COLORS.success} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Submit */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.submitBtn, (uploading || (requireSelfie && !selfieFile) || (requireId && !idFile) || (!selfieFile && !idFile)) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={uploading || (requireSelfie && !selfieFile) || (requireId && !idFile) || (!selfieFile && !idFile)}
              activeOpacity={1}
            >
              {uploading ? (
                <ActivityIndicator color={COLORS.card} size="small" />
              ) : (
                <View style={styles.submitInner}>
                  <Ionicons name="cloud-upload" size={17} color={COLORS.card} style={{ marginRight: 8 }} />
                  <Text style={styles.submitText}>Submit to Admin</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {submitError ? (
            <View style={styles.submitErrorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={COLORS.danger} />
              <Text style={styles.submitErrorText}>{submitError}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7} style={styles.backToLogin}>
          <Ionicons name="arrow-back" size={14} color={COLORS.muted} />
          <Text style={styles.backToLoginText}>Back to Login</Text>
        </TouchableOpacity>

        <View style={styles.blobBottom} />
      </ScrollView>
    </View>
  );
}

// ── File upload box helper ────────────────────────────────────────────────────

function FileUploadBox({ file, onClear, onGallery, onCamera, icon, label }) {
  if (file) {
    return (
      <View style={styles.previewBox}>
        <View style={styles.previewIcon}>
          <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.previewName}>File selected ✓</Text>
          <Text style={styles.previewSize}>{Math.round((file.fileSize || 0) / 1024)} KB</Text>
        </View>
        <TouchableOpacity onPress={onClear} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={22} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.uploadArea}>
      <View style={styles.uploadIconRing}>
        <Ionicons name={icon} size={28} color={COLORS.primary} />
      </View>
      <Text style={styles.uploadTitle}>{label}</Text>
      <Text style={styles.uploadSub}>JPEG or PNG · Max 8 MB</Text>
      <View style={styles.uploadBtnRow}>
        <TouchableOpacity style={styles.uploadBtn} onPress={onGallery} activeOpacity={0.8}>
          <Ionicons name="images-outline" size={16} color={COLORS.primary} />
          <Text style={styles.uploadBtnText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadBtn} onPress={onCamera} activeOpacity={0.8}>
          <Ionicons name="camera-outline" size={16} color={COLORS.primary} />
          <Text style={styles.uploadBtnText}>Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.backgroundAlt },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 50, paddingBottom: 48 },

  blobTopRight: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: COLORS.blob, opacity: 0.55 },
  blobTopLeft:  { position: 'absolute', top: 40,  left: -80,  width: 160, height: 160, borderRadius: 80,  backgroundColor: COLORS.blob, opacity: 0.35 },
  blobBottom:   { position: 'absolute', bottom: -80, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.blob, opacity: 0.3 },

  backBtn:   { alignSelf: 'flex-start', marginBottom: 8, padding: 4 },
  header:    { alignItems: 'center', marginBottom: 16, zIndex: 1 },
  logoRing:  { width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.blob, alignItems: 'center', justifyContent: 'center' },
  logoInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },

  titleSection: { width: '100%', alignItems: 'center', marginBottom: 16, zIndex: 1 },
  title:        { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 6, textAlign: 'center' },
  subtitle:     { fontSize: 13, color: COLORS.subtext, textAlign: 'center', lineHeight: 19 },
  roleChip:     { fontWeight: '700', color: COLORS.primary },

  // Admin note banner
  noteBanner: {
    width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.infoBg, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.infoBorder,
    padding: 12, marginBottom: 16,
  },
  noteIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.infoBg, alignItems: 'center', justifyContent: 'center' },
  noteTitle:    { fontSize: 12, fontWeight: '800', color: COLORS.infoText, marginBottom: 3 },
  noteText:     { fontSize: 13, color: COLORS.infoText, lineHeight: 18 },

  // Card
  card: {
    width: '100%', backgroundColor: COLORS.card, borderRadius: 28,
    paddingHorizontal: 20, paddingTop: 0, paddingBottom: 24,
    marginBottom: 16, overflow: 'hidden',
    shadowColor: COLORS.primary, shadowOpacity: 0.10, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  cardAccent:    { height: 5, backgroundColor: COLORS.primary, marginHorizontal: -20, marginBottom: 20 },
  sectionLabel:  { fontSize: 10, fontWeight: '700', color: COLORS.subtext, letterSpacing: 1.2, marginBottom: 4 },
  sectionHint:   { fontSize: 12, color: COLORS.muted, marginBottom: 10, lineHeight: 17 },

  // Upload area
  uploadArea: {
    borderWidth: 2, borderColor: COLORS.borderWarm, borderStyle: 'dashed',
    borderRadius: 14, paddingVertical: 22, alignItems: 'center',
    backgroundColor: COLORS.inputBg, marginBottom: 4,
  },
  uploadIconRing: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.iconBg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  uploadTitle:    { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  uploadSub:      { fontSize: 11, color: COLORS.muted, marginBottom: 14 },
  uploadBtnRow:   { flexDirection: 'row', columnGap: 10 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.card,
  },
  uploadBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginLeft: 5 },

  // Preview
  previewBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.successBg, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.successBorder,
    padding: 12, marginBottom: 4,
  },
  previewIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: COLORS.successIconBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  previewName: { fontSize: 13, fontWeight: '700', color: COLORS.successText },
  previewSize: { fontSize: 11, color: COLORS.success, marginTop: 2 },
  removeBtn:   { padding: 4 },

  // Guidelines
  guidelines:      { backgroundColor: COLORS.inputBg, borderRadius: 12, padding: 12, marginTop: 16, marginBottom: 18 },
  guidelinesTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  tipRow:          { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  tipText:         { fontSize: 11, color: COLORS.subtext, marginLeft: 6, flex: 1 },

  // Submit
  submitBtn:         { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  submitBtnDisabled: { backgroundColor: COLORS.blob, shadowOpacity: 0 },
  submitInner:       { flexDirection: 'row', alignItems: 'center' },
  submitText:        { color: COLORS.card, fontSize: 15, fontWeight: '800' },

  submitErrorBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginTop: 10 },
  submitErrorText: { flex: 1, fontSize: 13, color: COLORS.danger, fontWeight: '500' },

  // Back link
  backToLogin: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  backToLoginText: { fontSize: 13, color: COLORS.muted, fontWeight: '500' },

  // Success screen
  successRoot: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, backgroundColor: COLORS.backgroundAlt,
  },
  successIconRing: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.successBg,
    borderWidth: 2, borderColor: COLORS.successBorder,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 32, fontWeight: '800', color: COLORS.text,
    letterSpacing: -0.5, marginBottom: 12, textAlign: 'center',
  },
  successMsg: {
    fontSize: 14, color: COLORS.subtext, textAlign: 'center',
    lineHeight: 22, marginBottom: 32,
  },
  successSteps: {
    width: '100%', backgroundColor: COLORS.card, borderRadius: 16,
    padding: 16, gap: 14, marginBottom: 32,
    shadowColor: COLORS.primary, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  successStep:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  successStepIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.iconBg, alignItems: 'center', justifyContent: 'center',
  },
  successStepText: { fontSize: 13, color: COLORS.subtext, flex: 1, lineHeight: 18 },
  successBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 15, paddingHorizontal: 32,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  successBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.card },
});
