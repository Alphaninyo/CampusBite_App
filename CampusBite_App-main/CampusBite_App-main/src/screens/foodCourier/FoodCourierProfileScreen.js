import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Alert, Platform, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../stores/authStore';
import { api } from '../../api';
import { COLORS } from '../../constants';

const VEHICLE_TYPES = ['Electric Bicycle', 'Bicycle', 'Motorcycle', 'Walking'];

function getMockEarnings(total) {
  return Math.round(parseFloat(total) * 0.15) + 50;
}

export default function FoodCourierProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const [isAvailable, setIsAvailable]     = useState(true);
  const [vehicleType, setVehicleType]     = useState('Electric Bicycle');
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [rating, setRating]               = useState(0);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.foodCourier.getProfile();
      const profile = data.profile;
      setIsAvailable(profile.is_available);
      setVehicleType(profile.vehicle_type);
      setTotalDeliveries(profile.total_deliveries);
      setTotalEarnings(profile.total_earnings);
      setRating(profile.rating);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.notifications.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error(err.message);
    }
  }, []);

  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);

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

  const handleVehicleChange = () => {
    Alert.alert(
      'Vehicle Type',
      'Select your vehicle',
      VEHICLE_TYPES.map(v => ({
        text: v,
        onPress: async () => {
          try {
            await api.foodCourier.updateProfile({ vehicle_type: v });
            setVehicleType(v);
            Alert.alert('Success', 'Vehicle type updated successfully.');
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        }
      })).concat([{ text: 'Cancel', style: 'cancel' }])
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

  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || 'F';

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  const onTimeRate = totalDeliveries > 0 ? '100%' : '—';

  return (
    <View style={styles.container}>
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
          <Ionicons name="notifications-outline" size={22} color={COLORS.black} />
          {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} colors={[COLORS.primary]} />}
      >
        {/* ── Avatar + Name ── */}
        <TouchableOpacity style={styles.avatarSection} onPress={() => navigation.navigate('EditProfile', { user })}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'FC')}&background=E85D04&color=fff&size=200&bold=true` }}
              style={styles.avatarImg}
            />
            <View style={styles.ratingBadge}>
              <Ionicons name="shield-checkmark" size={10} color="#fff" />
              <Text style={styles.ratingBadgeText}>{rating.toFixed(1)}</Text>
            </View>
          </View>

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
            <View style={[styles.twoColIconBox, { backgroundColor: '#E0F2F1' }]}>
              <Ionicons name="trending-up-outline" size={22} color="#00796B" />
            </View>
            <View style={[styles.twoColIconBox, { backgroundColor: COLORS.successLight, marginTop: 4 }]}>
              <Ionicons name="bar-chart-outline" size={22} color="#388E3C" />
            </View>
            <Text style={styles.twoColTitle}>Weekly Trend</Text>
            <Text style={[styles.twoColSub, { color: '#388E3C' }]}>+12% vs last week</Text>
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
        </View>

        {/* ── Log Out ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.black },
  notifBtn: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },

  scrollView: { flex: 1, paddingHorizontal: 16 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 2,
    right: -2,
    backgroundColor: '#00796B',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 2,
  },
  ratingBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 22, fontWeight: 'bold', color: COLORS.black },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vehicleText: { fontSize: 13, color: COLORS.gray },

  // Availability
  availabilityCard: {
    backgroundColor: COLORS.iconBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  availabilityTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.black, marginBottom: 2 },
  availabilityStatus: { fontSize: 13, fontWeight: '600' },

  // Stats 3-col
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
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
  statValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.black },

  // Vehicle card
  featureCard: {
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextBlock: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 2 },
  featureSub: { fontSize: 12, color: COLORS.gray },

  // Two col cards
  twoColRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  twoColCard: {
    flex: 1,
    backgroundColor: COLORS.white,
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
  twoColTitle: { fontSize: 13, fontWeight: '600', color: COLORS.black, marginBottom: 2 },
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
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  menuDivider: { height: 1, backgroundColor: COLORS.borderWarm, marginHorizontal: 16 },

  // Feedback tags
  feedbackTags: { flexDirection: 'row', gap: 6, marginTop: 4 },
  tag: {
    backgroundColor: COLORS.iconBg,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  feedbackRating: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },

  // Logout
  logoutBtn: {
    backgroundColor: COLORS.white,
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
});
