import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, ScrollView, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../api';

const PRIMARY  = '#E85D04';
const BG       = '#FEF3ED';
const CARD     = '#FFFFFF';
const MUTED    = '#9CA3AF';
const TEXT     = '#111827';
const SUBTEXT  = '#6B7280';
const BORDER   = '#F3E8E2';

const DOC_TYPES = [
  { key: 'national_id', label: 'National ID',  icon: 'card-outline',    desc: 'Front + back of your national identity card' },
  { key: 'passport',    label: 'Passport',      icon: 'book-outline',    desc: 'Photo page of your valid passport' },
];

export default function VerificationScreen({ navigation, route }) {
  const role                          = route?.params?.role || 'vendor';
  const [docType, setDocType]         = useState('national_id');
  const [pickedFile, setPickedFile]   = useState(null);
  const [uploading, setUploading]     = useState(false);
  const btnScale                      = useRef(new Animated.Value(1)).current;

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

  const pickFromGallery = async () => {
    const ok = await requestPermission();
    if (!ok) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setPickedFile(result.assets[0]);
    }
  };

  const pickFromCamera = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'Camera is not available on web. Please upload from gallery.');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your camera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setPickedFile(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!pickedFile) return Alert.alert('No document', 'Please pick a document image first.');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document_type', docType);

      if (Platform.OS === 'web') {
        const response = await fetch(pickedFile.uri);
        const blob     = await response.blob();
        formData.append('document', blob, `verification_${Date.now()}.jpg`);
      } else {
        formData.append('document', {
          uri:  pickedFile.uri,
          name: `verification_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
      }

      await api.verification.upload(formData);
      Alert.alert(
        'Document submitted ✓',
        'Your verification document has been sent for review. You can start using the app while we verify your account.',
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
      'You can upload your document later from your profile settings. Note: your account requires admin approval to be fully active.',
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

        {/* Blobs */}
        <View style={styles.blobTopRight} />
        <View style={styles.blobTopLeft} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Ionicons name="shield-checkmark" size={24} color={CARD} />
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

        {/* Steps indicator */}
        <View style={styles.stepsRow}>
          {['Register', 'Verify', 'Get Approved'].map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, i === 1 && styles.stepDotActive, i < 1 && styles.stepDotDone]}>
                {i < 1
                  ? <Ionicons name="checkmark" size={12} color={CARD} />
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

          {/* Document type */}
          <Text style={styles.sectionLabel}>DOCUMENT TYPE</Text>
          <View style={styles.docTypeRow}>
            {DOC_TYPES.map((d) => (
              <TouchableOpacity
                key={d.key}
                style={[styles.docTypeBtn, docType === d.key && styles.docTypeBtnActive]}
                onPress={() => setDocType(d.key)}
                activeOpacity={0.8}
              >
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
                <Ionicons name="document-text" size={36} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewName} numberOfLines={1}>Document selected ✓</Text>
                <Text style={styles.previewSize}>{Math.round((pickedFile.fileSize || 0) / 1024)} KB</Text>
              </View>
              <TouchableOpacity onPress={() => setPickedFile(null)} style={styles.removeBtn}>
                <Ionicons name="close-circle" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadArea}>
              <View style={styles.uploadIconRing}>
                <Ionicons name="cloud-upload-outline" size={32} color={PRIMARY} />
              </View>
              <Text style={styles.uploadTitle}>Upload your document</Text>
              <Text style={styles.uploadSub}>JPEG, PNG or PDF · Max 8 MB</Text>
              <View style={styles.uploadBtnRow}>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickFromGallery} activeOpacity={0.8}>
                  <Ionicons name="images-outline" size={18} color={PRIMARY} />
                  <Text style={styles.uploadBtnText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickFromCamera} activeOpacity={0.8}>
                  <Ionicons name="camera-outline" size={18} color={PRIMARY} />
                  <Text style={styles.uploadBtnText}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Document guidelines</Text>
            {[
              'Document must be valid and not expired',
              'All four corners must be clearly visible',
              'Text must be sharp and easy to read',
              'No glare or heavy shadows on the image',
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Submit */}
          <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.submitBtn, (!pickedFile || uploading) && styles.submitBtnDisabled]}
              onPress={handleUpload}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={!pickedFile || uploading}
              activeOpacity={1}
            >
              {uploading ? (
                <ActivityIndicator color={CARD} size="small" />
              ) : (
                <View style={styles.submitInner}>
                  <Ionicons name="cloud-upload" size={18} color={CARD} style={{ marginRight: 8 }} />
                  <Text style={styles.submitText}>Submit for Verification</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Skip */}
        <TouchableOpacity onPress={skip} activeOpacity={0.7} style={styles.skipRow}>
          <Text style={styles.skipText}>I'll do this later</Text>
          <Ionicons name="arrow-forward" size={14} color={MUTED} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <View style={styles.blobBottom} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 50, paddingBottom: 48 },

  blobTopRight: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: '#FDDCC8', opacity: 0.55 },
  blobTopLeft:  { position: 'absolute', top: 40, left: -80,   width: 160, height: 160, borderRadius: 80,  backgroundColor: '#FDDCC8', opacity: 0.35 },
  blobBottom:   { position: 'absolute', bottom: -80, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: '#FDDCC8', opacity: 0.3 },

  header:    { alignItems: 'center', marginBottom: 20, zIndex: 1 },
  logoRing:  { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FDDCC8', alignItems: 'center', justifyContent: 'center', shadowColor: PRIMARY, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  logoInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },

  titleSection: { width: '100%', alignItems: 'center', marginBottom: 24, zIndex: 1 },
  title:        { fontSize: 26, fontWeight: '800', color: TEXT, letterSpacing: -0.5, marginBottom: 8, textAlign: 'center' },
  subtitle:     { fontSize: 14, color: SUBTEXT, textAlign: 'center', lineHeight: 20 },
  roleChip:     { fontWeight: '700', color: PRIMARY },

  // Steps
  stepsRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 28, zIndex: 1 },
  stepItem:       { flexDirection: 'row', alignItems: 'center' },
  stepDot:        { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  stepDotActive:  { backgroundColor: PRIMARY, shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  stepDotDone:    { backgroundColor: '#10B981' },
  stepNum:        { fontSize: 11, fontWeight: '700', color: MUTED },
  stepNumActive:  { color: CARD },
  stepLabel:      { fontSize: 10, color: MUTED, fontWeight: '600', marginLeft: 6 },
  stepLabelActive:{ color: PRIMARY, fontWeight: '700' },
  stepLine:       { width: 28, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  stepLineDone:   { backgroundColor: '#10B981' },

  // Card
  card: {
    width: '100%', backgroundColor: CARD, borderRadius: 28,
    paddingHorizontal: 22, paddingTop: 0, paddingBottom: 24,
    marginBottom: 16, overflow: 'hidden',
    shadowColor: '#C44D00', shadowOpacity: 0.10, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  cardAccent:   { height: 5, backgroundColor: PRIMARY, marginHorizontal: -22, marginBottom: 22 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: SUBTEXT, letterSpacing: 1.2, marginBottom: 10 },

  // Document type
  docTypeRow:          { flexDirection: 'row', columnGap: 12, marginBottom: 22 },
  docTypeBtn:          { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#FBF7F5' },
  docTypeBtnActive:    { backgroundColor: PRIMARY, borderColor: PRIMARY, shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  docTypeLabel:        { fontSize: 12, fontWeight: '700', color: SUBTEXT, marginTop: 6, marginBottom: 2 },
  docTypeLabelActive:  { color: CARD },
  docTypeDesc:         { fontSize: 10, color: MUTED, textAlign: 'center', paddingHorizontal: 4 },
  docTypeDescActive:   { color: 'rgba(255,255,255,0.8)' },

  // Upload area
  uploadArea: {
    borderWidth: 2, borderColor: BORDER, borderStyle: 'dashed',
    borderRadius: 16, paddingVertical: 28, alignItems: 'center',
    backgroundColor: '#FBF7F5', marginBottom: 20,
  },
  uploadIconRing: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF0E7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  uploadTitle:    { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 4 },
  uploadSub:      { fontSize: 12, color: MUTED, marginBottom: 16 },
  uploadBtnRow:   { flexDirection: 'row', columnGap: 12 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5, borderColor: PRIMARY, backgroundColor: CARD,
  },
  uploadBtnText: { fontSize: 13, fontWeight: '700', color: PRIMARY, marginLeft: 6 },

  // Preview
  previewBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FDF4', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#86EFAC',
    padding: 14, marginBottom: 20,
  },
  previewIcon: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  previewName: { fontSize: 14, fontWeight: '700', color: '#166534' },
  previewSize: { fontSize: 12, color: '#4ADE80', marginTop: 2 },
  removeBtn:   { padding: 4 },

  // Guidelines
  guidelines:      { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 20 },
  guidelinesTitle: { fontSize: 12, fontWeight: '700', color: TEXT, marginBottom: 10 },
  tipRow:          { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  tipText:         { fontSize: 12, color: SUBTEXT, marginLeft: 8, flex: 1 },

  // Submit
  submitBtn:         { backgroundColor: PRIMARY, borderRadius: 16, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  submitBtnDisabled: { backgroundColor: '#FDDCC8', shadowOpacity: 0 },
  submitInner:       { flexDirection: 'row', alignItems: 'center' },
  submitText:        { color: CARD, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  // Skip
  skipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  skipText: { fontSize: 13, color: MUTED, fontWeight: '500' },
});
