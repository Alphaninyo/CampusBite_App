import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Switch, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../stores/authStore';
import { api } from '../../api';
import { COLORS } from '../../constants';

export default function VendorProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  console.log('VendorProfileScreen: user state =', user);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

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
          <Ionicons name="storefront-outline" size={22} color={COLORS.black} />
          <Text style={styles.headerTitle}>Vendor Profile</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: vendor?.logo || `https://via.placeholder.com/90x90/E85D04/FFFFFF?text=${storeInitial}` }}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
            </View>
          </View>
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
            <View style={[styles.settingIcon, { backgroundColor: COLORS.iconBg }]}>
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
            <View style={[styles.settingIcon, { backgroundColor: COLORS.iconBg }]}>
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
            <View style={[styles.settingIcon, { backgroundColor: COLORS.iconBg }]}>
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
            <View style={[styles.settingIcon, { backgroundColor: COLORS.iconBg }]}>
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
            <View style={[styles.settingIcon, { backgroundColor: COLORS.iconBg }]}>
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
            <View style={[styles.settingIcon, { backgroundColor: COLORS.iconBg }]}>
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },

  scrollView: { flex: 1, paddingHorizontal: 16 },

  // Profile
  profileSection: { alignItems: 'center', paddingVertical: 24 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.iconBg,
    borderWidth: 3,
    borderColor: COLORS.borderWarm,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 1,
  },
  storeName: { fontSize: 22, fontWeight: 'bold', color: COLORS.black, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: COLORS.gray },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginTop: 20, marginBottom: 10, marginLeft: 2 },
  sectionCard: {
    backgroundColor: COLORS.white,
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
  settingLabel: { fontSize: 14, fontWeight: '600', color: COLORS.black },
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
});
