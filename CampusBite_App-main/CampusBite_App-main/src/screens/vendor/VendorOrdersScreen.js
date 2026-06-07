import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

const TABS = ['Incoming', 'In Progress', 'Completed'];

export default function VendorOrdersScreen({ navigation }) {
  const [allOrders, setAllOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('Incoming');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.orders.getVendorOrders();
      setAllOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching vendor orders:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleAccept = async (orderId) => {
    try {
      await api.orders.updateStatus(orderId, 'Preparing');
      fetchOrders();
    } catch (err) {
      console.error('Accept error:', err.message);
    }
  };

  const handleDecline = async (orderId) => {
    Alert.alert('Decline Order', 'Are you sure you want to decline this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.orders.updateStatus(orderId, 'Cancelled');
            fetchOrders();
          } catch (err) {
            console.error('Decline error:', err.message);
          }
        }
      }
    ]);
  };

  const handleMarkReady = async (orderId) => {
    try {
      await api.orders.updateStatus(orderId, 'Ready');
      fetchOrders();
    } catch (err) {
      console.error('Ready error:', err.message);
    }
  };

  // Filter orders by tab
  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'Incoming':
        return allOrders.filter(o => o.status === 'Received');
      case 'In Progress':
        return allOrders.filter(o => o.status === 'Preparing' || o.status === 'Ready');
      case 'Completed':
        return allOrders.filter(o => o.status === 'Delivered' || o.status === 'Collected');
      default:
        return allOrders;
    }
  };

  const getTimeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} mins ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  };

  const getOrderItems = (order) => {
    if (!order.items || order.items.length === 0) return [];
    return order.items.map(item => ({
      name: item.menuItem?.name || item.name || 'Item',
      quantity: item.quantity,
    }));
  };

  const incomingCount = allOrders.filter(o => o.status === 'Received').length;
  const filteredOrders = getFilteredOrders();

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bag-outline" size={22} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Orders</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')}>
          <Ionicons name="person-circle-outline" size={28} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
            {tab === 'Incoming' && incomingCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{incomingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[COLORS.primary]} />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bag-outline" size={48} color={COLORS.gray} />
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} orders</Text>
          </View>
        ) : (
          filteredOrders.map(order => (
            <View key={order.id} style={styles.orderCard}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderNumber}>ORDER #{order.id.slice(0, 4).toUpperCase()}</Text>
                  <Text style={styles.customerName}>{order.consumer?.name || 'Customer'}</Text>
                </View>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.timeText}>{getTimeAgo(order.created_at)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Order Items */}
              <View style={styles.itemsList}>
                {getOrderItems(order).map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemQty}>{item.quantity}x</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              {activeTab === 'Incoming' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={styles.declineBtn} 
                    onPress={() => handleDecline(order.id)}
                  >
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.acceptBtn} 
                    onPress={() => handleAccept(order.id)}
                  >
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeTab === 'In Progress' && order.status === 'Preparing' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={styles.readyBtn} 
                    onPress={() => handleMarkReady(order.id)}
                  >
                    <Text style={styles.readyBtnText}>Mark as Ready</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeTab === 'In Progress' && order.status === 'Ready' && (
                <View style={styles.statusBanner}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.statusBannerText}>Ready for pick-up</Text>
                </View>
              )}
            </View>
          ))
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    paddingTop: 4,
    gap: 24,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: { fontSize: 14, color: COLORS.gray, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  tabBadge: {
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },

  scrollView: { flex: 1, paddingHorizontal: 16 },

  // Order Card
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: { fontSize: 12, color: COLORS.gray, fontWeight: '600', letterSpacing: 0.5 },
  customerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },

  divider: { height: 1, backgroundColor: COLORS.borderWarm, marginVertical: 12 },

  // Items
  itemsList: { marginBottom: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemQty: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary, width: 28 },
  itemName: { fontSize: 15, color: COLORS.text },

  // Actions
  actionRow: { flexDirection: 'row', gap: 12 },
  declineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
  },
  declineBtnText: { color: '#333', fontWeight: '600', fontSize: 14 },
  acceptBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  acceptBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  readyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#00796B',
    alignItems: 'center',
  },
  readyBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },

  // Status
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.successLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  statusBannerText: { color: COLORS.success, fontWeight: '600', fontSize: 13 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: COLORS.gray, marginTop: 12, fontSize: 15 },
});
