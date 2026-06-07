import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { api } from '../../api';
import { COLORS } from '../../constants';
import RiderMapView from '../../components/RiderMapView';

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
  const [order, setOrder]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating]     = useState(false);
  const [collectingCash, setCollectingCash] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const locationIntervalRef = useRef(null);

  const startLocationTracking = useCallback(async (activeOrderId) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const sendLocation = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = loc.coords;
        setMyLocation({ lat: latitude, lng: longitude, updatedAt: new Date().toISOString() });
        await api.orders.updateRiderLocation(activeOrderId, { lat: latitude, lng: longitude });
      } catch (err) {
        console.error('[LOCATION] Failed to send location:', err.message);
      }
    };

    sendLocation(); // fire immediately on start
    locationIntervalRef.current = setInterval(sendLocation, 10000);
  }, []);

  const stopLocationTracking = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, []);

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

  // Start/stop location tracking based on order status
  useEffect(() => {
    if (order && ['Collected', 'In Transit'].includes(order.status)) {
      if (!locationIntervalRef.current) {
        startLocationTracking(orderId);
      }
    } else {
      stopLocationTracking();
    }
    return () => stopLocationTracking();
  }, [order?.status, orderId, startLocationTracking, stopLocationTracking]);

  const advanceStatus = async () => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(true);
    try {
      const response = await api.orders.updateStatus(orderId, next);
      const newStatus = response.data?.new_status || next;
      setOrder(prev => ({ ...prev, status: newStatus }));

      if (newStatus === 'Delivered') {
        stopLocationTracking();
        await updateProfileStats();
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const updateProfileStats = async () => {
    try {
      const deliveryFee = parseFloat(order.delivery_fee || 0);
      const currentDeliveries = await AsyncStorage.getItem('courierDeliveries') || '0';
      const currentEarnings = await AsyncStorage.getItem('courierEarnings') || '0';
      
      const newDeliveries = parseInt(currentDeliveries) + 1;
      const newEarnings = parseFloat(currentEarnings) + deliveryFee;
      
      await AsyncStorage.setItem('courierDeliveries', newDeliveries.toString());
      await AsyncStorage.setItem('courierEarnings', newEarnings.toString());
    } catch (err) {
      console.error('Error updating profile stats:', err);
    }
  };

  const handleCollectCash = () => {
    const amount = parseFloat(order.total_amount || 0).toFixed(0);
    Alert.alert(
      'Confirm Cash Received',
      `Confirm that the customer has paid KES ${amount} in cash?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Cash Received',
          onPress: async () => {
            setCollectingCash(true);
            try {
              await api.orders.collectCash(orderId);
              Alert.alert('Done', 'Cash payment confirmed.');
              fetchOrder();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || err.message);
            } finally {
              setCollectingCash(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
  if (!order) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <Text style={{ color: COLORS.gray }}>Order not found.</Text>
    </View>
  );

  const nextStatus      = NEXT_STATUS[order.status];
  const isDelivered     = order.status === 'Delivered';
  const deliveryFee     = parseFloat(order.delivery_fee || 0);
  const currentStep     = STATUS_STEPS.indexOf(order.status);
  const needsCashCollect = order.status === 'In Transit'
    && order.payment_method !== 'mpesa'
    && order.payment?.status !== 'confirmed';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrder(); }} colors={[COLORS.primary]} />}
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
          <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
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
          <Ionicons name="navigate-circle-outline" size={20} color={COLORS.primary} />
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

      {/* ── Live Location Map ── */}
      {['Collected', 'In Transit'].includes(order.status) && (
        <View style={styles.card}>
          <View style={styles.mapHeader}>
            <Ionicons name="navigate-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Your Live Location</Text>
            {myLocation && (
              <View style={styles.liveChip}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          <Text style={styles.mapSub}>
            This location is being shared with the consumer in real-time.
          </Text>
          <RiderMapView
            lat={myLocation?.lat}
            lng={myLocation?.lng}
            locationUpdatedAt={myLocation?.updatedAt}
          />
        </View>
      )}

      {/* ── Order Items ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
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
          <Ionicons name="wallet-outline" size={16} color={COLORS.primary} />
          <Text style={styles.earningsLabel}>Your Earnings</Text>
          <Text style={styles.earningsValue}>KES {deliveryFee.toFixed(0)}</Text>
        </View>
      </View>

      {/* ── Pay on Delivery: Cash Collection ── */}
      {needsCashCollect && (
        <View style={styles.cashCard}>
          <View style={styles.cashCardHeader}>
            <Ionicons name="cash-outline" size={22} color="#2e7d32" />
            <Text style={styles.cashCardTitle}>Pay on Delivery</Text>
          </View>
          <Text style={styles.cashCardSub}>
            This customer is paying in cash. Collect <Text style={styles.cashAmount}>KES {parseFloat(order.total_amount || 0).toFixed(0)}</Text> before handing over the order.
          </Text>
          <TouchableOpacity
            style={[styles.cashBtn, collectingCash && { opacity: 0.6 }]}
            onPress={handleCollectCash}
            disabled={collectingCash}
          >
            {collectingCash
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.cashBtnText}>Confirm Cash Received</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}

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
  container: { flex: 1, backgroundColor: COLORS.background },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
  },
  statusBannerGreen: { backgroundColor: '#388E3C' },
  statusText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },

  // Timeline
  timelineCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  timelineTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.black, marginBottom: 16 },
  timeline: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineStep: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotDone: { backgroundColor: '#388E3C' },
  stepDotCurrent: { backgroundColor: COLORS.primary },
  stepLabel: { fontSize: 11, color: COLORS.gray, textAlign: 'center' },
  stepLabelDone: { color: '#388E3C', fontWeight: '600' },
  stepLabelCurrent: { color: COLORS.primary, fontWeight: 'bold' },
  stepLine: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: -12,
    height: 2,
    backgroundColor: COLORS.border,
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
    borderColor: COLORS.borderWarm,
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
  divider: { height: 1, backgroundColor: COLORS.borderWarm, marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: COLORS.iconBg,
    borderRadius: 8,
  },
  earningsLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  earningsValue: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },

  // Live map
  mapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  mapSub: { fontSize: 12, color: COLORS.gray, marginBottom: 12 },
  liveChip: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#388E3C' },
  liveText: { fontSize: 11, color: '#388E3C', fontWeight: '800' },

  // Cash collection card
  cashCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#f1f8e9',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#a5d6a7',
  },
  cashCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cashCardTitle:  { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  cashCardSub:    { fontSize: 13, color: '#388E3C', lineHeight: 19, marginBottom: 14 },
  cashAmount:     { fontWeight: 'bold' },
  cashBtn: {
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cashBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  // Action button
  actionButton: {
    margin: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },

  // Success box
  successBox: {
    margin: 16,
    marginTop: 0,
    backgroundColor: COLORS.successBg,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  successText: { fontSize: 16, fontWeight: 'bold', color: '#388E3C', marginTop: 8 },
  successSub: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
});

