import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { api } from '../../api';
import { COLORS } from '../../constants';

export default function AdminVendorsScreen() {
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing]     = useState(null);

  const fetchVendors = useCallback(async () => {
    try {
      const { data } = await api.admin.getVendors();
      setVendors(data.vendors);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const approve = async (vendorId) => {
    setActing(vendorId);
    try {
      await api.admin.approveVendor(vendorId);
      fetchVendors();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActing(null);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;

  return (
    <FlatList
      data={vendors}
      keyExtractor={(v) => v.id}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVendors(); }} colors={[COLORS.primary]} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>{item.business_name}</Text>
            <View style={[styles.badge, { backgroundColor: item.is_approved ? COLORS.success : COLORS.warning }]}>
              <Text style={styles.badgeText}>{item.is_approved ? 'Approved' : 'Pending'}</Text>
            </View>
          </View>
          <Text style={styles.sub}>{item.vendor_type} · {item.location || 'No location'}</Text>
          <Text style={styles.sub}>Owner: {item.owner?.name} ({item.owner?.email})</Text>
          {!item.is_approved && (
            <TouchableOpacity
              style={[styles.approveBtn, acting === item.id && { opacity: 0.6 }]}
              onPress={() => approve(item.id)}
              disabled={acting === item.id}
            >
              {acting === item.id
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.approveBtnText}>Approve Vendor</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No vendors found.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  card:          { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  row:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name:          { fontSize: 15, fontWeight: 'bold', color: COLORS.black, flex: 1 },
  badge:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText:     { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  sub:           { color: COLORS.gray, fontSize: 13, marginBottom: 4 },
  approveBtn:    { marginTop: 10, backgroundColor: COLORS.primary, borderRadius: 8, padding: 10, alignItems: 'center' },
  approveBtnText:{ color: COLORS.white, fontWeight: 'bold' },
  empty:         { textAlign: 'center', color: COLORS.gray, marginTop: 60, fontSize: 15 },
});
