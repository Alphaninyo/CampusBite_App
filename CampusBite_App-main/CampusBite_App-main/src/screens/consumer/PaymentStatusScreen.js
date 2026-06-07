import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';
import useCartStore from '../../stores/cartStore';

export default function PaymentStatusScreen({ route, navigation }) {
  const {
    checkoutRequestId,
    initialStatus,   // 'confirmed' for card — skips polling
    orderId: initialOrderId,
    paymentMethod,
    devMode = false, // true when M-Pesa credentials are placeholder
  } = route.params;

  const [status,      setStatus]      = useState(initialStatus || 'pending');
  const [orderId,     setOrderId]     = useState(initialOrderId || null);
  const [simulating,  setSimulating]  = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Cash / card orders are confirmed immediately — clear cart and stop
    if (initialStatus === 'confirmed') {
      useCartStore.getState().clearCart();
      return;
    }
    if (initialStatus === 'failed') return;

    // M-Pesa: poll for payment confirmation
    const poll = async () => {
      try {
        const { data } = await api.payments.getStatus(checkoutRequestId);
        setStatus(data.status);
        if (data.status === 'confirmed') {
          setOrderId(data.order_id);
          clearInterval(intervalRef.current);
          useCartStore.getState().clearCart();
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
  }, [checkoutRequestId, initialStatus]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const { data } = await api.orders.devConfirm(checkoutRequestId);
      setOrderId(data.order_id);
      setStatus('confirmed');
      useCartStore.getState().clearCart();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message);
    } finally {
      setSimulating(false);
    }
  };

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
    const isCash = paymentMethod === 'cash';
    const isCard = paymentMethod === 'card';

    const goToOrder = () => {
      if (orderId) {
        navigation.navigate('OrdersTab', { screen: 'OrderDetail', params: { orderId } });
      } else {
        navigation.navigate('OrdersTab');
      }
    };

    return (
      <View style={styles.container}>
        <View style={styles.iconCircleSuccess}>
          <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
        </View>
        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>
          {isCash
            ? 'Your order is confirmed. Pay the rider in cash when your food arrives.'
            : isCard
            ? 'Your order is confirmed. Card payment will be collected on delivery.'
            : 'Your order has been placed and is being prepared.'}
        </Text>
        <TouchableOpacity style={styles.button} onPress={goToOrder}>
          <Ionicons name="receipt-outline" size={18} color={COLORS.card} />
          <Text style={styles.buttonText}>Track My Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('HomeTab')}>
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={styles.container}>
        <View style={styles.iconCircleFail}>
          <Ionicons name="close-circle" size={64} color={COLORS.danger} />
        </View>
        <Text style={styles.title}>Payment Failed</Text>
        <Text style={styles.subtitle}>The payment was cancelled or declined. Please try again.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Ionicons name="refresh-outline" size={18} color={COLORS.card} />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {devMode ? (
        <View style={styles.devBadge}>
          <Ionicons name="construct-outline" size={16} color="#7b4f00" />
          <Text style={styles.devBadgeText}>Dev / Test Mode</Text>
        </View>
      ) : null}

      <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: devMode ? 16 : 0 }} />
      <Text style={styles.title}>{devMode ? 'Order Ready to Confirm' : 'Waiting for M-Pesa...'}</Text>
      <Text style={styles.subtitle}>
        {devMode
          ? 'No M-Pesa credentials configured. Tap the button below to simulate a successful payment.'
          : 'Enter your PIN on your phone to confirm payment.'}
      </Text>

      {devMode ? (
        <TouchableOpacity
          style={[styles.simulateBtn, simulating && { opacity: 0.6 }]}
          onPress={handleSimulate}
          disabled={simulating}
        >
          {simulating
            ? <ActivityIndicator color={COLORS.card} size="small" />
            : <>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.card} />
                <Text style={styles.simulateBtnText}>Simulate M-Pesa Payment</Text>
              </>}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel Payment</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconCircleSuccess: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  iconCircleFail: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.dangerBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  title:    { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginTop: 16, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 32 },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 32,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  buttonText: { color: COLORS.card, fontWeight: 'bold', fontSize: 15 },
  cancelBtn:  { marginTop: 20 },
  cancelText: { color: COLORS.danger, fontSize: 14, fontWeight: '500' },
  secondaryBtn: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 24 },
  secondaryBtnText: { color: COLORS.gray, fontSize: 14, fontWeight: '500' },

  devBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff3cd', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: '#ffc107',
  },
  devBadgeText: { fontSize: 13, color: '#7b4f00', fontWeight: '600' },

  simulateBtn: {
    marginTop: 28,
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 28,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  simulateBtnText: { color: COLORS.card, fontWeight: 'bold', fontSize: 15 },
});
