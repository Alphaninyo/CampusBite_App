import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, subtext, badge, badgeColor, icon, iconColor, valueColor }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={[styles.cardIconWrap, { backgroundColor: iconColor + '22' }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        {badge ? (
          <View style={[styles.cardBadge, { backgroundColor: badgeColor + '22' }]}>
            <Text style={[styles.cardBadgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.cardValue, valueColor && { color: valueColor }]}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
      {subtext ? <Text style={styles.cardSubtext}>{subtext}</Text> : null}
    </View>
  );
}

// ── Weekly bar chart ──────────────────────────────────────────────────────────
function WeeklyBarChart({ data, totalOrders }) {
  if (!data || data.length === 0) {
    return <Text style={styles.emptyText}>No weekly data yet</Text>;
  }
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const todayShort = new Date().toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);

  return (
    <View>
      <View style={styles.chartBars}>
        {data.map((item, i) => {
          const isToday = item.day === todayShort;
          const barH = Math.max((item.value / maxVal) * 90, 4);
          return (
            <View key={i} style={styles.chartBarWrapper}>
              <Text style={[styles.chartBarCount, isToday && { color: COLORS.primary }]}>
                {item.value > 0 ? item.value : ''}
              </Text>
              <View style={[styles.chartBar, { height: barH, backgroundColor: isToday ? COLORS.primary : COLORS.border }]} />
              <Text style={[styles.chartDayLabel, isToday && { color: COLORS.primary, fontWeight: '700' }]}>
                {item.day}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.chartFooter}>
        <View style={styles.chartLegend}>
          <View style={[styles.legendSwatch, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>Today</Text>
          <View style={[styles.legendSwatch, { backgroundColor: COLORS.border, marginLeft: 10 }]} />
          <Text style={styles.legendText}>Rest of week</Text>
        </View>
        <Text style={styles.chartTotal}>Total: {totalOrders} orders</Text>
      </View>
    </View>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <View style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function AdminStatsScreen() {
  const [stats, setStats]           = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, weeklyRes, vendorsRes, notifRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getWeeklyOrders(),
        api.admin.getTopVendors(),
        api.notifications.getUnreadCount().catch(() => ({ data: { count: 0 } })),
      ]);
      setStats(statsRes.data.stats);
      setWeeklyData(weeklyRes.data.weekly_orders || []);
      setTopVendors(vendorsRes.data.top_vendors || []);
      setUnreadCount(notifRes.data.count || 0);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;

  const byStatus       = stats?.orders?.by_status || [];
  const totalOrders    = stats?.orders?.total ?? 0;
  const delivered      = stats?.orders?.delivered ?? 0;
  const activeOrders   = stats?.orders?.active ?? 0;
  const fulfilment     = stats?.orders?.fulfilment_rate ?? 0;
  const revenue        = parseFloat(stats?.revenue?.confirmed_total || 0).toFixed(0);
  const todayRevenue   = parseFloat(stats?.revenue?.today_total || 0).toFixed(0);
  const consumers      = stats?.users?.consumers ?? 0;
  const activeVendors  = stats?.users?.vendors ?? 0;
  const pendingVendors = stats?.users?.pending_vendors ?? 0;
  const couriers       = stats?.users?.food_couriers ?? 0;
  const reviews        = stats?.reviews?.total ?? 0;
  const avgDelivery    = stats?.avg_delivery_minutes ?? 0;

  // Week date range
  const now       = new Date();
  const sunday    = new Date(now); sunday.setDate(now.getDate() - now.getDay());
  const saturday  = new Date(sunday); saturday.setDate(sunday.getDate() + 6);
  const fmtD      = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekRange = `${fmtD(sunday)} – ${fmtD(saturday)}`;

  const dateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Dynamic insight
  const topV = topVendors[0];
  let insight = '';
  if (totalOrders === 0) {
    insight = 'No orders yet this week. Share CampusBite with students to get your first order!';
  } else if (activeOrders === 0 && delivered === totalOrders) {
    insight = `All ${totalOrders} order${totalOrders !== 1 ? 's' : ''} this week were delivered successfully${topV ? ` by ${topV.name}` : ''}. ${consumers < 5 ? `Onboard more consumers to grow order volume — only ${consumers} consumer${consumers === 1 ? ' is' : 's are'} currently registered.` : 'Keep up the great work!'}`;
  } else {
    insight = `${delivered} of ${totalOrders} orders delivered. ${activeOrders > 0 ? `${activeOrders} still in progress.` : ''}`;
  }

  const handleDownload = () => {
    const rows = [
      'CampusBite Admin Statistics Report',
      `Generated: ${new Date().toLocaleString()}`,
      '', 'Metric,Value',
      `Total Orders,${totalOrders}`, `Revenue (KES),${revenue}`,
      `Consumers,${consumers}`, `Active Vendors,${activeVendors}`,
      `Food Couriers,${couriers}`, `Reviews,${reviews}`,
      '', 'Status,Count', ...byStatus.map(s => `${s.status},${s.count}`),
      '', 'Day,Orders', ...weeklyData.map(d => `${d.day},${d.value}`),
      '', 'Vendor,Orders', ...topVendors.map(v => `${v.name},${v.orders}`),
    ].join('\n');
    if (Platform.OS === 'web') {
      const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `campusbite-stats-${now.toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('Download', 'CSV download is available on web. Mobile export coming soon!');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bar-chart-outline" size={22} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Stats</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerDate}>{dateLabel}</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={handleDownload} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} colors={[COLORS.primary]} />
        }
      >
        {/* ── 6 stat cards ── */}
        <View style={styles.grid}>
          <StatCard
            label="Total orders" value={totalOrders}
            badge="All time" badgeColor={COLORS.muted}
            icon="bag-outline" iconColor={COLORS.primary}
            subtext={totalOrders === 0 ? '— No change today' : `+${totalOrders} today`}
          />
          <StatCard
            label="Revenue (KES)" value={revenue}
            badge={Number(todayRevenue) > 0 ? `+${todayRevenue} today` : 'All time'} badgeColor={COLORS.success}
            icon="cash-outline" iconColor={COLORS.success} valueColor={COLORS.primary}
            subtext={Number(todayRevenue) > 0 ? `↑ KES ${todayRevenue} earned today` : '— No revenue today'}
          />
          <StatCard
            label="Consumers" value={consumers}
            badge="Registered" badgeColor="#6366F1"
            icon="people-outline" iconColor="#6366F1"
            subtext={`↑ ${consumers} registered`}
          />
          <StatCard
            label="Active vendors" value={activeVendors}
            badge={`${pendingVendors} pending`} badgeColor="#EC4899"
            icon="storefront-outline" iconColor="#EC4899"
            subtext={pendingVendors === 0 ? '✓ All approved' : `${pendingVendors} awaiting review`}
          />
          <StatCard
            label="Couriers" value={couriers}
            badge={`${couriers} active`} badgeColor="#F59E0B"
            icon="bicycle-outline" iconColor="#F59E0B"
            subtext={couriers > 0 ? '✓ All on duty' : '— None active'}
          />
          <StatCard
            label="Reviews" value={reviews}
            badge="All time" badgeColor="#14B8A6"
            icon="star-outline" iconColor="#14B8A6"
            subtext={reviews === 0 ? '— No new reviews' : `${reviews} total`}
          />
        </View>

        {/* ── Orders this week ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Orders this week</Text>
              <Text style={styles.sectionSub}>{weekRange}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.sectionLink}>This month ›</Text>
            </TouchableOpacity>
          </View>
          <WeeklyBarChart data={weeklyData} totalOrders={totalOrders} />
        </View>

        {/* ── Order status breakdown ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order status breakdown</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.sectionLink}>View orders ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statusBoxRow}>
            <View style={[styles.statusBox, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
              <Text style={[styles.statusBoxNum, { color: COLORS.success }]}>{delivered}</Text>
              <Text style={[styles.statusBoxLabel, { color: COLORS.success }]}>Delivered</Text>
            </View>
            <View style={[styles.statusBox, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
              <Text style={[styles.statusBoxNum, { color: '#F59E0B' }]}>{activeOrders}</Text>
              <Text style={[styles.statusBoxLabel, { color: '#F59E0B' }]}>Active</Text>
            </View>
            <View style={[styles.statusBox, { backgroundColor: '#F5F3FF', borderColor: '#C4B5FD' }]}>
              <Text style={[styles.statusBoxNum, { color: '#7C3AED' }]}>{totalOrders}</Text>
              <Text style={[styles.statusBoxLabel, { color: '#7C3AED' }]}>Total</Text>
            </View>
          </View>
          <ProgressBar label="Delivered" value={delivered}    total={totalOrders} color={COLORS.success} />
          <ProgressBar label="Active"    value={activeOrders} total={totalOrders} color="#F59E0B" />
          {byStatus.map(s => (
            !['Delivered'].includes(s.status) && (
              <View key={s.status} style={styles.statusDetailRow}>
                <Text style={styles.statusDetailLabel}>↳ {s.status}</Text>
                <Text style={styles.statusDetailValue}>{s.count}</Text>
              </View>
            )
          ))}
        </View>

        {/* ── Top vendors ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top vendors by orders</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.sectionLink}>All vendors ›</Text>
            </TouchableOpacity>
          </View>
          {topVendors.length === 0 ? (
            <Text style={styles.emptyText}>No vendor data yet</Text>
          ) : (
            topVendors.map((v, i) => (
              <ProgressBar
                key={i} label={v.name} value={v.orders}
                total={Math.max(...topVendors.map(x => x.orders), 1)}
                color={COLORS.primary}
              />
            ))
          )}
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total platform revenue</Text>
            <Text style={[styles.metricValue, { color: COLORS.primary }]}>KES {revenue}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Avg delivery time</Text>
            <Text style={styles.metricValue}>{avgDelivery > 0 ? `${avgDelivery} min` : '— min'}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Fulfilment rate</Text>
            <Text style={styles.metricValue}>{fulfilment}%</Text>
          </View>
        </View>

        {/* ── Insight banner ── */}
        {insight ? (
          <View style={styles.insightBanner}>
            <Ionicons name="sunny-outline" size={15} color="#B45309" style={{ marginTop: 1, flexShrink: 0 }} />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  scroll:        { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerDate:  { fontSize: 12, color: COLORS.subtext },
  headerBtn:   { padding: 8, alignItems: 'center', justifyContent: 'center' },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary,
  },

  // Stat card grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  card: {
    width: '47.8%',
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: COLORS.borderWarm,
  },
  cardTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardIconWrap:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardBadge:     { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3, maxWidth: 90 },
  cardBadgeText: { fontSize: 10, fontWeight: '700' },
  cardValue:     { fontSize: 30, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  cardLabel:     { fontSize: 12, color: COLORS.subtext, marginBottom: 5 },
  cardSubtext:   { fontSize: 11, color: COLORS.muted },

  // Section panels
  section: {
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.borderWarm,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sectionSub:    { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  sectionLink:   { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  // Bar chart
  chartBars: {
    flexDirection: 'row', alignItems: 'flex-end',
    height: 110, marginBottom: 10,
  },
  chartBarWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartBarCount:   { fontSize: 10, color: COLORS.muted, marginBottom: 3 },
  chartBar:        { width: '65%', borderRadius: 4, minHeight: 4 },
  chartDayLabel:   { fontSize: 11, color: COLORS.subtext, marginTop: 6 },
  chartFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartLegend:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSwatch:    { width: 10, height: 10, borderRadius: 2 },
  legendText:      { fontSize: 11, color: COLORS.subtext },
  chartTotal:      { fontSize: 12, fontWeight: '700', color: COLORS.text },

  // Status boxes
  statusBoxRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusBox: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 10, borderWidth: 1,
  },
  statusBoxNum:   { fontSize: 24, fontWeight: '800' },
  statusBoxLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Progress bars
  progressItem:   { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel:  { fontSize: 13, color: COLORS.text },
  progressValue:  { fontSize: 13, fontWeight: '700', color: COLORS.text },
  progressTrack:  { height: 7, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 4 },

  // Vendor metrics
  divider:    { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  metricRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  metricLabel:{ fontSize: 13, color: COLORS.subtext },
  metricValue:{ fontSize: 13, fontWeight: '700', color: COLORS.text },

  // Insight
  insightBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFFBEB', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#FCD34D', padding: 12,
  },
  insightText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  emptyText: { fontSize: 13, color: COLORS.subtext, textAlign: 'center', paddingVertical: 12 },
});
