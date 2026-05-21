import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

const STATUS_STEPS = ['Ready', 'Collected', 'In Transit', 'Delivered'];

const NEXT_STATUS = {
  Ready:        'Collected',
  Collected:    'In Transit',
  'In Transit': 'Delivered',
};

const ACTION_LABEL = {
  Collected:    'Collect Order from Vendor',
  'In Transit': 'Start Delivery',
  Delivered:    'Mark as Delivered',
};

export default function RiderOrderDetailScreen({ route }) {
  const { orderId } = route.params;
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await api.orders.getById(orderId);
      setOrder(data.order);
    } catch (err) {
      Alert.alert('Error', err.message);
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
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
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

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F6' }}>
      <ActivityIndicator size="large" color="#E85D04" />
    </View>
  );
  if (!order) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F6' }}>
      <Text style={{ color: COLORS.gray }}>Order not found.</Text>
    </View>
  );

  const nextStatus   = NEXT_STATUS[order.status];
  const isDelivered  = order.status === 'Delivered';
  const deliveryFee  = parseFloat(order.delivery_fee || 0);
  const currentStep  = STATUS_STEPS.indexOf(order.status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrder(); }} colors={['#E85D04']} />}
    >
      {/* ── Status Banner ── */}
      <View style={[styles.statusBanner, isDelivered && styles.statusBannerGreen]}>
        <Ionicons
          name={isDelivered ? 'checkmark-circle' : 'bicycle'}
          size={22}
          color="#fff"
        />
        <Text style={styles.statusText}>{order.status}</Text>
      </View>

      {/* ── Status Timeline ── */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Delivery Progress</Text>
        <View style={styles.timeline}>
          {STATUS_STEPS.map((step, index) => {
            const isPast = index < currentStep;
            const isCurrent = index === currentStep;
            const isFuture = index > currentStep;
            return (
              <View key={step} style={styles.timelineStep}>
                <View style={[styles.stepDot, isPast && styles.stepDotDone, isCurrent && styles.stepDotCurrent]}>
                  {isPast ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                </View>
                <Text style={[styles.stepLabel, isPast && styles.stepLabelDone, isCurrent && styles.stepLabelCurrent]}>
                  {step}
                </Text>
                {index < STATUS_STEPS.length - 1 && <View style={[styles.stepLine, isPast && styles.stepLineDone]} />}
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Pickup Info ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="storefront-outline" size={20} color="#E85D04" />
          <Text style={styles.cardTitle}>Pickup From</Text>
        </View>
        <Text style={styles.cardName}>{order.vendor?.business_name}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.gray} />
          <Text style={styles.infoText}>{order.vendor?.location || 'Vendor location'}</Text>
        </View>
      </View>

      {/* ── Delivery Info ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="navigate-circle-outline" size={20} color="#E85D04" />
          <Text style={styles.cardTitle}>Deliver To</Text>
        </View>
        <Text style={styles.cardName}>{order.consumer?.name}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.gray} />
          <Text style={styles.infoText}>{order.delivery_address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={14} color={COLORS.gray} />
          <Text style={styles.infoText}>{order.consumer?.phone}</Text>
        </View>
      </View>

      {/* ── Order Items ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="receipt-outline" size={20} color="#E85D04" />
          <Text style={styles.cardTitle}>Order Items</Text>
        </View>
        {order.items?.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.menuItem?.name}</Text>
            <View style={styles.itemQtyRow}>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
              <Text style={styles.itemPrice}>KES {(parseFloat(item.unit_price || 0) * item.quantity).toFixed(0)}</Text>
            </View>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>KES {parseFloat(order.total_amount || 0).toFixed(0)}</Text>
        </View>
        <View style={styles.earningsRow}>
          <Ionicons name="wallet-outline" size={16} color="#E85D04" />
          <Text style={styles.earningsLabel}>Your Earnings</Text>
          <Text style={styles.earningsValue}>KES {deliveryFee.toFixed(0)}</Text>
        </View>
      </View>

      {/* ── Action Button ── */}
      {nextStatus && (
        <TouchableOpacity
          style={[styles.actionButton, updating && { opacity: 0.6 }]}
          onPress={advanceStatus}
          disabled={updating}
        >
          {updating
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.actionButtonText}>{ACTION_LABEL[nextStatus]}</Text>
          }
        </TouchableOpacity>
      )}

      {isDelivered && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={24} color="#388E3C" />
          <Text style={styles.successText}>Delivery Complete!</Text>
          <Text style={styles.successSub}>You earned KES {deliveryFee.toFixed(0)} for this delivery</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F6' },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#E85D04',
  },
  statusBannerGreen: { backgroundColor: '#388E3C' },
  statusText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Timeline
  timelineCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0e8e4',
  },
  timelineTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.black, marginBottom: 16 },
  timeline: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineStep: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotDone: { backgroundColor: '#388E3C' },
  stepDotCurrent: { backgroundColor: '#E85D04' },
  stepLabel: { fontSize: 11, color: COLORS.gray, textAlign: 'center' },
  stepLabelDone: { color: '#388E3C', fontWeight: '600' },
  stepLabelCurrent: { color: '#E85D04', fontWeight: 'bold' },
  stepLine: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: -12,
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: -1,
  },
  stepLineDone: { backgroundColor: '#388E3C' },

  // Cards
  card: {
    backgroundColor: COLORS.white,
    margin: 16,
    marginTop: 0,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0e8e4',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.black },
  cardName: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontSize: 13, color: COLORS.gray, flex: 1 },

  // Items
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemName: { fontSize: 14, color: COLORS.black, flex: 1 },
  itemQtyRow: { alignItems: 'flex-end' },
  itemQty: { fontSize: 13, color: COLORS.gray, marginRight: 12 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  divider: { height: 1, backgroundColor: '#f0e8e4', marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#FFF0EB',
    borderRadius: 8,
  },
  earningsLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  earningsValue: { fontSize: 15, fontWeight: 'bold', color: '#E85D04' },

  // Action button
  actionButton: {
    margin: 16,
    backgroundColor: '#E85D04',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Success box
  successBox: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  successText: { fontSize: 16, fontWeight: 'bold', color: '#388E3C', marginTop: 8 },
  successSub: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
});

