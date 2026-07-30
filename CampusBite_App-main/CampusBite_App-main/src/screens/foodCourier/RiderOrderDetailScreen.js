import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform, Linking, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';
import RiderMapView from '../../components/RiderMapView';

const STATUS_STEPS = ['Ready', 'Collected', 'In Transit', 'Delivered'];

const NEXT_STATUS = {
  Ready:        'Collected',
  Collected:    'In Transit',
  'In Transit': 'Delivered',
};

const ACTION_LABEL = {
  Collected:    'Collect Order from Vendor',
  'In Transit': 'Start Delivery',
  Delivered:    'Mark as Delivered',
};

export default function RiderOrderDetailScreen({ route }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const pinStyles = useMemo(() => makePinStyles(COLORS), [COLORS]);
  const { orderId } = route.params;
  const [order, setOrder]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating]     = useState(false);
  const [collectingCash, setCollectingCash] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const locationIntervalRef = useRef(null);
  const scanLockRef = useRef(false);

  const startLocationTracking = useCallback(async (activeOrderId) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const sendLocation = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = loc.coords;
        setMyLocation({ lat: latitude, lng: longitude, updatedAt: new Date().toISOString() });
        await api.orders.updateRiderLocation(activeOrderId, { lat: latitude, lng: longitude });
      } catch (err) {
        console.error('[LOCATION] Failed to send location:', err.message);
      }
    };

    sendLocation(); // fire immediately on start
    locationIntervalRef.current = setInterval(sendLocation, 10000);
  }, []);

  const stopLocationTracking = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, []);

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await api.orders.getById(orderId);
      setOrder(data.order);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Start/stop location tracking based on order status
  useEffect(() => {
    if (order && ['Collected', 'In Transit'].includes(order.status)) {
      if (!locationIntervalRef.current) {
        startLocationTracking(orderId);
      }
    } else {
      stopLocationTracking();
    }
    return () => stopLocationTracking();
  }, [order?.status, orderId, startLocationTracking, stopLocationTracking]);

  const callVendor = () => {
    if (order?.vendor?.owner?.phone) Linking.openURL(`tel:${order.vendor.owner.phone}`);
  };

  const callConsumer = () => {
    if (order?.consumer?.phone) Linking.openURL(`tel:${order.consumer.phone}`);
  };

  const advanceStatus = async (pin) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(true);
    try {
      const response = await api.orders.updateStatus(orderId, next, pin);
      const newStatus = response.data?.new_status || next;
      setOrder(prev => ({ ...prev, status: newStatus }));

      if (newStatus === 'Delivered') {
        stopLocationTracking();
        setShowPinModal(false);
        setPinInput('');
        setPinError('');
      }
    } catch (err) {
      if (next === 'Delivered') {
        setPinError(err?.response?.data?.message || 'Incorrect PIN. Please try again.');
      } else {
        Alert.alert('Error', err.message);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleActionPress = () => {
    if (NEXT_STATUS[order.status] === 'Delivered') {
      setPinError('');
      setPinInput('');
      setShowPinModal(true);
      return;
    }
    advanceStatus();
  };

  const submitPin = () => {
    if (pinInput.trim().length !== 4) {
      setPinError('Enter the 4-digit PIN the customer gives you.');
      return;
    }
    advanceStatus(pinInput.trim());
  };

  const openScanner = async () => {
    let granted = cameraPermission?.granted;
    if (!granted) {
      const result = await requestCameraPermission();
      granted = result?.granted;
    }
    if (!granted) {
      setPinError('Camera permission is required to scan the QR code.');
      return;
    }
    scanLockRef.current = false;
    setShowScanner(true);
  };

  const handleBarcodeScanned = ({ data }) => {
    if (scanLockRef.current) return;
    const code = String(data || '').replace(/[^0-9]/g, '').slice(0, 4);
    if (code.length !== 4) return; // not the delivery-PIN QR code, ignore and keep scanning
    scanLockRef.current = true;
    setShowScanner(false);
    setPinInput(code);
    setPinError('');
    advanceStatus(code);
  };

  const handleCollectCash = () => {
    const amount = parseFloat(order.total_amount || 0).toFixed(0);

    const doCollect = async () => {
      setCollectingCash(true);
      try {
        await api.orders.collectCash(orderId);
        Alert.alert('Done', 'Cash payment confirmed.');
        fetchOrder();
      } catch (err) {
        Alert.alert('Error', err?.response?.data?.message || err.message);
      } finally {
        setCollectingCash(false);
      }
    };

    // React Native's Alert.alert with multiple buttons doesn't render on web,
    // so use the browser's native confirm() there instead of silently doing
    // nothing (same fix applied to the vendor's order detail screen).
    if (Platform.OS === 'web') {
      if (window.confirm(`Confirm that the customer has paid KES ${amount} in cash?`)) doCollect();
      return;
    }
    Alert.alert(
      'Confirm Cash Received',
      `Confirm that the customer has paid KES ${amount} in cash?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Cash Received', onPress: doCollect },
      ]
    );
  };

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
  if (!order) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <Text style={{ color: COLORS.gray }}>Order not found.</Text>
    </View>
  );

  const nextStatus      = NEXT_STATUS[order.status];
  const isDelivered     = order.status === 'Delivered';
  const deliveryFee     = parseFloat(order.delivery_fee || 0);
  const currentStep     = STATUS_STEPS.indexOf(order.status);
  const needsCashCollect = order.status === 'In Transit'
    && order.payment_method !== 'mpesa'
    && order.payment?.status !== 'confirmed';

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrder(); }} colors={[COLORS.primary]} />}
    >
      {/* ── Status Banner ── */}
      <View style={[styles.statusBanner, isDelivered && styles.statusBannerGreen]}>
        <Ionicons
          name={isDelivered ? 'checkmark-circle' : 'bicycle'}
          size={22}
          color="#fff"
        />
        <Text style={styles.statusText}>{order.status}</Text>
      </View>

      {/* ── Status Timeline ── */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Delivery Progress</Text>
        <View style={styles.timeline}>
          {STATUS_STEPS.map((step, index) => {
            // "Delivered" is the last step and also the terminal status — once the
            // order reaches it, treat it as done rather than "current", otherwise
            // its dot never gets a checkmark even though the delivery is complete.
            const isPast = index < currentStep || (order.status === 'Delivered' && index === currentStep);
            const isCurrent = index === currentStep && order.status !== 'Delivered';
            const isFuture = index > currentStep;
            return (
              <View key={step} style={styles.timelineStep}>
                <View style={[styles.stepDot, isPast && styles.stepDotDone, isCurrent && styles.stepDotCurrent]}>
                  {isPast ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                </View>
                <Text style={[styles.stepLabel, isPast && styles.stepLabelDone, isCurrent && styles.stepLabelCurrent]}>
                  {step}
                </Text>
                {index < STATUS_STEPS.length - 1 && <View style={[styles.stepLine, isPast && styles.stepLineDone]} />}
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Pickup Info ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Pickup From</Text>
        </View>
        <Text style={styles.cardName}>{order.vendor?.business_name}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.gray} />
          <Text style={styles.infoText}>{order.vendor?.location || 'Vendor location'}</Text>
        </View>
        {order.vendor?.owner?.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color={COLORS.gray} />
            <Text style={styles.infoText}>{order.vendor.owner.phone}</Text>
            <TouchableOpacity style={styles.miniCallBtn} onPress={callVendor}>
              <Ionicons name="call" size={13} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Delivery Info ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="navigate-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Deliver To</Text>
        </View>
        <Text style={styles.cardName}>{order.consumer?.name}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.gray} />
          <Text style={styles.infoText}>{order.delivery_address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={14} color={COLORS.gray} />
          <Text style={styles.infoText}>{order.consumer?.phone}</Text>
          {order.consumer?.phone && (
            <TouchableOpacity style={styles.miniCallBtn} onPress={callConsumer}>
              <Ionicons name="call" size={13} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Live Location Map ── */}
      {['Collected', 'In Transit'].includes(order.status) && (
        <View style={styles.card}>
          <View style={styles.mapHeader}>
            <Ionicons name="navigate-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Your Live Location</Text>
            {myLocation && (
              <View style={styles.liveChip}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          <Text style={styles.mapSub}>
            This location is being shared with the consumer in real-time.
          </Text>
          <RiderMapView
            lat={myLocation?.lat}
            lng={myLocation?.lng}
            locationUpdatedAt={myLocation?.updatedAt}
          />
        </View>
      )}

      {/* ── Order Items ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Order Items</Text>
        </View>
        {order.items?.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.menuItem?.name}</Text>
            <View style={styles.itemQtyRow}>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
              <Text style={styles.itemPrice}>KES {(parseFloat(item.unit_price || 0) * item.quantity).toFixed(0)}</Text>
            </View>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>KES {parseFloat(order.total_amount || 0).toFixed(0)}</Text>
        </View>
        <View style={styles.earningsRow}>
          <Ionicons name="wallet-outline" size={16} color={COLORS.primary} />
          <Text style={styles.earningsLabel}>Your Earnings</Text>
          <Text style={styles.earningsValue}>KES {deliveryFee.toFixed(0)}</Text>
        </View>
      </View>

      {/* ── Pay on Delivery: Cash Collection ── */}
      {needsCashCollect && (
        <View style={styles.cashCard}>
          <View style={styles.cashCardHeader}>
            <Ionicons name="cash-outline" size={22} color="#2e7d32" />
            <Text style={styles.cashCardTitle}>Pay on Delivery</Text>
          </View>
          <Text style={styles.cashCardSub}>
            This customer is paying in cash. Collect <Text style={styles.cashAmount}>KES {parseFloat(order.total_amount || 0).toFixed(0)}</Text> before handing over the order.
          </Text>
          <TouchableOpacity
            style={[styles.cashBtn, collectingCash && { opacity: 0.6 }]}
            onPress={handleCollectCash}
            disabled={collectingCash}
          >
            {collectingCash
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.cashBtnText}>Confirm Cash Received</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* ── Action Button ── */}
      {nextStatus && (
        <TouchableOpacity
          style={[styles.actionButton, updating && { opacity: 0.6 }]}
          onPress={handleActionPress}
          disabled={updating}
        >
          {updating
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.actionButtonText}>{ACTION_LABEL[nextStatus]}</Text>
          }
        </TouchableOpacity>
      )}

      {isDelivered && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={24} color="#388E3C" />
          <Text style={styles.successText}>Delivery Complete!</Text>
          <Text style={styles.successSub}>You earned KES {deliveryFee.toFixed(0)} for this delivery</Text>
        </View>
      )}
    </ScrollView>

    {/* ── Delivery PIN Modal ── */}
    <Modal visible={showPinModal} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={pinStyles.overlay}>
        <View style={pinStyles.sheet}>
          <View style={pinStyles.handle} />
          <Ionicons name="key-outline" size={28} color={COLORS.primary} style={{ alignSelf: 'center', marginBottom: 8 }} />
          <Text style={pinStyles.title}>Enter Delivery PIN</Text>
          <Text style={pinStyles.subtitle}>
            Ask {order.consumer?.name || 'the customer'} for their 4-digit delivery PIN to confirm you've handed over the order.
          </Text>
          <TextInput
            style={pinStyles.input}
            value={pinInput}
            onChangeText={(t) => { setPinInput(t.replace(/[^0-9]/g, '').slice(0, 4)); setPinError(''); }}
            placeholder="0000"
            placeholderTextColor={COLORS.muted}
            keyboardType="number-pad"
            maxLength={4}
            autoFocus
          />
          {!!pinError && <Text style={pinStyles.error}>{pinError}</Text>}
          <TouchableOpacity style={pinStyles.scanBtn} onPress={openScanner} disabled={updating}>
            <Ionicons name="qr-code-outline" size={18} color={COLORS.primary} />
            <Text style={pinStyles.scanBtnText}>Scan QR Code Instead</Text>
          </TouchableOpacity>
          <View style={pinStyles.actions}>
            <TouchableOpacity
              style={pinStyles.cancelBtn}
              onPress={() => { setShowPinModal(false); setPinInput(''); setPinError(''); }}
              disabled={updating}
            >
              <Text style={pinStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pinStyles.confirmBtn, updating && { opacity: 0.6 }]}
              onPress={submitPin}
              disabled={updating}
            >
              {updating
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={pinStyles.confirmBtnText}>Confirm Delivery</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    {/* ── QR Scanner Modal ── */}
    <Modal visible={showScanner} animationType="slide" onRequestClose={() => setShowScanner(false)}>
      <View style={pinStyles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={showScanner ? handleBarcodeScanned : undefined}
        />
        <View style={pinStyles.scannerOverlay}>
          <View style={pinStyles.scannerFrame} />
          <Text style={pinStyles.scannerHint}>Point the camera at the customer's QR code</Text>
        </View>
        <TouchableOpacity style={pinStyles.scannerCloseBtn} onPress={() => setShowScanner(false)}>
          <Ionicons name="close" size={22} color="#fff" />
          <Text style={pinStyles.scannerCloseText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
    </>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
  },
  statusBannerGreen: { backgroundColor: COLORS.success },
  statusText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },

  // Timeline
  timelineCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  timelineTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  timeline: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineStep: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotDone: { backgroundColor: COLORS.success },
  stepDotCurrent: { backgroundColor: COLORS.primary },
  stepLabel: { fontSize: 11, color: COLORS.gray, textAlign: 'center' },
  stepLabelDone: { color: COLORS.success, fontWeight: '600' },
  stepLabelCurrent: { color: COLORS.primary, fontWeight: 'bold' },
  stepLine: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: -12,
    height: 2,
    backgroundColor: COLORS.border,
    zIndex: -1,
  },
  stepLineDone: { backgroundColor: COLORS.success },

  // Cards
  card: {
    backgroundColor: COLORS.card,
    margin: 16,
    marginTop: 0,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  cardName: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontSize: 13, color: COLORS.gray, flex: 1 },
  miniCallBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center',
  },

  // Items
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemName: { fontSize: 14, color: COLORS.text, flex: 1 },
  itemQtyRow: { alignItems: 'flex-end' },
  itemQty: { fontSize: 13, color: COLORS.gray, marginRight: 12 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.borderWarm, marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: COLORS.iconBg,
    borderRadius: 8,
  },
  earningsLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  earningsValue: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },

  // Live map
  mapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  mapSub: { fontSize: 12, color: COLORS.gray, marginBottom: 12 },
  liveChip: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  liveText: { fontSize: 11, color: COLORS.success, fontWeight: '800' },

  // Cash collection card
  cashCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: COLORS.successBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.successBorder,
  },
  cashCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cashCardTitle:  { fontSize: 16, fontWeight: 'bold', color: COLORS.success },
  cashCardSub:    { fontSize: 13, color: COLORS.success, lineHeight: 19, marginBottom: 14 },
  cashAmount:     { fontWeight: 'bold' },
  cashBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 10,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cashBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  // Action button
  actionButton: {
    margin: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },

  // Success box
  successBox: {
    margin: 16,
    marginTop: 0,
    backgroundColor: COLORS.successBg,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  successText: { fontSize: 16, fontWeight: 'bold', color: COLORS.success, marginTop: 8 },
  successSub: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
});

const makePinStyles = (COLORS) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.borderWarm,
    borderRadius: 12,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 12,
    color: COLORS.text,
    marginBottom: 8,
  },
  error: { color: COLORS.danger, fontSize: 13, textAlign: 'center', marginBottom: 8 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed',
  },
  scanBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.gray },
  confirmBtn: {
    flex: 2, paddingVertical: 13, borderRadius: 10,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  scannerFrame: {
    width: 250, height: 250, borderRadius: 16,
    borderWidth: 3, borderColor: '#fff',
  },
  scannerHint: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 20, textAlign: 'center', paddingHorizontal: 40 },
  scannerCloseBtn: {
    position: 'absolute', top: 50, left: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  scannerCloseText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

