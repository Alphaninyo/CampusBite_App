import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Switch, Alert, Modal, ActivityIndicator, Image,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../api';
import { COLORS, resolveImageUrl } from '../../constants';
import useAuthStore from '../../stores/authStore';

// updateMode: 'id' | 'photo' | null
export default function AppSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [verification, setVerification] = useState(null);
  const [updateMode, setUpdateMode] = useState(null);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('national_id');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [viewUrl, setViewUrl] = useState(null);

  useEffect(() => {
    api.verification.getStatus()
      .then(({ data }) => setVerification(data.verification))
      .catch(() => {});
  }, []);

  const openUpdate = (mode) => {
    setFile(null);
    setUploadError('');
    setUploadSuccess(false);
    setUpdateMode(mode);
  };

  const pickFile = async (useCamera = false) => {
    if (useCamera) {
      if (Platform.OS === 'web') { Alert.alert('Not supported', 'Camera not available on web.'); return; }
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission required', 'Allow camera access.'); return; }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
      if (!result.canceled && result.assets?.length > 0) setFile(result.assets[0]);
      return;
    }
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission required', 'Allow photo library access.'); return; }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length > 0) setFile(result.assets[0]);
  };

  const handleUpload = async () => {
    setUploadError('');
    if (!file) { setUploadError('Please select a file first.'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      const fieldName = updateMode === 'id' ? 'document' : 'passport_photo';
      if (updateMode === 'id') formData.append('document_type', docType);
      if (Platform.OS === 'web') {
        const res = await fetch(file.uri);
        const blob = await res.blob();
        formData.append(fieldName, blob, `${fieldName}_${Date.now()}.jpg`);
      } else {
        formData.append(fieldName, { uri: file.uri, name: `${fieldName}_${Date.now()}.jpg`, type: 'image/jpeg' });
      }
      await api.verification.upload(formData);
      setVerification(v => ({ ...v, verification_status: 'pending' }));
      setUploadSuccess(true);
      setFile(null);
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => await logout() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This action cannot be undone. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Info', 'Account deletion requires contacting support.') },
    ]);
  };

  const statusColor = (s) =>
    s === 'approved'       ? COLORS.success :
    s === 'pending'        ? COLORS.warning :
    s === 'info_requested' ? '#F59E0B' : COLORS.danger;

  const statusLabel = (s) =>
    s === 'approved'       ? 'Approved' :
    s === 'pending'        ? 'Pending admin review' :
    s === 'info_requested' ? 'Admin requested info' : 'Not submitted';

  const idDocLabel = verification?.verification_type === 'passport' ? 'Passport (ID Document)' : 'National ID';
  const idDocUrl   = resolveImageUrl(verification?.verification_document);
  const photoUrl   = resolveImageUrl(verification?.passport_photo);
  const modalTitle = updateMode === 'id' ? `Update ${idDocLabel}` : 'Update Passport Sized Photo';

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        { icon: 'notifications-outline', label: 'Push Notifications', value: notificationsEnabled, onToggle: setNotificationsEnabled },
        { icon: 'mail-outline', label: 'Email Notifications', value: true, onToggle: () => Alert.alert('Info', 'Email notifications are managed in your account settings.') },
      ],
    },
    {
      title: 'Location',
      items: [
        { icon: 'location-outline', label: 'Location Services', value: locationEnabled, onToggle: setLocationEnabled },
      ],
    },
    {
      title: 'Appearance',
      items: [
        { icon: 'moon-outline', label: 'Dark Mode', value: darkMode, onToggle: setDarkMode },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile', { user }), showArrow: true },
        { icon: 'lock-closed-outline', label: 'Change Password', onPress: () => Alert.alert('Change Password', 'Password reset link will be sent to your email.'), showArrow: true },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'information-circle-outline', label: 'App Version', value: '1.0.0', showArrow: false },
        { icon: 'document-text-outline', label: 'Terms of Service', onPress: () => Alert.alert('Terms', 'Terms of Service content here.'), showArrow: true },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', onPress: () => Alert.alert('Privacy', 'Privacy Policy content here.'), showArrow: true },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Verification Documents ── */}
        <Text style={styles.sectionTitle} onStartShouldSetResponder={() => true}>VERIFICATION DOCUMENTS</Text>

        {/* Status banner */}
        <View style={styles.statusBanner}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(verification?.verification_status) }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitleText}>Document Status</Text>
            <Text style={[styles.statusValue, { color: statusColor(verification?.verification_status) }]}>
              {statusLabel(verification?.verification_status)}
            </Text>
          </View>
        </View>

        {verification?.verification_status === 'info_requested' && verification?.admin_note && (
          <View style={styles.adminNote}>
            <Ionicons name="information-circle-outline" size={15} color="#B45309" />
            <Text style={styles.adminNoteText}>{verification.admin_note}</Text>
          </View>
        )}

        {/* ID / Passport card */}
        <View style={styles.docCard}>
          <View style={styles.docCardHeader}>
            <Ionicons name="card-outline" size={18} color={COLORS.primary} />
            <Text style={styles.docCardTitle}>{idDocLabel}</Text>
          </View>

          {idDocUrl ? (
            <TouchableOpacity onPress={() => setViewUrl(idDocUrl)} activeOpacity={0.85}>
              <Image source={{ uri: idDocUrl }} style={styles.docPreview} resizeMode="cover" />
              <View style={styles.tapHint}>
                <Ionicons name="expand-outline" size={13} color={COLORS.white} />
                <Text style={styles.tapHintText}>Tap to view</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.docEmpty}>
              <Ionicons name="document-outline" size={32} color={COLORS.muted} />
              <Text style={styles.docEmptyText}>Not uploaded yet</Text>
            </View>
          )}

          <TouchableOpacity style={styles.updateDocBtn} onPress={() => openUpdate('id')}>
            <Ionicons name="cloud-upload-outline" size={15} color={COLORS.primary} />
            <Text style={styles.updateDocBtnText}>Update {idDocLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* Passport Sized Photo card */}
        <View style={styles.docCard}>
          <View style={styles.docCardHeader}>
            <Ionicons name="person-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.docCardTitle}>Passport Sized Photo</Text>
            <View style={styles.noteChip}>
              <Text style={styles.noteChipText}>Portrait photo of you</Text>
            </View>
          </View>

          {photoUrl ? (
            <TouchableOpacity onPress={() => setViewUrl(photoUrl)} activeOpacity={0.85}>
              <Image source={{ uri: photoUrl }} style={styles.docPreview} resizeMode="cover" />
              <View style={styles.tapHint}>
                <Ionicons name="expand-outline" size={13} color={COLORS.white} />
                <Text style={styles.tapHintText}>Tap to view</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.docEmpty}>
              <Ionicons name="person-circle-outline" size={32} color={COLORS.muted} />
              <Text style={styles.docEmptyText}>Not uploaded yet</Text>
            </View>
          )}

          <TouchableOpacity style={styles.updateDocBtn} onPress={() => openUpdate('photo')}>
            <Ionicons name="cloud-upload-outline" size={15} color={COLORS.primary} />
            <Text style={styles.updateDocBtnText}>Update Passport Sized Photo</Text>
          </TouchableOpacity>
        </View>

        {/* ── Other settings sections ── */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[styles.item, itemIndex < section.items.length - 1 && styles.itemBorder]}
                  onPress={item.onPress}
                  disabled={!item.onPress && item.onToggle === undefined}
                  activeOpacity={item.onPress ? 0.7 : 1}
                >
                  <View style={styles.itemLeft}>
                    <View style={styles.iconBox}>
                      <Ionicons name={item.icon} size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                  </View>
                  {item.onToggle !== undefined ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: COLORS.border, true: COLORS.primary }}
                      thumbColor={COLORS.white}
                    />
                  ) : item.showArrow !== false ? (
                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                  ) : (
                    <Text style={styles.itemValue}>{item.value}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DANGER ZONE</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
            <Text style={styles.dangerText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
            <Text style={[styles.dangerText, { color: COLORS.danger }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Full-screen image viewer ── */}
      <Modal visible={!!viewUrl} animationType="fade" transparent>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewUrl(null)}>
            <Ionicons name="close-circle" size={36} color={COLORS.white} />
          </TouchableOpacity>
          {viewUrl && (
            <Image source={{ uri: viewUrl }} style={styles.viewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* ── Update document modal ── */}
      <Modal visible={!!updateMode} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setUpdateMode(null)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {uploadSuccess ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={56} color={COLORS.success} />
                  <Text style={styles.successTitle}>Submitted!</Text>
                  <Text style={styles.successMsg}>
                    Your document is awaiting admin review. You'll be notified once approved.
                  </Text>
                  <TouchableOpacity style={styles.successBtn} onPress={() => setUpdateMode(null)}>
                    <Text style={styles.successBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {updateMode === 'id' && (
                    <>
                      <Text style={styles.inputLabel}>Document Type</Text>
                      <View style={styles.docTypeRow}>
                        {['national_id', 'passport'].map(t => (
                          <TouchableOpacity
                            key={t}
                            style={[styles.docTypeBtn, docType === t && styles.docTypeBtnActive]}
                            onPress={() => setDocType(t)}
                          >
                            <Text style={[styles.docTypeBtnText, docType === t && styles.docTypeBtnTextActive]}>
                              {t === 'national_id' ? 'National ID' : 'Passport'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  {updateMode === 'photo' && (
                    <View style={styles.photoHint}>
                      <Ionicons name="information-circle-outline" size={15} color={COLORS.primary} />
                      <Text style={styles.photoHintText}>
                        This is a passport-sized portrait photo of yourself — not your ID or passport document.
                      </Text>
                    </View>
                  )}

                  <Text style={styles.inputLabel}>
                    {updateMode === 'id' ? 'Select Document' : 'Select Photo'}
                  </Text>

                  {file ? (
                    <View style={styles.fileSelected}>
                      <Image source={{ uri: file.uri }} style={styles.filePreview} resizeMode="cover" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fileSelectedText}>File selected</Text>
                        <TouchableOpacity onPress={() => setFile(null)}>
                          <Text style={styles.fileRemoveText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                    </View>
                  ) : (
                    <View style={styles.filePickers}>
                      <TouchableOpacity style={styles.filePick} onPress={() => pickFile(false)}>
                        <Ionicons name="images-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.filePickText}>Gallery</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.filePick} onPress={() => pickFile(true)}>
                        <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.filePickText}>Camera</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {uploadError ? (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle-outline" size={15} color={COLORS.danger} />
                      <Text style={styles.errorText}>{uploadError}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.submitBtn, !file && { opacity: 0.45 }]}
                    onPress={handleUpload}
                    disabled={uploading || !file}
                  >
                    {uploading
                      ? <ActivityIndicator color={COLORS.white} />
                      : <Text style={styles.submitBtnText}>Submit for Admin Review</Text>}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderWarm,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  scrollView: { flex: 1 },

  // Section label
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: COLORS.subtext, letterSpacing: 1.2,
    marginTop: 20, marginBottom: 8, paddingHorizontal: 16, textTransform: 'uppercase',
  },

  // Status banner
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 14, marginHorizontal: 16,
    padding: 14, borderWidth: 1, borderColor: COLORS.borderWarm, marginBottom: 10,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusTitleText: { fontSize: 12, color: COLORS.subtext, marginBottom: 2 },
  statusValue: { fontSize: 14, fontWeight: '700' },

  // Admin note
  adminNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFFBEB', borderRadius: 10, marginHorizontal: 16,
    marginBottom: 10, padding: 12, borderWidth: 1, borderColor: '#FDE68A',
  },
  adminNoteText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },

  // Document cards
  docCard: {
    backgroundColor: COLORS.white, borderRadius: 14, marginHorizontal: 16,
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderWarm, overflow: 'hidden',
  },
  docCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderWarm,
  },
  docCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1 },
  noteChip: {
    backgroundColor: COLORS.primary + '15', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  noteChipText: { fontSize: 10, fontWeight: '600', color: COLORS.primary },

  docPreview: { width: '100%', height: 180, backgroundColor: COLORS.background },
  tapHint: {
    position: 'absolute', bottom: 8, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  tapHintText: { fontSize: 11, color: COLORS.white, fontWeight: '600' },

  docEmpty: {
    height: 140, alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.borderWarm,
  },
  docEmptyText: { fontSize: 13, color: COLORS.muted },

  updateDocBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, margin: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.primary + '0D',
  },
  updateDocBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  // Settings list sections
  section: { paddingHorizontal: 16 },
  sectionCard: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderWarm },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderWarm },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.iconBg, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 15, color: COLORS.black },
  itemValue: { fontSize: 14, color: COLORS.gray },

  // Danger zone
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.white, borderRadius: 10, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.borderWarm,
  },
  dangerText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },

  // Full-screen viewer
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  viewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  viewerImage: { width: '100%', height: '80%' },

  // Update modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.subtext, marginBottom: 10, marginTop: 4 },

  photoHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.primary + '0F', borderRadius: 10, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  photoHintText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 18 },

  docTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  docTypeBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  docTypeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '12' },
  docTypeBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.subtext },
  docTypeBtnTextActive: { color: COLORS.primary },

  filePickers: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  filePick: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  filePickText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  fileSelected: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 18,
    borderWidth: 1, borderColor: '#86EFAC',
  },
  filePreview: { width: 52, height: 52, borderRadius: 8 },
  fileSelectedText: { fontSize: 14, fontWeight: '600', color: COLORS.success, marginBottom: 4 },
  fileRemoveText: { fontSize: 12, color: COLORS.danger },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: '#FCA5A5',
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.danger },

  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  successBox: { alignItems: 'center', paddingVertical: 28, gap: 12 },
  successTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  successMsg: { fontSize: 14, color: COLORS.subtext, textAlign: 'center', lineHeight: 21, paddingHorizontal: 8 },
  successBtn: { marginTop: 8, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 44 },
  successBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
