import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

const NEXT_STATUS = {
  Received:  'Preparing',
  Preparing: 'Ready',
};

const STATUS_CONFIG = {
  Received:  { color: '#6B7280', icon: 'hourglass-outline', label: 'Received' },
  Preparing: { color: '#E85D04', icon: 'restaurant-outline', label: 'Preparing' },
  Ready:     { color: '#4CAF50', icon: 'checkmark-circle-outline', label: 'Ready' },
  Collected: { color: '#00796B', icon: 'bicycle-outline', label: 'Collected' },
  Delivered: { color: '#10B981', icon: 'checkmark-done-outline', label: 'Delivered' },
};

export default function VendorOrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await api.orders.getById(orderId);
      setOrder(data.order);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const advanceStatus = async () => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    Alert.alert('Update Status', `Mark order as "${next}"?`, [
      { text: 'Cancel' },
      {
        text: 'Confirm', onPress: async () => {
          setUpdating(true);
          try {
            await api.orders.updateStatus(orderId, next);
            fetchOrder();
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const cancelOrder = async () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
          setUpdating(true);
          try {
            await api.orders.updateStatus(orderId, 'Cancelled');
            fetchOrder();
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E85D04" /></View>;
  if (!order) return (
    <View style={styles.loadingContainer}>
      <Ionicons name="alert-circle-outline" size={48} color={COLORS.gray} />
      <Text style={{ color: COLORS.gray, marginTop: 12 }}>Order not found.</Text>
    </View>
  );

  const nextStatus = NEXT_STATUS[order.status];
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Received;
  const subtotal = order.items?.reduce((sum, i) => sum + (parseFloat(i.unit_price) * i.quantity), 0) || 0;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrder(); }} colors={['#E85D04']} />}
    >
      {/* Status Badge */}
      <View style={[styles.statusBanner, { backgroundColor: statusCfg.color }]}>
        <Ionicons name={statusCfg.icon} size={20} color={COLORS.white} />
        <Text style={styles.statusBannerText}>{statusCfg.label}</Text>
      </View>

      {/* Order Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Details</Text>
        <View style={styles.infoRow}>
          <Ionicons name="receipt-outline" size={16} color="#E85D04" />
          <Text style={styles.infoLabel}>Order ID</Text>
          <Text style={styles.infoValue}>#CB-{order.id.slice(0, 4).toUpperCase()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#E85D04" />
          <Text style={styles.infoLabel}>Customer</Text>
          <Text style={styles.infoValue}>{order.consumer?.name || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="#E85D04" />
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{order.consumer?.phone || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#E85D04" />
          <Text style={styles.infoLabel}>Address</Text>
          <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>{order.delivery_address || 'N/A'}</Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Items</Text>
        {order.items?.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.menuItem?.name || 'Item'}</Text>
            </View>
            <Text style={styles.itemPrice}>KES {(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalDivider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>KES {subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Delivery Fee</Text>
          <Text style={styles.totalValue}>KES {parseFloat(order.delivery_fee || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { fontWeight: 'bold', color: COLORS.black }]}>Total</Text>
          <Text style={[styles.totalValue, { fontWeight: 'bold', color: '#E85D04', fontSize: 16 }]}>
            KES {parseFloat(order.total_amount || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Rider Info */}
      {order.rider && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Rider</Text>
          <View style={styles.riderRow}>
            <View style={styles.riderAvatar}>
              <Ionicons name="bicycle" size={20} color="#E85D04" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.riderName}>{order.rider.name}</Text>
              <Text style={styles.riderPhone}>{order.rider.phone}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        {order.status === 'Received' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelOrder} disabled={updating}>
            {updating ? <ActivityIndicator color="#EF4444" /> : (
              <>
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                <Text style={styles.cancelBtnText}>Cancel Order</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {nextStatus && (
          <TouchableOpacity style={styles.actionBtn} onPress={advanceStatus} disabled={updating}>
            {updating
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="arrow-forward-circle-outline" size={20} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>Mark as {nextStatus}</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F6' },

  // Status
  statusBanner: {
    margin: 16,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusBannerText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },

  // Cards
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0e8e4',
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginBottom: 14 },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  infoLabel: { fontSize: 13, color: COLORS.gray, flex: 1 },
  infoValue: { fontSize: 13, color: COLORS.black, fontWeight: '500' },

  // Items
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f0ed',
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  itemQty: { fontSize: 14, fontWeight: 'bold', color: '#E85D04' },
  itemName: { fontSize: 14, color: COLORS.black },
  itemPrice: { fontSize: 14, color: COLORS.black, fontWeight: '500' },

  // Totals
  totalDivider: { height: 1, backgroundColor: '#f0e8e4', marginVertical: 10 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: { fontSize: 13, color: COLORS.gray },
  totalValue: { fontSize: 13, color: COLORS.black },

  // Rider
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderName: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  riderPhone: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  // Action Buttons
  actionButtonsContainer: {
    marginHorizontal: 16,
    marginTop: 4,
    gap: 12,
  },
  actionBtn: {
    backgroundColor: '#E85D04',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  cancelBtnText: { color: '#EF4444', fontWeight: 'bold', fontSize: 15 },
});
