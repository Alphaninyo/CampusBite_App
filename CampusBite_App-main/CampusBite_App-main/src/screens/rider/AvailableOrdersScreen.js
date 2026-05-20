import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

export default function AvailableOrdersScreen({ navigation }) {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.orders.getAvailableForRider();
      setOrders(data.orders);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

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

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[COLORS.primary]} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.vendor}>{item.vendor?.business_name}</Text>
            <Text style={styles.amount}>KES {parseFloat(item.total_amount).toFixed(2)}</Text>
          </View>
          <View style={styles.addressContainer}>
                <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                <Text style={styles.address}>{item.delivery_address}</Text>
              </View>
          <Text style={styles.items}>{item.items?.length} item(s)</Text>
          <TouchableOpacity
            style={[styles.button, accepting === item.id && { opacity: 0.6 }]}
            onPress={() => accept(item.id)}
            disabled={accepting === item.id}
          >
            {accepting === item.id
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.buttonText}>Accept Delivery</Text>}
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No orders available for pickup.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  card:       { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  vendor:     { fontSize: 15, fontWeight: 'bold', color: COLORS.black, flex: 1 },
  amount:     { fontSize: 15, color: COLORS.primary, fontWeight: 'bold' },
  addressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  address:      { color: COLORS.gray, marginLeft: 4, marginTop: 4 },
  items:      { color: COLORS.gray, fontSize: 12, marginBottom: 12 },
  button:     { backgroundColor: COLORS.primary, borderRadius: 8, padding: 12, alignItems: 'center' },
  buttonText: { color: COLORS.white, fontWeight: 'bold' },
  empty:      { textAlign: 'center', color: COLORS.gray, marginTop: 60, fontSize: 15 },
});
