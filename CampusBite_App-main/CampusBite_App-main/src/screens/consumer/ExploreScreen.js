import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

const CATEGORIES = [
  { id: 'All',        name: 'All',        icon: 'grid-outline' },
  { id: 'restaurant', name: 'Restaurants', icon: 'restaurant-outline' },
  { id: 'home_based', name: 'Home-based',  icon: 'home-outline' },
];

function VendorRow({ vendor, onPress }) {
  const vendorType = vendor.vendor_type === 'home_based' ? 'Home-based' : 'Restaurant';
  return (
    <TouchableOpacity style={styles.vendorRow} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: vendor.image || 'https://via.placeholder.com/80x80/E85D04/FFFFFF?text=Food' }}
        style={styles.vendorImage}
      />
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName} numberOfLines={1}>{vendor.business_name}</Text>
        <View style={styles.vendorMetaRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.gray} />
          <Text style={styles.vendorMeta} numberOfLines={1}>{vendor.location || 'Campus'}</Text>
        </View>
        <View style={styles.tagsRow}>
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>{vendorType}</Text>
          </View>
          <View style={[styles.statusTag, vendor.is_open ? styles.openTag : styles.closedTag]}>
            <Text style={[styles.statusTagText, vendor.is_open ? styles.openText : styles.closedText]}>
              {vendor.is_open ? 'Open Now' : 'Closed'}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
    </TouchableOpacity>
  );
}

export default function ExploreScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [allVendors, setAllVendors] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.vendors.getAll();
      setAllVendors(data.vendors || []);
    } catch (err) {
      console.error('[EXPLORE] Error fetching vendors:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredVendors = allVendors.filter((v) => {
    const matchesCategory = selectedCategory === 'All' || v.vendor_type === selectedCategory;
    const matchesSearch = !searchText
      || v.business_name?.toLowerCase().includes(searchText.toLowerCase())
      || v.location?.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openVendor = (vendor) => navigation.navigate('VendorDetail', { vendor });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSub}>Discover vendors around campus</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors or locations..."
          placeholderTextColor={COLORS.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons name={cat.icon} size={16} color={active ? COLORS.white : COLORS.primary} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Vendor list */}
      <FlatList
        data={filteredVendors}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <VendorRow vendor={item} onPress={() => openVendor(item)} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No vendors found</Text>
            <Text style={styles.emptySub}>Try a different search or category</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.gray, marginTop: 2 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },

  chipRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.iconBg,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  chipTextActive: { color: COLORS.white },

  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  vendorImage: { width: 64, height: 64, borderRadius: 10, backgroundColor: COLORS.iconBg },
  vendorInfo: { flex: 1, gap: 4 },
  vendorName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  vendorMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vendorMeta: { fontSize: 12, color: COLORS.gray, flex: 1 },
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  typeTag: { backgroundColor: COLORS.iconBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeTagText: { fontSize: 10, fontWeight: '600', color: COLORS.primary },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  openTag: { backgroundColor: COLORS.successLight },
  closedTag: { backgroundColor: COLORS.dangerBg },
  statusTagText: { fontSize: 10, fontWeight: '600' },
  openText: { color: COLORS.successText },
  closedText: { color: COLORS.danger },

  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.gray },
});
