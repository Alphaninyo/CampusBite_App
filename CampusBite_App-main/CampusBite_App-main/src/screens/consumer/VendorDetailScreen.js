import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS, API_BASE_URL } from '../../constants';

export default function VendorDetailScreen({ route, navigation }) {
  const { vendor } = route.params;
  const [menu, setMenu]   = useState([]);
  const [cart, setCart]   = useState({}); // { menu_item_id: quantity }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.menu.getVendorMenu(vendor.id)
      .then(({ data }) => setMenu(data.items || data.menu_items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addToCart   = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
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

  const goCheckout = () => {
    if (cartCount === 0) return Alert.alert('Empty Cart', 'Add items before checking out.');
    const items = Object.entries(cart).map(([menu_item_id, quantity]) => {
      const menuItem = menu.find((m) => m.id === menu_item_id);
      return { menu_item_id, quantity, name: menuItem?.name };
    });
    navigation.navigate('Checkout', { vendor, items, subtotal: parseFloat(cartTotal) });
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={menu.filter((i) => i.is_available)}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.vendorName}>{vendor.business_name}</Text>
            {vendor.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                <Text style={styles.location}>{vendor.location}</Text>
              </View>
            )}
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: vendor.is_open ? COLORS.success : COLORS.gray }]} />
              <Text style={[styles.statusLabel, { color: vendor.is_open ? COLORS.success : COLORS.gray }]}>
                {vendor.is_open ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image
              source={item.image
                ? { uri: `${API_BASE_URL}${item.image}` }
                : { uri: 'https://via.placeholder.com/70x70/FFF0EB/E85D04?text=Food' }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
              <Text style={styles.itemPrice}>KES {parseFloat(item.price).toFixed(2)}</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                <Ionicons name="remove-outline" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.qty}>{cart[item.id] || 0}</Text>
              <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addToCart(item.id)}>
                <Ionicons name="add-outline" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}
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
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { marginBottom: 16 },
  vendorName: { fontSize: 22, fontWeight: 'bold', color: COLORS.black },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  location: { color: COLORS.gray, fontSize: 13 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 13, fontWeight: '500' },
  item: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    gap: 12,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: COLORS.iconBg,
    flexShrink: 0,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: COLORS.black },
  itemDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  itemPrice: { fontSize: 14, color: COLORS.primary, fontWeight: 'bold', marginTop: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: { backgroundColor: COLORS.primary },
  qty: { fontSize: 16, fontWeight: 'bold', minWidth: 20, textAlign: 'center', color: COLORS.black },
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
  checkoutText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  checkoutAmount: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  checkoutRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
