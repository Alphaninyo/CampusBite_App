import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        <Ionicons name={STEP_ICONS[order.status] || 'help-circle-outline'} size={20} color={COLORS.white} />
        <Text style={styles.statusBannerText}>{order.status}</Text>
      </View>

      {/* Progress Steps */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.step, { backgroundColor: i <= stepIndex ? COLORS.primary : COLORS.borderWarm }]} />
        ))}
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
          <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: COLORS.black }]}>Total</Text>
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
          <Ionicons name="star-outline" size={18} color={COLORS.white} />
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
  statusBannerText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },

  // Progress
  progressRow: { flexDirection: 'row', gap: 4, marginHorizontal: 16, marginBottom: 16 },
  step: { flex: 1, height: 4, borderRadius: 2 },

  // Cards
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginBottom: 14 },

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
  itemName: { fontSize: 14, color: COLORS.black },
  itemPrice: { fontSize: 14, color: COLORS.black, fontWeight: '500' },

  // Summary
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: COLORS.gray },
  summaryValue: { fontSize: 13, color: COLORS.black },
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
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderName: { fontSize: 14, fontWeight: '600', color: COLORS.black },
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
  reviewBtnText: { fontWeight: 'bold', fontSize: 15, color: COLORS.white },
});
