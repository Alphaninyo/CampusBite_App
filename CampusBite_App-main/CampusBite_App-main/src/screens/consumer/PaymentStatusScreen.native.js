import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider, CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import { api } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';
import useCartStore from '../../stores/cartStore';

// Native in-app card entry — replaces the old Linking.openURL(...) handoff to
// a browser-hosted Stripe.js page. Must live inside a <StripeProvider>, which
// is why this is its own component rather than inlined in the screen below.
function CardPaymentForm({ clientSecret, paymentId, amount, onSuccess, styles, COLORS }) {
  const { confirmPayment, loading } = useConfirmPayment();
  const [cardComplete, setCardComplete] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setError('');
    const { error: confirmError, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
    });

    if (confirmError) {
      setError(confirmError.message);
      return;
    }

    if (paymentIntent?.status?.toLowerCase() !== 'succeeded') {
      setError(`Payment status: ${paymentIntent?.status || 'unknown'}`);
      return;
    }

    try {
      const { data } = await api.orders.confirmCardPayment(paymentId);
      if (data.success) {
        onSuccess(data.order_id);
      } else {
        setError(data.message || 'Payment succeeded, but the order could not be finalized. Please contact support.');
      }
    } catch (e) {
      setError('Payment succeeded, but we could not reach the server to finalize your order. Please contact support.');
    }
  };

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <Text style={styles.title}>Pay KES {amount}</Text>
      <Text style={styles.subtitle}>Enter your card details below.</Text>
      <CardField
        postalCodeEnabled={false}
        placeholders={{ number: '4242 4242 4242 4242' }}
        cardStyle={{ backgroundColor: COLORS.card, textColor: COLORS.text, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border }}
        style={{ width: '100%', height: 50, marginBottom: 8 }}
        onCardChange={(details) => setCardComplete(details.complete)}
      />
      {!!error && <Text style={{ color: COLORS.danger, marginTop: 8, textAlign: 'center' }}>{error}</Text>}
      <TouchableOpacity
        style={[styles.simulateBtn, (!cardComplete || loading) && { opacity: 0.6 }]}
        onPress={handlePay}
        disabled={!cardComplete || loading}
      >
        {loading
          ? <ActivityIndicator color={COLORS.white} size="small" />
          : <>
              <Ionicons name="card-outline" size={20} color={COLORS.white} />
              <Text style={styles.simulateBtnText}>Pay Now</Text>
            </>}
      </TouchableOpacity>
    </View>
  );
}

export default function PaymentStatusScreen({ route, navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const {
    checkoutRequestId,
    initialStatus,   // 'confirmed' for cash — skips polling
    orderId: initialOrderId,
    paymentMethod,
    devMode = false,      // true when M-Pesa/Stripe credentials are placeholder
    paymentId,            // card only — passed to confirm-card-payment after confirmPayment succeeds
    clientSecret,          // card only — passed to Stripe's native confirmPayment
    publishableKey,        // card only — used to init the local StripeProvider below
    amount,                // card only — shown above the card field
  } = route.params;

  const [status,      setStatus]      = useState(initialStatus || 'pending');
  const [orderId,     setOrderId]     = useState(initialOrderId || null);
  const [simulating,  setSimulating]  = useState(false);
  const intervalRef = useRef(null);
  const isCardMethod = paymentMethod === 'card';

  const handleCardPaymentSuccess = (newOrderId) => {
    setOrderId(newOrderId);
    setStatus('confirmed');
    useCartStore.getState().clearCart();
  };

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
            ? 'Your card payment was successful and your order is confirmed.'
            : 'Your order has been placed and is being prepared.'}
        </Text>
        <TouchableOpacity style={styles.button} onPress={goToOrder}>
          <Ionicons name="receipt-outline" size={18} color={COLORS.white} />
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
          <Ionicons name="refresh-outline" size={18} color={COLORS.white} />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Real (non-devMode) card payment renders its own header/spinner inside
  // CardPaymentForm, since it's a materially different UI (a form, not a
  // waiting state) — skip the generic waiting-screen chrome below for it.
  if (isCardMethod && !devMode) {
    return (
      <View style={styles.container}>
        <StripeProvider publishableKey={publishableKey}>
          <CardPaymentForm
            clientSecret={clientSecret}
            paymentId={paymentId}
            amount={amount}
            onSuccess={handleCardPaymentSuccess}
            styles={styles}
            COLORS={COLORS}
          />
        </StripeProvider>
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
      <Text style={styles.title}>
        {devMode ? 'Order Ready to Confirm' : 'Waiting for M-Pesa...'}
      </Text>
      <Text style={styles.subtitle}>
        {devMode
          ? `No ${isCardMethod ? 'Stripe' : 'M-Pesa'} credentials configured. Tap the button below to simulate a successful payment.`
          : 'Enter your PIN on your phone to confirm payment.'}
      </Text>

      {devMode ? (
        <TouchableOpacity
          style={[styles.simulateBtn, simulating && { opacity: 0.6 }]}
          onPress={handleSimulate}
          disabled={simulating}
        >
          {simulating
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : <>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.simulateBtnText}>Simulate {isCardMethod ? 'Card' : 'M-Pesa'} Payment</Text>
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

const makeStyles = (COLORS) => StyleSheet.create({
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
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
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
  simulateBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
});
