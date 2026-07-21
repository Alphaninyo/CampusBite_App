import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, Alert, RefreshControl, TextInput, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api';
import { COLORS, resolveImageUrl } from '../../constants';

const CATEGORIES = ['All', 'Main Course', 'Drinks', 'Snacks'];

export default function MenuScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [menu, setMenu]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deleteModal, setDeleteModal] = useState({ visible: false, item: null });

  const fetchMenu = useCallback(async () => {
    try {
      const profileRes = await api.vendors.getProfile();
      const vendorId   = profileRes.data.vendor.id;
      const { data }   = await api.menu.getVendorMenu(vendorId, { all: true });
      setMenu(data.items || data.menu_items || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchMenu(); }, [fetchMenu]));

  const toggleAvailable = async (item) => {
    try {
      await api.menu.update(item.id, { is_available: !item.is_available });
      setMenu((prev) => prev.map((m) => m.id === item.id ? { ...m, is_available: !m.is_available } : m));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const deleteItem = (item) => {
    console.log('[MENU] Delete item called:', item.id, item.name);
    setDeleteModal({ visible: true, item });
  };

  const confirmDelete = async () => {
    const { item } = deleteModal;
    console.log('[MENU] Delete confirmed for item:', item.id);
    try {
      console.log('[MENU] Calling API delete for:', item.id);
      await api.menu.delete(item.id);
      console.log('[MENU] Delete successful, updating menu state');
      setMenu((prev) => prev.filter((m) => m.id !== item.id));
      setDeleteModal({ visible: false, item: null });
    } catch (err) {
      console.error('[MENU] Delete error:', err);
      Alert.alert('Error', err.message);
    }
  };

  // Filter items
  const filteredMenu = menu.filter(item => {
    const matchesSearch = !searchText || item.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="menu-outline" size={24} color={COLORS.black} />
          <Text style={styles.headerTitle}>Menu Management</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('PromoCodes')}>
            <Ionicons name="pricetag-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AddMenuItem')}>
            <Ionicons name="add-outline" size={26} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMenu(); }} colors={[COLORS.primary]} />}
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
                source={item.image ? { uri: resolveImageUrl(item.image) } : { uri: 'https://via.placeholder.com/70x70/FFF0EB/E85D04?text=Food' }}
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
                      color={item.is_available ? COLORS.success : COLORS.gray} 
                    />
                    <Text style={[styles.statusText, { color: item.is_available ? COLORS.success : COLORS.gray }]}>
                      {item.is_available ? 'Available' : 'Inactive'}
                    </Text>
                  </View>
                  <Switch
                    value={item.is_available}
                    onValueChange={() => toggleAvailable(item)}
                    trackColor={{ false: '#ddd', true: COLORS.primary }}
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
            <Ionicons name="restaurant" size={28} color={COLORS.primary} />
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

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text style={styles.modalTitle}>Delete Item</Text>
            </View>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{deleteModal.item?.name}"? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setDeleteModal({ visible: false, item: null })}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalDeleteBtn} 
                onPress={confirmDelete}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },

  scrollView: { flex: 1, paddingHorizontal: 16 },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },

  // Categories
  categoryRow: { marginTop: 14, marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
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
  itemsTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  itemsCount: { fontSize: 13, color: COLORS.gray },

  // Menu Card
  menuCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    alignItems: 'center',
  },
  menuImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '20',
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
  menuName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, flex: 1 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  menuPrice: { fontSize: 14, color: COLORS.primary, fontWeight: 'bold', marginTop: 2 },
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
    backgroundColor: COLORS.iconBg,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  tipIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tipTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  tipText: { fontSize: 12, color: COLORS.gray, textAlign: 'center', lineHeight: 18 },

  // Add Button
  addBtn: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { color: COLORS.gray, marginTop: 12, fontSize: 14 },

  // Delete Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  modalDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});
