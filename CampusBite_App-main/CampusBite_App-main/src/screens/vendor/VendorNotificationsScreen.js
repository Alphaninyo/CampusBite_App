import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';

const TYPE_ICON = {
  order_status: 'receipt-outline',
  payment:      'card-outline',
  delivery:     'bicycle-outline',
  feedback:     'star-outline',
  new_order:    'bag-add-outline',
};

const makeTypeColor = (COLORS) => ({
  order_status: '#2563EB',
  payment:      '#7C3AED',
  delivery:     COLORS.primary,
  feedback:     '#FFB300',
  new_order:    COLORS.primary,
});

export default function VendorNotificationsScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const TYPE_COLOR = useMemo(() => makeTypeColor(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.notifications.getAll();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 90 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySub}>You're all caught up!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.is_read && styles.unreadCard]}
            onPress={() => {
              if (!item.is_read) markAsRead(item.id);
              if (item.data?.order_id) {
                navigation.navigate('OrdersTab', { screen: 'VendorOrderDetail', params: { orderId: item.data.order_id } });
              }
            }}
            activeOpacity={0.75}
          >
            <View style={[styles.iconBox, { backgroundColor: TYPE_COLOR[item.type] || COLORS.gray }]}>
              <Ionicons name={TYPE_ICON[item.type] || 'notifications-outline'} size={22} color="#fff" />
            </View>
            <View style={styles.content}>
              <Text style={[styles.title, !item.is_read && styles.unreadTitle]}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.time}>
                {new Date(item.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            {!item.is_read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderWarm,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  markAllBtn: { paddingHorizontal: 4 },
  markAllText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.card,
    borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.borderWarm,
    alignItems: 'flex-start',
  },
  unreadCard: { backgroundColor: COLORS.primary + '08', borderColor: COLORS.primary + '40' },
  iconBox: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0,
  },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  unreadTitle: { color: COLORS.primary },
  body: { fontSize: 13, color: COLORS.gray, marginBottom: 4, lineHeight: 18 },
  time: { fontSize: 11, color: COLORS.muted },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary, marginLeft: 8, marginTop: 4, flexShrink: 0,
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
});
