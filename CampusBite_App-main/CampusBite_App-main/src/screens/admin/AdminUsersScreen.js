import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { api } from '../../api';
import { COLORS } from '../../constants';

const ROLES = ['All', 'consumer', 'vendor', 'food_courier', 'admin'];
const ROLE_COLORS = { consumer: '#6366F1', vendor: COLORS.primary, food_courier: '#F59E0B', admin: '#EF4444' };

export default function AdminUsersScreen() {
  const [users, setUsers]       = useState([]);
  const [filter, setFilter]     = useState('All');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(true);

  const fetchUsers = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const params = { page: pageNum, limit: 25 };
      if (filter !== 'All') params.role = filter;
      const { data } = await api.admin.getUsers(params);
      if (reset) {
        setUsers(data.users);
      } else {
        setUsers((prev) => [...prev, ...data.users]);
      }
      setHasMore(data.users.length === 25);
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
    fetchUsers(1, true);
  }, [filter]);

  const loadMore = () => {
    if (!hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchUsers(next, false);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {ROLES.map((r) => (
          <TouchableOpacity key={r} style={[styles.chip, filter === r && styles.chipActive]} onPress={() => setFilter(r)}>
            <Text style={[styles.chipText, filter === r && styles.chipTextActive]}>{r === 'food_courier' ? 'Food Courier' : r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setPage(1); fetchUsers(1, true); }} colors={[COLORS.primary]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={[styles.badge, { backgroundColor: ROLE_COLORS[item.role] || COLORS.gray }]}>
                <Text style={styles.badgeText}>{item.role === 'food_courier' ? 'Food Courier' : item.role}</Text>
              </View>
            </View>
            <Text style={styles.email}>{item.email}</Text>
            {item.phone && <Text style={styles.sub}>{item.phone}</Text>}
            <Text style={styles.date}>Joined {new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No users found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  filterRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.lightGray },
  chip:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.lightGray },
  chipActive:     { backgroundColor: COLORS.primary },
  chipText:       { fontSize: 12, color: COLORS.gray },
  chipTextActive: { color: COLORS.white, fontWeight: 'bold' },
  card:           { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  row:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name:           { fontSize: 15, fontWeight: 'bold', color: COLORS.black, flex: 1 },
  badge:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText:      { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  email:          { color: COLORS.gray, fontSize: 13, marginBottom: 2 },
  sub:            { color: COLORS.gray, fontSize: 13, marginBottom: 2 },
  date:           { fontSize: 11, color: COLORS.gray },
  empty:          { textAlign: 'center', color: COLORS.gray, marginTop: 60, fontSize: 15 },
});
