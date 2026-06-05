import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS, STATUS_COLORS } from '../../constants';

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders]     = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const statusFilters = ['All', 'Received', 'Preparing', 'Ready', 'Collected', 'In Transit', 'Delivered'];

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.orders.getMyOrders();
      const ordersData = (data.orders || []).map(order => ({
        ...order,
        items: (order.items || []).map(item => ({
          name: item.menuItem?.name || item.name || 'Item',
          quantity: item.quantity,
          price: item.unit_price || item.price,
        })),
      }));
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (err) {
      console.error('Error fetching orders:', err.message);
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    let filtered = orders;
    
    // Apply status filter
    if (selectedFilter !== 'All') {
      filtered = filtered.filter(order => order.status === selectedFilter);
    }
    
    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(order => 
        order.vendor?.business_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        order.items?.some(item => item.name.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    
    setFilteredOrders(filtered);
  }, [orders, selectedFilter, searchText]);

  const getOrderStatusIcon = (status) => {
    switch (status) {
      case 'Received': return 'time-outline';
      case 'Preparing': return 'restaurant-outline';
      case 'Ready': return 'checkmark-circle-outline';
      case 'Collected': return 'bicycle-outline';
      case 'In Transit': return 'car-outline';
      case 'Delivered': return 'checkmark-done-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const formatOrderTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const OrderCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
      {/* Compact Order Header */}
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Order #{item.id}</Text>
          <Text style={styles.orderDate}>{formatOrderTime(item.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || COLORS.gray }]}>
          <Ionicons name={getOrderStatusIcon(item.status)} size={12} color={COLORS.white} />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {/* Vendor and Items Row */}
      <View style={styles.contentRow}>
        <View style={styles.vendorColumn}>
          <Text style={styles.vendorName}>{item.vendor?.business_name}</Text>
          <View style={styles.itemsSummary}>
            {item.items?.slice(0, 2).map((item, index) => (
              <Text key={index} style={styles.itemText}>
                {item.quantity}x {item.name}
              </Text>
            ))}
            {item.items?.length > 2 && (
              <Text style={styles.moreItemsText}>+{item.items.length - 2} more</Text>
            )}
          </View>
        </View>
        
        <View style={styles.detailsColumn}>
          <View style={styles.deliveryInfo}>
            <Ionicons name="location-outline" size={12} color={COLORS.gray} />
            <Text style={styles.deliveryText} numberOfLines={1}>
              {item.delivery_address}
            </Text>
          </View>
          <Text style={styles.totalAmount}>KES {parseFloat(item.total_amount).toFixed(2)}</Text>
        </View>
      </View>

      {/* Action Footer */}
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.trackBtn}>
          <Ionicons name="locate-outline" size={14} color={COLORS.white} />
          <Text style={styles.trackBtnText}>Track Order</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders by vendor or item..."
            placeholderTextColor={COLORS.gray}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle-outline" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterBtn, selectedFilter === filter && styles.filterBtnActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        
        {/* Orders List */}
        <View style={styles.ordersListContainer}>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((item) => (
              <OrderCard key={item.id} item={item} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color={COLORS.gray} />
              <Text style={styles.emptyTitle}>
                {searchText || selectedFilter !== 'All' ? 'No matching orders' : 'No orders yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchText || selectedFilter !== 'All' 
                  ? 'Try adjusting your search or filters' 
                  : 'Start ordering from your favorite vendors!'
                }
              </Text>
              {!searchText && selectedFilter === 'All' && (
                <TouchableOpacity 
                  style={styles.shopBtn}
                  onPress={() => navigation.navigate('HomeTab')}
                >
                  <Text style={styles.shopBtnText}>Browse Vendors</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Refresh Control */}
      <RefreshControl 
        refreshing={refreshing} 
        onRefresh={() => { setRefreshing(true); fetchOrders(); }} 
        colors={[COLORS.primary]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  
  // Filters
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  
  // Orders List
  ordersListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  
  // Order Card - Compact Design
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderWarm,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  
  // Content Row - Vendor and Details
  contentRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  vendorColumn: {
    flex: 1,
    marginRight: 16,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 6,
  },
  itemsSummary: {
    flex: 1,
  },
  itemText: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 2,
  },
  moreItemsText: {
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  
  detailsColumn: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deliveryText: {
    fontSize: 11,
    color: COLORS.gray,
    marginLeft: 4,
    maxWidth: 100,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  // Card Footer
  cardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
    alignItems: 'flex-end',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  trackBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  shopBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  shopBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
