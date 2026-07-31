import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Alert, Platform, ActivityIndicator, RefreshControl, Image,
  TextInput, Modal, KeyboardAvoidingView, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import useAuthStore from '../../stores/authStore';
import { api } from '../../api';
import { resolveImageUrl } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';

const VEHICLE_TYPES = ['Electric Bicycle', 'Bicycle', 'Motorcycle', 'Walking'];

function getMockEarnings(total) {
  return Math.round(parseFloat(total) * 0.15) + 50;
}

export default function FoodCourierProfileScreen({ navigation, route }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { user, logout, updateUser } = useAuthStore();
  const [isAvailable, setIsAvailable]     = useState(true);
  const [vehicleType, setVehicleType]     = useState('Electric Bicycle');
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [rating, setRating]               = useState(0);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);

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
  const [pendingAvatarUri, setPendingAvatarUri] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.foodCourier.getProfile();
      const profile = data.profile;
      setIsAvailable(profile.is_available);
      setVehicleType(profile.vehicle_type);
      setTotalDeliveries(profile.total_deliveries);
      setTotalEarnings(profile.total_earnings);
      setRating(parseFloat(profile.rating) || 0);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Opened from App Settings → "Change Password", jump straight to the form
  useEffect(() => {
    if (route?.params?.openChangePassword) {
      setShowPasswordModal(true);
      navigation.setParams({ openChangePassword: undefined });
    }
  }, [route?.params?.openChangePassword]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.notifications.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error(err.message);
    }
  }, []);

  // Bottom-tab screens stay mounted in the background when you switch tabs,
  // so a plain mount-only useEffect here only ever checks once for the whole
  // session — the badge goes stale (and can appear to vanish) the moment a
  // new notification arrives while this tab isn't the active one.
  useFocusEffect(useCallback(() => { fetchUnreadCount(); }, [fetchUnreadCount]));

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
        setPendingAvatarUri(result.assets[0].uri);
      return;
    }
    Alert.alert('Profile Picture', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access.'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 1 });
          if (!result.canceled && result.assets?.[0]?.uri) setPendingAvatarUri(result.assets[0].uri);
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
          if (!result.canceled && result.assets?.[0]?.uri) setPendingAvatarUri(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) await logout();
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => await logout() },
      ]);
    }
  };

  const applyVehicleChange = async (v) => {
    try {
      await api.foodCourier.updateProfile({ vehicle_type: v });
      setVehicleType(v);
      Alert.alert('Success', 'Vehicle type updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleVehicleChange = () => {
    // Alert.alert with multiple buttons doesn't render on web — see AGENTS.md.
    if (Platform.OS === 'web') {
      const choice = window.prompt(
        `Select your vehicle:\n${VEHICLE_TYPES.map((v, i) => `${i + 1}. ${v}`).join('\n')}`
      );
      const index = parseInt(choice, 10) - 1;
      if (VEHICLE_TYPES[index]) applyVehicleChange(VEHICLE_TYPES[index]);
      return;
    }
    Alert.alert(
      'Vehicle Type',
      'Select your vehicle',
      VEHICLE_TYPES.map(v => ({ text: v, onPress: () => applyVehicleChange(v) }))
        .concat([{ text: 'Cancel', style: 'cancel' }])
    );
  };

  const handleAvailabilityToggle = async () => {
    try {
      const { data } = await api.foodCourier.toggleAvailability();
      setIsAvailable(data.is_available);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
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

  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || 'F';

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  const onTimeRate = totalDeliveries > 0 ? '100%' : '—';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="car-outline" size={22} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Campus Dispatch</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => {
            navigation.navigate('Notifications');
            fetchUnreadCount();
          }}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} colors={[COLORS.primary]} />}
      >
        {/* ── Avatar + Name ── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handleImageUpload}>
            {saving ? (
              <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : user?.profile_photo ? (
              <Image source={{ uri: `${resolveImageUrl(user.profile_photo)}?t=${user._photo_ts || 0}` }} style={styles.avatarImg} resizeMode="cover" />
            ) : (
              <Image
                source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'FC')}&background=E85D04&color=fff&size=200&bold=true` }}
                style={styles.avatarImg}
              />
            )}
            <View style={styles.ratingBadge}>
              <Ionicons name="shield-checkmark" size={10} color="#fff" />
              <Text style={styles.ratingBadgeText}>{rating.toFixed(1)}</Text>
            </View>
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={11} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('EditProfile', { user })}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user?.name || 'Food Courier'}</Text>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={{ marginLeft: 6 }} />
            </View>
            <View style={styles.vehicleRow}>
              <Ionicons name="bicycle-outline" size={14} color={COLORS.gray} />
              <Text style={styles.vehicleText}>{vehicleType}</Text>
              <Ionicons name="create-outline" size={14} color={COLORS.gray} style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Availability Toggle ── */}
        <View style={styles.availabilityCard}>
          <View>
            <Text style={styles.availabilityTitle}>Availability</Text>
            <Text style={[styles.availabilityStatus, { color: isAvailable ? COLORS.primary : COLORS.gray }]}>
              {isAvailable ? 'Currently Online' : 'Currently Offline'}
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={handleAvailabilityToggle}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

        {/* ── Quick Stats (3 cols) ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statCaption}>EARNINGS</Text>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>KES {totalEarnings.toLocaleString()}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardBorder]}>
            <Text style={styles.statCaption}>COMPLETED</Text>
            <Text style={styles.statValue}>{totalDeliveries} Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCaption}>ON-TIME</Text>
            <Text style={styles.statValue}>{onTimeRate}</Text>
          </View>
        </View>

        {/* ── Vehicle Info ── */}
        <TouchableOpacity style={styles.featureCard} onPress={handleVehicleChange}>
          <View style={styles.featureIconBox}>
            <Ionicons name="swap-horizontal-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.featureTextBlock}>
            <Text style={styles.featureTitle}>Vehicle Info</Text>
            <Text style={styles.featureSub}>Manage your ride details</Text>
          </View>
        </TouchableOpacity>

        {/* ── Weekly Trend & Support (2 cols) ── */}
        <View style={styles.twoColRow}>
          <TouchableOpacity style={styles.twoColCard} onPress={() => navigation.navigate('DeliveriesTab')}>
            <View style={[styles.twoColIconBox, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="trending-up-outline" size={22} color={COLORS.success} />
            </View>
            <View style={[styles.twoColIconBox, { backgroundColor: COLORS.successLight, marginTop: 4 }]}>
              <Ionicons name="bar-chart-outline" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.twoColTitle}>Weekly Trend</Text>
            <Text style={[styles.twoColSub, { color: COLORS.success }]}>+12% vs last week</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.twoColCard} onPress={() => navigation.navigate('Support')}>
            <View style={[styles.twoColIconBox, { backgroundColor: COLORS.iconBg }]}>
              <Ionicons name="help-circle-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.twoColTitle}>Support</Text>
            <Text style={styles.twoColSub}>24/7 Help</Text>
          </TouchableOpacity>
        </View>

        {/* ── Account Management ── */}
        <Text style={styles.sectionLabel}>ACCOUNT MANAGEMENT</Text>

        <View style={styles.menuCard}>
          {/* Delivery History */}
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('DeliveriesTab')}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBox}>
                <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.menuText}>Delivery History</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Customer Feedback */}
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('CustomerFeedback')}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBox}>
                <Ionicons name="chatbox-outline" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.menuText}>Customer Feedback</Text>
                <View style={styles.feedbackTags}>
                  <View style={styles.tag}><Text style={styles.tagText}>FAST</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>POLITE</Text></View>
                </View>
              </View>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.feedbackRating}>4.9</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* App Settings */}
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('AppSettings', { user })}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBox}>
                <Ionicons name="settings-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.menuText}>App Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Security */}
          <TouchableOpacity style={styles.menuRow} onPress={handleSecurity}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#8B5CF622' }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#8B5CF6" />
              </View>
              <View>
                <Text style={styles.menuText}>Security</Text>
                <Text style={styles.menuSub}>Password, 2FA</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* ── Log Out ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Security Modal */}
      <Modal visible={showSecurityModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { maxHeight: screenHeight * 0.85 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowSecurityModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Security</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={{ maxHeight: screenHeight * 0.6 }} showsVerticalScrollIndicator={true}>
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
                      <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 8 }}>
                        <QRCode
                          value={`otpauth://totp/CampusBite:${encodeURIComponent(user?.email || '')}?secret=${twoFactorSecret}&issuer=CampusBite`}
                          size={160}
                          color="#000"
                          backgroundColor="#fff"
                        />
                      </View>
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
                      placeholderTextColor={COLORS.gray}
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
                <Ionicons name="arrow-back" size={24} color={COLORS.gray} />
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
              placeholderTextColor={COLORS.gray}
            />

            <Text style={styles.modalLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              value={newPw}
              onChangeText={setNewPw}
              secureTextEntry
              placeholder="Min 6 characters"
              placeholderTextColor={COLORS.gray}
            />
            <PasswordStrengthMeter password={newPw} COLORS={COLORS} />

            <Text style={styles.modalLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmPw}
              onChangeText={setConfirmPw}
              secureTextEntry
              placeholder="Repeat new password"
              placeholderTextColor={COLORS.gray}
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

      {/* Photo Confirm Modal — review the cropped photo before it uploads */}
      <Modal visible={!!pendingAvatarUri} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.photoConfirmSheet}>
            <Text style={styles.modalTitle}>Use this photo?</Text>
            {pendingAvatarUri && (
              <Image source={{ uri: pendingAvatarUri }} style={styles.photoConfirmPreview} resizeMode="cover" />
            )}
            <View style={styles.photoConfirmBtns}>
              <TouchableOpacity
                style={styles.photoConfirmRetake}
                onPress={() => { setPendingAvatarUri(null); handleImageUpload(); }}
                disabled={saving}
              >
                <Text style={styles.photoConfirmRetakeText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoConfirmSave}
                onPress={async () => { const uri = pendingAvatarUri; setPendingAvatarUri(null); await _uploadAvatar(uri); }}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.photoConfirmSaveText}>Save Photo</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  notifBtn: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    borderRadius: 9,
    minWidth: 18,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700', lineHeight: 14, textAlign: 'center' },

  scrollView: { flex: 1, paddingHorizontal: 16 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarImg: {
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
  cameraIcon: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 2,
    right: -2,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 2,
  },
  ratingBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vehicleText: { fontSize: 13, color: COLORS.gray },

  // Availability
  availabilityCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  availabilityTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  availabilityStatus: { fontSize: 13, fontWeight: '600' },

  // Stats 3-col
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    overflow: 'hidden',
  },
  statCard: { flex: 1, padding: 14 },
  statCardBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  statCaption: { fontSize: 10, fontWeight: '700', color: COLORS.gray, letterSpacing: 0.8, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },

  // Vehicle card
  featureCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  featureIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextBlock: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  featureSub: { fontSize: 12, color: COLORS.gray },

  // Two col cards
  twoColRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  twoColCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  twoColIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  twoColTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  twoColSub: { fontSize: 12, color: COLORS.gray },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.gray,
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // Menu card
  menuCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  menuDivider: { height: 1, backgroundColor: COLORS.borderWarm, marginHorizontal: 16 },

  // Feedback tags
  feedbackTags: { flexDirection: 'row', gap: 6, marginTop: 4 },
  tag: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  feedbackRating: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },

  // Logout
  logoutBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 8,
  },
  logoutText: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },
  menuSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  // Empty state
  emptySection: { 
    alignItems: 'center', 
    paddingVertical: 24, 
    backgroundColor: COLORS.card, 
    borderRadius: 14,
  },
  emptyText: { color: COLORS.gray, marginTop: 8, fontSize: 13 },

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

  photoConfirmSheet: {
    backgroundColor: COLORS.card, borderRadius: 20, padding: 24,
    marginHorizontal: 24, alignItems: 'center',
  },
  photoConfirmPreview: {
    width: 200, height: 200, borderRadius: 16, marginTop: 16, marginBottom: 20,
    borderWidth: 2, borderColor: COLORS.border,
  },
  photoConfirmBtns: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  photoConfirmRetake: {
    flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.borderWarm,
  },
  photoConfirmRetakeText: { fontSize: 14, fontWeight: '600', color: COLORS.subtext },
  photoConfirmSave: {
    flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  photoConfirmSaveText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

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
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
