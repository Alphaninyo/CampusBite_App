import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, Alert, RefreshControl, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

const CATEGORIES = ['All', 'Main Course', 'Drinks', 'Snacks'];

export default function MenuScreen({ navigation }) {
  const [menu, setMenu]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchMenu = useCallback(async () => {
    try {
      const profileRes = await api.vendors.getProfile();
      const vendorId   = profileRes.data.vendor.id;
      const { data }   = await api.menu.getVendorMenu(vendorId);
      setMenu(data.items || data.menu_items || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const toggleAvailable = async (item) => {
    try {
      await api.menu.update(item.id, { is_available: !item.is_available });
      setMenu((prev) => prev.map((m) => m.id === item.id ? { ...m, is_available: !m.is_available } : m));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const deleteItem = (item) => {
    Alert.alert('Delete Item', `Remove "${item.name}" from menu?`, [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.menu.delete(item.id);
            setMenu((prev) => prev.filter((m) => m.id !== item.id));
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  // Filter items
  const filteredMenu = menu.filter(item => {
    const matchesSearch = !searchText || item.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="menu-outline" size={24} color={COLORS.black} />
          <Text style={styles.headerTitle}>Menu Management</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('AddMenuItem')}>
          <Ionicons name="add-outline" size={26} color="#E85D04" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMenu(); }} colors={['#E85D04']} />}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu items..."
            placeholderTextColor={COLORS.gray}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Items Header */}
        <View style={styles.itemsHeader}>
          <Text style={styles.itemsTitle}>Popular Items</Text>
          <Text style={styles.itemsCount}>{filteredMenu.length} Items</Text>
        </View>

        {/* Menu Items */}
        {filteredMenu.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color={COLORS.gray} />
            <Text style={styles.emptyText}>No menu items yet. Add one!</Text>
          </View>
        ) : (
          filteredMenu.map(item => (
            <View key={item.id} style={styles.menuCard}>
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/70x70/FFF0EB/E85D04?text=Food' }}
                style={styles.menuImage}
              />
              {!item.is_available && (
                <View style={styles.outOfStockBadge}>
                  <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
                </View>
              )}
              <View style={styles.menuInfo}>
                <View style={styles.menuNameRow}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => navigation.navigate('EditMenuItem', { item })} style={styles.actionBtn}>
                      <Ionicons name="pencil-outline" size={18} color={COLORS.gray} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteItem(item)} style={styles.actionBtn}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.menuPrice}>KES {parseFloat(item.price).toFixed(2)}</Text>
                <View style={styles.menuStatusRow}>
                  <View style={styles.statusLeft}>
                    <Ionicons 
                      name="time-outline" 
                      size={14} 
                      color={item.is_available ? '#4CAF50' : COLORS.gray} 
                    />
                    <Text style={[styles.statusText, { color: item.is_available ? '#4CAF50' : COLORS.gray }]}>
                      {item.is_available ? 'Available' : 'Inactive'}
                    </Text>
                  </View>
                  <Switch
                    value={item.is_available}
                    onValueChange={() => toggleAvailable(item)}
                    trackColor={{ false: '#ddd', true: '#E85D04' }}
                    thumbColor={COLORS.white}
                    style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                  />
                </View>
              </View>
            </View>
          ))
        )}

        {/* Tip Card */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="restaurant" size={28} color="#E85D04" />
          </View>
          <Text style={styles.tipTitle}>Expanding your menu?</Text>
          <Text style={styles.tipText}>Add seasonal specials or new daily dishes to attract more students.</Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Add New Item Button */}
      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddMenuItem')}>
        <Ionicons name="add-outline" size={20} color={COLORS.white} />
        <Text style={styles.addBtnText}>Add New Item</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F6' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },

  scrollView: { flex: 1, paddingHorizontal: 16 },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#f0e8e4',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.black },

  // Categories
  categoryRow: { marginTop: 14, marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#f0e8e4',
  },
  categoryChipActive: {
    backgroundColor: '#E85D04',
    borderColor: '#E85D04',
  },
  categoryText: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  categoryTextActive: { color: COLORS.white, fontWeight: '600' },

  // Items header
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  itemsTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  itemsCount: { fontSize: 13, color: COLORS.gray },

  // Menu Card
  menuCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0e8e4',
    alignItems: 'center',
  },
  menuImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#FFF0EB',
    marginRight: 12,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outOfStockText: { color: COLORS.white, fontSize: 8, fontWeight: 'bold' },
  menuInfo: { flex: 1 },
  menuNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuName: { fontSize: 15, fontWeight: 'bold', color: COLORS.black, flex: 1 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  menuPrice: { fontSize: 14, color: '#E85D04', fontWeight: 'bold', marginTop: 2 },
  menuStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 12, fontWeight: '500' },

  // Tip Card
  tipCard: {
    backgroundColor: '#FFF0EB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#E85D04',
    borderStyle: 'dashed',
  },
  tipIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF8F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tipTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.black, marginBottom: 4 },
  tipText: { fontSize: 12, color: COLORS.gray, textAlign: 'center', lineHeight: 18 },

  // Add Button
  addBtn: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#E85D04',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 4,
    shadowColor: '#E85D04',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { color: COLORS.gray, marginTop: 12, fontSize: 14 },
});
