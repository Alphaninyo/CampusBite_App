import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

function StatCard({ label, value, subtext, icon, iconColor }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
      {subtext && <Text style={styles.cardSubtext}>{subtext}</Text>}
    </View>
  );
}

function WeeklyBarChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100;
          const isToday = item.day === 'Sun';
          return (
            <View key={index} style={styles.chartBarWrapper}>
              <View 
                style={[
                  styles.chartBar, 
                  { height: `${height}%`, backgroundColor: isToday ? COLORS.primary : '#E5E7EB' }
                ]} 
              />
              <Text style={[styles.chartLabel, isToday && styles.chartLabelActive]}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ProgressBar({ label, value, total, color }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function AdminStatsScreen() {
  const [stats, setStats]       = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [loading, setLoading]   = useState(true);
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

  const byStatus = stats?.orders?.by_status || [];
  const totalOrders = stats?.orders?.total ?? 0;
  const revenue = parseFloat(stats?.revenue?.confirmed_total || 0).toFixed(0);
  const consumers = stats?.users?.consumers ?? 0;
  const activeVendors = stats?.users?.vendors ?? 0;
  const pendingVendors = stats?.users?.pending_vendors ?? 0;
  const couriers = stats?.users?.food_couriers ?? 0;
  const reviews = stats?.reviews?.total ?? 0;

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDownload = () => {
    // Create CSV content
    const csvContent = [
      'CampusBite Admin Statistics Report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Summary Statistics',
      'Metric,Value',
      `Total Orders,${totalOrders}`,
      `Revenue (KES),${revenue}`,
      `Consumers,${consumers}`,
      `Active Vendors,${activeVendors}`,
      `Pending Vendors,${pendingVendors}`,
      `Food Couriers,${couriers}`,
      `Reviews,${reviews}`,
      '',
      'Orders by Status',
      'Status,Count',
      ...byStatus.map(s => `${s.status},${s.count}`),
      '',
      'Weekly Orders',
      'Day,Orders',
      ...weeklyData.map(d => `${d.day},${d.value}`),
      '',
      'Top Vendors',
      'Vendor,Orders',
      ...topVendors.map(v => `${v.name},${v.orders}`),
    ].join('\n');

    // Download on web
    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `campusbite-stats-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Alert.alert('Success', 'Statistics report downloaded successfully!');
    } else {
      Alert.alert('Download', 'CSV download is available on web. Mobile export coming soon!');
    }
  };

  const handleNotifications = () => {
    console.log('Notifications button pressed, unreadCount:', unreadCount);
    if (unreadCount > 0) {
      Alert.alert(
        'Notifications',
        `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'View', onPress: () => Alert.alert('Info', 'Notifications screen coming soon for admin!') }
        ]
      );
    } else {
      Alert.alert('Notifications', 'You have no new notifications at this time.');
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
          <Text style={styles.headerDate}>{getCurrentDate()}</Text>
          <TouchableOpacity style={styles.headerIcon} onPress={handleDownload}>
            <Ionicons name="download-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={handleNotifications} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
            {unreadCount > 0 && <View style={styles.notificationBadge} pointerEvents="none" />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} colors={[COLORS.primary]} />}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <StatCard 
            label="Total orders" 
            value={totalOrders} 
            icon="bag-outline" 
            iconColor={COLORS.primary} 
          />
          <StatCard 
            label="Revenue (KES)" 
            value={`$${revenue}`} 
            subtext={`+KES ${revenue} today`}
            icon="cash-outline" 
            iconColor={COLORS.success} 
          />
        </View>
        <View style={styles.summaryRow}>
          <StatCard 
            label="Consumers" 
            value={consumers} 
            subtext={`↑ ${consumers} registered`}
            icon="people-outline" 
            iconColor="#6366F1" 
          />
          <StatCard 
            label="Active vendors" 
            value={activeVendors} 
            subtext={`© ${pendingVendors} pending`}
            icon="storefront-outline" 
            iconColor="#EC4899" 
          />
        </View>
        <View style={styles.summaryRow}>
          <StatCard 
            label="Couriers" 
            value={couriers} 
            subtext={`– ${couriers} active`}
            icon="bicycle-outline" 
            iconColor="#F59E0B" 
          />
          <StatCard 
            label="Reviews" 
            value={reviews} 
            subtext="– None yet"
            icon="star-outline" 
            iconColor="#14B8A6" 
          />
        </View>

        {/* Orders This Week */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders This Week</Text>
          <WeeklyBarChart data={weeklyData} />
        </View>

        {/* Top Vendors by Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Vendors by Orders</Text>
          {topVendors.map((vendor, index) => (
            <ProgressBar 
              key={index}
              label={vendor.name}
              value={vendor.orders}
              total={Math.max(...topVendors.map(v => v.orders), 1)}
              color={COLORS.primary}
            />
          ))}
        </View>

        {/* Order Status Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status Breakdown</Text>
          {byStatus.length > 0 ? (
            byStatus.map(({ status, count }) => {
              let color = '#9CA3AF';
              if (status === 'Delivered') color = COLORS.success;
              if (status === 'Pending') color = COLORS.warning;
              if (status === 'Cancelled') color = COLORS.danger;
              return (
                <ProgressBar 
                  key={status}
                  label={status}
                  value={count}
                  total={totalOrders}
                  color={color}
                />
              );
            })
          ) : (
            <Text style={styles.emptyText}>No order status data available</Text>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
  },
  
  // Header
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerDate: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  headerIcon: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  
  // ScrollView
  scrollView: {
    flex: 1,
  },
  
  // Summary Cards
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: COLORS.subtext,
    marginBottom: 2,
  },
  cardSubtext: {
    fontSize: 10,
    color: COLORS.muted,
  },
  
  // Sections
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  
  // Weekly Bar Chart
  chartContainer: {
    paddingVertical: 8,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  chartBar: {
    width: '80%',
    borderRadius: 4,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 11,
    color: COLORS.subtext,
  },
  chartLabelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  
  // Progress Bars
  progressItem: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Empty state
  emptyText: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
