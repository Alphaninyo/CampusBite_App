import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

const ACTIVE_STATUSES = ['Received', 'Preparing', 'Ready'];

export default function VendorDashboardScreen({ navigation }) {
  const [vendor, setVendor]         = useState(null);
  const [allOrders, setAllOrders]   = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [reviews, setReviews]       = useState([]);   // shown in UI (up to 5)
  const [allReviews, setAllReviews] = useState([]);   // full list for rating calc
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling]     = useState(false);
  const pollRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, ordersRes, notifRes] = await Promise.all([
        api.vendors.getProfile(),
        api.orders.getVendorOrders(),
        api.notifications.getUnreadCount().catch(() => ({ data: { count: 0 } })),
      ]);
      setUnreadCount(notifRes.data?.count ?? 0);
      const vendorData = profileRes.data.vendor;
      const ordersData = ordersRes.data.orders || [];
      setVendor(vendorData);
      setAllOrders(ordersData);

      // Calculate popular items from order history
      const itemCounts = {};
      ordersData.forEach(order => {
        (order.items || []).forEach(item => {
          const name = item.menuItem?.name || item.name || 'Item';
          const id = item.menu_item_id || item.id || name;
          if (!itemCounts[id]) {
            itemCounts[id] = { name, count: 0, revenue: 0 };
          }
          itemCounts[id].count += item.quantity;
          itemCounts[id].revenue += (parseFloat(item.unit_price || 0) * item.quantity);
        });
      });
      const sorted = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);
      setPopularItems(sorted);

      // Fetch reviews for this vendor
      if (vendorData?.id) {
        try {
          const { data: reviewData } = await api.reviews.getVendorReviews(vendorData.id);
          const fetched = reviewData.reviews || [];
          setAllReviews(fetched);
          setReviews(fetched.slice(0, 5));
        } catch {
          setAllReviews([]);
          setReviews([]);
        }
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchData]);

  const toggleOpen = async () => {
    setToggling(true);
    try {
      const { data } = await api.vendors.updateStatus();
      setVendor((v) => ({ ...v, is_open: data.is_open }));
    } catch (err) {
      console.error(err.message);
    } finally {
      setToggling(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await api.orders.updateStatus(orderId, 'Preparing');
      fetchData();
    } catch (err) {
      console.error('Accept error:', err.message);
    }
  };

  const handleDeclineOrder = async (orderId) => {
    // For now, just refresh — could add a decline/cancel endpoint later
    console.log('Decline order:', orderId);
  };

  const handleMarkReady = async (orderId) => {
    try {
      await api.orders.updateStatus(orderId, 'Ready');
      fetchData();
    } catch (err) {
      console.error('Ready error:', err.message);
    }
  };

  const handleNotifications = () => {
    navigation.navigate('VendorNotifications');
  };

  // Derived data
  const incomingOrders = allOrders.filter(o => o.status === 'Received');
  const inProgressOrders = allOrders.filter(o => o.status === 'Preparing' || o.status === 'Ready');
  const activeOrderCount = allOrders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;
  const dailyRevenue = allOrders
    .filter(o => {
      const today = new Date().toDateString();
      return new Date(o.created_at).toDateString() === today;
    })
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((s, r) => s + (r.vendor_rating || 0), 0) / allReviews.length).toFixed(1)
    : '—';

  const getTimeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  };

  const getOrderItems = (order) => {
    if (!order.items || order.items.length === 0) return 'No items';
    return order.items.map(item => {
      const name = item.menuItem?.name || item.name || 'Item';
      return `${item.quantity}x ${name}`;
    }).join(', ');
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="storefront-outline" size={22} color={COLORS.primary} />
          <Text style={styles.headerTitle}>CampusBite</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.toggleRow}>
            <Text style={styles.openLabel}>{vendor?.is_open ? 'OPEN' : 'CLOSED'}</Text>
            <Switch
              value={!!vendor?.is_open}
              onValueChange={toggleOpen}
              disabled={toggling}
              trackColor={{ false: '#ddd', true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={handleNotifications}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.black} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[COLORS.primary]} />}
      >
        {/* Daily Revenue Card */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Daily Revenue</Text>
          <Text style={styles.revenueAmount}>KES {dailyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          <Text style={styles.revenueSubtext}>↗ from orders today</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statLabel}>Active Orders</Text>
            <Text style={styles.statValue}>{activeOrderCount}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="star-outline" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.statLabel}>Rating</Text>
            <Text style={styles.statValue}>{avgRating}</Text>
          </View>
        </View>

        {/* Incoming Orders Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Incoming Orders</Text>
          {incomingOrders.length > 0 && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>{incomingOrders.length} NEW</Text>
            </View>
          )}
        </View>

        {incomingOrders.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="checkmark-circle-outline" size={32} color={COLORS.gray} />
            <Text style={styles.emptyText}>No incoming orders</Text>
          </View>
        ) : (
          incomingOrders.map(order => (
            <View key={order.id} style={styles.incomingCard}>
              <View style={styles.incomingHeader}>
                <Text style={styles.incomingOrderId}>#CB-{order.id.slice(0, 4).toUpperCase()}</Text>
                <Text style={styles.incomingTime}>{getTimeAgo(order.created_at)}</Text>
              </View>
              <Text style={styles.incomingItems}>{getOrderItems(order)}</Text>
              <View style={styles.incomingActions}>
                <TouchableOpacity 
                  style={styles.acceptBtn} 
                  onPress={() => handleAcceptOrder(order.id)}
                >
                  <Text style={styles.acceptBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.declineBtn} 
                  onPress={() => handleDeclineOrder(order.id)}
                >
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Orders in Progress Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Orders in Progress</Text>
        </View>

        {inProgressOrders.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="time-outline" size={32} color={COLORS.gray} />
            <Text style={styles.emptyText}>No orders in progress</Text>
          </View>
        ) : (
          inProgressOrders.map(order => (
            <View key={order.id} style={styles.progressCard}>
              <View style={styles.progressLeft}>
                <View style={[styles.progressIcon, { backgroundColor: order.status === 'Ready' ? COLORS.successLight : COLORS.warningBg }]}>
                  <Ionicons 
                    name={order.status === 'Ready' ? 'checkmark-circle' : 'restaurant'} 
                    size={22} 
                    color={order.status === 'Ready' ? COLORS.success : COLORS.primary} 
                  />
                </View>
                <View>
                  <Text style={[styles.progressStatus, { color: order.status === 'Ready' ? COLORS.success : COLORS.primary }]}>
                    {order.status.toUpperCase()}
                  </Text>
                  <Text style={styles.progressOrderId}>
                    #CB-{order.id.slice(0, 4).toUpperCase()} • {order.consumer?.name || 'Customer'}
                  </Text>
                </View>
              </View>
              {order.status === 'Preparing' ? (
                <TouchableOpacity 
                  style={styles.readyBtn} 
                  onPress={() => handleMarkReady(order.id)}
                >
                  <Text style={styles.readyBtnText}>Ready</Text>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
                </TouchableOpacity>
              ) : (
                <Text style={styles.waitingText}>Waiting pick-up</Text>
              )}
            </View>
          ))
        )}

        {/* Popular Items Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Popular Items</Text>
        </View>

        {popularItems.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="trophy-outline" size={32} color={COLORS.gray} />
            <Text style={styles.emptyText}>No sales data yet</Text>
          </View>
        ) : (
          popularItems.map((item, index) => (
            <View key={index} style={styles.popularCard}>
              <View style={styles.popularRank}>
                <Text style={styles.popularRankText}>{index + 1}</Text>
              </View>
              <View style={styles.popularInfo}>
                <Text style={styles.popularName}>{item.name}</Text>
                <Text style={styles.popularStats}>{item.count} orders • KES {item.revenue.toFixed(0)} revenue</Text>
              </View>
              <View style={styles.popularBadge}>
                <Ionicons name="trending-up" size={16} color={COLORS.success} />
              </View>
            </View>
          ))
        )}

        {/* Recent Reviews Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
        </View>

        {reviews.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="chatbubbles-outline" size={32} color={COLORS.gray} />
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        ) : (
          reviews.map((review, index) => (
            <View key={review.id || index} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewUser}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>
                      {(review.consumer?.name || review.user?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.reviewName}>{review.consumer?.name || review.user?.name || 'Customer'}</Text>
                </View>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons
                      key={star}
                      name={star <= (review.vendor_rating || 0) ? 'star' : 'star-outline'}
                      size={14}
                      color="#FFB300"
                    />
                  ))}
                </View>
              </View>
              {review.comment && (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              )}
              <Text style={styles.reviewDate}>
                {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
              </Text>
            </View>
          ))
        )}

        <View style={{ height: 30 }} />
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openLabel: { fontWeight: 'bold', fontSize: 12, color: COLORS.text },
  notifBtn: { padding: 4, position: 'relative' },
  notifBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: COLORS.danger || '#EF4444',
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  
  scrollView: { flex: 1, paddingHorizontal: 16 },
  
  // Revenue Card
  revenueCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  revenueLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 },
  revenueAmount: { color: COLORS.white, fontSize: 28, fontWeight: 'bold' },
  revenueSubtext: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 6 },
  
  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    alignItems: 'center',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: { color: COLORS.subtext, fontSize: 12, marginTop: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  
  // Section
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 24, 
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  newBadge: { 
    backgroundColor: COLORS.success, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12,
  },
  newBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  
  // Incoming Orders
  incomingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  incomingHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 6,
  },
  incomingOrderId: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  incomingTime: { color: COLORS.gray, fontSize: 12 },
  incomingItems: { color: COLORS.subtext, fontSize: 13, marginBottom: 12 },
  incomingActions: { flexDirection: 'row', gap: 10 },
  acceptBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 13 },
  declineBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  declineBtnText: { color: COLORS.text, fontWeight: '600', fontSize: 13 },
  
  // Progress Orders
  progressCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  progressLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  progressStatus: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  progressOrderId: { fontSize: 13, color: COLORS.text },
  readyBtn: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readyBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },
  waitingText: { color: COLORS.gray, fontSize: 12, maxWidth: 80, textAlign: 'right' },
  
  // Empty states
  emptySection: { 
    alignItems: 'center', 
    paddingVertical: 24, 
    backgroundColor: COLORS.white, 
    borderRadius: 14,
  },
  emptyText: { color: COLORS.gray, marginTop: 8, fontSize: 13 },

  // Popular Items
  popularCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  popularRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  popularRankText: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary },
  popularInfo: { flex: 1 },
  popularName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  popularStats: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  popularBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Reviews
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUser: { flexDirection: 'row', alignItems: 'center' },
  reviewAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  reviewAvatarText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },
  reviewName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 13, color: COLORS.subtext, lineHeight: 18 },
  reviewDate: { fontSize: 11, color: COLORS.gray, marginTop: 6 },
});
