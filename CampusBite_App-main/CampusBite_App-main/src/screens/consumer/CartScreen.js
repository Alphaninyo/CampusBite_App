import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, ScrollView, Image, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { resolveImageUrl } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import useCartStore from '../../stores/cartStore';
import useAuthStore from '../../stores/authStore';
import { api } from '../../api';
import MapAddressPicker from '../../components/MapAddressPicker';
import { previewDeliveryFee, TIME_TIER_LABEL } from '../../utils/deliveryFee';

const SERVICE_FEE = 5; // Platform service fee, added on top — mirrors SERVICE_FEE_CONSUMER on the backend.

const PAYMENT_METHODS = [
  { id: 'mpesa', label: 'M-Pesa',             subtitle: 'STK push to your phone',      icon: 'phone-portrait-outline', iconBg: '#E8F5E9', iconColor: '#2E7D32', badge: 'Popular' },
  { id: 'card',  label: 'Debit / Credit card', subtitle: 'Visa, Mastercard accepted',   icon: 'card-outline',           iconBg: '#E3F2FD', iconColor: '#1565C0' },
  { id: 'cash',  label: 'Cash on delivery',    subtitle: 'Pay when your order arrives', icon: 'wallet-outline',         iconBg: '#FFF3E0', iconColor: '#E65100' },
];

function buildTimeSlots() {
  const slots = [{ label: 'ASAP (25–35 min)', value: null }];
  const now   = new Date();
  for (let mins = 30; mins <= 180; mins += 30) {
    const t  = new Date(now.getTime() + mins * 60 * 1000);
    const hh = String(t.getHours()).padStart(2, '0');
    const mm = String(t.getMinutes()).padStart(2, '0');
    slots.push({ label: `${hh}:${mm} (~${mins} min)`, value: t.toISOString() });
  }
  return slots;
}

export default function CartScreen({ navigation, route }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const {
    cartItems, totalAmount, vendorId, vendorName,
    loading, updateQuantity, loadCart,
  } = useCartStore();

  const [address,             setAddress]             = useState('');
  const [addressCoords,       setAddressCoords]       = useState(null); // { latitude, longitude } from the map picker — used for distance-based delivery fees
  const [paymentMethod,       setPaymentMethod]       = useState('mpesa');
  const [promoCode,           setPromoCode]           = useState('');
  const [appliedPromo,        setAppliedPromo]        = useState(null);
  const [promoLoading,        setPromoLoading]        = useState(false);
  const [promoError,          setPromoError]          = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [suggestions,         setSuggestions]         = useState([]);
  const [checkingOut,         setCheckingOut]         = useState(false);
  const [vendorOpen,          setVendorOpen]          = useState(true);
  const [vendorOpeningTime,   setVendorOpeningTime]   = useState(null);
  const [vendorCoords,        setVendorCoords]        = useState(null);
  const [timeSlots,           setTimeSlots]           = useState([]);
  const [selectedSlot,        setSelectedSlot]        = useState(null);
  const [selectedSlotLabel,   setSelectedSlotLabel]   = useState('ASAP (25–35 min)');
  const [showTimePicker,      setShowTimePicker]      = useState(false);
  const [showConfirm,         setShowConfirm]         = useState(false);
  const [showMapPicker,       setShowMapPicker]       = useState(false);
  const [mpesaPhone,          setMpesaPhone]          = useState(() => useAuthStore.getState().user?.phone || '');

  useFocusEffect(
    useCallback(() => {
      loadCart();
      setTimeSlots(buildTimeSlots());
    }, [])
  );

  useEffect(() => {
    if (!vendorId) { setSuggestions([]); return; }

    api.vendors.getById(vendorId)
      .then(({ data }) => {
        setVendorOpen(data.vendor?.is_open ?? true);
        setVendorOpeningTime(data.vendor?.opening_time || null);
        setVendorCoords(
          data.vendor?.latitude != null && data.vendor?.longitude != null
            ? { latitude: data.vendor.latitude, longitude: data.vendor.longitude }
            : null
        );
      })
      .catch(() => {});

    api.menu.getVendorMenu(vendorId)
      .then(({ data }) => {
        const all     = data.items || data.menu_items || [];
        const menuMap = Object.fromEntries(all.map((m) => [m.id, m]));

        // Enrich any cart items that were stored without an image
        const current = useCartStore.getState().cartItems;
        const needsEnrich = current.some((i) => !i.image && menuMap[i.id]?.image);
        if (needsEnrich) {
          const enriched = current.map((i) => ({
            ...i,
            image: i.image || menuMap[i.id]?.image || null,
          }));
          useCartStore.getState().saveCart(enriched);
        }

        const inCart = new Set(current.map((i) => i.id));
        setSuggestions(all.filter((i) => !inCart.has(i.id) && i.is_available).slice(0, 6));
      })
      .catch(() => {});
  }, [vendorId]);

  const deliveryPreview = useMemo(() => previewDeliveryFee({
    vendorLat:   vendorCoords?.latitude,
    vendorLng:   vendorCoords?.longitude,
    deliveryLat: addressCoords?.latitude,
    deliveryLng: addressCoords?.longitude,
  }), [vendorCoords, addressCoords]);
  const deliveryFee = deliveryPreview.delivery_fee;

  const discount = appliedPromo?.discount_amount || 0;
  const total    = totalAmount + deliveryFee + SERVICE_FEE - discount;

  // ── Cart actions ──────────────────────────────────────────────────────────────

  const handleRemove = (itemId) => {
    const updated = useCartStore.getState().cartItems.filter((i) => i.id !== itemId);
    useCartStore.getState().saveCart(
      updated,
      updated.length === 0 ? null : undefined,
      updated.length === 0 ? null : undefined,
    );
  };

  const handleQtyChange = (itemId, newQty) => {
    if (newQty < 1) { handleRemove(itemId); return; }
    updateQuantity(itemId, newQty);
  };

  const addSuggestion = (s) => {
    const current  = useCartStore.getState().cartItems;
    const existing = current.find((i) => i.id === s.id);
    const updated  = existing
      ? current.map((i) => i.id === s.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...current, { id: s.id, name: s.name, price: parseFloat(s.price), quantity: 1, vendor_id: vendorId, image: s.image || null }];
    useCartStore.getState().saveCart(updated, vendorId, vendorName);
    setSuggestions((prev) => prev.filter((x) => x.id !== s.id));
  };

  // ── Promo code ────────────────────────────────────────────────────────────────

  const handleApplyPromo = async (codeOverride) => {
    const codeToApply = codeOverride ?? promoCode;
    if (!codeToApply.trim() || !vendorId) return;
    setPromoLoading(true);
    setPromoError('');
    setAppliedPromo(null);
    try {
      const { data } = await api.promoCodes.validate({
        code:       codeToApply.trim().toUpperCase(),
        vendor_id:  vendorId,
        cart_total: totalAmount,
      });
      setAppliedPromo(data);
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Invalid promo code.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  // Arriving from a "New promo at <vendor>" notification tap or the vendor
  // page's promo banner — pre-fill and auto-apply instead of making the
  // consumer retype the code they just tapped on.
  useEffect(() => {
    const code = route?.params?.applyPromoCode;
    if (!code || !vendorId) return;
    setPromoCode(code);
    handleApplyPromo(code);
    navigation.setParams({ applyPromoCode: undefined });
  }, [route?.params?.applyPromoCode, vendorId]);

  // ── Checkout ──────────────────────────────────────────────────────────────────

  const openConfirm = () => {
    if (cartItems.length === 0) return;
    if (!vendorOpen) {
      Alert.alert(
        'Vendor Closed',
        vendorOpeningTime
          ? `${vendorName || 'This vendor'} is closed right now. They open at ${vendorOpeningTime}.`
          : `${vendorName || 'This vendor'} is currently closed.`
      );
      return;
    }
    if (!address.trim()) {
      Alert.alert('Delivery Address', 'Please enter your delivery address first.');
      return;
    }
    setShowConfirm(true);
  };

  const handleCheckout = async () => {
    setShowConfirm(false);
    setCheckingOut(true);
    try {
      // Fall back to vendor_id stored on the cart items if store-level value is missing
      const resolvedVendorId = vendorId || cartItems.find((i) => i.vendor_id)?.vendor_id || null;
      if (!resolvedVendorId) {
        Alert.alert('Checkout Failed', 'Vendor information is missing. Please re-add items to your cart.');
        setCheckingOut(false);
        return;
      }
      const { data } = await api.orders.initiate({
        vendor_id:            resolvedVendorId,
        items:                cartItems.map((i) => ({ menu_item_id: i.id, quantity: Math.round(Number(i.quantity)) })),
        delivery_address:     address.trim(),
        delivery_lat:         addressCoords?.latitude ?? undefined,
        delivery_lng:         addressCoords?.longitude ?? undefined,
        special_instructions: specialInstructions.trim() || undefined,
        payment_method:       paymentMethod,
        promo_code:           appliedPromo?.code || undefined,
        scheduled_time:       selectedSlot || undefined,
        phone_number:         paymentMethod === 'mpesa' && mpesaPhone.trim() ? mpesaPhone.trim() : undefined,
      });

      if (data.immediate) {
        navigation.navigate('CartPaymentStatus', {
          checkoutRequestId: data.checkout_request_id,
          initialStatus:     'confirmed',
          orderId:           data.order_id,
          paymentMethod,
        });
      } else {
        navigation.navigate('CartPaymentStatus', {
          checkoutRequestId: data.checkout_request_id,
          paymentMethod,
          devMode:           data.dev_mode || false,
          paymentId:         data.payment_id,
          clientSecret:      data.client_secret,
          publishableKey:    data.publishable_key,
          amount:            data.summary?.total_amount,
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
      Alert.alert('Checkout Failed', msg);
    } finally {
      setCheckingOut(false);
    }
  };

  // ── Loading / Empty states ────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cart-outline" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Browse vendors and add items to get started</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('HomeTab')}>
          <Text style={styles.shopBtnText}>Browse Vendors</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {!vendorOpen && (
          <View style={styles.closedBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.warningText} />
            <Text style={styles.closedBannerText}>
              {vendorOpeningTime
                ? `${vendorName || 'This vendor'} is closed right now — opens at ${vendorOpeningTime}. Checkout is disabled until then.`
                : `${vendorName || 'This vendor'} is currently closed. Checkout is disabled until they reopen.`}
            </Text>
          </View>
        )}

        {/* ── Cart Items ── */}
        {cartItems.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            {item.image ? (
              <Image
                source={{ uri: resolveImageUrl(item.image) }}
                style={styles.itemImage}
              />
            ) : (
              <View style={[styles.itemImage, styles.itemImageFallback]}>
                <Ionicons name="fast-food-outline" size={26} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemVendor}>{vendorName || 'Campus Vendor'}</Text>
              <Text style={styles.itemPrice}>KES {parseFloat(item.price).toFixed(2)}</Text>
            </View>
            <View style={styles.itemRight}>
              <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              </TouchableOpacity>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQtyChange(item.id, item.quantity - 1)}>
                  <Ionicons name="remove" size={14} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnFill]} onPress={() => handleQtyChange(item.id, item.quantity + 1)}>
                  <Ionicons name="add" size={14} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* ── Delivery Address ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <TouchableOpacity style={styles.mapBtn} onPress={() => setShowMapPicker(true)}>
              <Ionicons name="map-outline" size={14} color={COLORS.primary} />
              <Text style={styles.mapBtnText}>{address ? 'Change' : 'Pick on map'}</Text>
            </TouchableOpacity>
          </View>

          {address.trim() ? (
            <TouchableOpacity style={styles.addressDisplay} onPress={() => setShowMapPicker(true)}>
              <Ionicons name="location" size={18} color={COLORS.primary} style={{ flexShrink: 0, marginTop: 2 }} />
              <Text style={styles.addressDisplayText} numberOfLines={4}>{address}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.addressPlaceholder} onPress={() => setShowMapPicker(true)}>
              <Ionicons name="location-outline" size={20} color={COLORS.muted} />
              <Text style={styles.addressPlaceholderText}>Tap to set your delivery location</Text>
            </TouchableOpacity>
          )}

          {address.trim().length > 0 && (
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={12} color={COLORS.success} />
              <Text style={styles.chipText}>Est. delivery: 25–35 min</Text>
            </View>
          )}
        </View>

        {/* ── Delivery Time ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Time</Text>
          <TouchableOpacity style={styles.timeSelector} onPress={() => setShowTimePicker(true)}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            <Text style={styles.timeSelectorText}>{selectedSlotLabel}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* ── Promo Code ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Promo Code</Text>
          {appliedPromo ? (
            <View style={styles.appliedPromo}>
              <View style={styles.appliedPromoLeft}>
                <Ionicons name="pricetag" size={16} color={COLORS.success} />
                <View>
                  <Text style={styles.appliedPromoCode}>{appliedPromo.code}</Text>
                  <Text style={styles.appliedPromoMsg}>{appliedPromo.message}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemovePromo}>
                <Ionicons name="close-circle" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.promoRow}>
                <TextInput
                  style={[styles.promoInput, promoError ? styles.promoInputError : null]}
                  placeholder="Enter promo code"
                  placeholderTextColor={COLORS.muted}
                  value={promoCode}
                  onChangeText={(t) => { setPromoCode(t); setPromoError(''); }}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.applyBtn, (!promoCode.trim() || promoLoading) && styles.applyBtnDisabled]}
                  disabled={!promoCode.trim() || promoLoading}
                  onPress={() => handleApplyPromo()}
                >
                  {promoLoading
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : <Text style={styles.applyBtnText}>Apply</Text>}
                </TouchableOpacity>
              </View>
              {!!promoError && <Text style={styles.promoErrorText}>{promoError}</Text>}
            </>
          )}
        </View>

        {/* ── Payment Method ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((m, idx) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.paymentOption,
                idx < PAYMENT_METHODS.length - 1 && styles.paymentOptionDivider,
                paymentMethod === m.id && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod(m.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentIconWrap, { backgroundColor: m.iconBg }]}>
                <Ionicons name={m.icon} size={22} color={m.iconColor} />
              </View>
              <View style={styles.paymentOptionInfo}>
                <Text style={styles.paymentOptionLabel}>{m.label}</Text>
                <Text style={styles.paymentOptionSub}>{m.subtitle}</Text>
              </View>
              {m.badge ? (
                <View style={styles.paymentBadge}>
                  <Text style={styles.paymentBadgeText}>{m.badge}</Text>
                </View>
              ) : null}
              <View style={[styles.radio, paymentMethod === m.id && styles.radioActive]}>
                {paymentMethod === m.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
          {/* ── M-Pesa detail ── */}
          {paymentMethod === 'mpesa' && (
            <View style={styles.paymentDetail}>
              <Text style={styles.paymentDetailLabel}>M-Pesa Phone Number</Text>
              <View style={styles.paymentDetailInputWrap}>
                <Ionicons name="phone-portrait-outline" size={18} color={COLORS.primary} />
                <TextInput
                  style={styles.paymentDetailInput}
                  value={mpesaPhone}
                  onChangeText={(text) => {
                    let v = text.replace(/[^0-9+]/g, '');
                    if (v.indexOf('+') > 0) v = v.replace(/\+/g, '');
                    if (v.length > 13) v = v.slice(0, 13);
                    setMpesaPhone(v);
                  }}
                  placeholder="+254 7XX XXX XXX"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="phone-pad"
                  maxLength={13}
                  returnKeyType="go"
                  onSubmitEditing={() => { if (vendorOpen && !checkingOut) openConfirm(); }}
                />
              </View>
              <Text style={styles.paymentDetailHint}>STK push will be sent to this number</Text>
            </View>
          )}

          {/* ── Card detail ── */}
          {paymentMethod === 'card' && (
            <View style={styles.paymentDetail}>
              <View style={styles.cardInfoRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
                <Text style={styles.cardInfoText}>
                  You'll enter your card details on a secure Stripe checkout page after you place the order — CampusBite never sees or stores your card number.
                </Text>
              </View>
              <View style={styles.testModeBadge}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.warningText} />
                <Text style={styles.testModeBadgeText}>Test mode — use card 4242 4242 4242 4242, no real charge will be made</Text>
              </View>
            </View>
          )}

          {/* ── Cash note ── */}
          {paymentMethod === 'cash' && (
            <Text style={styles.paymentNote}>Pay the delivery rider in cash when your order arrives.</Text>
          )}
        </View>

        {/* ── You Might Also Like ── */}
        {suggestions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>You Might Also Like</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              {suggestions.map((s) => (
                <View key={s.id} style={styles.suggestionCard}>
                  <Image
                    source={s.image
                      ? { uri: resolveImageUrl(s.image) }
                      : { uri: 'https://via.placeholder.com/70x70/FFF0EB/E85D04?text=Food' }}
                    style={styles.suggestionImg}
                  />
                  <Text style={styles.suggestionName} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.suggestionPrice}>KES {parseFloat(s.price).toFixed(0)}</Text>
                  <TouchableOpacity style={styles.addBtn} onPress={() => addSuggestion(s)}>
                    <Ionicons name="add" size={13} color={COLORS.primary} />
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Order Summary ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</Text>
            <Text style={styles.summaryValue}>KES {totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Delivery Fee{deliveryPreview.distance_km != null ? ` (${deliveryPreview.distance_km.toFixed(1)} km)` : ''}
            </Text>
            <Text style={styles.summaryValue}>KES {deliveryFee}.00</Text>
          </View>
          {deliveryPreview.time_tier !== 'normal' && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: COLORS.primary }]}>{TIME_TIER_LABEL[deliveryPreview.time_tier]} surcharge included</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>KES {SERVICE_FEE}.00</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Promo Discount</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>- KES {discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotalValue}>KES {total.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── Special Instructions ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Special Instructions</Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="Allergies, customisations, or notes for the vendor…"
            placeholderTextColor={COLORS.muted}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Sticky Checkout Button ── */}
      <View style={styles.checkoutWrap}>
        <TouchableOpacity
          style={[styles.checkoutBtn, (!vendorOpen || checkingOut) && styles.checkoutBtnDisabled]}
          onPress={openConfirm}
          disabled={checkingOut || !vendorOpen}
          activeOpacity={0.9}
        >
          {checkingOut ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <View>
                <Text style={styles.checkoutBtnSub}>
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} · KES {total.toFixed(2)}
                </Text>
                <Text style={styles.checkoutBtnText}>
                  {vendorOpen ? 'Proceed to Checkout' : 'Vendor is Closed'}
                </Text>
              </View>
              <View style={styles.checkoutArrow}>
                <Ionicons name={vendorOpen ? 'arrow-forward' : 'time-outline'} size={18} color={COLORS.white} />
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Order Confirmation Modal ── */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.confirmTitle}>Confirm Order</Text>

            {/* Items summary */}
            <View style={styles.confirmSection}>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.confirmRow}>
                  <Text style={styles.confirmItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.confirmItemQty}>×{item.quantity}</Text>
                  <Text style={styles.confirmItemPrice}>KES {(parseFloat(item.price) * item.quantity).toFixed(0)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.confirmDivider} />

            {/* Totals */}
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>
                Delivery fee{deliveryPreview.distance_km != null ? ` (${deliveryPreview.distance_km.toFixed(1)} km)` : ''}
              </Text>
              <Text style={styles.confirmValue}>KES {deliveryFee}.00</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Service fee</Text>
              <Text style={styles.confirmValue}>KES {SERVICE_FEE}.00</Text>
            </View>
            {(appliedPromo?.discount_amount || 0) > 0 && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Promo discount</Text>
                <Text style={[styles.confirmValue, { color: COLORS.success }]}>- KES {appliedPromo.discount_amount.toFixed(0)}</Text>
              </View>
            )}
            <View style={[styles.confirmRow, { marginTop: 4 }]}>
              <Text style={styles.confirmTotal}>Total</Text>
              <Text style={styles.confirmTotalValue}>KES {total.toFixed(0)}</Text>
            </View>

            <View style={styles.confirmDivider} />

            {/* Address & payment */}
            <View style={styles.confirmMeta}>
              <Ionicons name="location-outline" size={14} color={COLORS.gray} />
              <Text style={styles.confirmMetaText} numberOfLines={2}>{address}</Text>
            </View>
            <View style={styles.confirmMeta}>
              <Ionicons
                name={paymentMethod === 'mpesa' ? 'phone-portrait-outline' : paymentMethod === 'cash' ? 'wallet-outline' : 'card-outline'}
                size={14} color={COLORS.gray}
              />
              <Text style={styles.confirmMetaText}>
                {paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'cash' ? 'Cash on delivery' : 'Debit / Credit card'}
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setShowConfirm(false)}>
                <Text style={styles.confirmCancelText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmPlaceBtn} onPress={handleCheckout}>
                <Text style={styles.confirmPlaceText}>Place Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Map Address Picker ── */}
      <MapAddressPicker
        visible={showMapPicker}
        onConfirm={(addr, coords) => { setAddress(addr); setAddressCoords(coords || null); setShowMapPicker(false); }}
        onClose={() => setShowMapPicker(false)}
      />

      {/* ── Delivery Time Picker Modal ── */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTimePicker(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Delivery Time</Text>
            {timeSlots.map((slot, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.slotRow, selectedSlot === slot.value && styles.slotRowActive]}
                onPress={() => {
                  setSelectedSlot(slot.value);
                  setSelectedSlotLabel(slot.label);
                  setShowTimePicker(false);
                }}
              >
                <Ionicons
                  name={slot.value === null ? 'flash-outline' : 'time-outline'}
                  size={18}
                  color={selectedSlot === slot.value ? COLORS.primary : COLORS.gray}
                />
                <Text style={[styles.slotLabel, selectedSlot === slot.value && styles.slotLabelActive]}>
                  {slot.label}
                </Text>
                {selectedSlot === slot.value && (
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: COLORS.background },
  scroll: { padding: 14 },

  emptyIcon:     { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:    { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 28 },
  shopBtn:       { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  shopBtnText:   { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },

  closedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.warningBg, borderWidth: 1.5, borderColor: COLORS.warningBorder,
    borderRadius: 14, padding: 12, marginBottom: 12,
  },
  closedBannerText: { flex: 1, fontSize: 13, color: COLORS.warningText },

  cartItem: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 12, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: COLORS.borderWarm,
  },
  itemImage:       { width: 60, height: 60, borderRadius: 10, backgroundColor: COLORS.primary + '20', flexShrink: 0 },
  itemImageFallback: { alignItems: 'center', justifyContent: 'center' },
  itemInfo:   { flex: 1 },
  itemName:   { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  itemVendor: { fontSize: 11, color: COLORS.gray, marginBottom: 4 },
  itemPrice:  { fontSize: 14, color: COLORS.primary, fontWeight: 'bold' },
  itemRight:  { alignItems: 'flex-end', gap: 8 },
  deleteBtn:  { padding: 4 },
  qtyRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.borderAccent,
  },
  qtyBtnFill: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  qtyText:    { fontSize: 14, fontWeight: 'bold', color: COLORS.text, minWidth: 18, textAlign: 'center' },

  card:         { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderWarm },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.borderAccent,
  },
  mapBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  addressDisplay: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.inputBg, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.borderWarm,
  },
  addressDisplayText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 18 },

  addressPlaceholder: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.inputBg, borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.borderWarm, borderStyle: 'dashed',
  },
  addressPlaceholderText: { fontSize: 14, color: COLORS.muted },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10,
    backgroundColor: COLORS.successBg, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
  },
  chipText: { fontSize: 11, color: COLORS.success, fontWeight: '600' },

  timeSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.borderWarm, borderRadius: 12, padding: 12,
  },
  timeSelectorText: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },

  promoRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  promoInput: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.borderWarm, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text,
  },
  promoInputError:  { borderColor: COLORS.danger },
  promoErrorText:   { color: COLORS.danger, fontSize: 12, marginTop: 6 },
  applyBtn:         { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11 },
  applyBtnDisabled: { backgroundColor: COLORS.muted },
  applyBtnText:     { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  appliedPromo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.successBg, borderRadius: 12, padding: 12, gap: 8,
    borderWidth: 1, borderColor: COLORS.successBorder,
  },
  appliedPromoLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  appliedPromoCode:  { fontSize: 14, fontWeight: 'bold', color: COLORS.success },
  appliedPromoMsg:   { fontSize: 12, color: COLORS.success, marginTop: 1 },

  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14,
  },
  paymentOptionDivider: {
    borderBottomWidth: 1, borderBottomColor: COLORS.borderWarm,
  },
  paymentOptionActive: {
    backgroundColor: COLORS.iconBg, marginHorizontal: -4, paddingHorizontal: 4, borderRadius: 12,
  },
  paymentIconWrap: {
    width: 46, height: 46, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  paymentOptionInfo: { flex: 1 },
  paymentOptionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  paymentOptionSub:   { fontSize: 12, color: COLORS.gray },
  paymentBadge: {
    backgroundColor: '#E8F5E9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  paymentBadgeText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: COLORS.gray,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive:  { borderColor: COLORS.primary },
  radioDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary,
  },
  paymentNote: { fontSize: 12, color: COLORS.gray, marginTop: 4, lineHeight: 16 },

  paymentDetail: {
    marginTop: 4, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: COLORS.borderWarm,
    gap: 8,
  },
  paymentDetailLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray, marginBottom: 2, marginTop: 4 },
  paymentDetailInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.borderWarm, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 11,
    backgroundColor: COLORS.inputBg,
  },
  paymentDetailRow: { flexDirection: 'row', gap: 10 },
  paymentDetailInput: { flex: 1, fontSize: 14, color: COLORS.text },
  paymentDetailHint: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  testModeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.warningBg, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7, marginTop: 4,
    borderWidth: 1, borderColor: COLORS.warningBorder,
  },
  testModeBadgeText: { fontSize: 12, color: COLORS.warningText, fontWeight: '500' },
  cardInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  cardInfoText: { flex: 1, fontSize: 13, color: COLORS.gray, lineHeight: 18 },

  suggestionCard: {
    width: 100, marginRight: 10, alignItems: 'center', borderRadius: 12, padding: 8,
    borderWidth: 1, borderColor: COLORS.borderWarm, backgroundColor: COLORS.inputBg,
  },
  suggestionImg:   { width: 60, height: 60, borderRadius: 10, backgroundColor: COLORS.primary + '20', marginBottom: 6 },
  suggestionName:  { fontSize: 11, fontWeight: '600', color: COLORS.text, textAlign: 'center', marginBottom: 2 },
  suggestionPrice: { fontSize: 11, color: COLORS.primary, fontWeight: '700', marginBottom: 6 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  addBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },

  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel:      { fontSize: 13, color: COLORS.gray },
  summaryValue:      { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  summaryDivider:    { height: 1, backgroundColor: COLORS.borderWarm, marginVertical: 10 },
  summaryTotal:      { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  summaryTotalValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },

  instructionsInput: {
    borderWidth: 1.5, borderColor: COLORS.borderWarm, borderRadius: 12,
    padding: 12, fontSize: 14, color: COLORS.text, minHeight: 80, textAlignVertical: 'top',
  },

  checkoutWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card, padding: 14,
    borderTopWidth: 1, borderTopColor: COLORS.borderWarm,
    shadowColor: COLORS.black, shadowOpacity: 0.08, shadowRadius: 10, elevation: 10,
  },
  checkoutBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 15,
    paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  checkoutBtnDisabled: { backgroundColor: COLORS.gray, shadowOpacity: 0 },
  checkoutBtnSub:      { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginBottom: 2 },
  checkoutBtnText:     { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
  checkoutArrow: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.borderWarm,
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle:     { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  slotRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 6,
    backgroundColor: COLORS.inputBg,
  },
  slotRowActive:   { backgroundColor: COLORS.primary + '20', borderWidth: 1.5, borderColor: COLORS.borderAccent },
  slotLabel:       { flex: 1, fontSize: 14, color: COLORS.text },
  slotLabelActive: { color: COLORS.primary, fontWeight: '600' },

  // Confirmation modal
  confirmSheet: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  confirmTitle:   { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  confirmSection: { marginBottom: 4 },
  confirmRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  confirmItemName:  { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  confirmItemQty:   { fontSize: 13, color: COLORS.gray, marginHorizontal: 8 },
  confirmItemPrice: { fontSize: 14, fontWeight: '600', color: COLORS.text, minWidth: 64, textAlign: 'right' },
  confirmLabel:     { flex: 1, fontSize: 13, color: COLORS.gray },
  confirmValue:     { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  confirmTotal:     { flex: 1, fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  confirmTotalValue:{ fontSize: 17, fontWeight: '800', color: COLORS.primary },
  confirmDivider:   { height: 1, backgroundColor: COLORS.borderWarm, marginVertical: 12 },
  confirmMeta:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  confirmMetaText: { flex: 1, fontSize: 13, color: COLORS.gray },
  confirmBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  confirmCancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.borderWarm, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  confirmCancelText: { fontSize: 14, color: COLORS.gray, fontWeight: '600' },
  confirmPlaceBtn: {
    flex: 2, backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  confirmPlaceText: { fontSize: 15, color: COLORS.white, fontWeight: 'bold' },
});
