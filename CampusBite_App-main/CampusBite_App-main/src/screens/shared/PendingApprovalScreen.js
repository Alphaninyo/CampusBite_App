import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Alert, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../stores/authStore';
import { api } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';

export default function PendingApprovalScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { user, logout, updateUser }    = useAuthStore();
  const [checking, setChecking]         = useState(false);
  const [verStatus, setVerStatus]       = useState(user?.verification_status || 'not_submitted');
  const [checkMsg,  setCheckMsg]        = useState(null);
  const [checkErr,  setCheckErr]        = useState('');
  const [infoNote,  setInfoNote]        = useState('');
  const [infoDocs,  setInfoDocs]        = useState([]);
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
    setCheckMsg(null);
    setCheckErr('');
    try {
      const { data } = await api.auth.getMe();
      const u = data.user;
      updateUser({ is_approved: u.is_approved, verification_status: u.verification_status });
      setVerStatus(u.verification_status || 'not_submitted');
      if (u.is_approved) {
        setCheckMsg('approved');
      } else if (u.verification_status === 'info_requested') {
        setInfoNote(u.admin_note || '');
        const raw = u.requested_docs;
        setInfoDocs(Array.isArray(raw) ? raw : (raw ? JSON.parse(raw) : []));
        setCheckMsg('info_requested');
      } else {
        setCheckMsg('pending');
      }
    } catch (err) {
      setCheckErr(err.message || 'Could not check status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // React Native's Alert with buttons does not work on web, so use window.confirm
      const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to log out?') : true;
      if (confirmed) logout();
      return;
    }
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
      color:  COLORS.success,
    },
    {
      icon:   'document-text-outline',
      label:  'Documents Submitted',
      done:   verStatus === 'pending' || verStatus === 'approved',
      color:  verStatus === 'pending' || verStatus === 'approved' ? COLORS.success : COLORS.muted,
      action: verStatus === 'not_submitted' ? () => navigation.navigate('Verification', { role: user?.role }) : null,
      actionLabel: 'Upload now',
    },
    {
      icon:   'shield-checkmark-outline',
      label:  'Admin Review',
      done:   false,
      color:  COLORS.primary,
      active: true,
    },
    {
      icon:   'checkmark-circle-outline',
      label:  'Account Activated',
      done:   false,
      color:  COLORS.muted,
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
            <Ionicons name="log-out-outline" size={18} color={COLORS.primary} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Animated icon */}
        <Animated.View style={[styles.iconRingOuter, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.iconRingMiddle}>
            <View style={styles.iconRingInner}>
              <Ionicons name="time" size={36} color={COLORS.white} />
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
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
          <Text style={styles.etaText}>Reviews typically take <Text style={styles.etaBold}>1–2 business days</Text></Text>
        </View>

        {/* Progress steps */}
        <View style={styles.card}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>Application Progress</Text>

          {verificationSteps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[styles.stepIcon, { backgroundColor: step.done ? step.color : step.active ? COLORS.iconBg : COLORS.inputBg }]}>
                  <Ionicons name={step.icon} size={18} color={step.done ? COLORS.white : step.active ? COLORS.primary : COLORS.muted} />
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
                    <Ionicons name="arrow-forward" size={12} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
                {!step.done && !step.active && (
                  <Text style={styles.stepPending}>Waiting</Text>
                )}
              </View>
              {step.done && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
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
              color={verStatus === 'approved' ? COLORS.success : verStatus === 'rejected' ? COLORS.danger : COLORS.info}
            />
            <Text style={[styles.docBadgeText, verStatus === 'approved' && { color: COLORS.success }, verStatus === 'rejected' && { color: COLORS.danger }, verStatus === 'pending' && { color: COLORS.info }]}>
              {verStatus === 'pending'   && 'Document submitted — under review'}
              {verStatus === 'approved'  && 'Document verified ✓'}
              {verStatus === 'rejected'  && 'Document rejected — please re-upload'}
            </Text>
            {verStatus === 'rejected' && (
              <TouchableOpacity onPress={() => navigation.navigate('Verification', { role: user?.role })} style={{ marginLeft: 8 }}>
                <Text style={{ fontSize: 12, color: COLORS.danger, fontWeight: '700' }}>Re-upload</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Check status button */}
        <TouchableOpacity style={styles.checkBtn} onPress={checkStatus} disabled={checking} activeOpacity={0.8}>
          {checking
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : <>
                <Ionicons name="refresh" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.checkBtnText}>Check Approval Status</Text>
              </>
          }
        </TouchableOpacity>

        {checkMsg === 'approved' && (
          <View style={[styles.statusBanner, styles.statusBannerGreen]}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={[styles.statusBannerText, { color: COLORS.success }]}>
              Your account has been approved! Welcome to CampusBite.
            </Text>
          </View>
        )}
        {checkMsg === 'pending' && (
          <View style={[styles.statusBanner, styles.statusBannerOrange]}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            <Text style={[styles.statusBannerText, { color: COLORS.primary }]}>
              Still under review. We'll notify you once approved.
            </Text>
          </View>
        )}
        {checkMsg === 'info_requested' && (
          <View style={[styles.statusBanner, styles.statusBannerOrange, { flexDirection: 'column', alignItems: 'flex-start' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
              <Text style={[styles.statusBannerText, { color: COLORS.primary, marginLeft: 8 }]}>
                Admin has requested additional information.
              </Text>
            </View>
            {infoNote ? (
              <Text style={{ fontSize: 12, color: COLORS.subtext, marginBottom: 10, lineHeight: 17 }}>{infoNote}</Text>
            ) : null}
            <TouchableOpacity
              style={{ backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16, alignSelf: 'flex-start' }}
              onPress={() => navigation.navigate('SubmitInfo', { requestedDocs: infoDocs, adminNote: infoNote, role: user?.role, useAuthFlow: true })}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Submit Required Information</Text>
            </TouchableOpacity>
          </View>
        )}
        {checkErr ? (
          <View style={[styles.statusBanner, styles.statusBannerRed]}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
            <Text style={[styles.statusBannerText, { color: COLORS.danger }]}>{checkErr}</Text>
          </View>
        ) : null}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>While you wait…</Text>
          {[
            'Make sure your submitted documents are clear and valid',
            'You will receive an email notification once approved',
            'Contact support if your review takes longer than 3 days',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="bulb-outline" size={14} color={COLORS.primary} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={styles.blobBottom} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.backgroundAlt },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 50, paddingBottom: 48 },

  blobTopRight: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: COLORS.blob, opacity: 0.55 },
  blobTopLeft:  { position: 'absolute', top: 40, left: -80,   width: 160, height: 160, borderRadius: 80,  backgroundColor: COLORS.blob, opacity: 0.35 },
  blobBottom:   { position: 'absolute', bottom: -80, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.blob, opacity: 0.3 },

  topRow:     { flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginBottom: 24 },
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.iconBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.borderWarm },
  logoutText: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginLeft: 6 },

  iconRingOuter:  { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.blob, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  iconRingMiddle: { width: 78,  height: 78,  borderRadius: 39, backgroundColor: '#FCBF91', alignItems: 'center', justifyContent: 'center' },
  iconRingInner:  { width: 58,  height: 58,  borderRadius: 29, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },

  title:         { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 10, textAlign: 'center' },
  subtitle:      { fontSize: 14, color: COLORS.subtext, textAlign: 'center', lineHeight: 22, marginBottom: 16, paddingHorizontal: 8 },
  nameHighlight: { fontWeight: '700', color: COLORS.text },
  roleChip:      { fontWeight: '700', color: COLORS.primary },

  etaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.iconBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 24, borderWidth: 1, borderColor: COLORS.borderWarm },
  etaText: { fontSize: 13, color: COLORS.subtext, marginLeft: 8 },
  etaBold: { fontWeight: '700', color: COLORS.text },

  card: { width: '100%', backgroundColor: COLORS.card, borderRadius: 24, paddingHorizontal: 20, paddingTop: 0, paddingBottom: 20, marginBottom: 16, overflow: 'hidden', shadowColor: COLORS.primary, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  cardAccent: { height: 4, backgroundColor: COLORS.primary, marginHorizontal: -20, marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 16 },

  stepRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  stepLeft:    { alignItems: 'center', width: 36, marginRight: 14 },
  stepIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepConnector:     { width: 2, height: 28, backgroundColor: COLORS.border, marginTop: 4 },
  stepConnectorDone: { backgroundColor: COLORS.success },
  stepContent: { flex: 1, paddingTop: 7, paddingBottom: 16 },
  stepLabel:        { fontSize: 14, fontWeight: '600', color: COLORS.subtext },
  stepLabelActive:  { color: COLORS.primary, fontWeight: '700' },
  stepLabelDone:    { color: COLORS.success },
  stepPending:      { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  reviewingBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  reviewingDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 6 },
  reviewingText:  { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  actionLink:     { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  actionLinkText: { fontSize: 12, color: COLORS.primary, fontWeight: '700', marginRight: 4 },

  docBadge: { flexDirection: 'row', alignItems: 'center', width: '100%', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1 },
  docBadgePending:  { backgroundColor: COLORS.infoBg,    borderColor: COLORS.infoBorder },
  docBadgeApproved: { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder },
  docBadgeRejected: { backgroundColor: COLORS.dangerBg,  borderColor: COLORS.dangerBorder },
  docBadgeText: { fontSize: 13, fontWeight: '500', marginLeft: 8, flex: 1 },

  checkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, width: '100%', marginBottom: 16, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  checkBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  tipsCard:   { width: '100%', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.borderWarm },
  tipsTitle:  { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  tipRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  tipText:    { fontSize: 12, color: COLORS.subtext, marginLeft: 8, flex: 1, lineHeight: 16 },

  statusBanner:       { flexDirection: 'row', alignItems: 'center', width: '100%', borderRadius: 12, padding: 12, marginBottom: 12, columnGap: 10 },
  statusBannerGreen:  { backgroundColor: COLORS.successBg, borderWidth: 1, borderColor: COLORS.successBorder },
  statusBannerOrange: { backgroundColor: COLORS.iconBg, borderWidth: 1, borderColor: COLORS.borderWarm },
  statusBannerRed:    { backgroundColor: COLORS.dangerBg, borderWidth: 1, borderColor: COLORS.dangerBorder },
  statusBannerText:   { flex: 1, fontSize: 13, fontWeight: '600' },
});
