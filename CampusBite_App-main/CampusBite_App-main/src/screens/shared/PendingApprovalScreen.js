import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../stores/authStore';
import { api } from '../../api';

const PRIMARY = '#E85D04';
const BG      = '#FEF3ED';
const CARD    = '#FFFFFF';
const TEXT    = '#111827';
const SUBTEXT = '#6B7280';
const MUTED   = '#9CA3AF';
const BORDER  = '#F3E8E2';

export default function PendingApprovalScreen({ navigation }) {
  const { user, logout, updateUser }    = useAuthStore();
  const [checking, setChecking]         = useState(false);
  const [verStatus, setVerStatus]       = useState(user?.verification_status || 'not_submitted');
  const pulseAnim                       = useRef(new Animated.Value(1)).current;

  const roleLabel = user?.role === 'food_courier' ? 'Food Courier' : 'Vendor';

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: false }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const { data } = await api.auth.getMe();
      updateUser({ is_approved: data.user.is_approved });
      setVerStatus(data.user.verification_status || 'not_submitted');
      if (data.user.is_approved) {
        Alert.alert('Account Approved! 🎉', 'Your account has been approved. Welcome to CampusBite!');
      } else {
        Alert.alert('Still Pending', 'Your account is still under review. We\'ll notify you once approved.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const verificationSteps = [
    {
      icon:   'person-add-outline',
      label:  'Account Created',
      done:   true,
      color:  '#10B981',
    },
    {
      icon:   'document-text-outline',
      label:  'Documents Submitted',
      done:   verStatus === 'pending' || verStatus === 'approved',
      color:  verStatus === 'pending' || verStatus === 'approved' ? '#10B981' : MUTED,
      action: verStatus === 'not_submitted' ? () => navigation.navigate('Verification', { role: user?.role }) : null,
      actionLabel: 'Upload now',
    },
    {
      icon:   'shield-checkmark-outline',
      label:  'Admin Review',
      done:   false,
      color:  PRIMARY,
      active: true,
    },
    {
      icon:   'checkmark-circle-outline',
      label:  'Account Activated',
      done:   false,
      color:  MUTED,
    },
  ];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Blobs */}
        <View style={styles.blobTopRight} />
        <View style={styles.blobTopLeft} />

        {/* Header with logout */}
        <View style={styles.topRow}>
          <View />
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color={PRIMARY} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Animated icon */}
        <Animated.View style={[styles.iconRingOuter, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.iconRingMiddle}>
            <View style={styles.iconRingInner}>
              <Ionicons name="time" size={36} color={CARD} />
            </View>
          </View>
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>Pending Approval</Text>
        <Text style={styles.subtitle}>
          Hi <Text style={styles.nameHighlight}>{user?.name?.split(' ')[0]}</Text>! Your{' '}
          <Text style={styles.roleChip}>{roleLabel}</Text> account is being reviewed by our admin team.
        </Text>

        {/* ETA card */}
        <View style={styles.etaCard}>
          <Ionicons name="calendar-outline" size={18} color={PRIMARY} />
          <Text style={styles.etaText}>Reviews typically take <Text style={styles.etaBold}>1–2 business days</Text></Text>
        </View>

        {/* Progress steps */}
        <View style={styles.card}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>Application Progress</Text>

          {verificationSteps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[styles.stepIcon, { backgroundColor: step.done ? step.color : step.active ? '#FEF0E7' : '#F3F4F6' }]}>
                  <Ionicons name={step.icon} size={18} color={step.done ? CARD : step.active ? PRIMARY : MUTED} />
                </View>
                {i < verificationSteps.length - 1 && (
                  <View style={[styles.stepConnector, step.done && styles.stepConnectorDone]} />
                )}
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepLabel, step.active && styles.stepLabelActive, step.done && styles.stepLabelDone]}>
                  {step.label}
                </Text>
                {step.active && (
                  <View style={styles.reviewingBadge}>
                    <View style={styles.reviewingDot} />
                    <Text style={styles.reviewingText}>In progress</Text>
                  </View>
                )}
                {step.action && (
                  <TouchableOpacity onPress={step.action} style={styles.actionLink} activeOpacity={0.7}>
                    <Text style={styles.actionLinkText}>{step.actionLabel}</Text>
                    <Ionicons name="arrow-forward" size={12} color={PRIMARY} />
                  </TouchableOpacity>
                )}
                {!step.done && !step.active && (
                  <Text style={styles.stepPending}>Waiting</Text>
                )}
              </View>
              {step.done && (
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              )}
            </View>
          ))}
        </View>

        {/* Document status */}
        {verStatus !== 'not_submitted' && (
          <View style={[styles.docBadge, verStatus === 'pending' && styles.docBadgePending, verStatus === 'approved' && styles.docBadgeApproved, verStatus === 'rejected' && styles.docBadgeRejected]}>
            <Ionicons
              name={verStatus === 'approved' ? 'shield-checkmark' : verStatus === 'rejected' ? 'close-circle' : 'document-text'}
              size={16}
              color={verStatus === 'approved' ? '#059669' : verStatus === 'rejected' ? '#DC2626' : '#2563EB'}
            />
            <Text style={[styles.docBadgeText, verStatus === 'approved' && { color: '#059669' }, verStatus === 'rejected' && { color: '#DC2626' }, verStatus === 'pending' && { color: '#2563EB' }]}>
              {verStatus === 'pending'   && 'Document submitted — under review'}
              {verStatus === 'approved'  && 'Document verified ✓'}
              {verStatus === 'rejected'  && 'Document rejected — please re-upload'}
            </Text>
            {verStatus === 'rejected' && (
              <TouchableOpacity onPress={() => navigation.navigate('Verification', { role: user?.role })} style={{ marginLeft: 8 }}>
                <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '700' }}>Re-upload</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Check status button */}
        <TouchableOpacity style={styles.checkBtn} onPress={checkStatus} disabled={checking} activeOpacity={0.8}>
          {checking
            ? <ActivityIndicator color={CARD} size="small" />
            : <>
                <Ionicons name="refresh" size={18} color={CARD} style={{ marginRight: 8 }} />
                <Text style={styles.checkBtnText}>Check Approval Status</Text>
              </>
          }
        </TouchableOpacity>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>While you wait…</Text>
          {[
            'Make sure your submitted documents are clear and valid',
            'You will receive an email notification once approved',
            'Contact support if your review takes longer than 3 days',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="bulb-outline" size={14} color={PRIMARY} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={styles.blobBottom} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 50, paddingBottom: 48 },

  blobTopRight: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: '#FDDCC8', opacity: 0.55 },
  blobTopLeft:  { position: 'absolute', top: 40, left: -80,   width: 160, height: 160, borderRadius: 80,  backgroundColor: '#FDDCC8', opacity: 0.35 },
  blobBottom:   { position: 'absolute', bottom: -80, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: '#FDDCC8', opacity: 0.3 },

  topRow:     { flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginBottom: 24 },
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF0E7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  logoutText: { fontSize: 13, color: PRIMARY, fontWeight: '600', marginLeft: 6 },

  iconRingOuter:  { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FDDCC8', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  iconRingMiddle: { width: 78,  height: 78,  borderRadius: 39, backgroundColor: '#FCBF91', alignItems: 'center', justifyContent: 'center' },
  iconRingInner:  { width: 58,  height: 58,  borderRadius: 29, backgroundColor: PRIMARY,   alignItems: 'center', justifyContent: 'center' },

  title:         { fontSize: 26, fontWeight: '800', color: TEXT, letterSpacing: -0.5, marginBottom: 10, textAlign: 'center' },
  subtitle:      { fontSize: 14, color: SUBTEXT, textAlign: 'center', lineHeight: 22, marginBottom: 16, paddingHorizontal: 8 },
  nameHighlight: { fontWeight: '700', color: TEXT },
  roleChip:      { fontWeight: '700', color: PRIMARY },

  etaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF0E7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 24, borderWidth: 1, borderColor: BORDER },
  etaText: { fontSize: 13, color: SUBTEXT, marginLeft: 8 },
  etaBold: { fontWeight: '700', color: TEXT },

  card: { width: '100%', backgroundColor: CARD, borderRadius: 24, paddingHorizontal: 20, paddingTop: 0, paddingBottom: 20, marginBottom: 16, overflow: 'hidden', shadowColor: '#C44D00', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  cardAccent: { height: 4, backgroundColor: PRIMARY, marginHorizontal: -20, marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 16 },

  stepRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  stepLeft:    { alignItems: 'center', width: 36, marginRight: 14 },
  stepIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepConnector:     { width: 2, height: 28, backgroundColor: '#E5E7EB', marginTop: 4 },
  stepConnectorDone: { backgroundColor: '#10B981' },
  stepContent: { flex: 1, paddingTop: 7, paddingBottom: 16 },
  stepLabel:        { fontSize: 14, fontWeight: '600', color: SUBTEXT },
  stepLabelActive:  { color: PRIMARY, fontWeight: '700' },
  stepLabelDone:    { color: '#059669' },
  stepPending:      { fontSize: 11, color: MUTED, marginTop: 2 },
  reviewingBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  reviewingDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: PRIMARY, marginRight: 6 },
  reviewingText:  { fontSize: 11, color: PRIMARY, fontWeight: '600' },
  actionLink:     { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  actionLinkText: { fontSize: 12, color: PRIMARY, fontWeight: '700', marginRight: 4 },

  docBadge: { flexDirection: 'row', alignItems: 'center', width: '100%', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1 },
  docBadgePending:  { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  docBadgeApproved: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  docBadgeRejected: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  docBadgeText: { fontSize: 13, fontWeight: '500', marginLeft: 8, flex: 1 },

  checkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY, borderRadius: 16, paddingVertical: 16, width: '100%', marginBottom: 16, shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  checkBtnText: { color: CARD, fontSize: 16, fontWeight: '800' },

  tipsCard:   { width: '100%', backgroundColor: CARD, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  tipsTitle:  { fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 12 },
  tipRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  tipText:    { fontSize: 12, color: SUBTEXT, marginLeft: 8, flex: 1, lineHeight: 16 },
});
