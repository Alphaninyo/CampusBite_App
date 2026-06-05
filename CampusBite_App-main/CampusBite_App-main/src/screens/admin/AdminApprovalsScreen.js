import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

const TABS = ['Vendors', 'Food Couriers'];

export default function AdminApprovalsScreen() {
  const [activeTab, setActiveTab]   = useState('Vendors');
  const [vendors, setVendors]       = useState([]);
  const [couriers, setCouriers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing]         = useState(null); // id of item being acted on

  const fetchAll = useCallback(async () => {
    try {
      const [vRes, cRes] = await Promise.all([
        api.admin.getPendingVendors(),
        api.admin.getPendingFoodCouriers(),
      ]);
      setVendors(vRes.data.vendors);
      setCouriers(cRes.data.couriers);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleVendorAction = async (vendorId, action) => {
    setActing(vendorId);
    try {
      if (action === 'approve') {
        await api.admin.approveVendor(vendorId);
        Alert.alert('Approved', 'Vendor has been approved successfully.');
      } else {
        await api.admin.rejectVendor(vendorId);
        Alert.alert('Rejected', 'Vendor application has been rejected.');
      }
      fetchAll();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActing(null);
    }
  };

  const handleCourierAction = async (courierId, action) => {
    setActing(courierId);
    try {
      if (action === 'approve') {
        await api.admin.approveFoodCourier(courierId);
        Alert.alert('Approved', 'Food courier has been approved successfully.');
      } else {
        await api.admin.rejectFoodCourier(courierId);
        Alert.alert('Rejected', 'Food courier application has been rejected.');
      }
      fetchAll();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActing(null);
    }
  };

  const confirmAction = (id, name, action, type) => {
    if (action === 'approve') {
      type === 'vendor' ? handleVendorAction(id, action) : handleCourierAction(id, action);
      return;
    }
    Alert.alert(
      'Reject Application',
      `Are you sure you want to reject ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => type === 'vendor' ? handleVendorAction(id, action) : handleCourierAction(id, action),
        },
      ]
    );
  };

  const renderVendorCard = ({ item }) => {
    const isActing = acting === item.id;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBg}>
            <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardName}>{item.business_name}</Text>
            <Text style={styles.cardSub}>{item.vendor_type === 'home_based' ? 'Home-Based' : 'Restaurant'}</Text>
          </View>
        </View>

        {item.location ? (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.subtext} />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
        ) : null}

        {item.owner && (
          <>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={13} color={COLORS.subtext} />
              <Text style={styles.infoText}>{item.owner.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={13} color={COLORS.subtext} />
              <Text style={styles.infoText}>{item.owner.email}</Text>
            </View>
            {item.owner.phone ? (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={13} color={COLORS.subtext} />
                <Text style={styles.infoText}>{item.owner.phone}</Text>
              </View>
            ) : null}
          </>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.subtext} />
          <Text style={styles.infoText}>Applied {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, isActing && styles.btnDisabled]}
            onPress={() => confirmAction(item.id, item.business_name, 'reject', 'vendor')}
            disabled={isActing}
          >
            {isActing ? <ActivityIndicator color={COLORS.danger} size="small" /> : (
              <>
                <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.approveBtn, isActing && styles.btnDisabled]}
            onPress={() => confirmAction(item.id, item.business_name, 'approve', 'vendor')}
            disabled={isActing}
          >
            {isActing ? <ActivityIndicator color={COLORS.white} size="small" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} />
                <Text style={styles.approveBtnText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCourierCard = ({ item }) => {
    const user = item.user || {};
    const isActing = acting === item.id;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBg, { backgroundColor: '#FFF5EB' }]}>
            <Ionicons name="bicycle-outline" size={20} color={COLORS.secondary} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardName}>{user.name || 'Unknown'}</Text>
            <Text style={styles.cardSub}>{item.vehicle_type}</Text>
          </View>
        </View>

        {user.email ? (
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={13} color={COLORS.subtext} />
            <Text style={styles.infoText}>{user.email}</Text>
          </View>
        ) : null}
        {user.phone ? (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={13} color={COLORS.subtext} />
            <Text style={styles.infoText}>{user.phone}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.subtext} />
          <Text style={styles.infoText}>Applied {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, isActing && styles.btnDisabled]}
            onPress={() => confirmAction(item.id, user.name || 'courier', 'reject', 'courier')}
            disabled={isActing}
          >
            {isActing ? <ActivityIndicator color={COLORS.danger} size="small" /> : (
              <>
                <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.approveBtn, isActing && styles.btnDisabled]}
            onPress={() => confirmAction(item.id, user.name || 'courier', 'approve', 'courier')}
            disabled={isActing}
          >
            {isActing ? <ActivityIndicator color={COLORS.white} size="small" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} />
                <Text style={styles.approveBtnText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const currentData    = activeTab === 'Vendors' ? vendors : couriers;
  const currentRender  = activeTab === 'Vendors' ? renderVendorCard : renderCourierCard;
  const pendingCount   = activeTab === 'Vendors' ? vendors.length : couriers.length;

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;
  }

  return (
    <View style={styles.container}>
      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {(tab === 'Vendors' ? vendors.length : couriers.length) > 0 && (
              <View style={[styles.badge, activeTab === tab && styles.badgeActive]}>
                <Text style={[styles.badgeText, activeTab === tab && styles.badgeTextActive]}>
                  {tab === 'Vendors' ? vendors.length : couriers.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id}
        renderItem={currentRender}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAll(); }}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={56} color={COLORS.success} />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySub}>No pending {activeTab.toLowerCase()} applications.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText:       { fontSize: 14, fontWeight: '600', color: COLORS.subtext },
  tabTextActive: { color: COLORS.primary },

  badge: {
    backgroundColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeActive:     { backgroundColor: COLORS.iconBg },
  badgeText:       { fontSize: 11, fontWeight: '700', color: COLORS.subtext },
  badgeTextActive: { color: COLORS.primary },

  list: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: COLORS.black,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBg:     { width: 42, height: 42, borderRadius: 11, backgroundColor: COLORS.iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardMeta:   { flex: 1 },
  cardName:   { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardSub:    { fontSize: 12, color: COLORS.subtext, marginTop: 2 },

  infoRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 6 },
  infoText: { fontSize: 13, color: COLORS.subtext, flex: 1 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },

  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
  },
  rejectBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: 14 },

  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  approveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  btnDisabled: { opacity: 0.6 },

  emptyContainer: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle:     { fontSize: 20, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  emptySub:       { fontSize: 14, color: COLORS.subtext, textAlign: 'center', lineHeight: 20 },
});
