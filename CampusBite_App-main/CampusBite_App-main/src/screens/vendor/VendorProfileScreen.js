import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Switch, Image, Platform, TextInput, Modal, KeyboardAvoidingView, Linking, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAuthStore from '../../stores/authStore';
import { api } from '../../api';
import { resolveImageUrl } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

// 24-hour time options: 00:00 to 23:30 in 30-min steps
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const PREP_OPTIONS = [
  '5-10 mins','10-15 mins','15-20 mins','20-30 mins',
  '30-45 mins','45-60 mins','60+ mins',
];

// Fix 1 & 5 — clean 24-hour formatter. Extracts digits, auto-inserts colon.
// Hours 00-23, minutes 00-59 enforced in real-time.
function processTimeInput(text) {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (digits.length === 0) return '';

  // Single digit: if ≥ 3 it can never start a valid 24-h hour, auto-pad + colon
  if (digits.length === 1) {
    return parseInt(digits[0]) >= 3 ? `0${digits[0]}:` : digits[0];
  }

  // 2+ digits: first two are always the hour
  let h = digits.slice(0, 2);
  if (parseInt(h) > 23) h = '23';

  let m = digits.slice(2, 4);
  if (m.length === 0) return `${h}:`;

  // Cap minute tens digit at 5 (60+ is impossible)
  if (parseInt(m[0]) > 5) m = '5' + m.slice(1);
  // Cap full minute at 59
  if (m.length === 2 && parseInt(m) > 59) m = '59';

  return `${h}:${m}`;
}

// Fix 1 — find nearest TIME_OPTIONS index for any HH:MM value (incl. non-30-min)
function nearestTimeIndex(value) {
  const exact = TIME_OPTIONS.indexOf(value);
  if (exact !== -1) return exact;
  const [hStr, mStr] = value.split(':');
  const totalMins = (parseInt(hStr) || 0) * 60 + (parseInt(mStr) || 0);
  let best = 0, bestDiff = Infinity;
  TIME_OPTIONS.forEach((t, idx) => {
    const [th, tm] = t.split(':').map(s => parseInt(s) || 0);
    const diff = Math.abs(th * 60 + tm - totalMins);
    if (diff < bestDiff) { bestDiff = diff; best = idx; }
  });
  return best;
}

// Buckets this vendor's delivered orders into the last 7 rolling days, and
// compares this week (last 7 days) against the prior 7 days for growth %.
function computeWeeklyAnalytics(orders) {
  const dayMs = 24 * 60 * 60 * 1000;
  const now = new Date();
  const delivered = orders.filter(o => o.status === 'Delivered');

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * dayMs);
    days.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3), key: d.toDateString(), orders: 0, revenue: 0 });
  }
  const dayIndexByKey = Object.fromEntries(days.map((d, i) => [d.key, i]));

  const startThisWeek = new Date(now.getTime() - 6 * dayMs);
  const startLastWeek = new Date(now.getTime() - 13 * dayMs);

  let thisWeekRevenue = 0, thisWeekOrders = 0;
  let lastWeekRevenue = 0, lastWeekOrders = 0;
  const itemCounts = {};

  delivered.forEach(o => {
    const d = new Date(o.updated_at || o.created_at);
    const amount = parseFloat(o.total_amount || 0);

    const key = d.toDateString();
    if (key in dayIndexByKey) {
      days[dayIndexByKey[key]].orders += 1;
      days[dayIndexByKey[key]].revenue += amount;
    }

    if (d >= startThisWeek) {
      thisWeekRevenue += amount;
      thisWeekOrders += 1;
      (o.items || []).forEach(item => {
        const name = item.menuItem?.name || item.name || 'Item';
        itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 0);
      });
    } else if (d >= startLastWeek) {
      lastWeekRevenue += amount;
      lastWeekOrders += 1;
    }
  });

  const growthPct = (curr, prev) => {
    if (prev > 0) return ((curr - prev) / prev) * 100;
    return curr > 0 ? 100 : 0;
  };

  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    days,
    thisWeekRevenue, thisWeekOrders, lastWeekRevenue, lastWeekOrders,
    revenueGrowth: growthPct(thisWeekRevenue, lastWeekRevenue),
    orderGrowth:   growthPct(thisWeekOrders, lastWeekOrders),
    topItems,
  };
}

// Simple 7-day order-count bar chart for the Business Analytics modal.
function WeeklyOrdersChart({ days, styles, COLORS }) {
  const maxVal = Math.max(...days.map(d => d.orders), 1);
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
  return (
    <View style={styles.chartBars}>
      {days.map((d, i) => {
        const isToday = d.label === todayLabel && i === days.length - 1;
        const barH = Math.max((d.orders / maxVal) * 90, 4);
        return (
          <View key={i} style={styles.chartBarWrapper}>
            <Text style={[styles.chartBarCount, isToday && { color: COLORS.primary }]}>
              {d.orders > 0 ? d.orders : ''}
            </Text>
            <View style={[styles.chartBar, { height: barH, backgroundColor: isToday ? COLORS.primary : COLORS.border }]} />
            <Text style={[styles.chartDayLabel, isToday && { color: COLORS.primary, fontWeight: '700' }]}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function VendorProfileScreen({ navigation = {} }) {
  const { colors: COLORS, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { user, logout, updateUser } = useAuthStore();
  console.log('VendorProfileScreen: user state =', user);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Finance modals
  const [showBankModal, setShowBankModal]       = useState(false);
  const [editMpesa, setEditMpesa]               = useState('');
  const [showPayoutModal, setShowPayoutModal]   = useState(false);
  const [payouts, setPayouts]                   = useState([]);
  const [loadingPayouts, setLoadingPayouts]     = useState(false);
  const [showTaxModal, setShowTaxModal]         = useState(false);
  const [editKraPin, setEditKraPin]             = useState('');
  const [savingFinance, setSavingFinance]       = useState(false);

  // Customer Reviews modal
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews]                   = useState([]);
  const [loadingReviews, setLoadingReviews]     = useState(false);

  // Business Analytics modal
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsOrders, setAnalyticsOrders]       = useState([]);
  const [loadingAnalytics, setLoadingAnalytics]     = useState(false);

  // Contact Support modal
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [expandedFaq, setExpandedFaq]           = useState(null);

  // Business hours modal
  const [showHoursModal, setShowHoursModal]   = useState(false);
  const [editOpenTime, setEditOpenTime]       = useState('');
  const [editCloseTime, setEditCloseTime]     = useState('');
  const [savingHours, setSavingHours]         = useState(false);

  // Prep time modal
  const [showPrepModal, setShowPrepModal]     = useState(false);
  const [editPrepTime, setEditPrepTime]       = useState('');
  const [savingPrep, setSavingPrep]           = useState(false);

  // Edit store profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName]           = useState('');
  const [editLocation, setEditLocation]   = useState('');
  const [editDesc, setEditDesc]           = useState('');
  const [editCoverImage, setEditCoverImage] = useState(null);
  const [savingEdit, setSavingEdit]       = useState(false);

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
    if (toggling) return;
    const previous = vendor?.is_open;
    setVendor(v => ({ ...v, is_open: !v?.is_open })); // optimistic update
    setToggling(true);
    try {
      const { data } = await api.vendors.updateStatus();
      setVendor(v => ({ ...v, is_open: data.is_open })); // confirm with server value
    } catch (err) {
      setVendor(v => ({ ...v, is_open: previous })); // revert on error
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to update store status.');
    } finally {
      setToggling(false);
    }
  };

  const openHoursModal = () => {
    setEditOpenTime(vendor?.opening_time || '08:00');
    setEditCloseTime(vendor?.closing_time || '22:00');
    setShowHoursModal(true);
  };

  const saveHours = async () => {
    const validRe = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!validRe.test(editOpenTime) || !validRe.test(editCloseTime)) {
      Alert.alert('Invalid time', 'Please enter complete times in HH:MM format (e.g. 08:00 or 22:30).');
      return;
    }
    setSavingHours(true);
    try {
      const { data } = await api.vendors.updateProfile({ opening_time: editOpenTime, closing_time: editCloseTime });
      setVendor(data.vendor);
      setShowHoursModal(false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to save.');
    } finally {
      setSavingHours(false);
    }
  };

  const openPrepModal = () => {
    setEditPrepTime(vendor?.prep_time || '');
    setShowPrepModal(true);
  };

  const savePrepTime = async (selected) => {
    setSavingPrep(true);
    try {
      const { data } = await api.vendors.updateProfile({ prep_time: selected });
      setVendor(data.vendor);
      setShowPrepModal(false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to save.');
    } finally {
      setSavingPrep(false);
    }
  };

  const openEditModal = () => {
    setEditName(vendor?.business_name || '');
    setEditLocation(vendor?.location || '');
    setEditDesc(vendor?.description || '');
    setEditCoverImage(null);
    setShowEditModal(true);
  };

  const pickCoverImage = async () => {
    if (Platform.OS === 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.85 });
      if (!result.canceled && result.assets?.[0]?.uri) setEditCoverImage(result.assets[0].uri);
      return;
    }
    Alert.alert('Cover Image', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access.'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.85 });
          if (!result.canceled && result.assets?.[0]?.uri) setEditCoverImage(result.assets[0].uri);
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.85 });
          if (!result.canceled && result.assets?.[0]?.uri) setEditCoverImage(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { Alert.alert('Error', 'Business name cannot be empty.'); return; }
    setSavingEdit(true);
    try {
      const payload = {
        business_name: editName.trim(),
        location:      editLocation.trim(),
        description:   editDesc.trim(),
      };
      if (editCoverImage) payload.image = editCoverImage;
      const { data } = await api.vendors.updateProfile(payload);
      setVendor(data.vendor);
      setShowEditModal(false);
      Alert.alert('Success', 'Store profile updated.');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleBusinessHours = () => openHoursModal();
  const handlePrepTime      = () => openPrepModal();

  const handleBankDetails = () => {
    setEditMpesa(vendor?.mpesa_phone || '');
    setShowBankModal(true);
  };

  const saveBankDetails = async () => {
    const phone = editMpesa.trim();
    if (phone && !/^(\+?254|0)[17]\d{8}$/.test(phone)) {
      Alert.alert('Invalid number', 'Enter a valid Kenyan M-Pesa number, e.g. 0712345678 or +254712345678');
      return;
    }
    setSavingFinance(true);
    try {
      const { data } = await api.vendors.updateProfile({ mpesa_phone: phone });
      setVendor(data.vendor);
      setShowBankModal(false);
      Alert.alert('Saved', 'M-Pesa number updated.');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to save.');
    } finally {
      setSavingFinance(false);
    }
  };

  const handlePayoutHistory = async () => {
    setShowPayoutModal(true);
    setLoadingPayouts(true);
    try {
      const { data } = await api.orders.getVendorOrders();
      const orders = data.orders || [];
      const delivered = orders.filter(o => o.status === 'Delivered');
      setPayouts(delivered);
    } catch (err) {
      Alert.alert('Error', 'Could not load order history.');
    } finally {
      setLoadingPayouts(false);
    }
  };

  const handleTaxInfo = () => {
    setEditKraPin(vendor?.kra_pin || '');
    setShowTaxModal(true);
  };

  const saveTaxInfo = async () => {
    const pin = editKraPin.trim().toUpperCase();
    if (pin && !/^[A-Z]\d{9}[A-Z]$/.test(pin)) {
      Alert.alert('Invalid KRA PIN', 'KRA PIN format: one letter, 9 digits, one letter (e.g. A000000000A)');
      return;
    }
    setSavingFinance(true);
    try {
      const { data } = await api.vendors.updateProfile({ kra_pin: pin });
      setVendor(data.vendor);
      setShowTaxModal(false);
      Alert.alert('Saved', 'Tax information updated.');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to save.');
    } finally {
      setSavingFinance(false);
    }
  };

  const handleCustomerReviews = async () => {
    setShowReviewsModal(true);
    setLoadingReviews(true);
    try {
      const { data } = await api.reviews.getVendorReviews(vendor.id);
      setReviews(data.reviews || []);
    } catch {
      Alert.alert('Error', 'Could not load reviews.');
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleContactSupport = () => {
    setShowSupportModal(true);
  };

  const handleAnalytics = async () => {
    setShowAnalyticsModal(true);
    setLoadingAnalytics(true);
    try {
      const { data } = await api.orders.getVendorOrders();
      setAnalyticsOrders(data.orders || []);
    } catch (err) {
      Alert.alert('Error', 'Could not load analytics.');
    } finally {
      setLoadingAnalytics(false);
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
          <TouchableOpacity style={styles.avatarContainer} onPress={openEditModal}>
            {vendor?.image ? (
              <Image source={{ uri: resolveImageUrl(vendor.image) }} style={styles.avatar} resizeMode="cover" />
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
          <TouchableOpacity style={styles.settingRow} onPress={openEditModal}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Edit Store Profile</Text>
              <Text style={styles.settingValue}>Name, location, cover image</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingRow} onPress={handleBusinessHours}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Business Hours</Text>
              <Text style={styles.settingValue}>
                {vendor?.opening_time && vendor?.closing_time
                  ? `${vendor.opening_time} – ${vendor.closing_time}`
                  : 'Tap to set hours'}
              </Text>
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
              <Text style={styles.settingValue}>{vendor?.prep_time || 'Tap to set'}</Text>
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
              <Text style={styles.settingValue}>
                {vendor?.mpesa_phone
                  ? `M-Pesa ****${vendor.mpesa_phone.slice(-4)}`
                  : 'Tap to add M-Pesa number'}
              </Text>
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
              <Text style={styles.settingValue}>View delivered orders & earnings</Text>
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
            <View style={[styles.settingIcon, { backgroundColor: '#8B5CF622' }]}>
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

      {/* Customer Reviews Modal */}
      <Modal visible={showReviewsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: screenHeight * 0.85 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowReviewsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Customer Reviews</Text>
              <View style={{ width: 24 }} />
            </View>

            {loadingReviews ? (
              <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.reviewEmpty}>
                <Ionicons name="star-outline" size={48} color={COLORS.border} />
                <Text style={styles.reviewEmptyText}>No reviews yet</Text>
                <Text style={styles.reviewEmptyHint}>Reviews will appear here once customers rate their orders</Text>
              </View>
            ) : (
              <>
                {/* Summary bar */}
                <View style={styles.reviewSummary}>
                  <Text style={styles.reviewAvgNum}>
                    {(reviews.reduce((s, r) => s + r.vendor_rating, 0) / reviews.length).toFixed(1)}
                  </Text>
                  <View>
                    <View style={styles.reviewStarsRow}>
                      {[1,2,3,4,5].map(n => (
                        <Ionicons key={n} name="star" size={16}
                          color={(reviews.reduce((s,r)=>s+r.vendor_rating,0)/reviews.length) >= n ? '#FFB300' : COLORS.border} />
                      ))}
                    </View>
                    <Text style={styles.reviewCount}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {reviews.map(r => (
                    <View key={r.id} style={styles.reviewCard}>
                      <View style={styles.reviewCardTop}>
                        <View style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>
                            {(r.consumer?.name || 'A').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewerName}>{r.consumer?.name || 'Anonymous'}</Text>
                          <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.reviewStarsRow}>
                          {[1,2,3,4,5].map(n => (
                            <Ionicons key={n} name="star" size={13}
                              color={r.vendor_rating >= n ? '#FFB300' : COLORS.border} />
                          ))}
                        </View>
                      </View>
                      {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                    </View>
                  ))}
                  <View style={{ height: 20 }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Contact Support Modal */}
      <Modal visible={showSupportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: screenHeight * 0.80 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setShowSupportModal(false); setExpandedFaq(null); }}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Contact Support</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.supportInfoCard}>
                <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} />
                <Text style={styles.supportInfoText}>
                  Our support team is available Mon–Fri, 8 AM – 8 PM. We typically respond within a few hours.
                </Text>
              </View>

              <Text style={styles.supportSectionLabel}>CONTACT US</Text>

              <TouchableOpacity style={styles.supportRow}
                onPress={() => Linking.openURL('mailto:support@campusbite.com?subject=Vendor Support – ' + (vendor?.business_name || ''))}>
                <View style={[styles.supportRowIcon, { backgroundColor: COLORS.primary + '18' }]}>
                  <Ionicons name="mail-outline" size={22} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportRowTitle}>Email Support</Text>
                  <Text style={styles.supportRowSub}>support@campusbite.com</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={COLORS.muted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.supportRow}
                onPress={() => Linking.openURL('tel:+254700000000')}>
                <View style={[styles.supportRowIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="call-outline" size={22} color="#2E7D32" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportRowTitle}>Call Support</Text>
                  <Text style={styles.supportRowSub}>+254 700 000 000</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={COLORS.muted} />
              </TouchableOpacity>

              <Text style={[styles.supportSectionLabel, { marginTop: 20 }]}>HELP TOPICS</Text>

              {[
                { icon: 'help-circle-outline', title: 'Why is my store not visible?',
                  body: 'Your store must be approved by an admin and toggled to OPEN in Store Status before customers can see it.' },
                { icon: 'wallet-outline', title: 'When do I receive my earnings?',
                  body: 'Earnings are paid out to your M-Pesa number after each delivered order. Make sure your M-Pesa number is saved in Bank Details.' },
                { icon: 'receipt-outline', title: 'How do I dispute an order?',
                  body: 'Email support with your order ID. Include the issue description and we will investigate within 24 hours.' },
                { icon: 'shield-checkmark-outline', title: 'How do I update my KRA PIN?',
                  body: 'Go to Finance & Payouts → Tax Information to update your KRA PIN at any time.' },
              ].map((faq, i) => {
                const open = expandedFaq === i;
                return (
                  <View key={i} style={styles.supportFaqItem}>
                    <TouchableOpacity style={styles.supportFaqRow}
                      onPress={() => setExpandedFaq(open ? null : i)}
                      activeOpacity={0.7}>
                      <Ionicons name={faq.icon} size={20} color={open ? COLORS.primary : COLORS.subtext} />
                      <Text style={[styles.supportFaqText, open && { color: COLORS.primary }]}>{faq.title}</Text>
                      <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={open ? COLORS.primary : COLORS.muted}
                      />
                    </TouchableOpacity>
                    {open && (
                      <View style={styles.supportFaqAnswer}>
                        <Text style={styles.supportFaqAnswerText}>{faq.body}</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bank Details Modal */}
      <Modal visible={showBankModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Bank Details</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.financeIconRow}>
              <View style={styles.financeIcon}>
                <Ionicons name="phone-portrait-outline" size={32} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.financeTitle}>M-Pesa Number</Text>
                <Text style={styles.financeDesc}>Payments from orders will be sent to this number</Text>
              </View>
            </View>

            <Text style={styles.modalLabel}>M-Pesa Phone Number</Text>
            <TextInput
              style={styles.modalInput}
              value={editMpesa}
              onChangeText={(text) => {
                // Allow + only at the start, then digits only, max 13 chars
                let cleaned = text.replace(/[^0-9+]/g, '');
                if (cleaned.indexOf('+') > 0) cleaned = cleaned.replace(/\+/g, '');
                if (cleaned.length > 13) cleaned = cleaned.slice(0, 13);
                setEditMpesa(cleaned);
              }}
              placeholder="e.g. 0712345678 or +254712345678"
              placeholderTextColor={COLORS.muted}
              keyboardType="phone-pad"
              maxLength={13}
            />
            <Text style={styles.financeHint}>Accepts Safaricom M-Pesa numbers only (07xx or +2547xx)</Text>

            <TouchableOpacity style={[styles.modalSaveBtn, { marginTop: 24 }]} onPress={saveBankDetails} disabled={savingFinance}>
              {savingFinance ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalSaveBtnText}>Save Number</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payout History Modal */}
      <Modal visible={showPayoutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: screenHeight * 0.80 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPayoutModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Payout History</Text>
              <View style={{ width: 24 }} />
            </View>

            {loadingPayouts ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : payouts.length === 0 ? (
              <View style={styles.payoutEmpty}>
                <Ionicons name="wallet-outline" size={48} color={COLORS.border} />
                <Text style={styles.payoutEmptyText}>No delivered orders yet</Text>
                <Text style={styles.payoutEmptyHint}>Completed orders will appear here as earnings</Text>
              </View>
            ) : (
              <>
                <View style={styles.payoutTotal}>
                  <Text style={styles.payoutTotalLabel}>Total Earnings</Text>
                  <Text style={styles.payoutTotalValue}>
                    KES {payouts.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0).toFixed(2)}
                  </Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {payouts.map(order => (
                    <View key={order.id} style={styles.payoutRow}>
                      <View style={styles.payoutRowLeft}>
                        <Text style={styles.payoutOrderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                        <Text style={styles.payoutDate}>{new Date(order.updated_at || order.created_at).toLocaleDateString()}</Text>
                      </View>
                      <Text style={styles.payoutAmount}>KES {parseFloat(order.total_amount || 0).toFixed(2)}</Text>
                    </View>
                  ))}
                  <View style={{ height: 20 }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Business Analytics Modal */}
      <Modal visible={showAnalyticsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: screenHeight * 0.85 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAnalyticsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Business Analytics</Text>
              <View style={{ width: 24 }} />
            </View>

            {loadingAnalytics ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (() => {
              const a = computeWeeklyAnalytics(analyticsOrders);
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.analyticsGrowthRow}>
                    <View style={styles.analyticsGrowthCard}>
                      <Text style={styles.analyticsGrowthLabel}>This week's revenue</Text>
                      <Text style={styles.analyticsGrowthValue}>KES {a.thisWeekRevenue.toFixed(0)}</Text>
                      <View style={styles.analyticsGrowthBadgeRow}>
                        <Ionicons
                          name={a.revenueGrowth >= 0 ? 'trending-up' : 'trending-down'}
                          size={13}
                          color={a.revenueGrowth >= 0 ? COLORS.success : COLORS.danger}
                        />
                        <Text style={[styles.analyticsGrowthBadge, { color: a.revenueGrowth >= 0 ? COLORS.success : COLORS.danger }]}>
                          {a.revenueGrowth >= 0 ? '+' : ''}{a.revenueGrowth.toFixed(0)}% vs last week
                        </Text>
                      </View>
                    </View>
                    <View style={styles.analyticsGrowthCard}>
                      <Text style={styles.analyticsGrowthLabel}>Orders delivered</Text>
                      <Text style={styles.analyticsGrowthValue}>{a.thisWeekOrders}</Text>
                      <View style={styles.analyticsGrowthBadgeRow}>
                        <Ionicons
                          name={a.orderGrowth >= 0 ? 'trending-up' : 'trending-down'}
                          size={13}
                          color={a.orderGrowth >= 0 ? COLORS.success : COLORS.danger}
                        />
                        <Text style={[styles.analyticsGrowthBadge, { color: a.orderGrowth >= 0 ? COLORS.success : COLORS.danger }]}>
                          {a.orderGrowth >= 0 ? '+' : ''}{a.orderGrowth.toFixed(0)}% vs last week
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.analyticsSectionTitle}>Orders — last 7 days</Text>
                  <WeeklyOrdersChart days={a.days} styles={styles} COLORS={COLORS} />

                  <Text style={styles.analyticsSectionTitle}>Top items this week</Text>
                  {a.topItems.length === 0 ? (
                    <Text style={styles.emptyAnalyticsText}>No delivered orders this week yet</Text>
                  ) : (
                    a.topItems.map((item, i) => (
                      <View key={i} style={styles.analyticsItemRow}>
                        <Text style={styles.analyticsItemName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.analyticsItemCount}>{item.count} sold</Text>
                      </View>
                    ))
                  )}
                  <View style={{ height: 20 }} />
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Tax Information Modal */}
      <Modal visible={showTaxModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTaxModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Tax Information</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.financeIconRow}>
              <View style={[styles.financeIcon, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="document-text-outline" size={32} color={COLORS.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.financeTitle}>KRA PIN</Text>
                <Text style={styles.financeDesc}>Required for tax compliance on earnings above KES 100,000/year</Text>
              </View>
            </View>

            <Text style={styles.modalLabel}>KRA PIN</Text>
            <TextInput
              style={[styles.modalInput, { letterSpacing: 2 }]}
              value={editKraPin}
              onChangeText={(t) => setEditKraPin(t.toUpperCase())}
              placeholder="e.g. A000000000A"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="characters"
              maxLength={11}
            />
            <Text style={styles.financeHint}>Format: one letter + 9 digits + one letter</Text>

            <TouchableOpacity style={[styles.modalSaveBtn, { marginTop: 24 }]} onPress={saveTaxInfo} disabled={savingFinance}>
              {savingFinance ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalSaveBtnText}>Save KRA PIN</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Business Hours Modal */}
      <Modal visible={showHoursModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowHoursModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Business Hours</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.stepperBlock}>
              <Text style={styles.stepperLabel}>Opens at  <Text style={styles.stepperHint}>(00:00 – 23:59)</Text></Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    const i = nearestTimeIndex(editOpenTime); // Fix 6
                    setEditOpenTime(TIME_OPTIONS[(i - 1 + TIME_OPTIONS.length) % TIME_OPTIONS.length]);
                  }}
                >
                  <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.stepperInput}
                  value={editOpenTime}
                  onChangeText={(text) => {
                    // Fix 2 — allow backspace freely; only auto-format on forward input
                    if (text.length < editOpenTime.length) {
                      setEditOpenTime(text.replace(/[^0-9:]/g, ''));
                    } else {
                      setEditOpenTime(processTimeInput(text));
                    }
                  }}
                  onBlur={() => {
                    const colonIdx = editOpenTime.indexOf(':');
                    if (colonIdx !== -1) {
                      const h = editOpenTime.slice(0, colonIdx).padStart(2, '0');
                      const m = editOpenTime.slice(colonIdx + 1).padStart(2, '0').slice(0, 2); // Fix 3
                      setEditOpenTime(`${h}:${m}`);
                    } else if (editOpenTime.length > 0) {
                      setEditOpenTime(`${editOpenTime.padStart(2, '0')}:00`);
                    }
                  }}
                  placeholder="08:00"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="numeric"
                  maxLength={5}
                  selectTextOnFocus
                />
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    const i = nearestTimeIndex(editOpenTime); // Fix 6
                    setEditOpenTime(TIME_OPTIONS[(i + 1) % TIME_OPTIONS.length]);
                  }}
                >
                  <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.stepperBlock}>
              <Text style={styles.stepperLabel}>Closes at  <Text style={styles.stepperHint}>(00:00 – 23:59)</Text></Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    const i = nearestTimeIndex(editCloseTime); // Fix 6
                    setEditCloseTime(TIME_OPTIONS[(i - 1 + TIME_OPTIONS.length) % TIME_OPTIONS.length]);
                  }}
                >
                  <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.stepperInput}
                  value={editCloseTime}
                  onChangeText={(text) => {
                    // Fix 2 — allow backspace freely; only auto-format on forward input
                    if (text.length < editCloseTime.length) {
                      setEditCloseTime(text.replace(/[^0-9:]/g, ''));
                    } else {
                      setEditCloseTime(processTimeInput(text));
                    }
                  }}
                  onBlur={() => {
                    const colonIdx = editCloseTime.indexOf(':');
                    if (colonIdx !== -1) {
                      const h = editCloseTime.slice(0, colonIdx).padStart(2, '0');
                      const m = editCloseTime.slice(colonIdx + 1).padStart(2, '0').slice(0, 2); // Fix 3
                      setEditCloseTime(`${h}:${m}`);
                    } else if (editCloseTime.length > 0) {
                      setEditCloseTime(`${editCloseTime.padStart(2, '0')}:00`);
                    }
                  }}
                  placeholder="22:00"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="numeric"
                  maxLength={5}
                  selectTextOnFocus
                />
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    const i = nearestTimeIndex(editCloseTime); // Fix 6
                    setEditCloseTime(TIME_OPTIONS[(i + 1) % TIME_OPTIONS.length]);
                  }}
                >
                  <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {editOpenTime && editCloseTime && (
              <View style={styles.hoursSummary}>
                <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                <Text style={styles.hoursSummaryText}>{editOpenTime} – {editCloseTime}</Text>
              </View>
            )}

            <TouchableOpacity style={[styles.modalSaveBtn, { marginTop: 24 }]} onPress={saveHours} disabled={savingHours}>
              {savingHours
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.modalSaveBtnText}>Save Hours</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Prep Time Modal */}
      <Modal visible={showPrepModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPrepModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Estimated Prep Time</Text>
              <View style={{ width: 24 }} />
            </View>
            <Text style={styles.prepHint}>How long does it typically take to prepare an order?</Text>
            <View style={styles.prepGrid}>
              {PREP_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.prepChip, editPrepTime === opt && styles.prepChipActive, savingPrep && styles.prepChipDisabled]}
                  onPress={() => { setEditPrepTime(opt); savePrepTime(opt); }}
                  disabled={savingPrep}
                >
                  {savingPrep && editPrepTime === opt
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : <Text style={[styles.prepChipText, editPrepTime === opt && styles.prepChipTextActive]}>{opt}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Store Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Store Profile</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Cover image picker */}
              <TouchableOpacity style={styles.coverPickerBtn} onPress={pickCoverImage}>
                {editCoverImage ? (
                  <Image source={{ uri: editCoverImage }} style={styles.coverPreview} resizeMode="cover" />
                ) : vendor?.image ? (
                  <Image source={{ uri: resolveImageUrl(vendor.image) }} style={styles.coverPreview} resizeMode="cover" />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Ionicons name="image-outline" size={32} color={COLORS.subtext} />
                    <Text style={styles.coverPlaceholderText}>Tap to add cover image</Text>
                  </View>
                )}
                <View style={styles.coverEditBadge}>
                  <Ionicons name="camera" size={14} color={COLORS.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.coverHint}>This image appears on your store card</Text>

              <Text style={styles.modalLabel}>Business Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g. Alpha's Kitchen"
                placeholderTextColor={COLORS.muted}
              />

              <Text style={styles.modalLabel}>Location</Text>
              <TextInput
                style={styles.modalInput}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="e.g. Block C, Campus"
                placeholderTextColor={COLORS.muted}
              />

              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Tell customers about your store..."
                placeholderTextColor={COLORS.muted}
                multiline
              />

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveProfile} disabled={savingEdit}>
                {savingEdit
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.modalSaveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
                <Ionicons name="close" size={24} color={COLORS.subtext} />
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

const makeStyles = (COLORS) => StyleSheet.create({
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

  // Business Analytics modal
  analyticsGrowthRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  analyticsGrowthCard: {
    flex: 1, backgroundColor: COLORS.inputBg, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  analyticsGrowthLabel: { fontSize: 12, color: COLORS.subtext, marginBottom: 6 },
  analyticsGrowthValue: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  analyticsGrowthBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  analyticsGrowthBadge: { fontSize: 11, fontWeight: '700' },
  analyticsSectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 4 },
  emptyAnalyticsText: { fontSize: 13, color: COLORS.subtext, textAlign: 'center', paddingVertical: 16 },
  analyticsItemRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderWarm,
  },
  analyticsItemName: { fontSize: 14, color: COLORS.text, flex: 1, marginRight: 8 },
  analyticsItemCount: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // Weekly bar chart (Business Analytics modal)
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 110, marginBottom: 20 },
  chartBarWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartBarCount: { fontSize: 10, color: COLORS.muted, marginBottom: 3 },
  chartBar: { width: '65%', borderRadius: 4, minHeight: 4 },
  chartDayLabel: { fontSize: 11, color: COLORS.subtext, marginTop: 6 },

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
  stepperBlock: { marginBottom: 20 },
  stepperLabel: { fontSize: 13, fontWeight: '600', color: COLORS.subtext, marginBottom: 10 },
  stepperHint:  { fontSize: 11, fontWeight: '400', color: COLORS.muted },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 20, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperInput: {
    flex: 1, textAlign: 'center',
    fontSize: 20, fontWeight: '700', color: COLORS.text,
    borderLeftWidth: 1, borderColor: COLORS.border,
    paddingVertical: 16, paddingHorizontal: 8,
  },
  periodToggle: {
    paddingHorizontal: 14, paddingVertical: 16,
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
    minWidth: 52,
  },
  periodText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  hoursSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, padding: 12, borderRadius: 10,
    backgroundColor: COLORS.primary + '12',
  },
  hoursSummaryText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  prepHint: { fontSize: 13, color: COLORS.subtext, marginBottom: 16, lineHeight: 18 },
  prepGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  prepChip: {
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.inputBg,
    minWidth: 110, alignItems: 'center',
  },
  prepChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  prepChipDisabled: { opacity: 0.6 },
  prepChipText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  prepChipTextActive: { color: COLORS.white },

  coverPickerBtn: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    marginBottom: 4,
  },
  coverPreview: { width: '100%', height: '100%' },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coverPlaceholderText: { fontSize: 13, color: COLORS.subtext },
  coverEditBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverHint: { fontSize: 11, color: COLORS.muted, marginBottom: 12, marginLeft: 2 },
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

  // Finance modals
  financeIconRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 20, marginTop: 8,
  },
  financeIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  financeTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  financeDesc: { fontSize: 13, color: COLORS.subtext, lineHeight: 18 },
  financeHint: { fontSize: 12, color: COLORS.muted, marginTop: 6, lineHeight: 17 },

  payoutEmpty: {
    paddingVertical: 48, alignItems: 'center', gap: 10,
  },
  payoutEmptyText: { fontSize: 16, fontWeight: '700', color: COLORS.subtext },
  payoutEmptyHint: { fontSize: 13, color: COLORS.muted, textAlign: 'center' },

  payoutTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.primary + '12', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16,
  },
  payoutTotalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  payoutTotalValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },

  payoutRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderColor: COLORS.border,
  },
  payoutRowLeft: { gap: 2 },
  payoutOrderId: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  payoutDate: { fontSize: 12, color: COLORS.muted },
  payoutAmount: { fontSize: 15, fontWeight: '700', color: COLORS.success },

  // Customer Reviews
  reviewEmpty: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  reviewEmptyText: { fontSize: 16, fontWeight: '700', color: COLORS.subtext },
  reviewEmptyHint: { fontSize: 13, color: COLORS.muted, textAlign: 'center', paddingHorizontal: 20 },
  reviewSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: COLORS.primary + '10', borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 16, marginBottom: 16,
  },
  reviewAvgNum: { fontSize: 40, fontWeight: '800', color: COLORS.primary },
  reviewStarsRow: { flexDirection: 'row', gap: 2 },
  reviewCount: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  reviewCard: {
    backgroundColor: COLORS.card, borderRadius: 12,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  reviewCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  reviewerName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  reviewDate: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  reviewComment: { fontSize: 13, color: COLORS.subtext, lineHeight: 18 },

  // Contact Support
  supportInfoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.primary + '10', borderRadius: 12,
    padding: 14, marginBottom: 20,
  },
  supportInfoText: { flex: 1, fontSize: 13, color: COLORS.subtext, lineHeight: 18 },
  supportSectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.muted,
    letterSpacing: 1, marginBottom: 10,
  },
  supportRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: 12,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  supportRowIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  supportRowTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  supportRowSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  supportFaqItem: {
    borderBottomWidth: 1, borderColor: COLORS.border,
  },
  supportFaqRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 4,
  },
  supportFaqText: { flex: 1, fontSize: 14, color: COLORS.text },
  supportFaqAnswer: {
    paddingHorizontal: 4, paddingBottom: 14, paddingTop: 2,
    backgroundColor: COLORS.primary + '08',
    borderRadius: 8, marginBottom: 4, paddingLeft: 36,
  },
  supportFaqAnswerText: { fontSize: 13, color: COLORS.subtext, lineHeight: 20 },
});
