import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Dimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { STATUS_COLORS } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { csvCell, downloadCSVReport } from '../../utils/reports';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PERIODS = ['Today', 'This Week', 'This Month', 'All Time'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getEarnings(order) {
  return parseFloat(order.delivery_fee || 0);
}

function getStatusBgColor(status, COLORS) {
  return STATUS_COLORS[status] || COLORS.gray;
}

function getPerformanceBadge(completedCount, COLORS) {
  if (completedCount >= 50) return { label: 'Elite Courier', color: '#7C3AED', icon: 'ribbon' };
  if (completedCount >= 20) return { label: 'Pro Courier',   color: '#2563EB', icon: 'medal' };
  if (completedCount >= 10) return { label: 'Rising Star',   color: '#D97706', icon: 'star' };
  return { label: 'Newcomer', color: COLORS.gray, icon: 'bicycle' };
}

function WeeklyBarChart({ orders, styles, COLORS }) {
  const dayTotals = DAYS.map((_, i) => {
    const dayOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getDay() === (i + 1) % 7;
    });
    return dayOrders.filter(o => o.status === 'Delivered').reduce((s, o) => s + getEarnings(o), 0);
  });

  const maxVal = Math.max(...dayTotals, 1);
  const barAreaHeight = 80;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Weekly Earnings Trend</Text>
      <View style={styles.chartBars}>
        {DAYS.map((day, i) => {
          const pct = dayTotals[i] / maxVal;
          const barH = Math.max(4, Math.round(pct * barAreaHeight));
          const isToday = new Date().getDay() === (i + 1) % 7;
          return (
            <View key={day} style={styles.barCol}>
              <Text style={styles.barValue}>{dayTotals[i] > 0 ? dayTotals[i] : ''}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: barH, backgroundColor: isToday ? COLORS.primary : '#FDBA74' }]} />
              </View>
              <Text style={[styles.barLabel, isToday && { color: COLORS.primary, fontWeight: '700' }]}>{day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function EarningsScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activePeriod, setActivePeriod] = useState('All Time');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.orders.getFoodCourierOrders();
      setOrders(data.orders);
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

  const filterByPeriod = (allOrders) => {
    const now = new Date();
    return allOrders.filter((o) => {
      const d = new Date(o.created_at);
      if (activePeriod === 'Today') return d.toDateString() === now.toDateString();
      if (activePeriod === 'This Week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (activePeriod === 'This Month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const filteredOrders  = filterByPeriod(orders);
  const allDelivered    = orders.filter(o => o.status === 'Delivered');
  const deliveredOrders = filteredOrders.filter(o => o.status === 'Delivered');
  const totalEarnings   = deliveredOrders.reduce((sum, o) => sum + getEarnings(o), 0);
  const totalDeliveries = deliveredOrders.length;
  const inProgressOrders = filteredOrders.filter(o => o.status !== 'Delivered');
  const avgEarnings     = totalDeliveries > 0 ? Math.round(totalEarnings / totalDeliveries) : 0;
  const completionRate  = filteredOrders.length > 0 ? Math.round((deliveredOrders.length / filteredOrders.length) * 100) : 100;
  const badge           = getPerformanceBadge(allDelivered.length, COLORS);

  // Best day this week
  const dayTotals = DAYS.map((day, i) => ({
    day,
    total: orders.filter(o => {
      const d = new Date(o.created_at); return d.getDay() === (i + 1) % 7 && o.status === 'Delivered';
    }).reduce((s, o) => s + getEarnings(o), 0),
  }));
  const bestDay = dayTotals.reduce((best, d) => d.total > best.total ? d : best, { day: '—', total: 0 });

  const handleDownloadReport = async () => {
    const rows = [
      `CampusBite Courier Earnings Report — ${activePeriod}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'SUMMARY',
      'Metric,Value',
      `Deliveries Completed,${totalDeliveries}`,
      `In Progress,${inProgressOrders.length}`,
      `Total Earnings (KES),${totalEarnings.toFixed(0)}`,
      `Avg Earnings / Trip (KES),${avgEarnings}`,
      `Completion Rate,${completionRate}%`,
      '',
      'DELIVERY DETAIL',
      'Order ID,Date,Vendor,Address,Fee (KES),Status',
      ...filteredOrders.map(o => [
        csvCell(o.id?.slice(0, 8)),
        csvCell(new Date(o.created_at).toLocaleString()),
        csvCell(o.vendor?.business_name || 'N/A'),
        csvCell(o.delivery_address || 'N/A'),
        getEarnings(o).toFixed(0),
        csvCell(o.status),
      ].join(',')),
    ].join('\n');

    const filename = `campusbite-earnings-${activePeriod.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    const downloaded = await downloadCSVReport(filename, rows);
    if (!downloaded) {
      Alert.alert('Download Failed', 'Could not save or share the report. Please try again.');
    }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const ListHeader = () => (
    <View>
      {/* ── Summary Card ── */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>TOTAL EARNINGS</Text>
        <Text style={styles.summaryAmount}>KES {totalEarnings.toLocaleString()}</Text>
        <Text style={styles.summaryPeriod}>{activePeriod === 'All Time' ? 'All time earnings' : activePeriod}</Text>
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p} style={[styles.periodChip, activePeriod === p && styles.periodChipActive]} onPress={() => setActivePeriod(p)}>
              <Text style={[styles.periodChipText, activePeriod === p && styles.periodChipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.reportBtn} onPress={handleDownloadReport} activeOpacity={0.8}>
          <Ionicons name="download-outline" size={16} color={COLORS.primary} />
          <Text style={styles.reportBtnText}>Download {activePeriod} Report</Text>
        </TouchableOpacity>
      </View>

      {/* ── Quick Stats ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.success} />
          <Text style={styles.statValue}>{totalDeliveries}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color={COLORS.warning} />
          <Text style={styles.statValue}>{inProgressOrders.length}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up-outline" size={24} color={COLORS.primary} />
          <Text style={styles.statValue}>KES {avgEarnings}</Text>
          <Text style={styles.statLabel}>Avg / Trip</Text>
        </View>
      </View>

      {/* ── Performance Badge ── */}
      <View style={[styles.badgeCard, { borderLeftColor: badge.color }]}>
        <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
          <Ionicons name={badge.icon} size={28} color={badge.color} />
        </View>
        <View style={styles.badgeInfo}>
          <Text style={styles.badgeTitle}>Performance Level</Text>
          <Text style={[styles.badgeLabel, { color: badge.color }]}>{badge.label}</Text>
          <Text style={styles.badgeSub}>{allDelivered.length} total deliveries completed</Text>
        </View>
        <View style={styles.completionBox}>
          <Text style={[styles.completionPct, { color: completionRate >= 80 ? COLORS.success : COLORS.warning }]}>{completionRate}%</Text>
          <Text style={styles.completionLabel}>Completion</Text>
        </View>
      </View>

      {/* ── Weekly Chart ── */}
      <WeeklyBarChart orders={orders} styles={styles} COLORS={COLORS} />

      {/* ── Payout Breakdown ── */}
      <View style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>Payout Breakdown</Text>
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Ionicons name="bicycle-outline" size={20} color={COLORS.success} />
            <Text style={styles.breakdownValue}>{totalDeliveries}</Text>
            <Text style={styles.breakdownLabel}>Deliveries</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
            <Text style={styles.breakdownValue}>KES {avgEarnings}</Text>
            <Text style={styles.breakdownLabel}>Avg / Trip</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
            <Text style={styles.breakdownValue}>KES {totalEarnings}</Text>
            <Text style={styles.breakdownLabel}>Total Earned</Text>
          </View>
        </View>
      </View>

      {/* ── Best Day & Extra Info ── */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Ionicons name="sunny-outline" size={22} color="#F59E0B" />
          <Text style={styles.infoValue}>{bestDay.day}</Text>
          <Text style={styles.infoLabel}>Best Day</Text>
          {bestDay.total > 0 && <Text style={styles.infoSub}>KES {bestDay.total}</Text>}
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="bicycle-outline" size={22} color={COLORS.primary} />
          <Text style={styles.infoValue}>{allDelivered.length}</Text>
          <Text style={styles.infoLabel}>Total Trips</Text>
          <Text style={styles.infoSub}>All time</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="star-outline" size={22} color="#F59E0B" />
          <Text style={styles.infoValue}>4.8</Text>
          <Text style={styles.infoLabel}>Rating</Text>
          <Text style={styles.infoSub}>Customer avg</Text>
        </View>
      </View>

      <Text style={styles.historyTitle}>Delivery History</Text>
    </View>
  );

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      {/* Header — matches CampusBite design system */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="wallet-outline" size={22} color={COLORS.primary} />
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
      <FlatList
        data={filteredOrders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[COLORS.primary]} />}
        ListHeaderComponent={ListHeader}
      renderItem={({ item }) => {
        const earned = getEarnings(item);
        const isDelivered = item.status === 'Delivered';
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('FoodCourierOrderDetail', { orderId: item.id })}
          >
            <View style={styles.cardTop}>
              {/* Icon */}
              <View style={[styles.iconBox, { backgroundColor: isDelivered ? COLORS.successBg : COLORS.backgroundAlt }]}>
                <Ionicons
                  name={isDelivered ? 'checkmark-circle' : 'bicycle'}
                  size={22}
                  color={isDelivered ? COLORS.success : COLORS.primary}
                />
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.vendorName}>{item.vendor?.business_name}</Text>
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={12} color={COLORS.gray} />
                  <Text style={styles.addressText} numberOfLines={1}>{item.delivery_address}</Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>

              {/* Earnings */}
              <View style={styles.earningsBox}>
                <Text style={[styles.earningsValue, !isDelivered && { color: COLORS.gray }]}>
                  {isDelivered ? `+KES ${earned.toFixed(0)}` : 'Pending'}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: getStatusBgColor(item.status, COLORS) }]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>No deliveries yet</Text>
          <Text style={styles.emptySub}>Your earnings will appear here after completing deliveries</Text>
        </View>
      }
    />
    </View>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: COLORS.background },

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

  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  summaryAmount: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryPeriod: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginBottom: 20,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  periodChipActive: { backgroundColor: COLORS.white },
  periodChipText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  periodChipTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.white, borderRadius: 10, paddingVertical: 11, marginTop: 16,
  },
  reportBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 6, marginBottom: 2 },
  statLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '500', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 14 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, marginTop: 4 },
  // Performance badge
  badgeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  badgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInfo: { flex: 1 },
  badgeTitle: { fontSize: 11, color: COLORS.gray, fontWeight: '600', marginBottom: 2 },
  badgeLabel: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  badgeSub:   { fontSize: 11, color: COLORS.gray },
  completionBox: { alignItems: 'center' },
  completionPct: { fontSize: 22, fontWeight: '900' },
  completionLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '600' },
  // Weekly chart
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  chartTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barCol:    { alignItems: 'center', flex: 1 },
  barValue:  { fontSize: 9, color: COLORS.gray, marginBottom: 4, fontWeight: '600' },
  barTrack:  { width: 20, height: 80, backgroundColor: COLORS.inputBg, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill:   { width: '100%', borderRadius: 6 },
  barLabel:  { fontSize: 11, color: COLORS.gray, marginTop: 6, fontWeight: '600' },
  breakdownCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  breakdownRow: { flexDirection: 'row', alignItems: 'center' },
  breakdownItem: { flex: 1, alignItems: 'center', gap: 6 },
  breakdownValue: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  breakdownLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  breakdownDivider: { width: 1, height: 50, backgroundColor: COLORS.borderWarm },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  infoValue: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  infoLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', textAlign: 'center' },
  infoSub:   { fontSize: 10, color: COLORS.lightGray, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 3,
    flex: 1,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.gray,
  },
  earningsBox: {
    alignItems: 'flex-end',
    gap: 6,
  },
  earningsValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.success },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.gray, marginTop: 12 },
  emptySub: { fontSize: 13, color: COLORS.gray, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
});
