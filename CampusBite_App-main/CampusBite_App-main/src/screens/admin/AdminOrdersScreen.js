import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { api } from '../../api';
import { COLORS, STATUS_COLORS } from '../../constants';

const STATUSES = ['All', 'Received', 'Preparing', 'Ready', 'In Transit', 'Delivered'];

export default function AdminOrdersScreen() {
  const [orders, setOrders]       = useState([]);
  const [filter, setFilter]       = useState('All');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);

  const fetchOrders = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const params = { page: pageNum, limit: 20 };
      if (filter !== 'All') params.status = filter;
      const { data } = await api.admin.getOrders(params);
      if (reset) {
        setOrders(data.orders);
      } else {
        setOrders((prev) => [...prev, ...data.orders]);
      }
      setHasMore(data.orders.length === 20);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchOrders(1, true);
  }, [filter]);

  const loadMore = () => {
    if (!hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchOrders(next, false);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {STATUSES.map((s) => (
          <TouchableOpacity key={s} style={[styles.chip, filter === s && styles.chipActive]} onPress={() => setFilter(s)}>
            <Text style={[styles.chipText, filter === s && styles.chipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setPage(1); fetchOrders(1, true); }} colors={[COLORS.primary]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.sub}>{item.vendor?.business_name} → {item.consumer?.name}</Text>
            <Text style={styles.amount}>KES {parseFloat(item.total_amount).toFixed(2)}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No orders found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.background },
  filterRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.lightGray },
  chip:            { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.lightGray },
  chipActive:      { backgroundColor: COLORS.primary },
  chipText:        { fontSize: 12, color: COLORS.gray },
  chipTextActive:  { color: COLORS.white, fontWeight: 'bold' },
  card:            { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 10, elevation: 1 },
  row:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId:         { fontWeight: 'bold', color: COLORS.black },
  badge:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText:       { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  sub:             { color: COLORS.gray, fontSize: 13, marginBottom: 4 },
  amount:          { color: COLORS.primary, fontWeight: 'bold', marginBottom: 4 },
  date:            { fontSize: 11, color: COLORS.gray },
  empty:           { textAlign: 'center', color: COLORS.gray, marginTop: 60, fontSize: 15 },
});
