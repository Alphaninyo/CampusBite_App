import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { resolveImageUrl } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

const FILTERS = ['All Tasks', 'Closest', 'Highest Pay', 'Hot'];

function VendorImagePlaceholder({ name, styles }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const hue = name ? name.charCodeAt(0) % 360 : 0;
  return (
    <View style={[styles.restaurantImage, { backgroundColor: `hsl(${hue},55%,60%)`, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontSize: 32, fontWeight: '700', color: '#fff' }}>{initials}</Text>
    </View>
  );
}

function getMockDistance(index) {
  const distances = [0.4, 0.8, 1.2, 0.2, 0.6, 1.0];
  return distances[index % distances.length];
}

function getEarnings(order) {
  return parseFloat(order.delivery_fee || 0);
}

function getMockBadge(index) {
  const badges = ['Premium Rate', 'Express', null, null, 'Hot', null];
  return badges[index % badges.length];
}

export default function AvailableOrdersScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const [orders, setOrders]     = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All Tasks');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      const [avRes, myRes] = await Promise.all([
        api.orders.getAvailableForFoodCourier(),
        api.orders.getFoodCourierOrders(),
      ]);
      setOrders(avRes.data.orders || []);
      setMyOrders(myRes.data.orders || []);
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

  const accept = async (orderId) => {
    setAccepting(orderId);
    try {
      await api.orders.acceptDelivery(orderId);
      fetchOrders();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setAccepting(null);
    }
  };

  const activeDeliveries = myOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');

  const filteredOrders = orders.filter((order, index) => {
    if (activeFilter === 'All Tasks') return true;
    if (activeFilter === 'Hot') return getMockBadge(index) === 'Hot' || getMockBadge(index) === 'Premium Rate';
    if (activeFilter === 'Highest Pay') return getMockEarnings(order.total_amount) >= 100;
    if (activeFilter === 'Closest') return getMockDistance(index) <= 0.6;
    return true;
  });

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header — matches CampusBite design system */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bicycle-outline" size={22} color={COLORS.primary} />
          <Text style={styles.headerTitle}>CampusBite</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => {
            navigation.navigate('Notifications');
            fetchUnreadCount();
          }}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
        </TouchableOpacity>
      </View>

      {/* Sub-header */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderTitle}>Available Tasks</Text>
        <Text style={styles.subHeaderSub}>{orders.length} active requests near you</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active Deliveries Section */}
      {activeDeliveries.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>My Active Delivery</Text>
          {activeDeliveries.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={styles.activeCard}
              onPress={() => navigation.navigate('FoodCourierOrderDetail', { orderId: item.id })}
              activeOpacity={0.8}
            >
              <View style={styles.activeHeader}>
                <View style={styles.activeHeaderInfo}>
                  <Text style={styles.activeRestaurant} numberOfLines={1}>{item.vendor?.business_name}</Text>
                  <View style={styles.distanceRow}>
                    <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                    <Text style={styles.distanceText} numberOfLines={1} ellipsizeMode="tail">{item.delivery_address}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: COLORS.success }]}>
                  <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.activeFooter}>
                <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
                <Text style={styles.activeEarnings}>KES {getEarnings(item).toFixed(0)}</Text>
                <Text style={styles.activeCta}>Tap to manage</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}


      <FlatList
        data={filteredOrders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[COLORS.primary]} />}
        renderItem={({ item, index }) => {
          const badge = getMockBadge(index);
          const distance = getMockDistance(index);
          const earnings = getEarnings(item);
          const imageUrl = resolveImageUrl(item.vendor?.image);

          return (
            <View style={styles.card}>
              {/* Image Section */}
              <View style={styles.imageContainer}>
                {imageUrl
                  ? <Image source={{ uri: imageUrl }} style={styles.restaurantImage} />
                  : <VendorImagePlaceholder name={item.vendor?.business_name} styles={styles} />}
                {badge && (
                  <View style={[styles.badge, badge === 'Hot' && styles.badgeHot]}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                )}
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>KES {Math.round(parseFloat(item.total_amount))}</Text>
                </View>
              </View>

              {/* Restaurant Info */}
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{item.vendor?.business_name}</Text>
                <View style={styles.distanceRow}>
                  <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.distanceText}>{distance} km away</Text>
                </View>
              </View>

              {/* Destination */}
              <View style={styles.destinationBox}>
                <View style={styles.destinationHeader}>
                  <Ionicons name="navigate-circle-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.destinationLabel}>DESTINATION</Text>
                </View>
                <Text style={styles.destinationText}>{item.delivery_address}</Text>
              </View>

              {/* Accept Button */}
              <TouchableOpacity
                style={[styles.acceptButton, accepting === item.id && { opacity: 0.6 }]}
                onPress={() => accept(item.id)}
                disabled={accepting === item.id}
              >
                {accepting === item.id
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.acceptButtonText}>Accept Delivery</Text>
                }
              </TouchableOpacity>

              {/* Earnings Row */}
              <View style={styles.earningsRow}>
                <View style={styles.earningsLabel}>
                  <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.earningsLabelText}>EARNINGS</Text>
                </View>
                <Text style={styles.earningsAmount}>KES {earnings.toFixed(0)}</Text>
              </View>

              {/* Pickup/Drop-off Details */}
              <View style={styles.detailsRow}>
                <View style={styles.detailDot} />
                <Text style={styles.detailText}>Pickup: {item.vendor?.location || 'Main Square Food Court'}</Text>
              </View>
              <View style={styles.detailsRow}>
                <View style={[styles.detailDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.detailText}>Drop-off: {item.delivery_address}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle-outline" size={64} color={COLORS.lightGray} />
            <Text style={styles.empty}>No deliveries available right now.</Text>
            <Text style={styles.emptySub}>Pull down to refresh</Text>
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header — matches VendorDashboardScreen
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

  // Sub-header
  subHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  subHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  subHeaderSub: { fontSize: 13, color: COLORS.gray },

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderWarm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  filterChipTextActive: { color: COLORS.white },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeHot: {
    backgroundColor: '#FF6B35',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(232, 93, 4, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  priceBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  restaurantInfo: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 4,
    flexShrink: 1,
  },
  destinationBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.iconBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  destinationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    marginLeft: 6,
    letterSpacing: 1,
  },
  destinationText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderWarm,
  },
  earningsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  earningsLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray,
    letterSpacing: 0.5,
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warning,
    marginRight: 10,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  empty: { color: COLORS.gray, marginTop: 12, fontSize: 15 },
  emptySub: { color: COLORS.gray, marginTop: 6, fontSize: 13 },

  // Active delivery
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 10, marginTop: 8 },
  activeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activeHeaderInfo: { flex: 1, marginRight: 8 },
  activeRestaurant: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    flexShrink: 0,
  },
  statusBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  activeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
    paddingTop: 12,
  },
  activeEarnings: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary, flex: 1 },
  activeCta: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
});
