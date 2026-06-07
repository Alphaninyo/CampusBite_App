import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, TextInput,
  Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

const TABS = ['All', 'Active', 'Pending', 'Suspended'];

export default function AdminVendorsScreen() {
  const [activeTab, setActiveTab] = useState('All');
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [suspendedCount, setSuspendedCount] = useState(0);

  const fetchVendors = useCallback(async () => {
    try {
      const { data } = await api.admin.getVendors({ limit: 100 });
      setVendors(data.vendors || []);
      
      const allVendors = data.vendors || [];
      setActiveCount(allVendors.filter(v => v.approved_at && !v.rejected_at).length);
      setPendingCount(allVendors.filter(v => !v.approved_at && !v.rejected_at).length);
      setSuspendedCount(allVendors.filter(v => v.rejected_at).length);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  useEffect(() => {
    let filtered = vendors;
    
    // Filter by tab
    if (activeTab === 'Active') {
      filtered = filtered.filter(v => v.approved_at && !v.rejected_at);
    } else if (activeTab === 'Pending') {
      filtered = filtered.filter(v => !v.approved_at && !v.rejected_at);
    } else if (activeTab === 'Suspended') {
      filtered = filtered.filter(v => v.rejected_at);
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.business_name?.toLowerCase().includes(query) ||
        v.owner?.name?.toLowerCase().includes(query) ||
        v.location?.toLowerCase().includes(query)
      );
    }
    
    setFilteredVendors(filtered);
  }, [activeTab, searchQuery, vendors]);

  const getInitials = (name) => {
    if (!name) return 'V';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const openVendorDetail = (vendor) => {
    setSelectedVendor(vendor);
    setShowDetailModal(true);
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="storefront-outline" size={22} color={COLORS.primary} />
          <View>
            <Text style={styles.headerTitle}>Vendors</Text>
            <Text style={styles.headerSubtitle}>{activeCount} active - {pendingCount} pending</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          {pendingCount > 0 && <View style={styles.notificationBadge} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchVendors(); }}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.subtext} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, owner or location..."
            placeholderTextColor={COLORS.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const count = tab === 'All' ? vendors.length :
                          tab === 'Active' ? activeCount :
                          tab === 'Pending' ? pendingCount : suspendedCount;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Vendors List */}
        <View style={styles.section}>
          {filteredVendors.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color={COLORS.subtext} />
              <Text style={styles.emptyText}>No vendors found</Text>
            </View>
          ) : (
            filteredVendors.map((vendor) => (
              <TouchableOpacity key={vendor.id} style={styles.vendorCard} onPress={() => openVendorDetail(vendor)}>
                <View style={styles.vendorHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(vendor.business_name)}</Text>
                  </View>
                  <View style={styles.vendorMeta}>
                    <Text style={styles.vendorName}>{vendor.business_name}</Text>
                    <Text style={styles.vendorSub}>{vendor.vendor_type} · {vendor.location || 'No location'}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: vendor.approved_at ? COLORS.successLight : COLORS.warningBg }
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      { color: vendor.approved_at ? COLORS.success : COLORS.warning }
                    ]}>
                      {vendor.approved_at ? 'Active' : 'Pending'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.vendorDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color={COLORS.subtext} />
                    <Text style={styles.detailText}>{vendor.owner?.name || 'Unknown'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color={COLORS.subtext} />
                    <Text style={styles.detailText}>{vendor.owner?.phone || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="mail-outline" size={16} color={COLORS.subtext} />
                    <Text style={styles.detailText}>{vendor.owner?.email || 'N/A'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Vendor Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>VENDOR DETAIL - {selectedVendor?.business_name?.toUpperCase()}</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Business Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Business Name</Text>
                  <Text style={styles.detailValue}>{selectedVendor?.business_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{selectedVendor?.vendor_type || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{selectedVendor?.location || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: selectedVendor?.approved_at ? COLORS.success : selectedVendor?.rejected_at ? COLORS.danger : COLORS.warning }
                  ]}>
                    {selectedVendor?.approved_at ? 'Active' : selectedVendor?.rejected_at ? 'Suspended' : 'Pending'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Owner</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{selectedVendor?.owner?.name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{selectedVendor?.owner?.email || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{selectedVendor?.owner?.phone || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Dates</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Joined</Text>
                  <Text style={styles.detailValue}>{selectedVendor?.created_at ? new Date(selectedVendor.created_at).toLocaleDateString() : 'N/A'}</Text>
                </View>
                {selectedVendor?.approved_at && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Approved</Text>
                    <Text style={styles.detailValue}>{new Date(selectedVendor.approved_at).toLocaleDateString()}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  notificationBtn: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  tabTextActive: {
    color: COLORS.white,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Vendor Card
  vendorCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  vendorMeta: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  vendorSub: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  vendorDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.subtext,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.subtext,
    marginTop: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.subtext,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
