import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, ScrollView, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../api';
import { COLORS } from '../../constants';

const DOC_TYPES = [
  { key: 'national_id', label: 'National ID', icon: 'card-outline',  desc: 'Front of your national identity card' },
  { key: 'passport',    label: 'Passport',    icon: 'book-outline',  desc: 'Photo page of your valid passport' },
];

export default function VerificationScreen({ navigation, route }) {
  const role = route?.params?.role || 'vendor';

  const [docType, setDocType]       = useState('national_id');
  const [idFile, setIdFile]         = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [uploading, setUploading]   = useState(false);
  const btnScale                    = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

  const requestGalleryPermission = async () => {
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
    const ok = await requestGalleryPermission();
    if (!ok) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length > 0) setter(result.assets[0]);
  };

  const handleUpload = async () => {
    if (!selfieFile) {
      Alert.alert('Photo required', 'Please upload your passport-sized photo (selfie).');
      return;
    }
    if (!idFile) {
      Alert.alert('ID required', 'Please upload your identity document.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document_type', docType);

      const appendFile = async (field, file) => {
        if (Platform.OS === 'web') {
          const res  = await fetch(file.uri);
          const blob = await res.blob();
          formData.append(field, blob, `${field}_${Date.now()}.jpg`);
        } else {
          formData.append(field, { uri: file.uri, name: `${field}_${Date.now()}.jpg`, type: 'image/jpeg' });
        }
      };

      await appendFile('passport_photo', selfieFile);
      await appendFile('document',       idFile);

      await api.verification.upload(formData);

      Alert.alert(
        'Documents submitted ✓',
        'Your documents have been sent for review. You will be notified once your account is approved.',
        [{ text: 'Continue', onPress: () => navigation.replace('Login') }]
      );
    } catch (err) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  const skip = () => {
    Alert.alert(
      'Skip verification?',
      'You can upload your documents later. Note: your account requires admin approval before you can use the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip for now', onPress: () => navigation.replace('Login') },
      ]
    );
  };

  const roleLabel = role === 'food_courier' ? 'Food Courier' : 'Vendor';

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.blobTopRight} />
        <View style={styles.blobTopLeft} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.card} />
            </View>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Verify your identity</Text>
          <Text style={styles.subtitle}>
            As a <Text style={styles.roleChip}>{roleLabel}</Text>, we need to confirm your identity before activating your account.
          </Text>
        </View>

        {/* Steps */}
        <View style={styles.stepsRow}>
          {['Register', 'Verify', 'Get Approved'].map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, i === 1 && styles.stepDotActive, i < 1 && styles.stepDotDone]}>
                {i < 1
                  ? <Ionicons name="checkmark" size={12} color={COLORS.card} />
                  : <Text style={[styles.stepNum, i === 1 && styles.stepNumActive]}>{i + 1}</Text>
                }
              </View>
              <Text style={[styles.stepLabel, i === 1 && styles.stepLabelActive]}>{s}</Text>
              {i < 2 && <View style={[styles.stepLine, i < 1 && styles.stepLineDone]} />}
            </View>
          ))}
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.cardAccent} />

          {/* ── Section 1: Passport-sized selfie ── */}
          <Text style={styles.sectionLabel}>PASSPORT-SIZED PHOTO (SELFIE)</Text>
          <Text style={styles.sectionHint}>A clear photo of your face — look straight at the camera, no sunglasses or filters.</Text>
          <FileUploadBox
            file={selfieFile}
            onClear={() => setSelfieFile(null)}
            onGallery={() => pickFile(setSelfieFile)}
            onCamera={() => pickFile(setSelfieFile, true)}
            icon="person-circle-outline"
            label="Upload your selfie"
          />

          {/* ── Section 2: ID document ── */}
          <Text style={[styles.sectionLabel, { marginTop: 18 }]}>IDENTITY DOCUMENT</Text>
          <Text style={styles.sectionHint}>Upload your government-issued ID or passport. All four corners must be visible.</Text>
          <View style={styles.docTypeRow}>
            {DOC_TYPES.map((d) => (
              <TouchableOpacity
                key={d.key}
                style={[styles.docTypeBtn, docType === d.key && styles.docTypeBtnActive]}
                onPress={() => setDocType(d.key)}
                activeOpacity={0.8}
              >
                <Ionicons name={d.icon} size={20} color={docType === d.key ? COLORS.card : COLORS.muted} />
                <Text style={[styles.docTypeLabel, docType === d.key && styles.docTypeLabelActive]}>{d.label}</Text>
                <Text style={[styles.docTypeDesc,  docType === d.key && styles.docTypeDescActive]} numberOfLines={2}>{d.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FileUploadBox
            file={idFile}
            onClear={() => setIdFile(null)}
            onGallery={() => pickFile(setIdFile)}
            onCamera={() => pickFile(setIdFile, true)}
            icon="card-outline"
            label="Upload your ID document"
          />

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
          <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.submitBtn, (!selfieFile || !idFile || uploading) && styles.submitBtnDisabled]}
              onPress={handleUpload}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={!selfieFile || !idFile || uploading}
              activeOpacity={1}
            >
              {uploading ? (
                <ActivityIndicator color={COLORS.card} size="small" />
              ) : (
                <View style={styles.submitInner}>
                  <Ionicons name="cloud-upload" size={18} color={COLORS.card} style={{ marginRight: 8 }} />
                  <Text style={styles.submitText}>Submit for Verification</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        <TouchableOpacity onPress={skip} activeOpacity={0.7} style={styles.skipRow}>
          <Text style={styles.skipText}>I'll do this later</Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.muted} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <View style={styles.blobBottom} />
      </ScrollView>
    </View>
  );
}

// ── File upload box ───────────────────────────────────────────────────────────

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

  header:    { alignItems: 'center', marginBottom: 20, zIndex: 1 },
  logoRing:  { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.blob, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  logoInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },

  titleSection: { width: '100%', alignItems: 'center', marginBottom: 24, zIndex: 1 },
  title:        { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 8, textAlign: 'center' },
  subtitle:     { fontSize: 14, color: COLORS.subtext, textAlign: 'center', lineHeight: 20 },
  roleChip:     { fontWeight: '700', color: COLORS.primary },

  stepsRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 28, zIndex: 1 },
  stepItem:        { flexDirection: 'row', alignItems: 'center' },
  stepDot:         { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive:   { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  stepDotDone:     { backgroundColor: COLORS.success },
  stepNum:         { fontSize: 11, fontWeight: '700', color: COLORS.muted },
  stepNumActive:   { color: COLORS.card },
  stepLabel:       { fontSize: 10, color: COLORS.muted, fontWeight: '600', marginLeft: 6 },
  stepLabelActive: { color: COLORS.primary, fontWeight: '700' },
  stepLine:        { width: 28, height: 2, backgroundColor: COLORS.border, marginHorizontal: 4 },
  stepLineDone:    { backgroundColor: COLORS.success },

  card: {
    width: '100%', backgroundColor: COLORS.card, borderRadius: 28,
    paddingHorizontal: 22, paddingTop: 0, paddingBottom: 24,
    marginBottom: 16, overflow: 'hidden',
    shadowColor: COLORS.primary, shadowOpacity: 0.10, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  cardAccent:   { height: 5, backgroundColor: COLORS.primary, marginHorizontal: -22, marginBottom: 22 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: COLORS.subtext, letterSpacing: 1.2, marginBottom: 4 },
  sectionHint:  { fontSize: 12, color: COLORS.muted, marginBottom: 10, lineHeight: 17 },

  docTypeRow:         { flexDirection: 'row', columnGap: 12, marginBottom: 14 },
  docTypeBtn:         { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.borderWarm, backgroundColor: COLORS.inputBg },
  docTypeBtnActive:   { backgroundColor: COLORS.primary, borderColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  docTypeLabel:       { fontSize: 11, fontWeight: '700', color: COLORS.subtext, marginTop: 5, marginBottom: 2 },
  docTypeLabelActive: { color: COLORS.card },
  docTypeDesc:        { fontSize: 9, color: COLORS.muted, textAlign: 'center', paddingHorizontal: 4 },
  docTypeDescActive:  { color: 'rgba(255,255,255,0.8)' },

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

  guidelines:      { backgroundColor: COLORS.inputBg, borderRadius: 12, padding: 12, marginTop: 16, marginBottom: 18 },
  guidelinesTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  tipRow:          { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  tipText:         { fontSize: 11, color: COLORS.subtext, marginLeft: 6, flex: 1 },

  submitBtn:         { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  submitBtnDisabled: { backgroundColor: COLORS.blob, shadowOpacity: 0 },
  submitInner:       { flexDirection: 'row', alignItems: 'center' },
  submitText:        { color: COLORS.card, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  skipRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  skipText: { fontSize: 13, color: COLORS.muted, fontWeight: '500' },
});
