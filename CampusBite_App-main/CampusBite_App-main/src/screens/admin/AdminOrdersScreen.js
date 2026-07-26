import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, TextInput,
  Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS, STATUS_COLORS } from '../../constants';

const TABS = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'];

const ISSUE_REASON_LABELS = {
  not_delivered: 'Order not delivered',
  wrong_items:   'Wrong items',
  missing_items: 'Missing items',
  poor_quality:  'Poor quality',
  other:         'Something else',
};

export default function AdminOrdersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [resolvingIssue, setResolvingIssue] = useState(false);
  const [markingRefund, setMarkingRefund] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.admin.getOrders({ limit: 100 });
      setOrders(data.orders || []);

      const allOrders = data.orders || [];
      setPendingCount(allOrders.filter(o => o.status === 'Received' || o.status === 'Pending').length);
      setInProgressCount(allOrders.filter(o => o.status === 'Preparing' || o.status === 'Ready' || o.status === 'In Transit').length);
      setCompletedCount(allOrders.filter(o => o.status === 'Delivered').length);
      setCancelledCount(allOrders.filter(o => o.status === 'Cancelled').length);

      api.notifications.getUnreadCount()
        .then(({ data }) => setUnreadCount(data.unread_count || 0))
        .catch(() => {});
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    let filtered = orders;
    
    // Filter by tab
    if (activeTab === 'Pending') {
      filtered = filtered.filter(o => o.status === 'Received' || o.status === 'Pending');
    } else if (activeTab === 'In Progress') {
      filtered = filtered.filter(o => o.status === 'Preparing' || o.status === 'Ready' || o.status === 'In Transit');
    } else if (activeTab === 'Completed') {
      filtered = filtered.filter(o => o.status === 'Delivered');
    } else if (activeTab === 'Cancelled') {
      filtered = filtered.filter(o => o.status === 'Cancelled');
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.id?.toLowerCase().includes(query) ||
        o.consumer?.name?.toLowerCase().includes(query) ||
        o.vendor?.business_name?.toLowerCase().includes(query)
      );
    }
    
    setFilteredOrders(filtered);
  }, [activeTab, searchQuery, orders]);

  const getStatusColor = (status) => {
    if (status === 'Delivered') return COLORS.success;
    if (status === 'Cancelled') return COLORS.danger;
    if (status === 'Preparing' || status === 'Ready' || status === 'In Transit') return COLORS.warning;
    return COLORS.primary;
  };

  const getStatusLabel = (status) => {
    if (status === 'Received' || status === 'Pending') return 'Pending';
    if (status === 'Preparing' || status === 'Ready' || status === 'In Transit') return 'In Progress';
    if (status === 'Delivered') return 'Completed';
    return status;
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleResolveIssue = async () => {
    if (!selectedOrder) return;
    setResolvingIssue(true);
    try {
      const { data } = await api.admin.resolveOrderIssue(selectedOrder.id);
      // The resolve-issue response is a bare Order row with no consumer/vendor/rider
      // includes — merge in just the resolved timestamp so the detail view keeps
      // the joined data already loaded from the orders list.
      const resolvedAt = data.order.issue_resolved_at;
      setSelectedOrder(prev => ({ ...prev, issue_resolved_at: resolvedAt }));
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, issue_resolved_at: resolvedAt } : o));
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Could not resolve the issue.');
    } finally {
      setResolvingIssue(false);
    }
  };

  const handleMarkRefundComplete = async () => {
    if (!selectedOrder) return;
    setMarkingRefund(true);
    try {
      const { data } = await api.admin.markRefundComplete(selectedOrder.id);
      const { refund_status, refunded_at } = data.order;
      setSelectedOrder(prev => ({ ...prev, refund_status, refunded_at }));
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, refund_status, refunded_at } : o));
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Could not mark the refund as complete.');
    } finally {
      setMarkingRefund(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bag-outline" size={22} color={COLORS.primary} />
          <View>
            <Text style={styles.headerTitle}>Orders</Text>
            <Text style={styles.headerSubtitle}>{pendingCount} pending - {inProgressCount} in progress</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('AdminNotifications')}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          {unreadCount > 0 && <View style={styles.notificationBadge} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrders(); }}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.subtext} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order ID, customer or vendor..."
            placeholderTextColor={COLORS.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {TABS.map((tab) => {
            const count = tab === 'All' ? orders.length :
                          tab === 'Pending' ? pendingCount :
                          tab === 'In Progress' ? inProgressCount :
                          tab === 'Completed' ? completedCount : cancelledCount;
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
        </ScrollView>

        {/* Orders List */}
        <View style={styles.section}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.subtext} />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          ) : (
            filteredOrders.map((order) => (
              <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => openOrderDetail(order)}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdContainer}>
                    <Text style={styles.orderId}>#{order.id?.slice(0, 8) || 'N/A'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {order.has_issue && !order.issue_resolved_at && (
                      <View style={styles.issueFlag}>
                        <Ionicons name="flag" size={11} color={COLORS.danger} />
                        <Text style={styles.issueFlagText}>Issue</Text>
                      </View>
                    )}
                    {order.refund_status === 'manual_required' && (
                      <View style={styles.refundFlag}>
                        <Ionicons name="cash-outline" size={11} color={COLORS.warningText} />
                        <Text style={styles.refundFlagText}>Refund needed</Text>
                      </View>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(order.status) }]}>
                        {getStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color={COLORS.subtext} />
                    <Text style={styles.detailText}>{order.consumer?.name || 'Unknown'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="storefront-outline" size={16} color={COLORS.subtext} />
                    <Text style={styles.detailText}>{order.vendor?.business_name || 'Unknown'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={16} color={COLORS.subtext} />
                    <Text style={styles.detailText}>KES {parseFloat(order.total_amount || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.subtext} />
                    <Text style={styles.detailText}>{new Date(order.created_at).toLocaleString()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ORDER DETAIL - #{selectedOrder?.id?.slice(0, 8)}</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Order Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedOrder?.status) }]}>
                    {getStatusLabel(selectedOrder?.status)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount</Text>
                  <Text style={styles.detailValue}>KES {parseFloat(selectedOrder?.total_amount || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Date</Text>
                  <Text style={styles.detailValue}>{selectedOrder?.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Customer</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{selectedOrder?.consumer?.name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{selectedOrder?.consumer?.phone || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Vendor</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Business</Text>
                  <Text style={styles.detailValue}>{selectedOrder?.vendor?.business_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{selectedOrder?.vendor?.location || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Delivery</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Courier</Text>
                  <Text style={styles.detailValue}>{selectedOrder?.rider?.name || 'Not assigned'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Delivery Address</Text>
                  <Text style={styles.detailValue}>{selectedOrder?.delivery_address || 'N/A'}</Text>
                </View>
              </View>

              {selectedOrder?.has_issue && (
                <View style={[styles.detailSection, styles.issueSection]}>
                  <View style={styles.issueSectionHeader}>
                    <Ionicons name="flag" size={16} color={COLORS.danger} />
                    <Text style={styles.detailSectionTitle}>Reported Issue</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reason</Text>
                    <Text style={styles.detailValue}>{ISSUE_REASON_LABELS[selectedOrder.issue_reason] || selectedOrder.issue_reason}</Text>
                  </View>
                  {selectedOrder.issue_note ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Note</Text>
                      <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>{selectedOrder.issue_note}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reported</Text>
                    <Text style={styles.detailValue}>{selectedOrder.issue_reported_at ? new Date(selectedOrder.issue_reported_at).toLocaleString() : 'N/A'}</Text>
                  </View>

                  {selectedOrder.issue_resolved_at ? (
                    <View style={styles.resolvedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#388E3C" />
                      <Text style={styles.resolvedBadgeText}>Resolved on {new Date(selectedOrder.issue_resolved_at).toLocaleDateString()}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.resolveBtn, resolvingIssue && { opacity: 0.6 }]}
                      onPress={handleResolveIssue}
                      disabled={resolvingIssue}
                    >
                      {resolvingIssue
                        ? <ActivityIndicator color={COLORS.white} size="small" />
                        : <Text style={styles.resolveBtnText}>Mark as Resolved</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {selectedOrder?.status === 'Cancelled' && selectedOrder?.refund_status !== 'not_applicable' && (
                <View style={[styles.detailSection, styles.issueSection]}>
                  <View style={styles.issueSectionHeader}>
                    <Ionicons name="cash-outline" size={16} color={COLORS.warningText} />
                    <Text style={styles.detailSectionTitle}>Refund</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Method</Text>
                    <Text style={styles.detailValue}>{selectedOrder.payment_method === 'mpesa' ? 'M-Pesa' : selectedOrder.payment_method === 'card' ? 'Card' : selectedOrder.payment_method}</Text>
                  </View>

                  {selectedOrder.refund_status === 'refunded' ? (
                    <View style={styles.resolvedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#388E3C" />
                      <Text style={styles.resolvedBadgeText}>
                        Refunded{selectedOrder.refunded_at ? ` on ${new Date(selectedOrder.refunded_at).toLocaleDateString()}` : ''}
                      </Text>
                    </View>
                  ) : selectedOrder.refund_status === 'failed' ? (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailValue, { color: COLORS.danger }]}>Refund attempt failed — check server logs.</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.resolveBtn, markingRefund && { opacity: 0.6 }]}
                      onPress={handleMarkRefundComplete}
                      disabled={markingRefund}
                    >
                      {markingRefund
                        ? <ActivityIndicator color={COLORS.white} size="small" />
                        : <Text style={styles.resolveBtnText}>Mark M-Pesa Refund as Sent</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
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

  // Order Card
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdContainer: {
    backgroundColor: COLORS.iconBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderId: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  orderDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.subtext,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.subtext,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Issue flag (order card)
  issueFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.danger + '15',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  issueFlagText: { fontSize: 10, fontWeight: '700', color: COLORS.danger },

  // Refund flag (order card)
  refundFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.warning + '18',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  refundFlagText: { fontSize: 10, fontWeight: '700', color: COLORS.warningText },

  // Issue section (order detail modal)
  issueSection: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 0,
  },
  issueSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  resolvedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#e8f5e9', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12, marginTop: 10,
    justifyContent: 'center',
  },
  resolvedBadgeText: { color: '#388E3C', fontWeight: '600', fontSize: 13 },
  resolveBtn: {
    marginTop: 10, backgroundColor: COLORS.danger,
    borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  resolveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
