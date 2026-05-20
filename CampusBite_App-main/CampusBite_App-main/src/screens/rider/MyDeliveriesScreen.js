import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

export default function MyDeliveriesScreen({ navigation }) {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.orders.getRiderOrders();
      setOrders(data.orders);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[COLORS.primary]} />}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RiderOrderDetail', { orderId: item.id })}>
          <View style={styles.row}>
            <Text style={styles.vendor}>{item.vendor?.business_name}</Text>
            <View style={[styles.badge, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.addressContainer}>
                <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                <Text style={styles.address}>{item.delivery_address}</Text>
              </View>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No deliveries yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  card:       { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  vendor:     { fontSize: 15, fontWeight: 'bold', color: COLORS.black, flex: 1 },
  badge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText:  { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  addressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  address:      { color: COLORS.gray, marginLeft: 4, marginTop: 4 },
  date:       { fontSize: 12, color: COLORS.gray },
  empty:      { textAlign: 'center', color: COLORS.gray, marginTop: 60, fontSize: 15 },
});
