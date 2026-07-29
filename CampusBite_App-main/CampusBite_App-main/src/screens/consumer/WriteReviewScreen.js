import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';

function StarRow({ label, value, onChange, styles, COLORS }) {
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
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { order } = route.params;
  const hasRider = !!order.rider;

  const [vendorRating, setVendorRating] = useState(0);
  const [riderRating, setRiderRating]   = useState(0);
  const [comment, setComment]           = useState('');
  const [loading, setLoading]           = useState(false);
  const [submitted, setSubmitted]       = useState(false);

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
      setSubmitted(true);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to submit review';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconWrap}>
          <Ionicons name="checkmark-circle" size={72} color="#388E3C" />
        </View>
        <Text style={styles.successTitle}>Review Submitted!</Text>
        <Text style={styles.successSub}>
          Thank you for your feedback on your order from{' '}
          <Text style={{ fontWeight: 'bold' }}>{order.vendor?.business_name}</Text>.
        </Text>
        <View style={styles.successStars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Ionicons
              key={n}
              name={n <= vendorRating ? 'star' : 'star-outline'}
              size={28}
              color={n <= vendorRating ? '#F59E0B' : '#ddd'}
            />
          ))}
        </View>
        {comment.trim() ? (
          <View style={styles.successComment}>
            <Ionicons name="chatbubble-outline" size={14} color={COLORS.gray} />
            <Text style={styles.successCommentText}>"{comment.trim()}"</Text>
          </View>
        ) : null}
        <TouchableOpacity style={styles.successBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.successBtnText}>Back to Order</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <StarRow label="Food & Service" value={vendorRating} onChange={setVendorRating} styles={styles} COLORS={COLORS} />
        {hasRider && (
          <>
            <View style={styles.divider} />
            <StarRow label="Delivery (Rider)" value={riderRating} onChange={setRiderRating} styles={styles} COLORS={COLORS} />
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
            <Ionicons name="send-outline" size={18} color={COLORS.white} />
            <Text style={styles.buttonText}>Submit Review</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
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

  // Success screen
  successContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIconWrap: {
    backgroundColor: '#e8f5e9',
    borderRadius: 60,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 10, textAlign: 'center' },
  successSub: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  successStars: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  successComment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    maxWidth: '100%',
  },
  successCommentText: { fontSize: 13, color: COLORS.gray, fontStyle: 'italic', flex: 1 },
  successBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  successBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // Button
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
});
