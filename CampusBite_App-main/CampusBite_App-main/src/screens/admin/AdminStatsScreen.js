import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { api } from '../../api';
import { COLORS } from '../../constants';

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.card, { borderLeftColor: color || COLORS.primary }]}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

export default function AdminStatsScreen() {
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.admin.getStats();
      setStats(data.stats);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} colors={[COLORS.primary]} />}>

      <Text style={styles.heading}>Platform Overview</Text>

      <View style={styles.grid}>
        <StatCard label="Total Orders"    value={stats?.orders?.total ?? 0}                                    color={COLORS.primary} />
        <StatCard label="Revenue (KES)"   value={parseFloat(stats?.revenue?.confirmed_total || 0).toFixed(0)}  color={COLORS.success} />
        <StatCard label="Consumers"       value={stats?.users?.consumers ?? 0}                                  color="#6366F1" />
        <StatCard label="Vendors"         value={stats?.users?.vendors ?? 0}                                    color="#EC4899" />
        <StatCard label="Riders"          value={stats?.users?.riders ?? 0}                                     color="#F59E0B" />
        <StatCard label="Pending Vendors" value={stats?.users?.pending_vendors ?? 0}                            color={COLORS.warning} />
        <StatCard label="Reviews"         value={stats?.reviews?.total ?? 0}                                    color="#14B8A6" />
      </View>

      {byStatus.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders by Status</Text>
          {byStatus.map(({ status, count }) => (
            <View key={status} style={styles.row}>
              <Text style={styles.statusLabel}>{status}</Text>
              <Text style={styles.statusCount}>{count}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  heading:      { fontSize: 20, fontWeight: 'bold', color: COLORS.black, marginBottom: 16 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  card:         { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, flex: 1, minWidth: '44%', borderLeftWidth: 4 },
  cardValue:    { fontSize: 24, fontWeight: 'bold', color: COLORS.black },
  cardLabel:    { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  section:      { backgroundColor: COLORS.white, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.black, marginBottom: 12 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: COLORS.lightGray },
  statusLabel:  { color: COLORS.gray, fontSize: 14 },
  statusCount:  { fontWeight: 'bold', color: COLORS.black },
});
