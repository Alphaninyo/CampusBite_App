import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, Platform, Image, Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAuthStore from '../../stores/authStore';
import { api } from '../../api';
import { COLORS } from '../../constants';


export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuthStore();

  const [name, setName]   = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileImage, setProfileImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const [showEditModal, setShowEditModal]         = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent]   = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      fetchStats();
    }
  }, [user]);

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

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.auth.updateProfile({ name, phone });
      updateUser({ name: data.user.name, phone: data.user.phone });
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

  const handleImageUpload = () => {
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
            allowsEditing: true, aspect: [1, 1], quality: 0.8,
          });
          if (!result.canceled && result.assets?.[0]?.uri)
            setProfileImage({ uri: result.assets[0].uri });
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
            mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
          });
          if (!result.canceled && result.assets?.[0]?.uri)
            setProfileImage({ uri: result.assets[0].uri });
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
    {
      icon: 'location-outline',
      iconColor: COLORS.info,
      label: 'Saved addresses',
      sub: 'Hostel, lecture halls, etc.',
      onPress: () => Alert.alert('Coming soon', 'Saved addresses will be available soon.'),
    },
    {
      icon: 'notifications-outline',
      iconColor: COLORS.success,
      label: 'Notifications',
      sub: 'Order updates, promos',
      onPress: () => Alert.alert('Coming soon', 'Notification settings coming soon.'),
    },
    {
      icon: 'lock-closed-outline',
      iconColor: '#8B5CF6',
      label: 'Security',
      sub: 'Password, 2FA',
      onPress: () => setShowPasswordModal(true),
    },
    {
      icon: 'help-circle-outline',
      iconColor: COLORS.warning,
      label: 'Help & support',
      sub: 'Report an issue, contact us',
      onPress: () =>
        Alert.alert('Help & Support', 'Email us at support@campusbite.app'),
    },
  ];

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Edit Profile Modal ──────────────────────────────────────────── */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalAvatar} onPress={handleImageUpload}>
              {profileImage ? (
                <Image source={profileImage} style={styles.modalAvatarImg} />
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
              onChangeText={setPhone}
              keyboardType="phone-pad"
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
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Password Modal ──────────────────────────────────────────────── */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Profile Header ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handleImageUpload}>
            {profileImage ? (
              <Image source={profileImage} style={styles.avatarImg} />
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

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
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
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Favourites</Text>
          </View>
        </View>

        {/* ── Recent Orders ───────────────────────────────────────────────── */}
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

        {/* ── Favourite Items ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>FAVOURITE ITEMS</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={44} color={COLORS.muted} />
            <Text style={styles.emptyText}>
              Tap the heart on any item to save it here for quick reordering.
            </Text>
          </View>
        </View>

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
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg:     { width: 90, height: 90, borderRadius: 45 },
  avatarInitials:{ fontSize: 32, fontWeight: '700', color: COLORS.white },
  cameraIcon:    {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.card,
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
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 44,
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
  modalTitle:          { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalAvatar:         { alignSelf: 'center', position: 'relative', marginBottom: 20 },
  modalAvatarImg:      { width: 72, height: 72, borderRadius: 36 },
  modalAvatarCircle:   {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  modalAvatarInitials: { fontSize: 26, fontWeight: '700', color: COLORS.white },
  modalCameraIcon:     {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
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
});
