import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

const DELIVERY_FEE = 50;

export default function CheckoutScreen({ route, navigation }) {
  const { vendor, items, subtotal } = route.params;
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const total = subtotal + DELIVERY_FEE;

  const handleCheckout = async () => {
    if (!address.trim()) return Alert.alert('Error', 'Please enter your delivery address.');
    setLoading(true);
    try {
      const { data } = await api.orders.initiate({
        vendor_id: vendor.id,
        items,
        delivery_address: address.trim(),
      });
      navigation.replace('PaymentStatus', {
        checkoutRequestId: data.checkout_request_id,
        summary: data.summary,
      });
    } catch (err) {
      Alert.alert('Checkout Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
      {/* Vendor Info */}
      <View style={styles.vendorCard}>
        <Ionicons name="storefront-outline" size={20} color="#E85D04" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.heading}>Order Summary</Text>
          <Text style={styles.vendorName}>{vendor.business_name}</Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items</Text>
        {items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}x</Text>
            <Text style={styles.itemName}>{item.name || item.menu_item_id.slice(0, 8)}</Text>
          </View>
        ))}
      </View>

      {/* Price Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment</Text>
        <View style={styles.row}><Text style={styles.rowLabel}>Subtotal</Text><Text style={styles.rowValue}>KES {subtotal.toFixed(2)}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Delivery</Text><Text style={styles.rowValue}>KES {DELIVERY_FEE}.00</Text></View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>KES {total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Address */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery Address</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="location-outline" size={18} color={COLORS.gray} />
          <TextInput style={styles.input} placeholder="e.g. Block C, Room 12" placeholderTextColor={COLORS.gray}
            value={address} onChangeText={setAddress} multiline />
        </View>
      </View>

      {/* Checkout Button */}
      <TouchableOpacity style={styles.button} onPress={handleCheckout} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="phone-portrait-outline" size={18} color={COLORS.white} />
            <Text style={styles.buttonText}>Pay KES {total.toFixed(2)} via M-Pesa</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F6' },

  // Vendor
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0e8e4',
  },
  heading: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  vendorName: { color: COLORS.gray, fontSize: 13, marginTop: 2 },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0e8e4',
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.black, marginBottom: 12 },

  // Items
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  itemQty: { fontSize: 14, fontWeight: 'bold', color: '#E85D04' },
  itemName: { fontSize: 14, color: COLORS.black },

  // Summary
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { color: COLORS.gray, fontSize: 13 },
  rowValue: { color: COLORS.black, fontSize: 13 },
  totalLabel: { fontWeight: 'bold', fontSize: 16, color: COLORS.black },
  totalValue: { fontWeight: 'bold', fontSize: 16, color: '#E85D04' },
  divider: { height: 1, backgroundColor: '#f0e8e4', marginVertical: 10 },

  // Input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  input: { flex: 1, fontSize: 14, color: COLORS.black, minHeight: 50 },

  // Button
  button: {
    backgroundColor: '#E85D04',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
});
