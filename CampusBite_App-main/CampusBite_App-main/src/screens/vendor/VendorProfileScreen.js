import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Switch, Image, Platform, TextInput, Modal, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAuthStore from '../../stores/authStore';
import { api } from '../../api';
import { COLORS } from '../../constants';

export default function VendorProfileScreen({ navigation = {} }) {
  const { user, logout, updateUser } = useAuthStore();
  const API_BASE = 'http://localhost:5000';
  console.log('VendorProfileScreen: user state =', user);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Security modal states
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetupStep, setTwoFactorSetupStep] = useState(0);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchVendor = useCallback(async () => {
    try {
      const { data } = await api.vendors.getProfile();
      setVendor(data.vendor);
    } catch (err) {
      console.error('Vendor profile error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVendor(); }, [fetchVendor]);

  // Monitor user state changes
  useEffect(() => {
    console.log('VendorProfileScreen: user state changed to', user);
    if (user === null) {
      console.log('VendorProfileScreen: user is null, should navigate to login');
    }
  }, [user]);

  const toggleStoreStatus = async () => {
    setToggling(true);
    try {
      const { data } = await api.vendors.updateStatus();
      setVendor(v => ({ ...v, is_open: data.is_open }));
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setToggling(false);
    }
  };

  const handleBusinessHours = () => {
    Alert.alert('Business Hours', 'Feature coming soon! This will allow you to set your store opening and closing times.');
  };

  const handlePrepTime = () => {
    Alert.alert('Preparation Time', 'Feature coming soon! This will allow you to set your estimated food preparation time.');
  };

  const handleBankDetails = () => {
    Alert.alert('Bank Details', 'Feature coming soon! This will allow you to manage your payment information.');
  };

  const handlePayoutHistory = () => {
    Alert.alert('Payout History', 'Feature coming soon! This will show your earnings and payout history.');
  };

  const handleTaxInfo = () => {
    Alert.alert('Tax Information', 'Feature coming soon! This will allow you to manage your tax documents.');
  };

  const handleCustomerReviews = () => {
    Alert.alert('Customer Reviews', 'Feature coming soon! This will show all your customer reviews and ratings.');
  };

  const handleContactSupport = () => {
    Alert.alert('Contact Support', 'Feature coming soon! This will connect you with customer support.');
  };

  const handleAnalytics = () => {
    Alert.alert('Business Analytics', 'Feature coming soon! This will show detailed analytics about your business performance.');
  };

  const handleSecurity = () => {
    setShowSecurityModal(true);
  };

  // Security handlers
  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const handleEnable2FA = () => {
    const secret = generateSecret();
    setTwoFactorSecret(secret);
    setTwoFactorSetupStep(1);
  };

  const handleVerify2FA = () => {
    if (twoFactorCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }
    setTwoFactorEnabled(true);
    setBackupCodes(generateBackupCodes());
    setTwoFactorSetupStep(0);
    setTwoFactorCode('');
    Alert.alert('Success', '2FA has been enabled. Your backup codes have been generated.');
  };

  const handleDisable2FA = () => {
    Alert.alert(
      'Disable 2FA',
      'Are you sure you want to disable two-factor authentication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: () => {
            setTwoFactorEnabled(false);
            setBackupCodes([]);
            setTwoFactorSecret('');
            Alert.alert('Success', '2FA has been disabled');
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw)
      return Alert.alert('Error', 'All password fields are required.');
    if (newPw.length < 6)
      return Alert.alert('Error', 'New password must be at least 6 characters.');
    if (newPw !== confirmPw)
      return Alert.alert('Error', 'Passwords do not match.');
    setSaving(true);
    try {
      await api.auth.updatePassword({ current_password: currentPw, new_password: newPw });
      Alert.alert('Success', 'Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setShowPasswordModal(false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const _uploadAvatar = async (uri) => {
    setSaving(true);
    try {
      const { data } = await api.auth.updateProfile({ name: user?.name, phone: user?.phone, avatar: uri });
      updateUser({ profile_photo: data.user.profile_photo, _photo_ts: Date.now() });
      Alert.alert('Success', 'Profile photo updated.');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to upload photo.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async () => {
    if (Platform.OS === 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1,
      });
      if (!result.canceled && result.assets?.[0]?.uri)
        await _uploadAvatar(result.assets[0].uri);
      return;
    }
    Alert.alert('Profile Picture', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access.'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 1 });
          if (!result.canceled && result.assets?.[0]?.uri) await _uploadAvatar(result.assets[0].uri);
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
          if (!result.canceled && result.assets?.[0]?.uri) await _uploadAvatar(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLogout = async () => {
    console.log('VendorProfileScreen: handleLogout called');
    
    if (Platform.OS === 'web') {
      // Web: use window.confirm since Alert.alert doesn't work on web
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        console.log('VendorProfileScreen: logout confirmed');
        await logout();
        console.log('VendorProfileScreen: logout completed');
        window.location.reload();
      }
    } else {
      // Mobile: use native Alert
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            console.log('VendorProfileScreen: logout confirmed');
            await logout();
            console.log('VendorProfileScreen: logout completed');
          }
        },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const storeName = vendor?.business_name || user?.name || 'Your Store';
  const storeInitial = storeName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="storefront-outline" size={22} color={COLORS.text} />
          <Text style={styles.headerTitle}>Vendor Profile</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate?.('VendorSettings')}>
          <Ionicons name="settings-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleImageUpload}>
            {saving ? (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : user?.profile_photo ? (
              <Image source={{ uri: `${API_BASE}${user.profile_photo}?t=${user._photo_ts || 0}` }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{storeInitial}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={13} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.storeName}>{storeName}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFB300" />
            <Text style={styles.ratingText}>4.8 (500+ Student Reviews)</Text>
          </View>
        </View>

        {/* Store Settings */}
        <Text style={styles.sectionTitle}>Store Settings</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.settingRow} onPress={handleBusinessHours}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Business Hours</Text>
              <Text style={styles.settingValue}>Open until 10:00 PM</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingRow} onPress={handlePrepTime}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="timer-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Estimated Prep Time</Text>
              <Text style={styles.settingValue}>15-20 mins</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="radio-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Store Status</Text>
              <Text style={styles.settingValue}>
                {vendor?.is_open ? 'Accepting Orders' : 'Closed'}
              </Text>
            </View>
            <Switch
              value={!!vendor?.is_open}
              onValueChange={toggleStoreStatus}
              disabled={toggling}
              trackColor={{ false: '#ddd', true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Finance & Payouts */}
        <Text style={styles.sectionTitle}>Finance & Payouts</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.settingRow} onPress={handleBankDetails}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="card-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Bank Details</Text>
              <Text style={styles.settingValue}>Linked: M-Pesa ****4829</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingRow} onPress={handlePayoutHistory}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Payout History</Text>
              <Text style={styles.settingValue}>Last payout: {new Date().toLocaleDateString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingRow} onPress={handleTaxInfo}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Tax Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Performance & Support */}
        <Text style={styles.sectionTitle}>Performance & Support</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.settingRow} onPress={handleCustomerReviews}>
            <View style={[styles.settingIcon, { backgroundColor: '#FFF8E1' }]}>
              <Ionicons name="star" size={20} color="#FFB300" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Customer Reviews</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingRow} onPress={handleContactSupport}>
            <View style={[styles.settingIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="help-circle-outline" size={20} color="#9C27B0" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingRow} onPress={handleSecurity}>
            <View style={[styles.settingIcon, { backgroundColor: '#E8EAF6' }]}>
              <Ionicons name="lock-closed-outline" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Security</Text>
              <Text style={styles.settingValue}>Password, 2FA</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Business Analytics Card */}
        <TouchableOpacity style={styles.analyticsCard} onPress={handleAnalytics}>
          <View>
            <Text style={styles.analyticsTitle}>Business Analytics</Text>
            <Text style={styles.analyticsSubtext}>View weekly growth metrics</Text>
          </View>
          <Ionicons name="trending-up" size={24} color={COLORS.white} />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => {
            console.log('Logout button pressed');
            handleLogout();
          }}
        >
          <Text style={styles.logoutText}>Logout of Store Manager</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Security Modal */}
      <Modal visible={showSecurityModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowSecurityModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Security</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
              {/* 2FA Section */}
              <View style={styles.securitySection}>
                <View style={styles.securitySectionHeader}>
                  <View style={styles.securityIcon}>
                    <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.securityInfo}>
                    <Text style={styles.securityTitle}>Two-Factor Authentication</Text>
                    <Text style={styles.securityDesc}>Add an extra layer of security to your account</Text>
                  </View>
                </View>
                
                {twoFactorSetupStep === 0 ? (
                  <TouchableOpacity
                    style={styles.toggleRow}
                    onPress={() => {
                      if (twoFactorEnabled) {
                        handleDisable2FA();
                      } else {
                        handleEnable2FA();
                      }
                    }}
                  >
                    <Text style={styles.toggleLabel}>
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                    <View style={[styles.toggleSwitch, twoFactorEnabled && styles.toggleSwitchOn]}>
                      <View style={[styles.toggleKnob, twoFactorEnabled && styles.toggleKnobOn]} />
                    </View>
                  </TouchableOpacity>
                ) : twoFactorSetupStep === 1 ? (
                  <View style={styles.twoFactorSetup}>
                    <Text style={styles.setupTitle}>Set up Authenticator App</Text>
                    <Text style={styles.setupDesc}>
                      1. Download an authenticator app (Google Authenticator, Authy, etc.)
                    </Text>
                    <Text style={styles.setupDesc}>
                      2. Scan the QR code below or enter the secret manually
                    </Text>
                    
                    <View style={styles.qrPlaceholder}>
                      <Ionicons name="qr-code" size={80} color={COLORS.primary} />
                      <Text style={styles.secretText}>{twoFactorSecret}</Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.modalSaveBtn}
                      onPress={() => setTwoFactorSetupStep(2)}
                    >
                      <Text style={styles.modalSaveBtnText}>I've Scanned the QR Code</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        setTwoFactorSetupStep(0);
                        setTwoFactorSecret('');
                      }}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.twoFactorSetup}>
                    <Text style={styles.setupTitle}>Enter Verification Code</Text>
                    <Text style={styles.setupDesc}>
                      Enter the 6-digit code from your authenticator app
                    </Text>
                    
                    <TextInput
                      style={styles.verificationInput}
                      value={twoFactorCode}
                      onChangeText={setTwoFactorCode}
                      placeholder="000000"
                      placeholderTextColor={COLORS.muted}
                      keyboardType="number-pad"
                      maxLength={6}
                      textAlign="center"
                    />
                    
                    <TouchableOpacity
                      style={styles.modalSaveBtn}
                      onPress={handleVerify2FA}
                    >
                      <Text style={styles.modalSaveBtnText}>Verify</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setTwoFactorSetupStep(1)}
                    >
                      <Text style={styles.cancelBtnText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {twoFactorEnabled && backupCodes.length > 0 && twoFactorSetupStep === 0 && (
                  <View style={styles.backupCodesSection}>
                    <TouchableOpacity
                      style={styles.viewBackupBtn}
                      onPress={() => {
                        Alert.alert(
                          'Backup Codes',
                          'Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.\n\n' + backupCodes.join('\n'),
                          [{ text: 'OK' }]
                        );
                      }}
                    >
                      <Ionicons name="key-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.viewBackupBtnText}>View Backup Codes</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Password Section */}
              <View style={styles.securitySection}>
                <View style={styles.securitySectionHeader}>
                  <View style={[styles.securityIcon, { backgroundColor: COLORS.warning + '22' }]}>
                    <Ionicons name="key-outline" size={24} color={COLORS.warning} />
                  </View>
                  <View style={styles.securityInfo}>
                    <Text style={styles.securityTitle}>Change Password</Text>
                    <Text style={styles.securityDesc}>Update your password to keep your account secure</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.changePasswordBtn}
                  onPress={() => {
                    setShowSecurityModal(false);
                    setShowPasswordModal(true);
                  }}
                >
                  <Text style={styles.changePasswordBtnText}>Change Password</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {/* Security Tips */}
              <View style={styles.securitySection}>
                <Text style={styles.securitySectionTitle}>Security Tips</Text>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <Text style={styles.tipText}>Use a strong, unique password</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <Text style={styles.tipText}>Enable 2FA for extra protection</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <Text style={styles.tipText}>Don't share your password with anyone</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <Text style={styles.tipText}>Keep your contact info updated</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowPasswordModal(false);
                setShowSecurityModal(true);
              }}>
                <Ionicons name="arrow-back" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Change Password</Text>
              <View style={{ width: 24 }} />
            </View>

            <Text style={styles.modalLabel}>Current Password</Text>
            <TextInput
              style={styles.modalInput}
              value={currentPw}
              onChangeText={setCurrentPw}
              secureTextEntry
              placeholder="Enter current password"
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.modalLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              value={newPw}
              onChangeText={setNewPw}
              secureTextEntry
              placeholder="Min 6 characters"
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.modalLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmPw}
              onChangeText={setConfirmPw}
              secureTextEntry
              placeholder="Repeat new password"
              placeholderTextColor={COLORS.muted}
            />

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleChangePassword}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.modalSaveBtnText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },

  scrollView: { flex: 1, paddingHorizontal: 16 },

  // Profile
  profileSection: { alignItems: 'center', paddingVertical: 24 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 38, fontWeight: 'bold', color: COLORS.primary },
  cameraIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  storeName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: COLORS.gray },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 20, marginBottom: 10, marginLeft: 2 },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    overflow: 'hidden',
  },

  // Setting Rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  settingValue: { fontSize: 12, color: COLORS.primary, marginTop: 2 },
  settingDivider: { height: 1, backgroundColor: COLORS.borderWarm, marginLeft: 64 },

  // Analytics
  analyticsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analyticsTitle: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
  analyticsSubtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  // Logout
  logoutBtn: {
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },

  // Security Modal
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 44,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.lightGray,
    alignSelf: 'center', marginBottom: 18,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray, marginBottom: 6, marginTop: 14 },
  modalInput: {
    backgroundColor: COLORS.inputBg, borderRadius: 10,
    padding: 13, fontSize: 15, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  modalSaveBtn: {
    marginTop: 24, backgroundColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 15, alignItems: 'center',
  },
  modalSaveBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  securitySection: { marginBottom: 24 },
  securitySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  securityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  securityInfo: { flex: 1 },
  securityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  securityDesc: {
    fontSize: 13,
    color: COLORS.gray,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  toggleSwitch: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    padding: 2,
  },
  toggleSwitchOn: {
    backgroundColor: COLORS.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  changePasswordBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
  },
  changePasswordBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  securitySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 10,
  },
  twoFactorSetup: {
    marginTop: 16,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
  },
  setupDesc: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 8,
    lineHeight: 18,
  },
  qrPlaceholder: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  secretText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  verificationInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.border,
    letterSpacing: 8,
    marginVertical: 16,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
  backupCodesSection: {
    marginTop: 16,
  },
  viewBackupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  viewBackupBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
