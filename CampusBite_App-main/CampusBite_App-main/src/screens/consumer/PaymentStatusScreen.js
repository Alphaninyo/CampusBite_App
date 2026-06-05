import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

export default function PaymentStatusScreen({ route, navigation }) {
  const { checkoutRequestId } = route.params;
  const [status, setStatus]   = useState('pending');
  const [orderId, setOrderId] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await api.payments.getStatus(checkoutRequestId);
        setStatus(data.status);
        if (data.status === 'confirmed') {
          setOrderId(data.order_id);
          clearInterval(intervalRef.current);
        } else if (data.status === 'failed') {
          clearInterval(intervalRef.current);
        }
      } catch (err) {
        console.error(err.message);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 4000);
    return () => clearInterval(intervalRef.current);
  }, [checkoutRequestId]);

  const handleCancel = () => {
    Alert.alert('Cancel Payment', 'Also decline the M-Pesa prompt on your phone.', [
      { text: 'Keep Waiting' },
      {
        text: 'Cancel Payment', style: 'destructive', onPress: async () => {
          try {
            await api.payments.cancel(checkoutRequestId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  if (status === 'confirmed') {
    return (
      <View style={styles.container}>
        <View style={styles.iconCircleSuccess}>
          <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
        </View>
        <Text style={styles.title}>Payment Confirmed!</Text>
        <Text style={styles.subtitle}>Your order has been placed successfully.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('OrdersTab', { screen: 'OrderDetail', params: { orderId } })}>
          <Ionicons name="locate-outline" size={18} color={COLORS.white} />
          <Text style={styles.buttonText}>Track My Order</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={styles.container}>
        <View style={styles.iconCircleFail}>
          <Ionicons name="close-circle" size={64} color="#EF4444" />
        </View>
        <Text style={styles.title}>Payment Failed</Text>
        <Text style={styles.subtitle}>The payment was cancelled or declined.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Ionicons name="refresh-outline" size={18} color={COLORS.white} />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.title}>Waiting for M-Pesa...</Text>
      <Text style={styles.subtitle}>Enter your PIN on your phone to confirm payment.</Text>
      <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
        <Text style={styles.cancelText}>Cancel Payment</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconCircleSuccess: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleFail: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.black, marginTop: 16, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 32 },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
  cancelBtn: { marginTop: 20 },
  cancelText: { color: COLORS.danger, fontSize: 14, fontWeight: '500' },
});
