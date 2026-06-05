import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

export default function CustomerFeedbackScreen({ navigation }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeedback = useCallback(async () => {
    try {
      const { data } = await api.orders.getFoodCourierOrders();
      const orders = data.orders || [];
      const deliveredOrders = orders.filter(o => o.status === 'Delivered');
      
      // Mock feedback data - in real app this would come from reviews
      const mockFeedback = deliveredOrders.map(order => ({
        id: order.id,
        customerName: order.consumer?.name || 'Customer',
        rating: 4.5 + Math.random() * 0.5,
        comment: ['Great service!', 'Very professional', 'Fast delivery', 'Polite and friendly'][Math.floor(Math.random() * 4)],
        date: order.created_at,
        tags: ['FAST', 'POLITE', 'RELIABLE'].slice(0, Math.floor(Math.random() * 3) + 1),
      }));
      
      setFeedback(mockFeedback);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const averageRating = feedback.length > 0 
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : '0.0';

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Feedback</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFeedback(); }} colors={[COLORS.primary]} />}
      >
        {/* Rating Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={styles.ratingValue}>{averageRating}</Text>
            <Text style={styles.ratingLabel}>Average Rating</Text>
          </View>
          <View style={styles.summaryRight}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.reviewCount}>{feedback.length} reviews</Text>
          </View>
        </View>

        {/* Feedback List */}
        <Text style={styles.sectionTitle}>Recent Feedback</Text>
        {feedback.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbox-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No feedback yet</Text>
            <Text style={styles.emptySub}>Complete deliveries to receive customer feedback</Text>
          </View>
        ) : (
          feedback.map((item) => (
            <View key={item.id} style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.customerName.charAt(0)}</Text>
                </View>
                <View style={styles.feedbackInfo}>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.feedbackDate}>
                    {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.comment}>{item.comment}</Text>
              <View style={styles.tags}>
                {item.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderWarm,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  scrollView: { flex: 1 },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  summaryLeft: { flex: 1 },
  ratingValue: { fontSize: 36, fontWeight: 'bold', color: COLORS.white },
  ratingLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  summaryRight: { alignItems: 'flex-end' },
  reviewCount: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginBottom: 12 },
  feedbackCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  feedbackHeader: { flexDirection: 'row', marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  feedbackInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  feedbackDate: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.iconBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary, marginLeft: 4 },
  comment: { fontSize: 14, color: COLORS.black, marginBottom: 12, lineHeight: 20 },
  tags: { flexDirection: 'row', gap: 8 },
  tag: {
    backgroundColor: COLORS.iconBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray, marginTop: 12 },
  emptySub: { fontSize: 14, color: COLORS.gray, marginTop: 4, textAlign: 'center' },
});
