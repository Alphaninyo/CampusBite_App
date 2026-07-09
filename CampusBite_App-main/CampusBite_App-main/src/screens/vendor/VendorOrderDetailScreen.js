import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api';
import { COLORS } from '../../constants';

const NEXT_STATUS = {
  Received:  'Preparing',
  Preparing: 'Ready',
};

const STATUS_CONFIG = {
  Received:  { color: COLORS.subtext, icon: 'hourglass-outline', label: 'Received' },
  Preparing: { color: COLORS.primary, icon: 'restaurant-outline', label: 'Preparing' },
  Ready:     { color: COLORS.success, icon: 'checkmark-circle-outline', label: 'Ready' },
  Collected: { color: '#00796B', icon: 'bicycle-outline', label: 'Collected' },
  'In Transit': { color: '#00796B', icon: 'car-outline', label: 'In Transit' },
  Delivered: { color: COLORS.success, icon: 'checkmark-done-outline', label: 'Delivered' },
};

// Simple progress checklist — lets the vendor track the order all the way to
// the consumer without needing a live map. Mirrors the same steps/labels the
// consumer and courier screens use.
const PROGRESS_STEPS = ['Received', 'Preparing', 'Ready', 'Collected', 'In Transit', 'Delivered'];

export default function VendorOrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const pollRef = useRef(null);

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

  // Poll while this screen is focused so the vendor can just leave it open and
  // watch the order move through Collected → In Transit → Delivered, instead
  // of needing a live map or manually pulling to refresh.
  useFocusEffect(
    useCallback(() => {
      fetchOrder();
      pollRef.current = setInterval(fetchOrder, 5000);
      return () => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      };
    }, [fetchOrder])
  );

  const callRider = () => {
    if (order?.rider?.phone) Linking.openURL(`tel:${order.rider.phone}`);
  };

  const advanceStatus = async () => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;

    const doUpdate = async () => {
      setUpdating(true);
      try {
        await api.orders.updateStatus(orderId, next);
        fetchOrder();
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setUpdating(false);
      }
    };

    // React Native's Alert.alert with multiple buttons doesn't render on web
    // (same issue previously fixed for the photo upload dialog), so use the
    // browser's native confirm() there instead of silently doing nothing.
    if (Platform.OS === 'web') {
      if (window.confirm(`Mark order as "${next}"?`)) await doUpdate();
      return;
    }
    Alert.alert('Update Status', `Mark order as "${next}"?`, [
      { text: 'Cancel' },
      { text: 'Confirm', onPress: doUpdate },
    ]);
  };

  const cancelOrder = async () => {
    const doCancel = async () => {
      setUpdating(true);
      try {
        await api.orders.cancel(orderId);
        fetchOrder();
      } catch (err) {
        Alert.alert('Error', err?.response?.data?.message || err.message);
      } finally {
        setUpdating(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to cancel this order?')) await doCancel();
      return;
    }
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: doCancel },
    ]);
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!order) return (
    <View style={styles.loadingContainer}>
      <Ionicons name="alert-circle-outline" size={48} color={COLORS.gray} />
      <Text style={{ color: COLORS.gray, marginTop: 12 }}>Order not found.</Text>
    </View>
  );

  const nextStatus = NEXT_STATUS[order.status];
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Received;
  const subtotal = order.items?.reduce((sum, i) => sum + (parseFloat(i.unit_price) * i.quantity), 0) || 0;
  const stepIndex = PROGRESS_STEPS.indexOf(order.status);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrder(); }} colors={[COLORS.primary]} />}
    >
      {/* Status Badge */}
      <View style={[styles.statusBanner, { backgroundColor: statusCfg.color }]}>
        <Ionicons name={statusCfg.icon} size={20} color={COLORS.white} />
        <Text style={styles.statusBannerText}>{statusCfg.label}</Text>
      </View>

      {/* Delivery Progress — simple checklist tracking, no map needed */}
      {order.status !== 'Cancelled' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Progress</Text>
          {PROGRESS_STEPS.map((step, index) => {
            // "Delivered" is the last step and also the terminal status — once
            // the order reaches it, treat it as done rather than "current".
            const isPast = index < stepIndex || (order.status === 'Delivered' && index === stepIndex);
            const isCurrent = index === stepIndex && order.status !== 'Delivered';
            const isLast = index === PROGRESS_STEPS.length - 1;
            return (
              <View key={step} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.stepDot, isPast && styles.stepDotDone, isCurrent && styles.stepDotCurrent]}>
                    {isPast ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                  </View>
                  {!isLast && <View style={[styles.stepConnector, isPast && styles.stepConnectorDone]} />}
                </View>
                <Text style={[styles.stepLabel, isPast && styles.stepLabelDone, isCurrent && styles.stepLabelCurrent]}>
                  {step}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Order Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Details</Text>
        <View style={styles.infoRow}>
          <Ionicons name="receipt-outline" size={16} color={COLORS.primary} />
          <Text style={styles.infoLabel}>Order ID</Text>
          <Text style={styles.infoValue}>#CB-{order.id.slice(0, 4).toUpperCase()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.primary} />
          <Text style={styles.infoLabel}>Customer</Text>
          <Text style={styles.infoValue}>{order.consumer?.name || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color={COLORS.primary} />
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{order.consumer?.phone || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.primary} />
          <Text style={styles.infoLabel}>Address</Text>
          <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>{order.delivery_address || 'N/A'}</Text>
        </View>
        {order.special_instructions ? (
          <View style={styles.instructionsBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLORS.primary} style={{ marginTop: 1 }} />
            <Text style={styles.instructionsText}>{order.special_instructions}</Text>
          </View>
        ) : null}
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
          <Text style={[styles.totalValue, { fontWeight: 'bold', color: COLORS.primary, fontSize: 16 }]}>
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
              <Ionicons name="bicycle" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.riderName}>{order.rider.name}</Text>
              <Text style={styles.riderPhone}>{order.rider.phone}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={callRider}>
              <Ionicons name="call" size={16} color={COLORS.white} />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

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
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 14 },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  infoLabel: { fontSize: 13, color: COLORS.gray, flex: 1 },
  infoValue: { fontSize: 13, color: COLORS.text, fontWeight: '500' },

  // Items
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderWarm,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  itemQty: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  itemName: { fontSize: 14, color: COLORS.text },
  itemPrice: { fontSize: 14, color: COLORS.text, fontWeight: '500' },

  // Totals
  totalDivider: { height: 1, backgroundColor: COLORS.borderWarm, marginVertical: 10 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: { fontSize: 13, color: COLORS.gray },
  totalValue: { fontSize: 13, color: COLORS.text },

  // Special instructions
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 10,
    padding: 10,
  },
  instructionsText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 18 },

  // Rider
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  riderPhone: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.success, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  callBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

  // Delivery Progress timeline
  timelineRow: { flexDirection: 'row', alignItems: 'center', minHeight: 34 },
  timelineLeft: { alignItems: 'center', width: 26, alignSelf: 'stretch' },
  stepDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: '#388E3C' },
  stepDotCurrent: { backgroundColor: COLORS.primary },
  stepConnector: { width: 2, flex: 1, minHeight: 14, backgroundColor: COLORS.border, marginVertical: 2 },
  stepConnectorDone: { backgroundColor: '#388E3C' },
  stepLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '500', marginLeft: 10 },
  stepLabelDone: { color: '#388E3C', fontWeight: '600' },
  stepLabelCurrent: { color: COLORS.primary, fontWeight: 'bold' },

  // Action Buttons
  actionButtonsContainer: {
    marginHorizontal: 16,
    marginTop: 4,
    gap: 12,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
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
    borderColor: COLORS.danger,
  },
  cancelBtnText: { color: COLORS.danger, fontWeight: 'bold', fontSize: 15 },
});
