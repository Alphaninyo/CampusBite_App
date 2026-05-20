import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

const NEXT_STATUS = {
  Ready:        'Collected',
  Collected:    'In Transit',
  'In Transit': 'Delivered',
};

export default function RiderOrderDetailScreen({ route }) {
  const { orderId } = route.params;
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await api.orders.getById(orderId);
      setOrder(data.order);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const advanceStatus = async () => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    Alert.alert('Update Delivery', `Mark as "${next}"?`, [
      { text: 'Cancel' },
      {
        text: 'Confirm', onPress: async () => {
          setUpdating(true);
          try {
            await api.orders.updateStatus(orderId, next);
            fetchOrder();
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;
  if (!order)  return <Text style={{ padding: 20 }}>Order not found.</Text>;

  const nextStatus = NEXT_STATUS[order.status];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrder(); }} colors={[COLORS.primary]} />}>
      <View style={[styles.badge, { backgroundColor: COLORS.primary }]}>
        <Text style={styles.badgeText}>{order.status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pickup From</Text>
        <Text style={styles.name}>{order.vendor?.business_name}</Text>
        {order.vendor?.location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.sub}>{order.vendor.location}</Text>
                </View>
              )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deliver To</Text>
        <Text style={styles.name}>{order.consumer?.name}</Text>
        <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                <Text style={styles.sub}>{order.delivery_address}</Text>
              </View>
              <View style={styles.locationContainer}>
                <Ionicons name="call-outline" size={14} color={COLORS.gray} />
                <Text style={styles.sub}>{order.consumer?.phone}</Text>
              </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items?.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.itemName}>{item.menuItem?.name}</Text>
            <Text style={styles.itemQty}>×{item.quantity}</Text>
          </View>
        ))}
      </View>

      {nextStatus && (
        <TouchableOpacity style={styles.button} onPress={advanceStatus} disabled={updating}>
          {updating
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>
                {nextStatus === 'Collected'  ? 'Collect Order'        :
                 nextStatus === 'In Transit' ? 'Start Delivery'        :
                                              'Mark as Delivered'}
              </Text>}
        </TouchableOpacity>
      )}

      {order.status === 'Delivered' && (
        <View style={styles.doneBox}>
          <Text style={styles.doneText}>Delivery complete!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  badge:        { margin: 16, borderRadius: 10, padding: 12, alignItems: 'center' },
  badgeText:    { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  section:      { backgroundColor: COLORS.white, margin: 16, marginTop: 0, borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.gray, marginBottom: 8, textTransform: 'uppercase' },
  name:         { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginBottom: 4 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  sub:          { color: COLORS.gray, marginLeft: 4, marginTop: 2 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName:     { flex: 1, color: COLORS.black },
  itemQty:      { color: COLORS.gray },
  button:       { margin: 16, backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText:   { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  doneBox:      { margin: 16, backgroundColor: COLORS.success, borderRadius: 10, padding: 16, alignItems: 'center' },
  doneText:     { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});
