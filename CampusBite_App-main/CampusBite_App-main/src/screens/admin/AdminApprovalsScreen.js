import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

const TABS = ['All', 'Vendors', 'Couriers', 'Rejected'];

export default function AdminApprovalsScreen() {
  const [activeTab, setActiveTab]   = useState('All');
  const [vendors, setVendors]       = useState([]);
  const [couriers, setCouriers]     = useState([]);
  const [rejected, setRejected]     = useState([]);
  const [recentlyApproved, setRecentlyApproved] = useState([]);
  const [longWaitingCount, setLongWaitingCount] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing]         = useState(null); // id of item being acted on

  const fetchAll = useCallback(async () => {
    try {
      const [vRes, cRes] = await Promise.all([
        api.admin.getPendingVendors(),
        api.admin.getPendingFoodCouriers(),
      ]);
      setVendors(vRes.data.vendors || []);
      setCouriers(cRes.data.couriers || []);
      
      // Calculate vendors waiting over 24 hours
      const now = new Date();
      const longWaitingVendors = (vRes.data.vendors || []).filter(v => {
        const created = new Date(v.created_at);
        const diffHours = (now - created) / (1000 * 60 * 60);
        return diffHours > 24;
      });
      setLongWaitingCount(longWaitingVendors.length);
      
      // Mock recently approved (in real app, fetch from backend)
      setRecentlyApproved([
        { id: '1', name: 'Campus Vendor Shop', approved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), type: 'vendor' },
      ]);
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

  const totalPending = vendors.length + couriers.length;
  
  const getCurrentData = () => {
    switch (activeTab) {
      case 'Vendors': return vendors;
      case 'Couriers': return couriers;
      case 'Rejected': return rejected;
      default: return [...vendors, ...couriers];
    }
  };

  const getTimeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.primary} />
          <View>
            <Text style={styles.headerTitle}>Approvals</Text>
            <Text style={styles.headerSubtitle}>{totalPending} pending review</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          {totalPending > 0 && <View style={styles.notificationBadge} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAll(); }}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Alert Banner */}
        {longWaitingCount > 0 && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning-outline" size={20} color={COLORS.warning} />
            <Text style={styles.alertText}>
              {longWaitingCount} vendor application{longWaitingCount > 1 ? 's have' : ' has'} been waiting over 24 hours.
            </Text>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const count = tab === 'All' ? totalPending : 
                          tab === 'Vendors' ? vendors.length : 
                          tab === 'Couriers' ? couriers.length : rejected.length;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pending Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'Rejected' ? 'REJECTED' : 'PENDING ' + (activeTab === 'Couriers' ? 'COURIERS' : 'VENDORS')}
          </Text>
          
          {getCurrentData().length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success} />
              <Text style={styles.emptyText}>No applications to review</Text>
            </View>
          ) : (
            getCurrentData().map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    <Ionicons 
                      name={item.vehicle_type ? 'bicycle-outline' : 'storefront-outline'} 
                      size={24} 
                      color={COLORS.primary} 
                    />
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardName}>
                      {item.business_name || item.user?.name || 'Unknown'}
                    </Text>
                    <Text style={styles.cardSub}>
                      Applied {getTimeAgo(item.created_at)} - {item.location || item.vehicle_type || 'Campus'}
                    </Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Owner Name</Text>
                    <Text style={styles.detailValue}>{item.owner?.name || item.user?.name || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>{item.owner?.phone || item.user?.phone || 'N/A'}</Text>
                  </View>
                  {item.business_name && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Menu Items</Text>
                      <Text style={styles.detailValue}>12 items</Text>
                    </View>
                  )}
                  {item.location && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>{item.location}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.rejectBtn, acting === item.id && styles.btnDisabled]}
                    onPress={() => confirmAction(item.id, item.business_name || item.user?.name, 'reject', item.vehicle_type ? 'courier' : 'vendor')}
                    disabled={acting === item.id}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.approveBtn, acting === item.id && styles.btnDisabled]}
                    onPress={() => confirmAction(item.id, item.business_name || item.user?.name, 'approve', item.vehicle_type ? 'courier' : 'vendor')}
                    disabled={acting === item.id}
                  >
                    <Text style={styles.approveBtnText}>
                      {item.vehicle_type ? 'Approve courier' : 'Approve vendor'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recently Approved Section */}
        {recentlyApproved.length > 0 && activeTab !== 'Rejected' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENTLY APPROVED</Text>
            {recentlyApproved.map((item) => (
              <View key={item.id} style={styles.approvedCard}>
                <View style={styles.approvedHeader}>
                  <View style={styles.approvedIcon}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  </View>
                  <View style={styles.approvedMeta}>
                    <Text style={styles.approvedName}>{item.name}</Text>
                    <Text style={styles.approvedSub}>
                      Approved {new Date(item.approved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
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
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  notificationBtn: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },

  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    marginTop: 16,
    borderRadius: 12,
    gap: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warningText,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  tabTextActive: {
    color: COLORS.white,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.subtext,
    marginBottom: 12,
    letterSpacing: 0.8,
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardMeta: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  pendingBadge: {
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.warning,
  },

  // Card Details
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  approveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.subtext,
    marginTop: 8,
  },

  // Approved Card
  approvedCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
  },
  approvedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  approvedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  approvedMeta: {
    flex: 1,
  },
  approvedName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  approvedSub: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  activeBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.success,
  },
});
