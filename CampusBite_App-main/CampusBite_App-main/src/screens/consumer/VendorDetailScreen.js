import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { resolveImageUrl } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import useCartStore from '../../stores/cartStore';

export default function VendorDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { vendor } = route.params;
  const [menu, setMenu]       = useState([]);
  const [cart, setCart]       = useState({});
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [promoCodes, setPromoCodes] = useState([]);
  // vendor from route.params is a snapshot from whenever the list was last
  // fetched (Home/Explore) — refresh is_open/hours live so a shop that
  // closed (or reopened) since then isn't shown stale here.
  const [liveStatus, setLiveStatus] = useState({
    is_open: vendor.is_open,
    opening_time: vendor.opening_time,
    closing_time: vendor.closing_time,
  });
  const menuLoaded = useRef(false);

  // Restore persisted cart for this vendor on mount
  useEffect(() => {
    api.vendors.getById(vendor.id)
      .then(({ data }) => setLiveStatus({
        is_open: data.vendor?.is_open ?? vendor.is_open,
        opening_time: data.vendor?.opening_time ?? vendor.opening_time,
        closing_time: data.vendor?.closing_time ?? vendor.closing_time,
      }))
      .catch(() => {});

    api.menu.getVendorMenu(vendor.id, { all: true }) // include out-of-stock items so they can show as such, not just vanish
      .then(({ data }) => {
        const items = data.items || data.menu_items || [];
        setMenu(items);
        // Restore cart from store only if it belongs to this vendor
        const stored = useCartStore.getState().cartItems;
        if (stored.length > 0 && stored[0]?.vendor_id === vendor.id) {
          const map = {};
          stored.forEach((i) => { map[i.id] = i.quantity; });
          setCart(map);
        }
        menuLoaded.current = true;
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    api.favorites.getIds()
      .then(({ data }) => setFavoriteIds(new Set(data.menu_item_ids || [])))
      .catch(() => {});

    api.promoCodes.getForVendor(vendor.id)
      .then(({ data }) => setPromoCodes(data.promo_codes || []))
      .catch(() => {});
  }, []);

  // Jump to Cart with this code pre-applied instead of making the consumer
  // memorize and retype it.
  const applyPromoAtCheckout = (code) => {
    navigation.navigate('CartTab', { screen: 'CartMain', params: { applyPromoCode: code } });
  };

  const toggleFavorite = (itemId) => {
    const wasFavorited = favoriteIds.has(itemId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(itemId); else next.add(itemId);
      return next;
    });
    api.favorites.toggle(itemId).catch(() => {
      // Revert on failure
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.add(itemId); else next.delete(itemId);
        return next;
      });
    });
  };

  // Persist cart to store whenever it changes (after menu is loaded)
  useEffect(() => {
    if (!menuLoaded.current || menu.length === 0) return;
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, quantity]) => {
        const m = menu.find((x) => x.id === id);
        return { id, quantity, price: parseFloat(m?.price || 0), vendor_id: vendor.id, name: m?.name || '', image: m?.image || null };
      });
    useCartStore.getState().saveCart(items, vendor.id, vendor.business_name);
  }, [cart]);

  const addToCart = (id) => {
    if (!liveStatus.is_open) return; // Shop is closed — nothing can be added until it reopens
    const item = menu.find((m) => m.id === id);
    if (item && !item.is_available) return; // Out of stock — vendor disabled it since the menu was loaded
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  };
  const removeFromCart = (id) => setCart((c) => {
    const updated = { ...c };
    if (updated[id] > 1) updated[id]--;
    else delete updated[id];
    return updated;
  });

  const cartCount = Object.values(cart).reduce((s, v) => s + v, 0);
  const cartTotal = menu
    .filter((i) => cart[i.id])
    .reduce((s, i) => s + parseFloat(i.price) * cart[i.id], 0)
    .toFixed(2);

  // Cart items are already synced to the shared cart store above (every time
  // `cart` changes), so jumping to the Cart tab gives the exact same checkout
  // flow — address picker, payment method choice, promo codes — as adding
  // items from Home, instead of a separate, limited checkout screen.
  const goCheckout = () => {
    if (cartCount === 0) return;
    navigation.navigate('CartTab', { screen: 'CartMain' });
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={menu}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Cover image */}
            {vendor.image ? (
              <Image
                source={{ uri: resolveImageUrl(vendor.image) }}
                style={styles.coverImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.coverImage, styles.coverPlaceholder]}>
                <Ionicons name="storefront-outline" size={36} color={COLORS.primary} />
              </View>
            )}

            <View style={styles.headerBody}>
              <Text style={styles.vendorName}>{vendor.business_name}</Text>

              {vendor.description ? (
                <Text style={styles.description}>{vendor.description}</Text>
              ) : null}

              {vendor.location ? (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.infoText}>{vendor.location}</Text>
                </View>
              ) : null}

              <View style={styles.pillsRow}>
                {/* Open / Closed status */}
                <View style={[styles.pill, { backgroundColor: liveStatus.is_open ? COLORS.successBg : COLORS.dangerBg }]}>
                  <View style={[styles.statusDot, { backgroundColor: liveStatus.is_open ? COLORS.success : COLORS.danger }]} />
                  <Text style={[styles.pillText, { color: liveStatus.is_open ? COLORS.success : COLORS.danger }]}>
                    {liveStatus.is_open ? 'Open Now' : 'Closed'}
                  </Text>
                </View>

                {/* Business hours */}
                {liveStatus.opening_time && liveStatus.closing_time ? (
                  <View style={styles.pill}>
                    <Ionicons name="time-outline" size={13} color={COLORS.subtext} />
                    <Text style={styles.pillText}>{liveStatus.opening_time} – {liveStatus.closing_time}</Text>
                  </View>
                ) : null}

                {/* Prep time */}
                {vendor.prep_time ? (
                  <View style={styles.pill}>
                    <Ionicons name="timer-outline" size={13} color={COLORS.subtext} />
                    <Text style={styles.pillText}>{vendor.prep_time}</Text>
                  </View>
                ) : null}
              </View>

              {!liveStatus.is_open && (
                <View style={styles.closedBanner}>
                  <Ionicons name="time-outline" size={16} color={COLORS.danger} />
                  <Text style={styles.closedBannerText}>
                    {liveStatus.opening_time
                      ? `Closed right now — opens at ${liveStatus.opening_time}. Ordering is disabled until then.`
                      : 'Closed right now. Ordering is disabled until the vendor reopens.'}
                  </Text>
                </View>
              )}

              {promoCodes.length > 0 && (
                <View style={styles.promoBannerList}>
                  {promoCodes.map((promo) => (
                    <TouchableOpacity
                      key={promo.code}
                      style={styles.promoBanner}
                      activeOpacity={0.8}
                      onPress={() => applyPromoAtCheckout(promo.code)}
                    >
                      <Ionicons name="pricetag" size={18} color={COLORS.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.promoBannerCode}>{promo.code}</Text>
                        <Text style={styles.promoBannerText}>
                          {promo.discount_type === 'percent'
                            ? `${parseFloat(promo.discount_value)}% off`
                            : `KES ${parseFloat(promo.discount_value).toFixed(0)} off`}
                          {parseFloat(promo.min_order_amount) > 0
                            ? ` orders over KES ${parseFloat(promo.min_order_amount).toFixed(0)}`
                            : ' your order'}
                        </Text>
                      </View>
                      <Text style={styles.promoBannerCta}>Use at checkout</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.menuDivider}>
              <Text style={styles.menuTitle}>Menu</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const outOfStock = !item.is_available;
          const shopClosed = !liveStatus.is_open;
          const disabledForOrder = outOfStock || shopClosed;
          return (
          <View style={[styles.item, disabledForOrder && styles.itemOutOfStock]}>
            <View>
              {item.image
                ? <Image source={{ uri: resolveImageUrl(item.image) }} style={[styles.itemImage, outOfStock && styles.itemImageOutOfStock]} resizeMode="cover" />
                : <View style={[styles.itemImage, styles.itemImagePlaceholder, outOfStock && styles.itemImageOutOfStock]}>
                    <Ionicons name="fast-food-outline" size={24} color={COLORS.primary} />
                  </View>
              }
              {outOfStock && (
                <View style={styles.outOfStockBadge}>
                  <Text style={styles.outOfStockBadgeText}>OUT OF STOCK</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.favoriteBtn}
                onPress={() => toggleFavorite(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={favoriteIds.has(item.id) ? 'heart' : 'heart-outline'}
                  size={16}
                  color={favoriteIds.has(item.id) ? COLORS.danger : COLORS.white}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, disabledForOrder && styles.itemNameOutOfStock]}>{item.name}</Text>
              {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
              <Text style={[styles.itemPrice, disabledForOrder && styles.itemNameOutOfStock]}>KES {parseFloat(item.price).toFixed(2)}</Text>
            </View>
            {disabledForOrder ? (
              cart[item.id] > 0 ? (
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                    <Ionicons name="remove-outline" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qty}>{cart[item.id]}</Text>
                </View>
              ) : null
            ) : (
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                  <Ionicons name="remove-outline" size={16} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.qty}>{cart[item.id] || 0}</Text>
                <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addToCart(item.id)}>
                  <Ionicons name="add-outline" size={16} color={COLORS.card} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="restaurant-outline" size={48} color={COLORS.gray} />
            <Text style={styles.empty}>No menu items available.</Text>
          </View>
        }
        contentContainerStyle={{ padding: 16 }}
      />

      {cartCount > 0 && (
        <TouchableOpacity style={styles.checkoutBar} onPress={goCheckout}>
          <View>
            <Text style={styles.checkoutText}>{cartCount} items</Text>
            <Text style={styles.checkoutAmount}>KES {cartTotal}</Text>
          </View>
          <View style={styles.checkoutRight}>
            <Text style={styles.checkoutText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.card} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { marginBottom: 8 },
  coverImage: {
    width: '100%', height: 180,
    borderRadius: 14, marginBottom: 12,
    backgroundColor: COLORS.inputBg,
  },
  coverPlaceholder: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary + '12',
  },
  headerBody: { paddingHorizontal: 2, marginBottom: 12 },
  vendorName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  description: { fontSize: 13, color: COLORS.subtext, lineHeight: 18, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  infoText: { fontSize: 13, color: COLORS.gray },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.inputBg, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.border,
  },
  pillText: { fontSize: 12, color: COLORS.subtext, fontWeight: '500' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },

  promoBannerList: { marginTop: 12, gap: 8 },
  closedBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.dangerBg, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 12,
    borderWidth: 1, borderColor: COLORS.danger + '30',
  },
  closedBannerText: { flex: 1, fontSize: 12, color: COLORS.danger, fontWeight: '600', lineHeight: 17 },
  promoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.iconBg, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  promoBannerCode: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 0.5 },
  promoBannerText: { fontSize: 12, color: COLORS.subtext, marginTop: 1 },
  promoBannerCta: { fontSize: 11, fontWeight: '600', color: COLORS.primary },

  menuDivider: { borderTopWidth: 1, borderColor: COLORS.border, paddingTop: 14, marginTop: 4 },
  menuTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  item: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    gap: 12,
  },
  itemOutOfStock: { opacity: 0.6 },
  itemImage: {
    width: 64, height: 64,
    borderRadius: 10, flexShrink: 0,
  },
  itemImageOutOfStock: { opacity: 0.5 },
  itemImagePlaceholder: {
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  outOfStockBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingVertical: 3, borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    alignItems: 'center',
  },
  outOfStockBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  favoriteBtn: {
    position: 'absolute', top: -4, right: -4,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  itemNameOutOfStock: { color: COLORS.gray },
  itemDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  itemPrice: { fontSize: 14, color: COLORS.primary, fontWeight: 'bold', marginTop: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: { backgroundColor: COLORS.primary },
  qty: { fontSize: 16, fontWeight: 'bold', minWidth: 20, textAlign: 'center', color: COLORS.text },
  empty: { textAlign: 'center', color: COLORS.gray, marginTop: 12, fontSize: 14 },
  checkoutBar: {
    backgroundColor: COLORS.primary,
    padding: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  checkoutText: { color: COLORS.card, fontWeight: 'bold', fontSize: 14 },
  checkoutAmount: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  checkoutRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
