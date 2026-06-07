import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

function StarRow({ label, value, onChange }) {
  return (
    <View style={styles.starSection}>
      <Text style={styles.starLabel}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => onChange(n)}>
            <Ionicons
              name={n <= value ? 'star' : 'star-outline'}
              size={32}
              color={n <= value ? COLORS.warning : '#ddd'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function WriteReviewScreen({ route, navigation }) {
  const { order } = route.params;
  const hasRider = !!order.rider;

  const [vendorRating, setVendorRating] = useState(0);
  const [riderRating, setRiderRating]   = useState(0);
  const [comment, setComment]           = useState('');
  const [loading, setLoading]           = useState(false);

  const submit = async () => {
    if (vendorRating === 0) return Alert.alert('Error', 'Please rate the vendor.');
    if (hasRider && riderRating === 0) return Alert.alert('Error', 'Please rate the rider.');
    setLoading(true);
    try {
      await api.reviews.create({
        order_id:      order.id,
        vendor_rating: vendorRating,
        rider_rating:  hasRider ? riderRating : undefined,
        comment:       comment.trim() || undefined,
      });
      Alert.alert('Thanks!', 'Your review has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
      {/* Header info */}
      <View style={styles.headerCard}>
        <Ionicons name="star-outline" size={24} color="#F59E0B" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.heading}>Rate Your Order</Text>
          <Text style={styles.sub}>From {order.vendor?.business_name}</Text>
        </View>
      </View>

      {/* Ratings */}
      <View style={styles.card}>
        <StarRow label="Food & Service" value={vendorRating} onChange={setVendorRating} />
        {hasRider && (
          <>
            <View style={styles.divider} />
            <StarRow label="Delivery (Rider)" value={riderRating} onChange={setRiderRating} />
          </>
        )}
      </View>

      {/* Comment */}
      <View style={styles.card}>
        <Text style={styles.label}>Comment (optional)</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.gray} style={{ marginTop: 2 }} />
          <TextInput
            style={styles.input}
            placeholder="How was your experience?"
            placeholderTextColor={COLORS.gray}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Submit */}
      <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="send-outline" size={18} color={COLORS.card} />
            <Text style={styles.buttonText}>Submit Review</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  heading: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  sub: { color: COLORS.gray, fontSize: 13, marginTop: 2 },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  divider: { height: 1, backgroundColor: COLORS.borderWarm, marginVertical: 12 },

  // Stars
  starSection: { marginBottom: 4 },
  starLabel: { fontSize: 14, color: COLORS.gray, fontWeight: '500', marginBottom: 8 },
  stars: { flexDirection: 'row', gap: 8 },

  // Comment
  label: { fontSize: 14, color: COLORS.gray, fontWeight: '500', marginBottom: 10 },
  inputWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  input: { flex: 1, fontSize: 14, color: COLORS.text, minHeight: 80 },

  // Button
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { color: COLORS.card, fontWeight: 'bold', fontSize: 15 },
});
