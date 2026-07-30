import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, TextInput,
  Alert, Modal, Image, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { resolveImageUrl } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

const docUrl = resolveImageUrl;

const TABS = ['All', 'Active', 'Pending', 'Suspended'];

export default function AdminVendorsScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
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
  const [docActing, setDocActing] = useState(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [actionMsg, setActionMsg] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchVendors = useCallback(async () => {
    try {
      const { data } = await api.admin.getVendors({ limit: 100 });
      setVendors(data.vendors || []);

      const allVendors = data.vendors || [];
      setActiveCount(allVendors.filter(v => v.approved_at && !v.rejected_at).length);
      setPendingCount(allVendors.filter(v => !v.approved_at && !v.rejected_at).length);
      setSuspendedCount(allVendors.filter(v => v.rejected_at).length);

      api.notifications.getUnreadCount()
        .then(({ data }) => setUnreadCount(data.unread_count || 0))
        .catch(() => {});
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

  const showMsg = (text, isError = false) => {
    setActionMsg({ text, isError });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleApproveDocs = async () => {
    const userId = selectedVendor?.owner?.id;
    if (!userId) return;
    setDocActing('approve');
    try {
      await api.admin.approveUserDocs(userId);
      showMsg(`${selectedVendor.owner.name}'s documents approved.`);
      setSelectedVendor(v => ({ ...v, owner: { ...v.owner, verification_status: 'approved' } }));
      fetchVendors();
    } catch (err) {
      showMsg(err.message || 'Failed to approve.', true);
    } finally {
      setDocActing(null);
    }
  };

  const handleRejectDocs = async () => {
    const userId = selectedVendor?.owner?.id;
    if (!userId) return;
    if (!rejectNote.trim()) {
      showMsg('Please add a note explaining the issue.', true);
      return;
    }
    setDocActing('reject');
    try {
      await api.admin.rejectUserDocs(userId, rejectNote.trim());
      showMsg(`${selectedVendor.owner.name}'s documents rejected. They have been notified.`);
      setSelectedVendor(v => ({ ...v, owner: { ...v.owner, verification_status: 'info_requested' } }));
      setRejectMode(false);
      setRejectNote('');
      fetchVendors();
    } catch (err) {
      showMsg(err.message || 'Failed to reject.', true);
    } finally {
      setDocActing(null);
    }
  };

  const openVendorDetail = (vendor) => {
    setSelectedVendor(vendor);
    setRejectMode(false);
    setRejectNote('');
    setShowDetailModal(true);
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="storefront-outline" size={22} color={COLORS.primary} />
          <View>
            <Text style={styles.headerTitle}>Vendors</Text>
            <Text style={styles.headerSubtitle}>{activeCount} active - {pendingCount} pending</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('AdminNotifications')}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          {unreadCount > 0 && <View style={styles.notificationBadge} />}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
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
        </ScrollView>

        {/* Vendors List */}
        <View style={styles.section}>
          {filteredVendors.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color={COLORS.subtext} />
              <Text style={styles.emptyText}>No vendors found</Text>
            </View>
          ) : (
            filteredVendors.map((vendor) => (
              <TouchableOpacity
                key={vendor.id}
                style={[styles.vendorCard, vendor.owner?.verification_status === 'pending' && styles.vendorCardPending]}
                onPress={() => openVendorDetail(vendor)}
              >
                {vendor.owner?.verification_status === 'pending' && (
                  <View style={styles.docPendingBanner}>
                    <Ionicons name="time-outline" size={13} color={COLORS.warningText} />
                    <Text style={styles.docPendingBannerText}>Documents pending review — tap to approve or reject</Text>
                  </View>
                )}
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

                  {/* Document thumbnails */}
                  <View style={styles.docsDivider} />
                  <View style={styles.docsRow}>
                    <View style={styles.docThumbBox}>
                      <Text style={styles.docThumbLabel}>
                        {vendor.owner?.verification_type === 'passport' ? 'Passport' : 'ID Document'}
                      </Text>
                      {docUrl(vendor.owner?.verification_document) ? (
                        <Image
                          source={{ uri: docUrl(vendor.owner.verification_document) }}
                          style={styles.docThumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.docThumb, styles.docThumbEmpty]}>
                          <Ionicons name="document-outline" size={24} color={COLORS.muted} />
                          <Text style={styles.docThumbEmptyText}>Not uploaded</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.docThumbBox}>
                      <Text style={styles.docThumbLabel}>Passport Sized Photo</Text>
                      {docUrl(vendor.owner?.passport_photo) ? (
                        <Image
                          source={{ uri: docUrl(vendor.owner.passport_photo) }}
                          style={styles.docThumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.docThumb, styles.docThumbEmpty]}>
                          <Ionicons name="person-circle-outline" size={24} color={COLORS.muted} />
                          <Text style={styles.docThumbEmptyText}>Not uploaded</Text>
                        </View>
                      )}
                    </View>
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

              <View style={styles.detailSection}>
                <View style={styles.docSectionHeader}>
                  <Text style={styles.detailSectionTitle}>Verification Documents</Text>
                  {selectedVendor?.owner?.verification_status === 'approved' && (
                    <View style={styles.docStatusBadgeApproved}>
                      <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                      <Text style={styles.docStatusBadgeTextApproved}>Approved</Text>
                    </View>
                  )}
                  {selectedVendor?.owner?.verification_status === 'pending' && (
                    <View style={styles.docStatusBadgePending}>
                      <Ionicons name="time-outline" size={13} color={COLORS.warningText} />
                      <Text style={styles.docStatusBadgeTextPending}>Pending Review</Text>
                    </View>
                  )}
                  {selectedVendor?.owner?.verification_status === 'info_requested' && (
                    <View style={styles.docStatusBadgeRejected}>
                      <Ionicons name="close-circle" size={13} color={COLORS.danger} />
                      <Text style={styles.docStatusBadgeTextRejected}>Info Requested</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalDocsRow}>
                  <View style={styles.modalDocBox}>
                    <Text style={styles.modalDocLabel}>
                      {selectedVendor?.owner?.verification_type === 'passport' ? 'Passport (ID)' : 'ID Document'}
                    </Text>
                    {docUrl(selectedVendor?.owner?.verification_document) ? (
                      <Image source={{ uri: docUrl(selectedVendor.owner.verification_document) }} style={styles.modalDocImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.modalDocImage, styles.modalDocEmpty]}>
                        <Ionicons name="document-outline" size={32} color={COLORS.muted} />
                        <Text style={styles.docThumbEmptyText}>Not uploaded</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.modalDocBox}>
                    <Text style={styles.modalDocLabel}>Passport Sized Photo</Text>
                    {docUrl(selectedVendor?.owner?.passport_photo) ? (
                      <Image source={{ uri: docUrl(selectedVendor.owner.passport_photo) }} style={styles.modalDocImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.modalDocImage, styles.modalDocEmpty]}>
                        <Ionicons name="person-circle-outline" size={32} color={COLORS.muted} />
                        <Text style={styles.docThumbEmptyText}>Not uploaded</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Approve / Reject — only when pending */}
                {selectedVendor?.owner?.verification_status === 'pending' && (
                  <>
                    {rejectMode ? (
                      <View style={styles.rejectPanel}>
                        <Text style={styles.rejectPanelLabel}>REASON (SENT TO VENDOR)</Text>
                        <TextInput
                          style={styles.rejectInput}
                          placeholder="e.g. The ID image is too blurry. Please resubmit a clear photo."
                          placeholderTextColor={COLORS.muted}
                          value={rejectNote}
                          onChangeText={setRejectNote}
                          multiline
                          numberOfLines={3}
                          textAlignVertical="top"
                        />
                        <View style={styles.rejectPanelActions}>
                          <TouchableOpacity style={styles.cancelBtn} onPress={() => { setRejectMode(false); setRejectNote(''); }}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.confirmRejectBtn, docActing && { opacity: 0.6 }]}
                            onPress={handleRejectDocs}
                            disabled={!!docActing}
                          >
                            {docActing === 'reject'
                              ? <ActivityIndicator color={COLORS.white} size="small" />
                              : <Text style={styles.confirmRejectBtnText}>Confirm Reject</Text>}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.docActionRow}>
                        <TouchableOpacity
                          style={[styles.rejectDocBtn, docActing && { opacity: 0.6 }]}
                          onPress={() => setRejectMode(true)}
                          disabled={!!docActing}
                        >
                          <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
                          <Text style={styles.rejectDocBtnText}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.approveDocBtn, docActing && { opacity: 0.6 }]}
                          onPress={handleApproveDocs}
                          disabled={!!docActing}
                        >
                          {docActing === 'approve'
                            ? <ActivityIndicator color={COLORS.white} size="small" />
                            : <><Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} /><Text style={styles.approveDocBtnText}>Approve Documents</Text></>}
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>
            </ScrollView>

            {/* Action message inside modal */}
            {actionMsg && (
              <View style={[styles.actionBanner, actionMsg.isError ? styles.actionBannerError : styles.actionBannerSuccess]}>
                <Ionicons name={actionMsg.isError ? 'alert-circle-outline' : 'checkmark-circle-outline'} size={16} color={actionMsg.isError ? COLORS.danger : COLORS.success} />
                <Text style={[styles.actionBannerText, { color: actionMsg.isError ? COLORS.danger : COLORS.success }]}>{actionMsg.text}</Text>
              </View>
            )}
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

  // Pending doc banner on card
  vendorCardPending: { borderColor: COLORS.warningBorder, borderWidth: 1.5 },
  docPendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.warningBg, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.warningBorder,
  },
  docPendingBannerText: { fontSize: 12, color: COLORS.warningText, fontWeight: '600', flex: 1 },

  // Document thumbnails in card
  docsDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  docsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  docThumbBox: {
    flex: 1,
  },
  docThumbLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.subtext,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  docThumb: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  docThumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    gap: 4,
  },
  docThumbEmptyText: {
    fontSize: 10,
    color: COLORS.muted,
  },

  // Doc status badges in modal header
  docSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  docStatusBadgeApproved: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.successLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  docStatusBadgeTextApproved: { fontSize: 11, fontWeight: '700', color: COLORS.success },
  docStatusBadgePending: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.warningBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.warningBorder },
  docStatusBadgeTextPending: { fontSize: 11, fontWeight: '700', color: COLORS.warningText },
  docStatusBadgeRejected: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.dangerBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  docStatusBadgeTextRejected: { fontSize: 11, fontWeight: '700', color: COLORS.danger },

  // Approve / reject controls in modal
  docActionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  rejectDocBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.danger,
    backgroundColor: COLORS.card,
  },
  rejectDocBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
  approveDocBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: 10, backgroundColor: COLORS.primary,
  },
  approveDocBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  // Reject note panel
  rejectPanel: { backgroundColor: COLORS.dangerBg, borderRadius: 10, padding: 12, marginTop: 14, borderWidth: 1, borderColor: COLORS.dangerBorder },
  rejectPanelLabel: { fontSize: 10, fontWeight: '800', color: COLORS.danger, letterSpacing: 1, marginBottom: 8 },
  rejectInput: {
    backgroundColor: COLORS.card, borderRadius: 8, borderWidth: 1, borderColor: COLORS.dangerBorder,
    padding: 10, fontSize: 13, color: COLORS.text, minHeight: 72, marginBottom: 10,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  rejectPanelActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.card },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.subtext },
  confirmRejectBtn: { flex: 2, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' },
  confirmRejectBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },

  // Action message banner
  actionBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionBannerSuccess: { backgroundColor: COLORS.successBg },
  actionBannerError:   { backgroundColor: COLORS.dangerBg },
  actionBannerText:    { flex: 1, fontSize: 13, fontWeight: '600' },

  // Document images in modal
  modalDocsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalDocBox: {
    flex: 1,
  },
  modalDocLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.subtext,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalDocImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },
  modalDocEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    gap: 6,
  },
});
