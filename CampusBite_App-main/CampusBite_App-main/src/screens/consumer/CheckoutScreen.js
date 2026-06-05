import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';
import useAuthStore from '../../stores/authStore';

const DELIVERY_FEE = 50;

export default function CheckoutScreen({ route, navigation }) {
  const { vendor, items, subtotal } = route.params;
  const user = useAuthStore((s) => s.user);
  const [address, setAddress]                 = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading]                 = useState(false);

  const total = subtotal + DELIVERY_FEE;

  const handleCheckout = async () => {
    if (!address.trim()) return Alert.alert('Error', 'Please enter your delivery address.');
    setLoading(true);
    try {
      const { data } = await api.orders.initiate({
        vendor_id: vendor.id,
        items,
        delivery_address: address.trim(),
        special_instructions: specialInstructions.trim() || undefined,
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
        <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
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

      {/* Special Instructions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Special Instructions</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.gray} />
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            placeholder="e.g. No onions, extra sauce, call when at gate…"
            placeholderTextColor={COLORS.gray}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
          />
        </View>
        <Text style={styles.optionalHint}>Optional</Text>
      </View>

      {/* M-Pesa Phone */}
      <View style={styles.mpesaRow}>
        <Ionicons name="phone-portrait-outline" size={18} color={COLORS.primary} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.mpesaLabel}>M-Pesa will be sent to</Text>
          <Text style={styles.mpesaPhone}>{user?.phone || 'No phone on account'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
          <Text style={styles.mpesaEdit}>Edit</Text>
        </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: COLORS.background },

  // Vendor
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
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
    borderColor: COLORS.borderWarm,
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.black, marginBottom: 12 },

  // Items
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  itemQty: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  itemName: { fontSize: 14, color: COLORS.black },

  // Summary
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { color: COLORS.gray, fontSize: 13 },
  rowValue: { color: COLORS.black, fontSize: 13 },
  totalLabel: { fontWeight: 'bold', fontSize: 16, color: COLORS.black },
  totalValue: { fontWeight: 'bold', fontSize: 16, color: COLORS.primary },
  divider: { height: 1, backgroundColor: COLORS.borderWarm, marginVertical: 10 },

  // Input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  input: { flex: 1, fontSize: 14, color: COLORS.black, minHeight: 50 },

  optionalHint: { fontSize: 11, color: COLORS.gray, marginTop: 6, alignSelf: 'flex-end' },

  // M-Pesa phone row
  mpesaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  mpesaLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', letterSpacing: 0.3 },
  mpesaPhone: { fontSize: 15, fontWeight: '700', color: COLORS.black, marginTop: 2 },
  mpesaEdit:  { fontSize: 13, color: COLORS.primary, fontWeight: '700' },

  // Button
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
});
