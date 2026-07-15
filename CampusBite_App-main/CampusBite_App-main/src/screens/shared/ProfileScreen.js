import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, Platform, Image, Modal,
  KeyboardAvoidingView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import useAuthStore from '../../stores/authStore';
import { api } from '../../api';
import { COLORS, API_BASE_URL } from '../../constants';


export default function ProfileScreen({ navigation }) {
  // useWindowDimensions (not a module-level Dimensions.get() snapshot) — the
  // latter can read 0 on a physical device if it's evaluated before the
  // native bridge reports real dimensions, which silently collapses the
  // modal sheets below back to blank. This hook re-renders once the real
  // value is available.
  const { height: screenHeight } = useWindowDimensions();
  const { user, logout, updateUser } = useAuthStore();


  const [name, setName]   = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const [showEditModal, setShowEditModal]         = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddressModal, setShowAddressModal]   = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showSupportModal, setShowSupportModal]   = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent]   = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddressDetails, setNewAddressDetails] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetupStep, setTwoFactorSetupStep] = useState(0); // 0: not setup, 1: showing QR, 2: verify code
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      fetchStats();
      fetchNotifications();
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data } = await api.favorites.getAll();
      setFavoriteItems(data.items || []);
    } catch (_) {}
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.orders.getMyOrders();
      const orders = data.orders || [];
      const spent = orders
        .filter(o => o.status === 'Delivered')
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      setTotalOrders(orders.length);
      setTotalSpent(spent);
      setRecentOrders(orders.slice(0, 3));
    } catch (_) {}
    setLoading(false);
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.notifications.getAll();
      setNotifications(data.notifications || []);
    } catch (_) {}
  };

  const handleAddAddress = () => {
    if (!newAddressLabel || !newAddressDetails) {
      Alert.alert('Error', 'Please fill in all address fields');
      return;
    }
    const newAddress = {
      id: Date.now().toString(),
      label: newAddressLabel,
      details: newAddressDetails,
    };
    setSavedAddresses([...savedAddresses, newAddress]);
    setNewAddressLabel('');
    setNewAddressDetails('');
    Alert.alert('Success', 'Address saved successfully');
  };

  // Reverse geocoding using OpenStreetMap Nominatim API (free) — shared by both
  // the web and native location paths below.
  const resolveAndSetAddress = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      setNewAddressLabel('Current Location');
      setNewAddressDetails(address);
      Alert.alert('Success', 'Current location detected');
    } catch (error) {
      setNewAddressLabel('Current Location');
      setNewAddressDetails(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      Alert.alert('Success', 'Coordinates captured');
    } finally {
      setSaving(false);
    }
  };

  const handleGetCurrentLocation = () => {
    // Web: the browser's own Geolocation API. Native: `window.navigator.geolocation`
    // does not exist in React Native — it must go through expo-location instead.
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.geolocation) {
        setSaving(true);
        window.navigator.geolocation.getCurrentPosition(
          (position) => resolveAndSetAddress(position.coords.latitude, position.coords.longitude),
          (error) => {
            setSaving(false);
            Alert.alert('Error', 'Could not get your location. Please enable location services.');
            console.error(error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        Alert.alert('Error', 'Geolocation is not supported on this browser.');
      }
      return;
    }

    (async () => {
      setSaving(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setSaving(false);
          Alert.alert('Permission needed', 'Allow location access in your device settings to use this feature.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await resolveAndSetAddress(loc.coords.latitude, loc.coords.longitude);
      } catch (error) {
        setSaving(false);
        Alert.alert('Error', 'Could not get your location. Please enable location services.');
        console.error(error);
      }
    })();
  };

  const handleDeleteAddress = (id) => {
    setSavedAddresses(savedAddresses.filter(addr => addr.id !== id));
    Alert.alert('Success', 'Address deleted');
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.notifications.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

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
    // In a real app, this would verify the code against the authenticator
    // For demo purposes, we'll accept any 6-digit code
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

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.auth.updateProfile({ name, phone });
      updateUser({ name: data.user.name, phone: data.user.phone, profile_photo: data.user.profile_photo });
      Alert.alert('Success', 'Profile updated.');
      setShowEditModal(false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
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
      const { data } = await api.auth.updateProfile({ name, phone, avatar: uri });
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
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow camera access to take a photo.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true, aspect: [1, 1], quality: 1,
          });
          if (!result.canceled && result.assets?.[0]?.uri)
            await _uploadAvatar(result.assets[0].uri);
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
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
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) logout();
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ]);
    }
  };

  const isWeb   = Platform.OS === 'web';
  const isAdmin = user?.role === 'admin';

  const initials = (user?.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : 'N/A';

  const menuItems = [
    {
      icon: 'person-outline',
      iconColor: COLORS.primary,
      label: 'Edit profile',
      sub: 'Name, photo, phone number',
      onPress: () => setShowEditModal(true),
    },
    ...(!isAdmin ? [{
      icon: 'location-outline',
      iconColor: COLORS.info,
      label: 'Saved addresses',
      sub: 'Hostel, lecture halls, etc.',
      onPress: () => setShowAddressModal(true),
    }] : []),
    {
      icon: 'notifications-outline',
      iconColor: COLORS.success,
      label: 'Notifications',
      sub: 'Order updates, promos',
      onPress: () => {
        fetchNotifications();
        setShowNotificationsModal(true);
      },
    },
    {
      icon: 'lock-closed-outline',
      iconColor: '#8B5CF6',
      label: 'Security',
      sub: 'Password, 2FA',
      onPress: () => setShowSecurityModal(true),
    },
    {
      icon: 'help-circle-outline',
      iconColor: COLORS.warning,
      label: 'Help & support',
      sub: 'Report an issue, contact us',
      onPress: () => setShowSupportModal(true),
    },
  ];

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Edit Profile Modal ──────────────────────────────────────────── */}
      <Modal visible={showEditModal} animationType={isWeb ? 'fade' : 'slide'} transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalOverlay, isWeb && styles.modalOverlayWeb]}
        >
          <View style={[styles.modalSheet, { maxHeight: screenHeight * 0.85 }, isWeb && styles.modalSheetWeb]}>
            {!isWeb && <View style={styles.modalHandle} />}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TouchableOpacity style={styles.modalAvatar} onPress={handleImageUpload}>
                {saving ? (
                  <View style={styles.modalAvatarCircle}>
                    <ActivityIndicator color={COLORS.white} />
                  </View>
                ) : user?.profile_photo ? (
                  <Image
                    source={{ uri: `${API_BASE_URL}${user.profile_photo}?t=${user._photo_ts || 0}` }}
                    style={styles.modalAvatarImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.modalAvatarCircle}>
                    <Text style={styles.modalAvatarInitials}>{initials}</Text>
                  </View>
                )}
                <View style={styles.modalCameraIcon}>
                  <Ionicons name="camera" size={13} color={COLORS.white} />
                </View>
              </TouchableOpacity>

              <Text style={styles.modalLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.muted}
              />

              <Text style={styles.modalLabel}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                value={phone}
                onChangeText={(text) => {
                  let v = text.replace(/[^0-9+]/g, '');
                  if (v.indexOf('+') > 0) v = v.replace(/\+/g, '');
                  if (v.length > 13) v = v.slice(0, 13);
                  setPhone(v);
                }}
                keyboardType="phone-pad"
                maxLength={13}
                placeholder="e.g. 0712345678"
                placeholderTextColor={COLORS.muted}
              />

              <Text style={styles.modalLabel}>Email</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputDisabled]}
                value={user?.email || ''}
                editable={false}
              />

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleUpdateProfile}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.modalSaveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Password Modal ──────────────────────────────────────────────── */}
      <Modal visible={showPasswordModal} animationType={isWeb ? 'fade' : 'slide'} transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalOverlay, isWeb && styles.modalOverlayWeb]}
        >
          <View style={[styles.modalSheet, { maxHeight: screenHeight * 0.85 }, isWeb && styles.modalSheetWeb]}>
            {!isWeb && <View style={styles.modalHandle} />}
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

      {/* ── Security Modal ─────────────────────────────────────────────── */}
      <Modal visible={showSecurityModal} animationType={isWeb ? 'fade' : 'slide'} transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalOverlay, isWeb && styles.modalOverlayWeb]}
        >
          <View style={[styles.modalSheet, { maxHeight: screenHeight * 0.85 }, isWeb && styles.modalSheetWeb]}>
            {!isWeb && <View style={styles.modalHandle} />}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Security</Text>
              <TouchableOpacity onPress={() => setShowSecurityModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
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

      {/* ── Saved Addresses Modal ─────────────────────────────────────────── */}
      <Modal visible={showAddressModal} animationType={isWeb ? 'fade' : 'slide'} transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalOverlay, isWeb && styles.modalOverlayWeb]}
        >
          <View style={[styles.modalSheet, { maxHeight: screenHeight * 0.85 }, isWeb && styles.modalSheetWeb]}>
            {!isWeb && <View style={styles.modalHandle} />}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Addresses</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: screenHeight * 0.6, marginBottom: 16 }}>
              {savedAddresses.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="location-outline" size={44} color={COLORS.muted} />
                  <Text style={styles.emptyText}>No saved addresses yet</Text>
                </View>
              ) : (
                savedAddresses.map((addr) => (
                  <View key={addr.id} style={styles.addressCard}>
                    <View style={styles.addressHeader}>
                      <Text style={styles.addressLabel}>{addr.label}</Text>
                      <TouchableOpacity onPress={() => handleDeleteAddress(addr.id)}>
                        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.addressDetails}>{addr.details}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.addAddressSection}>
              <TouchableOpacity
                style={styles.currentLocationBtn}
                onPress={handleGetCurrentLocation}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="location" size={18} color={COLORS.primary} />
                    <Text style={styles.currentLocationBtnText}>Use Current Location</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.modalLabel}>Label (e.g., Home, Hostel)</Text>
              <TextInput
                style={styles.modalInput}
                value={newAddressLabel}
                onChangeText={setNewAddressLabel}
                placeholder="Address label"
                placeholderTextColor={COLORS.muted}
              />
              <Text style={styles.modalLabel}>Address Details</Text>
              <TextInput
                style={[styles.modalInput, { marginBottom: 12 }]}
                value={newAddressDetails}
                onChangeText={setNewAddressDetails}
                placeholder="Room number, building, etc."
                placeholderTextColor={COLORS.muted}
              />
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleAddAddress}
              >
                <Text style={styles.modalSaveBtnText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Notifications Modal ─────────────────────────────────────────────── */}
      <Modal visible={showNotificationsModal} animationType={isWeb ? 'fade' : 'slide'} transparent>
        <View style={[styles.modalOverlay, isWeb && styles.modalOverlayWeb]}>
          <View style={[styles.modalSheet, { maxHeight: screenHeight * 0.85 }, isWeb && styles.modalSheetWeb]}>
            {!isWeb && <View style={styles.modalHandle} />}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: screenHeight * 0.6 }} showsVerticalScrollIndicator={true}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="notifications-off-outline" size={44} color={COLORS.muted} />
                  <Text style={styles.emptyText}>No notifications yet</Text>
                </View>
              ) : (
                notifications.map((notif) => (
                  <TouchableOpacity
                    key={notif.id}
                    style={[styles.notificationCard, !notif.read && styles.notificationUnread]}
                    onPress={() => handleMarkAsRead(notif.id)}
                  >
                    <View style={styles.notificationIcon}>
                      <Ionicons
                        name={notif.type === 'order' ? 'receipt-outline' : 'information-circle-outline'}
                        size={20}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{notif.title || 'Notification'}</Text>
                      <Text style={styles.notificationMessage}>{notif.message}</Text>
                      <Text style={styles.notificationTime}>
                        {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                      </Text>
                    </View>
                    {!notif.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Favourite Items Modal ("See all") ────────────────────────────────── */}
      <Modal visible={showFavoritesModal} animationType={isWeb ? 'fade' : 'slide'} transparent>
        <View style={[styles.modalOverlay, isWeb && styles.modalOverlayWeb]}>
          <View style={[styles.modalSheet, { maxHeight: screenHeight * 0.85 }, isWeb && styles.modalSheetWeb]}>
            {!isWeb && <View style={styles.modalHandle} />}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Favourite Items</Text>
              <TouchableOpacity onPress={() => setShowFavoritesModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: screenHeight * 0.6 }} showsVerticalScrollIndicator={true}>
              {favoriteItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="heart-outline" size={44} color={COLORS.muted} />
                  <Text style={styles.emptyText}>
                    Tap the heart on any item to save it here for quick reordering.
                  </Text>
                </View>
              ) : (
                favoriteItems.map((item, i) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.orderRow, i === 0 && { borderTopWidth: 0 }]}
                    onPress={() => {
                      setShowFavoritesModal(false);
                      navigation.navigate('HomeTab', { screen: 'VendorDetail', params: { vendor: item.vendor } });
                    }}
                  >
                    {item.image ? (
                      <Image source={{ uri: `${API_BASE_URL}${item.image}` }} style={styles.favItemImage} />
                    ) : (
                      <View style={[styles.favItemImage, styles.favItemImagePlaceholder]}>
                        <Ionicons name="fast-food-outline" size={18} color={COLORS.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderVendor} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.orderMeta}>KES {parseFloat(item.price).toFixed(2)} · {item.vendor?.business_name}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Help & Support Modal ────────────────────────────────────────────── */}
      <Modal visible={showSupportModal} animationType={isWeb ? 'fade' : 'slide'} transparent>
        <View style={[styles.modalOverlay, isWeb && styles.modalOverlayWeb]}>
          <View style={[styles.modalSheet, { maxHeight: screenHeight * 0.85 }, isWeb && styles.modalSheetWeb]}>
            {!isWeb && <View style={styles.modalHandle} />}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & Support</Text>
              <TouchableOpacity onPress={() => setShowSupportModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: screenHeight * 0.6 }} showsVerticalScrollIndicator={true}>
              <View style={styles.supportSection}>
                <Text style={styles.supportTitle}>Contact Us</Text>
                <TouchableOpacity style={styles.supportItem}>
                  <View style={styles.supportIcon}>
                    <Ionicons name="mail-outline" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.supportInfo}>
                    <Text style={styles.supportLabel}>Email Support</Text>
                    <Text style={styles.supportValue}>{user?.role === 'admin' ? 'admin@campusbite.app' : 'support@campusbite.app'}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.supportItem}>
                  <View style={styles.supportIcon}>
                    <Ionicons name="call-outline" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.supportInfo}>
                    <Text style={styles.supportLabel}>Phone Support</Text>
                    <Text style={styles.supportValue}>+254 700 000 000</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.supportSection}>
                <Text style={styles.supportTitle}>FAQ</Text>
                {user?.role === 'admin' ? (
                  <>
                    <View style={styles.faqItem}>
                      <Text style={styles.faqQuestion}>How do I approve vendor applications?</Text>
                      <Text style={styles.faqAnswer}>Go to Approvals tab, review pending applications, and approve or reject based on verification documents.</Text>
                    </View>
                    <View style={styles.faqItem}>
                      <Text style={styles.faqQuestion}>How do I suspend a user?</Text>
                      <Text style={styles.faqAnswer}>Go to Users tab, select the user, and use the suspend/unsuspend button to manage their account status.</Text>
                    </View>
                    <View style={styles.faqItem}>
                      <Text style={styles.faqQuestion}>How do I view platform statistics?</Text>
                      <Text style={styles.faqAnswer}>The Stats dashboard shows total orders, revenue, active users, weekly trends, and top vendors.</Text>
                    </View>
                    <View style={styles.faqItem}>
                      <Text style={styles.faqQuestion}>How do I manage orders?</Text>
                      <Text style={styles.faqAnswer}>Use the Orders tab to view all platform orders, filter by status, and see detailed order information.</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.faqItem}>
                      <Text style={styles.faqQuestion}>How do I place an order?</Text>
                      <Text style={styles.faqAnswer}>Browse vendors, select items, add to cart, and checkout with your preferred payment method.</Text>
                    </View>
                    <View style={styles.faqItem}>
                      <Text style={styles.faqQuestion}>How do I track my order?</Text>
                      <Text style={styles.faqAnswer}>Go to Orders tab and select your order to see real-time status updates.</Text>
                    </View>
                    <View style={styles.faqItem}>
                      <Text style={styles.faqQuestion}>How do I become a vendor?</Text>
                      <Text style={styles.faqAnswer}>Register as a vendor and wait for admin approval. You'll need to provide business details and verification documents.</Text>
                    </View>
                    <View style={styles.faqItem}>
                      <Text style={styles.faqQuestion}>How do I become a food courier?</Text>
                      <Text style={styles.faqAnswer}>Register as a food courier, provide your vehicle details, and wait for admin approval.</Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.supportSection}>
                <Text style={styles.supportTitle}>Report an Issue</Text>
                <Text style={styles.supportText}>
                  {user?.role === 'admin' 
                    ? 'As an admin, report system issues or bugs that affect platform operations.'
                    : 'If you\'re experiencing any issues with the app, please contact us with details about the problem.'}
                </Text>
                <TouchableOpacity style={styles.reportBtn}>
                  <Text style={styles.reportBtnText}>Report Issue via Email</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Profile Header ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handleImageUpload}>
            {user?.profile_photo ? (
              <Image
                source={{ uri: `${API_BASE_URL}${user.profile_photo}?t=${user._photo_ts || 0}` }}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={13} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <Text style={styles.headerName}>{user?.name || 'User'}</Text>
          <Text style={styles.headerRole}>
            {user?.role
              ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
              : 'Consumer'}
          </Text>
          <Text style={styles.headerMember}>Member since {memberSince}</Text>

          <View style={styles.contactRow}>
            {user?.email ? (
              <View style={styles.contactChip}>
                <Ionicons name="mail-outline" size={13} color={COLORS.subtext} />
                <Text style={styles.contactText} numberOfLines={1}>{user.email}</Text>
              </View>
            ) : null}
            {user?.phone ? (
              <View style={styles.contactChip}>
                <Ionicons name="phone-portrait-outline" size={13} color={COLORS.subtext} />
                <Text style={styles.contactText}>{user.phone}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Stats Row (consumer only) ────────────────────────────────────── */}
        {!isAdmin && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalOrders}</Text>
              <Text style={styles.statLabel}>Total orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>
                KES {totalSpent > 0 ? totalSpent.toLocaleString() : '0'}
              </Text>
              <Text style={styles.statLabel}>Total spent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{favoriteItems.length}</Text>
              <Text style={styles.statLabel}>Favourites</Text>
            </View>
          </View>
        )}

        {/* ── Recent Orders (consumer only) ───────────────────────────────── */}
        {!isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>RECENT ORDERS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('OrdersTab')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} />
            ) : recentOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bag-outline" size={44} color={COLORS.muted} />
                <Text style={styles.emptyText}>
                  No orders yet. Start exploring vendors on campus!
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.navigate('HomeTab')}
                >
                  <Text style={styles.emptyBtnText}>Browse vendors</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentOrders.map((order, i) => (
                <TouchableOpacity
                  key={order.id}
                  style={[styles.orderRow, i === 0 && { borderTopWidth: 0 }]}
                  onPress={() =>
                    navigation.navigate('OrdersTab', {
                      screen: 'OrderDetail',
                      params: { orderId: order.id },
                    })
                  }
                >
                  <View style={styles.orderIconWrap}>
                    <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderVendor}>
                      {order.vendor?.business_name || 'Order'}
                    </Text>
                    <Text style={styles.orderMeta}>
                      KES {order.total_amount} · {order.status}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ── Favourite Items (consumer only) ─────────────────────────────── */}
        {!isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>FAVOURITE ITEMS</Text>
              {favoriteItems.length > 0 && (
                <TouchableOpacity onPress={() => setShowFavoritesModal(true)}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              )}
            </View>
            {favoriteItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={44} color={COLORS.muted} />
                <Text style={styles.emptyText}>
                  Tap the heart on any item to save it here for quick reordering.
                </Text>
              </View>
            ) : (
              favoriteItems.slice(0, 3).map((item, i) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.orderRow, i === 0 && { borderTopWidth: 0 }]}
                  onPress={() => navigation.navigate('HomeTab', { screen: 'VendorDetail', params: { vendor: item.vendor } })}
                >
                  {item.image ? (
                    <Image source={{ uri: `${API_BASE_URL}${item.image}` }} style={styles.favItemImage} />
                  ) : (
                    <View style={[styles.favItemImage, styles.favItemImagePlaceholder]}>
                      <Ionicons name="fast-food-outline" size={18} color={COLORS.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderVendor} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.orderMeta}>KES {parseFloat(item.price).toFixed(2)} · {item.vendor?.business_name}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ── Account Menu ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.accountLabel}>ACCOUNT</Text>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuRow,
                i < menuItems.length - 1 && styles.menuRowBorder,
              ]}
              onPress={item.onPress}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.iconColor + '22' }]}>
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Logout ──────────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 16 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarWrap:    { position: 'relative', marginBottom: 14 },
  avatarCircle:  {
    width: 114, height: 114, borderRadius: 57,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  avatarImg:     {
    width: 114, height: 114, borderRadius: 57,
    borderWidth: 3, borderColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  avatarInitials:{ fontSize: 38, fontWeight: '700', color: COLORS.white },
  cameraIcon:    {
    position: 'absolute', bottom: 4, right: 4,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  headerName:   { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  headerRole:   { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginBottom: 4 },
  headerMember: { fontSize: 12, color: COLORS.subtext, marginBottom: 14 },
  contactRow:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  contactChip:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  contactText:  { fontSize: 12, color: COLORS.subtext },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow:    {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginTop: 2,
    paddingVertical: 18,
  },
  statItem:    { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 6 },
  statValue:   { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  statLabel:   { fontSize: 11, color: COLORS.subtext },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: {
    backgroundColor: COLORS.card,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle:  { fontSize: 11, fontWeight: '700', color: COLORS.subtext, letterSpacing: 0.8 },
  seeAll:        { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  accountLabel:  { fontSize: 11, fontWeight: '700', color: COLORS.subtext, letterSpacing: 0.8, marginBottom: 4 },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 10, paddingBottom: 16 },
  emptyText:  { fontSize: 13, color: COLORS.subtext, textAlign: 'center', maxWidth: 270, lineHeight: 19 },
  emptyBtn:   {
    marginTop: 2, paddingHorizontal: 22, paddingVertical: 9,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  emptyBtnText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },

  // ── Order rows ────────────────────────────────────────────────────────────
  orderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  orderIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  orderVendor: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  orderMeta:   { fontSize: 12, color: COLORS.subtext },
  favItemImage: { width: 38, height: 38, borderRadius: 10, marginRight: 12 },
  favItemImagePlaceholder: {
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Menu rows ─────────────────────────────────────────────────────────────
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIconWrap:  {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  menuInfo:  { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  menuSub:   { fontSize: 12, color: COLORS.subtext },

  // ── Logout button ─────────────────────────────────────────────────────────
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 8, marginHorizontal: 16,
    paddingVertical: 15, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.danger + '50',
    backgroundColor: COLORS.danger + '0A',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.danger },

  // ── Modals ────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalOverlayWeb: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 44,
    flexShrink: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  modalSheetWeb: {
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '88%',
    paddingBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
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
  modalTitle:          { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalAvatar:         { alignSelf: 'center', position: 'relative', marginBottom: 20 },
  modalAvatarImg:      {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
  },
  modalAvatarCircle:   {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
  },
  modalAvatarInitials: { fontSize: 32, fontWeight: '700', color: COLORS.white },
  modalCameraIcon:     {
    position: 'absolute', bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: COLORS.white,
  },
  modalLabel:         { fontSize: 13, fontWeight: '600', color: COLORS.subtext, marginBottom: 6, marginTop: 14 },
  modalInput:         {
    backgroundColor: COLORS.inputBg, borderRadius: 10,
    padding: 13, fontSize: 15, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  modalInputDisabled: { color: COLORS.muted },
  modalSaveBtn:       {
    marginTop: 24, backgroundColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 15, alignItems: 'center',
  },
  modalSaveBtnText:   { fontSize: 15, fontWeight: '700', color: COLORS.white },

  // ── Saved Addresses ───────────────────────────────────────────────────────
  addressCard: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  addressDetails: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  addAddressSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  currentLocationBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notificationCard: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'flex-start',
  },
  notificationUnread: {
    backgroundColor: COLORS.primary + '08',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13,
    color: COLORS.subtext,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: COLORS.muted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },

  // ── Help & Support ───────────────────────────────────────────────────────
  supportSection: {
    marginBottom: 24,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    marginBottom: 10,
  },
  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  supportInfo: {
    flex: 1,
  },
  supportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  supportValue: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  faqItem: {
    padding: 14,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    marginBottom: 10,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    color: COLORS.subtext,
    lineHeight: 18,
  },
  supportText: {
    fontSize: 13,
    color: COLORS.subtext,
    lineHeight: 18,
    marginBottom: 12,
  },
  reportBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  reportBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },

  // ── Security Modal ─────────────────────────────────────────────────────
  securitySection: {
    marginBottom: 24,
  },
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
  securityInfo: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  securityDesc: {
    fontSize: 13,
    color: COLORS.subtext,
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
    backgroundColor: COLORS.white,
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
    color: COLORS.subtext,
    marginLeft: 10,
  },

  // ── 2FA Setup ───────────────────────────────────────────────────────────
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
    color: COLORS.subtext,
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
    color: COLORS.subtext,
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
    color: COLORS.subtext,
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
