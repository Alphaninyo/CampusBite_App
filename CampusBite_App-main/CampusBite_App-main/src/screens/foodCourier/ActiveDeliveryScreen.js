import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';

function getEarnings(order) {
  return parseFloat(order.delivery_fee || 0);
}

const STATUS_LABEL = {
  Ready:        'Awaiting pickup',
  Collected:    'Collected',
  'In Transit': 'On the way',
};

export default function ActiveDeliveryScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.orders.getFoodCourierOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.notifications.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error(err.message);
    }
  }, []);

  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);

  const activeDeliveries = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="navigate-outline" size={22} color={COLORS.primary} />
          <Text style={styles.headerTitle}>CampusBite</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => { navigation.navigate('Notifications'); fetchUnreadCount(); }}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
        </TouchableOpacity>
      </View>

      {/* Sub-header */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderTitle}>Active Delivery</Text>
        <Text style={styles.subHeaderSub}>
          {activeDeliveries.length === 0 ? 'Nothing in progress right now' : `${activeDeliveries.length} in progress`}
        </Text>
      </View>

      <FlatList
        data={activeDeliveries}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[COLORS.primary]} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('FoodCourierOrderDetail', { orderId: item.id })}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.restaurant}>{item.vendor?.business_name}</Text>
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.addressText} numberOfLines={1}>{item.delivery_address}</Text>
                </View>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{STATUS_LABEL[item.status] || item.status}</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
              <Text style={styles.earnings}>KES {getEarnings(item).toFixed(0)}</Text>
              <Text style={styles.cta}>Tap to manage</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="navigate-outline" size={64} color={COLORS.lightGray} />
            <Text style={styles.empty}>No active delivery right now.</Text>
            <Text style={styles.emptySub}>Accept a task to see it here.</Text>
            <TouchableOpacity style={styles.emptyCta} onPress={() => navigation.navigate('AvailableTab')} activeOpacity={0.8}>
              <Text style={styles.emptyCtaText}>Find a delivery</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

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
  notifBtn: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },

  subHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  subHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  subHeaderSub: { fontSize: 13, color: COLORS.gray },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  restaurant: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontSize: 13, color: COLORS.gray, flexShrink: 1 },
  statusBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
    paddingTop: 12,
  },
  earnings: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },
  cta: { fontSize: 13, color: COLORS.gray, fontWeight: '600', flex: 1, textAlign: 'right' },

  emptyContainer: { alignItems: 'center', paddingVertical: 60, flex: 1, justifyContent: 'center' },
  empty: { color: COLORS.gray, marginTop: 12, fontSize: 15 },
  emptySub: { color: COLORS.gray, marginTop: 6, fontSize: 13 },
  emptyCta: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyCtaText: { color: COLORS.white, fontSize: 14, fontWeight: 'bold' },
});
