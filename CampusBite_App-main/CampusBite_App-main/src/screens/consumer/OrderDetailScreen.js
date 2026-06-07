import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api';
import { COLORS, STATUS_COLORS } from '../../constants';

const STEPS = ['Received', 'Preparing', 'Ready', 'Collected', 'In Transit', 'Delivered'];

const STEP_ICONS = {
  Received:    'hourglass-outline',
  Preparing:   'restaurant-outline',
  Ready:       'checkmark-circle-outline',
  Collected:   'bicycle-outline',
  'In Transit':'car-outline',
  Delivered:   'checkmark-done-outline',
};

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

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

  // Poll for order updates every 5 seconds when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchOrder();
      intervalRef.current = setInterval(fetchOrder, 5000);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [fetchOrder])
  );

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!order) return (
    <View style={styles.loadingContainer}>
      <Ionicons name="alert-circle-outline" size={48} color={COLORS.gray} />
      <Text style={{ color: COLORS.gray, marginTop: 12 }}>Order not found.</Text>
    </View>
  );

  const stepIndex = STEPS.indexOf(order.status);
  const subtotal = order.items?.reduce((sum, i) => sum + (parseFloat(i.unit_price) * i.quantity), 0) || 0;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrder(); }} colors={[COLORS.primary]} />}
    >
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: STATUS_COLORS[order.status] || COLORS.gray }]}>
        <Ionicons name={STEP_ICONS[order.status] || 'help-circle-outline'} size={20} color={COLORS.card} />
        <Text style={styles.statusBannerText}>{order.status}</Text>
      </View>

      {/* Order Timeline */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Order Progress</Text>
        <View style={styles.timeline}>
          {STEPS.map((step, index) => {
            const isPast = index < stepIndex;
            const isCurrent = index === stepIndex;
            const isFuture = index > stepIndex;
            return (
              <View key={step} style={styles.timelineStep}>
                <View style={[styles.stepDot, isPast && styles.stepDotDone, isCurrent && styles.stepDotCurrent]}>
                  {isPast ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                </View>
                <Text style={[styles.stepLabel, isPast && styles.stepLabelDone, isCurrent && styles.stepLabelCurrent]}>
                  {step}
                </Text>
                {index < STEPS.length - 1 && <View style={[styles.stepLine, isPast && styles.stepLineDone]} />}
              </View>
            );
          })}
        </View>
      </View>

      {/* Order Items */}
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
      </View>

      {/* Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Food Subtotal</Text>
          <Text style={styles.summaryValue}>KES {subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>KES {parseFloat(order.delivery_fee || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: COLORS.text }]}>Total</Text>
          <Text style={[styles.summaryValue, { fontWeight: 'bold', color: COLORS.primary, fontSize: 16 }]}>
            KES {parseFloat(order.total_amount || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery Address</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.primary} />
          <Text style={styles.addressText}>{order.delivery_address || 'N/A'}</Text>
        </View>
      </View>

      {/* Rider */}
      {order.rider && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Rider</Text>
          <View style={styles.riderRow}>
            <View style={styles.riderAvatar}>
              <Ionicons name="bicycle" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.riderName}>{order.rider.name}</Text>
              <Text style={styles.riderPhone}>{order.rider.phone}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Review Button */}
      {order.status === 'Delivered' && (
        <TouchableOpacity style={styles.reviewBtn} onPress={() => navigation.navigate('WriteReview', { order })}>
          <Ionicons name="star-outline" size={18} color={COLORS.card} />
          <Text style={styles.reviewBtnText}>Write a Review</Text>
        </TouchableOpacity>
      )}

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
  statusBannerText: { color: COLORS.card, fontWeight: 'bold', fontSize: 15 },

  // Timeline
  timelineCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  timelineTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
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
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 14 },

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

  // Summary
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: COLORS.gray },
  summaryValue: { fontSize: 13, color: COLORS.text },
  totalDivider: { height: 1, backgroundColor: COLORS.borderWarm, marginVertical: 10 },

  // Address
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressText: { color: COLORS.gray, fontSize: 13, flex: 1 },

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

  // Review
  reviewBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: COLORS.warning,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reviewBtnText: { fontWeight: 'bold', fontSize: 15, color: COLORS.card },
});
