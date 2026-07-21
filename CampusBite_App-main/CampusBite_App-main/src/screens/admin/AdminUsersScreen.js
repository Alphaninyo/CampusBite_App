import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, TextInput,
  Alert, Modal, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

const TABS = ['All', 'Consumers', 'Vendors', 'Couriers', 'Suspended'];

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('All');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionMsg, setActionMsg]   = useState(null);
  const [suspending, setSuspending] = useState(null);
  const [consumersCount, setConsumersCount] = useState(0);
  const [couriersCount, setCouriersCount]   = useState(0);
  const [vendorsCount, setVendorsCount]     = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.admin.getUsers({ limit: 100 });
      setUsers(data.users || []);
      
      const consumers = (data.users || []).filter(u => u.role === 'consumer');
      const couriers  = (data.users || []).filter(u => u.role === 'food_courier');
      const vendors   = (data.users || []).filter(u => u.role === 'vendor');
      setConsumersCount(consumers.length);
      setCouriersCount(couriers.length);
      setVendorsCount(vendors.length);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    let filtered = users;
    
    // Filter by tab
    if (activeTab === 'Consumers') {
      filtered = filtered.filter(u => u.role === 'consumer');
    } else if (activeTab === 'Vendors') {
      filtered = filtered.filter(u => u.role === 'vendor');
    } else if (activeTab === 'Couriers') {
      filtered = filtered.filter(u => u.role === 'food_courier');
    } else if (activeTab === 'Suspended') {
      filtered = filtered.filter(u => u.is_suspended);
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(query) || 
        u.phone?.includes(query)
      );
    }
    
    setFilteredUsers(filtered);
  }, [activeTab, searchQuery, users]);

  const getInitials = (name) => {
    if (!name) return 'U';
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

  const doSuspendToggle = async (user) => {
    setSuspending(user.id);
    try {
      const { data } = await api.admin.suspendUser(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_suspended: data.is_suspended } : u));
      if (selectedUser?.id === user.id) setSelectedUser(s => ({ ...s, is_suspended: data.is_suspended }));
      showMsg(data.message);
    } catch (err) {
      showMsg(err.message || 'Action failed. Please try again.', true);
    } finally {
      setSuspending(null);
    }
  };

  const handleSuspend = (user) => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && window.confirm(`Suspend ${user.name}'s account?`);
      if (ok) doSuspendToggle(user);
      return;
    }
    Alert.alert('Suspend Account', `Are you sure you want to suspend ${user.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Suspend', style: 'destructive', onPress: () => doSuspendToggle(user) },
    ]);
  };

  const handleUnsuspend = (user) => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && window.confirm(`Unsuspend ${user.name}'s account?`);
      if (ok) doSuspendToggle(user);
      return;
    }
    Alert.alert('Unsuspend Account', `Are you sure you want to unsuspend ${user.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unsuspend', onPress: () => doSuspendToggle(user) },
    ]);
  };

  const openUserDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="people-outline" size={22} color={COLORS.primary} />
          <View>
            <Text style={styles.headerTitle}>Users</Text>
            <Text style={styles.headerSubtitle}>{consumersCount + vendorsCount + couriersCount} users · {consumersCount} consumers · {vendorsCount} vendors · {couriersCount} couriers</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchUsers(); }}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.subtext} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor={COLORS.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {TABS.map((tab) => {
            const count = tab === 'All'       ? consumersCount + vendorsCount + couriersCount :
                          tab === 'Consumers' ? consumersCount :
                          tab === 'Vendors'   ? vendorsCount :
                          tab === 'Couriers'  ? couriersCount :
                          users.filter(u => u.is_suspended).length;
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

        {/* Action message banner */}
        {actionMsg && (
          <View style={[styles.actionBanner, actionMsg.isError ? styles.actionBannerError : styles.actionBannerSuccess]}>
            <Ionicons name={actionMsg.isError ? 'alert-circle-outline' : 'checkmark-circle-outline'} size={16} color={actionMsg.isError ? COLORS.danger : COLORS.success} />
            <Text style={[styles.actionBannerText, { color: actionMsg.isError ? COLORS.danger : COLORS.success }]}>{actionMsg.text}</Text>
          </View>
        )}

        {/* Consumers Section */}
        {(activeTab === 'All' || activeTab === 'Consumers') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CONSUMERS</Text>
            {filteredUsers.filter(u => u.role === 'consumer').map((user) => (
              <View key={user.id} style={[styles.userCard, user.is_suspended && styles.userCardSuspended]}>
                <TouchableOpacity onPress={() => openUserDetail(user)}>
                  <View style={styles.userHeader}>
                    <View style={[styles.avatar, user.is_suspended && { backgroundColor: COLORS.dangerBg }]}>
                      <Text style={[styles.avatarText, user.is_suspended && { color: COLORS.danger }]}>{getInitials(user.name)}</Text>
                    </View>
                    <View style={styles.userMeta}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userSub}>Consumer{user.is_suspended ? ' - Suspended' : ' - Active'}</Text>
                    </View>
                    <View style={[styles.statusBadge, user.is_suspended && { backgroundColor: COLORS.dangerBg }]}>
                      <Text style={[styles.statusBadgeText, user.is_suspended && { color: COLORS.danger }]}>{user.is_suspended ? 'Suspended' : 'Active'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.suspendBtn, user.is_suspended && styles.unsuspendBtn]}
                  onPress={() => user.is_suspended ? handleUnsuspend(user) : handleSuspend(user)}
                  disabled={suspending === user.id}
                >
                  {suspending === user.id
                    ? <ActivityIndicator size="small" color={user.is_suspended ? COLORS.white : COLORS.danger} />
                    : <Text style={[styles.suspendBtnText, user.is_suspended && styles.unsuspendBtnText]}>{user.is_suspended ? 'Unsuspend' : 'Suspend'}</Text>
                  }
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Vendors Section */}
        {(activeTab === 'All' || activeTab === 'Vendors') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>VENDORS</Text>
            {filteredUsers.filter(u => u.role === 'vendor').map((user) => (
              <View key={user.id} style={[styles.userCard, user.is_suspended && styles.userCardSuspended]}>
                <TouchableOpacity onPress={() => openUserDetail(user)}>
                  <View style={styles.userHeader}>
                    <View style={[styles.avatar, user.is_suspended ? { backgroundColor: COLORS.dangerBg } : {}]}>
                      <Text style={[styles.avatarText, user.is_suspended ? { color: COLORS.danger } : {}]}>{getInitials(user.name)}</Text>
                    </View>
                    <View style={styles.userMeta}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userSub}>Vendor{user.is_suspended ? ' - Suspended' : ' - Active'}</Text>
                    </View>
                    <View style={[styles.statusBadge, user.is_suspended ? { backgroundColor: COLORS.dangerBg } : { backgroundColor: COLORS.successLight }]}>
                      <Text style={[styles.statusBadgeText, { color: user.is_suspended ? COLORS.danger : COLORS.success }]}>{user.is_suspended ? 'Suspended' : 'Active'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.suspendBtn, user.is_suspended && styles.unsuspendBtn]}
                  onPress={() => user.is_suspended ? handleUnsuspend(user) : handleSuspend(user)}
                  disabled={suspending === user.id}
                >
                  {suspending === user.id
                    ? <ActivityIndicator size="small" color={user.is_suspended ? COLORS.white : COLORS.danger} />
                    : <Text style={[styles.suspendBtnText, user.is_suspended && styles.unsuspendBtnText]}>{user.is_suspended ? 'Unsuspend' : 'Suspend'}</Text>
                  }
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Couriers Section */}
        {(activeTab === 'All' || activeTab === 'Couriers') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COURIERS</Text>
            {filteredUsers.filter(u => u.role === 'food_courier').map((user) => (
              <View key={user.id} style={[styles.userCard, user.is_suspended && styles.userCardSuspended]}>
                <TouchableOpacity onPress={() => openUserDetail(user)}>
                  <View style={styles.userHeader}>
                    <View style={[styles.avatar, { backgroundColor: user.is_suspended ? COLORS.dangerBg : '#FFF5EB' }]}>
                      <Text style={[styles.avatarText, { color: user.is_suspended ? COLORS.danger : COLORS.secondary }]}>{getInitials(user.name)}</Text>
                    </View>
                    <View style={styles.userMeta}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userSub}>Courier{user.is_suspended ? ' - Suspended' : ' - Active'}</Text>
                    </View>
                    <View style={[styles.statusBadge, user.is_suspended ? { backgroundColor: COLORS.dangerBg } : { backgroundColor: COLORS.successLight }]}>
                      <Text style={[styles.statusBadgeText, { color: user.is_suspended ? COLORS.danger : COLORS.success }]}>{user.is_suspended ? 'Suspended' : 'Active'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.suspendBtn, user.is_suspended && styles.unsuspendBtn]}
                  onPress={() => user.is_suspended ? handleUnsuspend(user) : handleSuspend(user)}
                  disabled={suspending === user.id}
                >
                  {suspending === user.id
                    ? <ActivityIndicator size="small" color={user.is_suspended ? COLORS.white : COLORS.danger} />
                    : <Text style={[styles.suspendBtnText, user.is_suspended && styles.unsuspendBtnText]}>{user.is_suspended ? 'Unsuspend' : 'Suspend'}</Text>
                  }
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Suspended Section */}
        {activeTab === 'Suspended' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SUSPENDED</Text>
            {filteredUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success} />
                <Text style={styles.emptyText}>No suspended users</Text>
              </View>
            ) : (
              filteredUsers.map((user) => (
                <TouchableOpacity key={user.id} style={styles.userCard} onPress={() => openUserDetail(user)}>
                  <View style={styles.userHeader}>
                    <View style={[styles.avatar, { backgroundColor: COLORS.dangerBg }]}>
                      <Text style={[styles.avatarText, { color: COLORS.danger }]}>{getInitials(user.name)}</Text>
                    </View>
                    <View style={styles.userMeta}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userSub}>{user.role === 'consumer' ? 'Consumer' : 'Courier'} - Suspended</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: COLORS.dangerBg }]}>
                      <Text style={[styles.statusBadgeText, { color: COLORS.danger }]}>Suspended</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.suspendBtn, styles.unsuspendBtn]}
                    onPress={() => handleUnsuspend(user)}
                  >
                    <Text style={[styles.suspendBtnText, styles.unsuspendBtnText]}>Unsuspend</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* User Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>USER DETAIL - {selectedUser?.name?.toUpperCase()}</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Role</Text>
                <Text style={styles.detailValue}>{selectedUser?.role === 'food_courier' ? 'Courier' : selectedUser?.role || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{selectedUser?.email || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{selectedUser?.phone || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Joined</Text>
                <Text style={styles.detailValue}>{selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Orders</Text>
                <Text style={styles.detailValue}>0</Text>
              </View>
              {selectedUser?.role === 'consumer' && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Spent</Text>
                  <Text style={styles.detailValue}>KES 0</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[styles.detailValue, { color: selectedUser?.is_suspended ? COLORS.danger : COLORS.success }]}>
                  {selectedUser?.is_suspended ? 'Suspended' : 'Active'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalSuspendBtn}
              onPress={() => {
                setShowDetailModal(false);
                selectedUser?.is_suspended ? handleUnsuspend(selectedUser) : handleSuspend(selectedUser);
              }}
            >
              <Text style={styles.modalSuspendBtnText}>
                {selectedUser?.is_suspended ? 'Unsuspend account' : 'Suspend account'}
              </Text>
            </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.subtext,
    marginBottom: 12,
    letterSpacing: 0.8,
  },

  // User Card
  userCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  userHeader: {
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
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  userSub: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  statusBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  userCardSuspended: {
    borderColor: COLORS.dangerBorder || '#FCA5A5',
    backgroundColor: '#FFF8F8',
  },
  actionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 8,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1,
  },
  actionBannerSuccess: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  actionBannerError:   { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  actionBannerText:    { flex: 1, fontSize: 13, fontWeight: '600' },
  suspendBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: 'center',
  },
  suspendBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  unsuspendBtn: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  unsuspendBtnText: {
    color: COLORS.white,
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
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
  modalSuspendBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
  },
  modalSuspendBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
