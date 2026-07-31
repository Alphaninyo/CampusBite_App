import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput, ScrollView, Image, Modal, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { resolveImageUrl } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import useCartStore from '../../stores/cartStore';

function VendorImagePlaceholder({ name, styles }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const hue = name ? name.charCodeAt(0) % 360 : 0;
  return (
    <View style={[styles.featuredImage, { backgroundColor: `hsl(${hue},55%,60%)`, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontSize: 32, fontWeight: '700', color: '#fff' }}>{initials}</Text>
    </View>
  );
}

function FeaturedVendorCard({ vendor, onPress, styles, COLORS }) {
  const vendorType = vendor.vendor_type === 'home_based' ? 'Home-based' : 'Restaurant';
  const imageUri = resolveImageUrl(vendor.image);
  return (
    <TouchableOpacity style={styles.featuredCard} onPress={onPress}>
      <View style={styles.imageContainer}>
        {imageUri
          ? <Image source={{ uri: imageUri }} style={styles.featuredImage} />
          : <VendorImagePlaceholder name={vendor.business_name} styles={styles} />}
        <View style={styles.ratingOverlay}>
          <Text style={styles.ratingText}>{vendorType}</Text>
        </View>
      </View>
      <Text style={styles.vendorName}>{vendor.business_name}</Text>
      <Text style={styles.deliveryTime}>{vendor.location || 'Campus'}</Text>
      <Text style={[styles.freeDelivery, { color: vendor.is_open ? COLORS.success : COLORS.danger }]}>
        {vendor.is_open ? 'Open Now' : 'Closed'}
      </Text>
    </TouchableOpacity>
  );
}

function MenuImagePlaceholder({ name, styles }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const hue = name ? (name.charCodeAt(0) * 7) % 360 : 30;
  return (
    <View style={[styles.trendingImage, { backgroundColor: `hsl(${hue},55%,65%)`, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>{initials}</Text>
    </View>
  );
}

function TrendingItemCard({ item, onPress, styles, COLORS }) {
  const imageUri = resolveImageUrl(item.image);
  return (
    <TouchableOpacity style={styles.trendingCard} onPress={onPress}>
      {imageUri
        ? <Image source={{ uri: imageUri }} style={styles.trendingImage} />
        : <MenuImagePlaceholder name={item.name} styles={styles} />}
      <Text style={styles.itemVendor}>{item.vendor_name}</Text>
      <Text style={styles.itemName}>{item.name}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.itemPrice}>KES {item.price}</Text>
        <TouchableOpacity style={styles.addButton} onPress={onPress}>
          <Ionicons name="add" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const NOTIF_TYPE_ICON = {
  order_status: 'receipt-outline',
  payment:      'card-outline',
  delivery:     'bicycle-outline',
  feedback:     'star-outline',
};

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const [vendors, setVendors]     = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showNotifications, setShowNotifications] = useState(false);
  const { addToCart, itemCount } = useCartStore();

  const [allVendors, setAllVendors] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const categories = [
    { id: 'All', name: 'All', icon: 'grid-outline' },
    { id: 'restaurant', name: 'Restaurants', icon: 'restaurant-outline' },
    { id: 'home_based', name: 'Home-based', icon: 'home-outline' },
  ];

  // Filter vendors by category and search
  const getFilteredVendors = useCallback(() => {
    let filtered = allVendors;
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(v => v.vendor_type === selectedCategory);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(v =>
        v.business_name.toLowerCase().includes(q) ||
        (v.location || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [allVendors, selectedCategory, searchText]);

  // Filter menu items by vendor category and search
  const getFilteredItems = useCallback(() => {
    let filtered = allMenuItems;
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item._vendor_type === selectedCategory);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.vendor_name || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [allMenuItems, selectedCategory, searchText]);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.notifications.getAll();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
    }
  }, []);

  const markNotificationRead = async (id) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  // Fetch real data from the API
  const fetchData = useCallback(async () => {
    try {
      // Fetch all approved vendors from the API
      const { data: vendorData } = await api.vendors.getAll();
      const vendorList = vendorData.vendors || [];
      setAllVendors(vendorList);

      // Fetch menu items for each vendor and flatten into trending items
      const menuPromises = vendorList.map(async (vendor) => {
        try {
          const { data: menuData } = await api.menu.getVendorMenu(vendor.id);
          const items = menuData.items || menuData.menu_items || [];
          return items
            .filter(item => item.is_available)
            .map(item => ({
              id: item.id,
              vendor_name: vendor.business_name,
              vendor_id: vendor.id,
              name: item.name,
              price: parseFloat(item.price).toFixed(2),
              image: resolveImageUrl(item.image),
              _vendor_type: vendor.vendor_type,
            }));
        } catch {
          return [];
        }
      });

      const allItems = (await Promise.all(menuPromises)).flat();
      setAllMenuItems(allItems);
    } catch (err) {
      console.error('Error fetching data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Update filtered data when filters change
  useEffect(() => {
    setVendors(getFilteredVendors());
    setTrendingItems(getFilteredItems());
  }, [selectedCategory, searchText, getFilteredVendors, getFilteredItems]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Avatar and Notifications */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('ProfileTab')}>
            <Ionicons name="person-outline" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          <Text style={styles.logo}>CampusBite</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => setShowNotifications(true)}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          {notifications.filter(n => !n.is_read).length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notifications.filter(n => !n.is_read).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.subtext} style={styles.searchIconLeft} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search for food or restaurants"
            placeholderTextColor={COLORS.subtext}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <Ionicons name="close-circle-outline" size={20} color={COLORS.subtext} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryBtn, selectedCategory === category.id && styles.categoryBtnActive]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons 
                name={category.icon} 
                size={16} 
                color={selectedCategory === category.id ? COLORS.white : COLORS.primary}
                style={styles.categoryIcon}
              />
              <Text style={[styles.categoryText, selectedCategory === category.id && styles.categoryTextActive]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Vendors Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Vendors at Baraton</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredContainer}>
            {vendors.length === 0 ? (
              <View style={{ paddingHorizontal: 16, paddingVertical: 20, alignItems: 'center', width: '100%' }}>
                <Ionicons name="storefront-outline" size={40} color={COLORS.gray} />
                <Text style={{ color: COLORS.gray, marginTop: 8 }}>No vendors available yet</Text>
              </View>
            ) : (
              vendors.map((vendor) => (
                <FeaturedVendorCard
                  key={vendor.id}
                  vendor={vendor}
                  styles={styles}
                  COLORS={COLORS}
                  onPress={() => navigation.navigate('VendorDetail', { vendor })}
                />
              ))
            )}
          </ScrollView>
        </View>

        {/* Trending Now Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <TouchableOpacity style={styles.hottestPicks}>
              <Ionicons name="flame-outline" size={16} color={COLORS.primary} style={styles.hottestIcon} />
              <Text style={styles.hottestText}>Hottest Picks</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.trendingGrid}>
            {trendingItems.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20, width: '100%' }}>
                <Ionicons name="fast-food-outline" size={40} color={COLORS.gray} />
                <Text style={{ color: COLORS.gray, marginTop: 8 }}>No menu items available yet</Text>
              </View>
            ) : (
              trendingItems.map((item) => (
                <TrendingItemCard
                  key={item.id}
                  item={item}
                  styles={styles}
                  COLORS={COLORS}
                  onPress={() => addToCart(item)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CartTab')}>
        <Ionicons name="cart-outline" size={28} color={COLORS.white} />
        {itemCount > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{itemCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} animationType="slide" transparent onRequestClose={() => setShowNotifications(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.notificationModal, { maxHeight: screenHeight * 0.75 }]}>
            <View style={styles.notificationModalHeader}>
              <Text style={styles.notificationModalTitle}>Notifications</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <TouchableOpacity onPress={markAllNotificationsRead}>
                    <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '600' }}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <Ionicons name="close-outline" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={[styles.notificationList, { maxHeight: screenHeight * 0.6 }]} showsVerticalScrollIndicator={true}>
              {notifications.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="notifications-off-outline" size={48} color={COLORS.gray} />
                  <Text style={{ color: COLORS.gray, marginTop: 12, fontSize: 14 }}>No notifications yet</Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={styles.notificationItem}
                    onPress={() => {
                      if (!notification.is_read) markNotificationRead(notification.id);
                      if (notification.data?.order_id) {
                        setShowNotifications(false);
                        navigation.navigate('OrdersTab', { screen: 'OrderDetail', params: { orderId: notification.data.order_id } });
                      }
                    }}
                  >
                    <View style={styles.notificationIconBox}>
                      <Ionicons
                        name={NOTIF_TYPE_ICON[notification.type] || 'information-circle-outline'}
                        size={20}
                        color="#fff"
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationMessage}>{notification.body}</Text>
                      <Text style={styles.notificationTime}>
                        {new Date(notification.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    {!notification.is_read && (
                      <View style={styles.notificationDot} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.iconBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  notificationBtn: {
    padding: 6,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationIcon: {
    fontSize: 20,
  },
  
  // Search
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    paddingHorizontal: 14,
  },
  searchIconLeft: {
    marginRight: 12,
  },
  searchBar: {
    flex: 1,
    backgroundColor: 'transparent',
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    marginLeft: 12,
  },
  
  // Categories
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  categoryBtn: {
    backgroundColor: COLORS.iconBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    color: COLORS.primary,
    fontWeight: '500',
    fontSize: 14,
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewAllText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  hottestPicks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hottestIcon: {
    marginRight: 4,
  },
  hottestText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  
  // Featured Vendors
  featuredContainer: {
    paddingHorizontal: 16,
  },
  featuredCard: {
    width: 200,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  imageContainer: {
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  ratingOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ratingText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  deliveryTime: {
    fontSize: 14,
    color: COLORS.gray,
    paddingHorizontal: 12,
  },
  freeDelivery: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  
  // Trending Items
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  trendingCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  trendingImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  itemVendor: {
    fontSize: 14,
    color: COLORS.gray,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Notification Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  notificationModal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  notificationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderWarm,
  },
  notificationModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  notificationList: {
    // No flex:1 here on purpose — inside a maxHeight-bounded (not fixed-height)
    // parent, flex:1 resolves to a 0 basis on Android and the ScrollView
    // collapses to nothing even with an explicit maxHeight applied alongside it.
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderWarm,
  },
  notificationIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 12,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: COLORS.white,
  },
  cartBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
