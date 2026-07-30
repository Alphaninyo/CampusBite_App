import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  Modal, Image, Linking, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { resolveImageUrl } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

const TABS = ['All', 'Vendors', 'Couriers', 'Documents', 'Rejected'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTimeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

function VerificationBadge({ status, type, hasDocument, onView, onViewPassport, hasPassport, passportUrl, styles, COLORS }) {
  if (!hasDocument && !hasPassport) {
    return (
      <View style={[styles.verBadge, styles.verBadgeNone]}>
        <Ionicons name="warning-outline" size={13} color={COLORS.warningText} />
        <Text style={[styles.verBadgeText, { color: COLORS.warningText }]}>No documents submitted</Text>
      </View>
    );
  }
  const idLabel = type === 'passport' ? 'Passport' : 'National ID';
  const badgeStyle = status === 'approved' ? styles.verBadgeApproved
    : status === 'rejected' ? styles.verBadgeRejected
    : styles.verBadgePending;
  const textColor = status === 'approved' ? COLORS.successText
    : status === 'rejected' ? COLORS.danger
    : COLORS.infoText;
  const iconName = status === 'approved' ? 'checkmark-circle'
    : status === 'rejected' ? 'close-circle'
    : 'document-text-outline';
  const statusLabel = status === 'approved' ? 'Verified' : status === 'rejected' ? 'Rejected' : 'Submitted';

  return (
    <View style={{ gap: 8 }}>
      {hasPassport && (
        <View style={styles.passportPhotoRow}>
          <TouchableOpacity onPress={onViewPassport} activeOpacity={0.85} style={styles.passportThumbWrap}>
            <Image source={{ uri: passportUrl }} style={styles.passportThumb} resizeMode="cover" />
            <View style={styles.passportThumbOverlay}>
              <Ionicons name="eye-outline" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.passportPhotoLabel}>PASSPORT-SIZED PHOTO</Text>
            <View style={[styles.verBadge, styles.verBadgePending, { marginTop: 4 }]}>
              <Ionicons name="person-circle-outline" size={13} color={COLORS.infoText} />
              <Text style={[styles.verBadgeText, { color: COLORS.infoText }]}>Submitted</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewDocBtn} onPress={onViewPassport} activeOpacity={0.7}>
            <Ionicons name="eye-outline" size={13} color={COLORS.primary} />
            <Text style={styles.viewDocBtnText}>View</Text>
          </TouchableOpacity>
        </View>
      )}
      {hasDocument && (
        <View style={styles.verRow}>
          <View style={[styles.verBadge, badgeStyle]}>
            <Ionicons name={iconName} size={13} color={textColor} />
            <Text style={[styles.verBadgeText, { color: textColor }]}>{idLabel} — {statusLabel}</Text>
          </View>
          <TouchableOpacity style={styles.viewDocBtn} onPress={onView} activeOpacity={0.7}>
            <Ionicons name="eye-outline" size={13} color={COLORS.primary} />
            <Text style={styles.viewDocBtnText}>View</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminApprovalsScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab]   = useState('All');
  const [vendors, setVendors]       = useState([]);
  const [couriers, setCouriers]     = useState([]);
  const [rejected, setRejected]     = useState([]);
  const [recentlyApproved, setRecentlyApproved] = useState([]);
  const [longWaitingCount, setLongWaitingCount] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing]         = useState(null);
  const [requestingInfo, setRequestingInfo] = useState(null);
  const [infoNote, setInfoNote]             = useState('');
  const [requestedDocs, setRequestedDocs]   = useState(['passport_photo', 'national_id', 'passport']);
  const [sendingNote, setSendingNote]       = useState(false);
  const [sentConfirm, setSentConfirm]       = useState(null); // card id that just got sent
  const [panelError, setPanelError]         = useState('');
  const [docViewer, setDocViewer]           = useState(null); // { url, label }
  const [actionMsg,  setActionMsg]          = useState(null); // { type: 'success'|'error', text }
  const [expandedCard, setExpandedCard]     = useState(null);
  const [unreadCount, setUnreadCount]       = useState(0);

  // Document review tab state
  const [docUsers, setDocUsers]             = useState([]);
  const [docActing, setDocActing]           = useState(null);
  const [rejectDocMode, setRejectDocMode]   = useState(null); // userId being rejected
  const [rejectNote, setRejectNote]         = useState('');
  const [rejectNoteError, setRejectNoteError] = useState('');

  const docUrl = resolveImageUrl;

  const fetchAll = useCallback(async () => {
    try {
      const [vRes, cRes, dRes, notifRes] = await Promise.all([
        api.admin.getPendingVendors(),
        api.admin.getPendingFoodCouriers(),
        api.admin.getPendingDocUsers(),
        api.notifications.getUnreadCount().catch(() => ({ data: { unread_count: 0 } })),
      ]);
      setVendors(vRes.data.vendors || []);
      setCouriers(cRes.data.couriers || []);
      setDocUsers(dRes.data.users || []);
      setUnreadCount(notifRes.data.unread_count || 0);

      const now = new Date();
      const longWaiting = (vRes.data.vendors || []).filter(v => {
        const hours = (now - new Date(v.created_at)) / (1000 * 60 * 60);
        return hours > 24;
      });
      setLongWaitingCount(longWaiting.length);

      setRecentlyApproved([
        { id: '1', name: 'Campus Vendor Shop', approved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), type: 'vendor' },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const showActionMsg = (type, text) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleVendorAction = async (vendorId, action) => {
    setActing(vendorId);
    try {
      if (action === 'approve') {
        await api.admin.approveVendor(vendorId);
        showActionMsg('success', 'Vendor has been approved successfully.');
      } else {
        await api.admin.rejectVendor(vendorId);
        showActionMsg('success', 'Vendor application has been rejected.');
      }
      fetchAll();
    } catch (err) {
      showActionMsg('error', err.message);
    } finally {
      setActing(null);
    }
  };

  const handleCourierAction = async (courierId, action) => {
    setActing(courierId);
    try {
      if (action === 'approve') {
        await api.admin.approveFoodCourier(courierId);
        showActionMsg('success', 'Food courier has been approved successfully.');
      } else {
        await api.admin.rejectFoodCourier(courierId);
        showActionMsg('success', 'Food courier application has been rejected.');
      }
      fetchAll();
    } catch (err) {
      showActionMsg('error', err.message);
    } finally {
      setActing(null);
    }
  };

  const confirmAction = (id, name, action, type) => {
    if (action === 'approve') {
      type === 'vendor' ? handleVendorAction(id, action) : handleCourierAction(id, action);
      return;
    }
    // Alert.alert buttons are suppressed on web — use window.confirm instead
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && window.confirm(`Reject ${name}'s application?`);
      if (ok) type === 'vendor' ? handleVendorAction(id, action) : handleCourierAction(id, action);
      return;
    }
    Alert.alert(
      'Reject Application',
      `Are you sure you want to reject ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => type === 'vendor' ? handleVendorAction(id, action) : handleCourierAction(id, action),
        },
      ]
    );
  };

  const toggleRequestedDoc = (key) => {
    setRequestedDocs(prev =>
      prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
    );
  };

  const handleRequestInfo = async (itemId, userId, name) => {
    if (requestedDocs.length === 0) {
      setPanelError('Select at least one document to request.');
      return;
    }
    if (!infoNote.trim()) {
      setPanelError('Please add a note describing what is missing.');
      return;
    }
    setPanelError('');
    setSendingNote(true);
    try {
      await api.admin.requestInfo(userId, infoNote.trim(), requestedDocs);
      setRequestingInfo(null);
      setInfoNote('');
      setRequestedDocs(['passport_photo', 'national_id', 'passport']);
      setSentConfirm(itemId);
      setTimeout(() => setSentConfirm(null), 4000);
      fetchAll();
    } catch (err) {
      setPanelError(err.message || 'Failed to send request. Please try again.');
    } finally {
      setSendingNote(false);
    }
  };

  // ── Vendor card ─────────────────────────────────────────────────────────────
  const renderVendorCard = (item) => {
    const owner = item.owner || {};
    const isActing = acting === item.id;
    const hasDoc      = !!owner.verification_document;
    const hasPassport = !!owner.passport_photo;
    const noDoc = !hasDoc && !hasPassport;

    return (
      <View key={item.id} style={[styles.card, noDoc && styles.cardFlagged]}>
        {/* ── Flag banner ── */}
        {noDoc && (
          <View style={styles.flagBanner}>
            <Ionicons name="warning" size={14} color={COLORS.warningText} />
            <Text style={styles.flagBannerText}>No verification document submitted — review carefully</Text>
          </View>
        )}

        {/* ── Header (tap to expand/collapse) ── */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="storefront-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardName}>{item.business_name}</Text>
            <Text style={styles.cardSub}>
              {item.vendor_type === 'home_based' ? 'Home-Based' : 'Restaurant'} · Applied {getTimeAgo(item.created_at)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
            <Ionicons name={expandedCard === item.id ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.muted} />
          </View>
        </TouchableOpacity>

        {expandedCard === item.id && (<>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Identity & Contact ── */}
        <Text style={styles.sectionLabel}>APPLICANT DETAILS</Text>
        <View style={styles.detailGrid}>
          <DetailRow icon="person-outline"   label="Full Name"     value={owner.name  || 'N/A'} styles={styles} COLORS={COLORS} />
          <DetailRow icon="mail-outline"     label="Email"         value={owner.email || 'N/A'} styles={styles} COLORS={COLORS} />
          <DetailRow icon="call-outline"     label="Phone"         value={owner.phone || 'N/A'} styles={styles} COLORS={COLORS} />
          <DetailRow icon="calendar-outline" label="Registered"    value={owner.created_at ? new Date(owner.created_at).toLocaleDateString() : 'N/A'} styles={styles} COLORS={COLORS} />
        </View>

        {/* ── Business info ── */}
        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>BUSINESS INFO</Text>
        <View style={styles.detailGrid}>
          <DetailRow icon="business-outline"  label="Type"         value={item.vendor_type === 'home_based' ? 'Home-Based' : 'Restaurant'} styles={styles} COLORS={COLORS} />
          <DetailRow icon="location-outline"  label="Location"     value={item.location || 'Not provided'} warn={!item.location} styles={styles} COLORS={COLORS} />
          <DetailRow icon="time-outline"      label="Waiting"      value={getTimeAgo(item.created_at)} styles={styles} COLORS={COLORS} />
        </View>

        {/* ── Verification ── */}
        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>IDENTITY VERIFICATION</Text>
        <View style={styles.verSection}>
          <VerificationBadge
            status={owner.verification_status}
            type={owner.verification_type}
            hasDocument={hasDoc}
            hasPassport={hasPassport}
            passportUrl={docUrl(owner.passport_photo)}
            onView={() => setDocViewer({ url: docUrl(owner.verification_document), label: `${item.business_name} — ID Document` })}
            onViewPassport={() => setDocViewer({ url: docUrl(owner.passport_photo), label: `${item.business_name} — Passport-Sized Photo` })}
            styles={styles}
            COLORS={COLORS}
          />
        </View>

        {/* ── Request Info inline panel ── */}
        {requestingInfo === item.id ? (
          <View style={styles.requestInfoPanel}>
            <Text style={styles.requestInfoLabel}>WHICH DOCUMENTS ARE NEEDED?</Text>
            <View style={styles.docCheckRow}>
              {[
                { key: 'passport_photo', label: 'Passport-Sized Photo', icon: 'person-circle-outline' },
                { key: 'national_id',    label: 'National ID',    icon: 'card-outline' },
                { key: 'passport',       label: 'Passport',       icon: 'book-outline' },
              ].map(({ key, label, icon }) => {
                const checked = requestedDocs.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.docCheckBtn, checked && styles.docCheckBtnActive]}
                    onPress={() => toggleRequestedDoc(key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={16} color={checked ? COLORS.primary : COLORS.muted} />
                    <Ionicons name={icon} size={14} color={checked ? COLORS.primary : COLORS.muted} />
                    <Text style={[styles.docCheckLabel, checked && styles.docCheckLabelActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.requestInfoLabel, { marginTop: 10 }]}>ADD A NOTE FOR THE APPLICANT</Text>
            <TextInput
              style={styles.requestInfoInput}
              placeholder="e.g. Please upload a clearer ID photo and provide your business location."
              placeholderTextColor={COLORS.muted}
              value={infoNote}
              onChangeText={setInfoNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {panelError ? (
              <View style={styles.panelErrorBox}>
                <Ionicons name="alert-circle-outline" size={14} color={COLORS.danger} />
                <Text style={styles.panelErrorText}>{panelError}</Text>
              </View>
            ) : null}
            <View style={styles.requestInfoActions}>
              <TouchableOpacity
                style={styles.cancelNoteBtn}
                onPress={() => { setRequestingInfo(null); setInfoNote(''); setPanelError(''); }}
              >
                <Text style={styles.cancelNoteBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendNoteBtn, sendingNote && { opacity: 0.7 }]}
                onPress={() => handleRequestInfo(item.id, owner.id || item.user_id, item.business_name)}
                disabled={sendingNote}
              >
                {sendingNote
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <><Ionicons name="send-outline" size={14} color={COLORS.white} /><Text style={styles.sendNoteBtnText}>Send Request</Text></>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* ── Sent confirmation ── */}
        {sentConfirm === item.id && (
          <View style={styles.sentConfirmBanner}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.sentConfirmText}>Request sent! {item.business_name} has been notified.</Text>
          </View>
        )}

        {/* ── Actions ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, isActing && styles.btnDisabled]}
            onPress={() => confirmAction(item.id, item.business_name, 'reject', 'vendor')}
            disabled={isActing}
          >
            {isActing ? <ActivityIndicator color={COLORS.danger} size="small" /> : (
              <>
                <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.requestInfoBtn, (isActing || requestingInfo === item.id) && styles.btnDisabled]}
            onPress={() => { setRequestingInfo(item.id); setInfoNote(''); setPanelError(''); setRequestedDocs(['passport_photo', 'national_id', 'passport']); }}
            disabled={isActing || requestingInfo === item.id}
          >
            <Ionicons name="information-circle-outline" size={16} color={COLORS.infoText} />
            <Text style={styles.requestInfoBtnText}>Request Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.approveBtn, isActing && styles.btnDisabled]}
            onPress={() => confirmAction(item.id, item.business_name, 'approve', 'vendor')}
            disabled={isActing}
          >
            {isActing ? <ActivityIndicator color={COLORS.white} size="small" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} />
                <Text style={styles.approveBtnText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        </>)}
      </View>
    );
  };

  // ── Courier card ─────────────────────────────────────────────────────────────
  const renderCourierCard = (item) => {
    const user = item.user || {};
    const isActing = acting === item.id;
    const hasDoc      = !!user.verification_document;
    const hasPassport = !!user.passport_photo;
    const noDoc = !hasDoc && !hasPassport;

    return (
      <View key={item.id} style={[styles.card, noDoc && styles.cardFlagged]}>
        {/* ── Flag banner ── */}
        {noDoc && (
          <View style={styles.flagBanner}>
            <Ionicons name="warning" size={14} color={COLORS.warningText} />
            <Text style={styles.flagBannerText}>No verification document submitted — review carefully</Text>
          </View>
        )}

        {/* ── Header (tap to expand/collapse) ── */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.cardIcon, { backgroundColor: COLORS.iconBg }]}>
            <Ionicons name="bicycle-outline" size={22} color={COLORS.secondary} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardName}>{user.name || 'Unknown'}</Text>
            <Text style={styles.cardSub}>
              {item.vehicle_type} · Applied {getTimeAgo(item.created_at)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
            <Ionicons name={expandedCard === item.id ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.muted} />
          </View>
        </TouchableOpacity>

        {expandedCard === item.id && (<>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Identity & Contact ── */}
        <Text style={styles.sectionLabel}>APPLICANT DETAILS</Text>
        <View style={styles.detailGrid}>
          <DetailRow icon="person-outline"   label="Full Name"  value={user.name  || 'N/A'} styles={styles} COLORS={COLORS} />
          <DetailRow icon="mail-outline"     label="Email"      value={user.email || 'N/A'} styles={styles} COLORS={COLORS} />
          <DetailRow icon="call-outline"     label="Phone"      value={user.phone || 'N/A'} styles={styles} COLORS={COLORS} />
          <DetailRow icon="calendar-outline" label="Registered" value={user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'} styles={styles} COLORS={COLORS} />
        </View>

        {/* ── Delivery info ── */}
        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>DELIVERY INFO</Text>
        <View style={styles.detailGrid}>
          <DetailRow icon="bicycle-outline" label="Vehicle"  value={item.vehicle_type || 'N/A'} styles={styles} COLORS={COLORS} />
          <DetailRow icon="time-outline"    label="Waiting"  value={getTimeAgo(item.created_at)} styles={styles} COLORS={COLORS} />
        </View>

        {/* ── Verification ── */}
        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>IDENTITY VERIFICATION</Text>
        <View style={styles.verSection}>
          <VerificationBadge
            status={user.verification_status}
            type={user.verification_type}
            hasDocument={hasDoc}
            hasPassport={hasPassport}
            passportUrl={docUrl(user.passport_photo)}
            onView={() => setDocViewer({ url: docUrl(user.verification_document), label: `${user.name} — ID Document` })}
            onViewPassport={() => setDocViewer({ url: docUrl(user.passport_photo), label: `${user.name} — Passport-Sized Photo` })}
            styles={styles}
            COLORS={COLORS}
          />
        </View>

        {/* ── Request Info inline panel ── */}
        {requestingInfo === item.id ? (
          <View style={styles.requestInfoPanel}>
            <Text style={styles.requestInfoLabel}>WHICH DOCUMENTS ARE NEEDED?</Text>
            <View style={styles.docCheckRow}>
              {[
                { key: 'passport_photo', label: 'Passport-Sized Photo', icon: 'person-circle-outline' },
                { key: 'national_id',    label: 'National ID',    icon: 'card-outline' },
                { key: 'passport',       label: 'Passport',       icon: 'book-outline' },
              ].map(({ key, label, icon }) => {
                const checked = requestedDocs.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.docCheckBtn, checked && styles.docCheckBtnActive]}
                    onPress={() => toggleRequestedDoc(key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={16} color={checked ? COLORS.primary : COLORS.muted} />
                    <Ionicons name={icon} size={14} color={checked ? COLORS.primary : COLORS.muted} />
                    <Text style={[styles.docCheckLabel, checked && styles.docCheckLabelActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.requestInfoLabel, { marginTop: 10 }]}>ADD A NOTE FOR THE APPLICANT</Text>
            <TextInput
              style={styles.requestInfoInput}
              placeholder="e.g. Please upload a passport-sized photo and a clear ID document."
              placeholderTextColor={COLORS.muted}
              value={infoNote}
              onChangeText={setInfoNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {panelError ? (
              <View style={styles.panelErrorBox}>
                <Ionicons name="alert-circle-outline" size={14} color={COLORS.danger} />
                <Text style={styles.panelErrorText}>{panelError}</Text>
              </View>
            ) : null}
            <View style={styles.requestInfoActions}>
              <TouchableOpacity
                style={styles.cancelNoteBtn}
                onPress={() => { setRequestingInfo(null); setInfoNote(''); setPanelError(''); }}
              >
                <Text style={styles.cancelNoteBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendNoteBtn, sendingNote && { opacity: 0.7 }]}
                onPress={() => handleRequestInfo(item.id, user.id, user.name || 'courier')}
                disabled={sendingNote}
              >
                {sendingNote
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <><Ionicons name="send-outline" size={14} color={COLORS.white} /><Text style={styles.sendNoteBtnText}>Send Request</Text></>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* ── Sent confirmation ── */}
        {sentConfirm === item.id && (
          <View style={styles.sentConfirmBanner}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.sentConfirmText}>Request sent! {user.name || 'The applicant'} has been notified.</Text>
          </View>
        )}

        {/* ── Actions ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, isActing && styles.btnDisabled]}
            onPress={() => confirmAction(item.id, user.name || 'courier', 'reject', 'courier')}
            disabled={isActing}
          >
            {isActing ? <ActivityIndicator color={COLORS.danger} size="small" /> : (
              <>
                <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.requestInfoBtn, (isActing || requestingInfo === item.id) && styles.btnDisabled]}
            onPress={() => { setRequestingInfo(item.id); setInfoNote(''); setPanelError(''); setRequestedDocs(['passport_photo', 'national_id', 'passport']); }}
            disabled={isActing || requestingInfo === item.id}
          >
            <Ionicons name="information-circle-outline" size={16} color={COLORS.infoText} />
            <Text style={styles.requestInfoBtnText}>Request Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.approveBtn, isActing && styles.btnDisabled]}
            onPress={() => confirmAction(item.id, user.name || 'courier', 'approve', 'courier')}
            disabled={isActing}
          >
            {isActing ? <ActivityIndicator color={COLORS.white} size="small" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} />
                <Text style={styles.approveBtnText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        </>)}
      </View>
    );
  };

  // ── Document review actions ──────────────────────────────────────────────────
  const handleApproveDoc = async (userId, name) => {
    setDocActing(userId);
    try {
      await api.admin.approveUserDocs(userId);
      showActionMsg('success', `${name}'s documents have been approved.`);
      fetchAll();
    } catch (err) {
      showActionMsg('error', err.message);
    } finally {
      setDocActing(null);
    }
  };

  const handleRejectDoc = async (userId, name) => {
    if (!rejectNote.trim()) { setRejectNoteError('Please add a note explaining what is wrong.'); return; }
    setRejectNoteError('');
    setDocActing(userId);
    try {
      await api.admin.rejectUserDocs(userId, rejectNote.trim());
      showActionMsg('success', `${name}'s documents have been rejected and they have been notified.`);
      setRejectDocMode(null);
      setRejectNote('');
      fetchAll();
    } catch (err) {
      showActionMsg('error', err.message);
    } finally {
      setDocActing(null);
    }
  };

  // ── Document review card ─────────────────────────────────────────────────────
  const renderDocReviewCard = (user) => {
    const hasId    = !!user.verification_document;
    const hasPhoto = !!user.passport_photo;
    const idLabel  = user.verification_type === 'passport' ? 'Passport (ID)' : 'National ID';
    const isActing = docActing === user.id;
    const isRejecting = rejectDocMode === user.id;

    return (
      <View key={user.id} style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <Ionicons
              name={user.role === 'vendor' ? 'storefront-outline' : 'bicycle-outline'}
              size={22}
              color={user.role === 'vendor' ? COLORS.primary : COLORS.secondary}
            />
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardName}>{user.name}</Text>
            <Text style={styles.cardSub}>
              {user.role === 'vendor' ? 'Vendor' : 'Food Courier'} · Document update request
            </Text>
          </View>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Pending</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Contact */}
        <Text style={[styles.sectionLabel, { paddingHorizontal: 14, marginTop: 10, marginBottom: 6 }]}>APPLICANT</Text>
        <View style={[styles.detailGrid]}>
          <DetailRow icon="mail-outline" label="Email" value={user.email || 'N/A'} styles={styles} COLORS={COLORS} />
          <DetailRow icon="call-outline" label="Phone" value={user.phone || 'N/A'} styles={styles} COLORS={COLORS} />
        </View>

        {/* Documents side by side */}
        <Text style={[styles.sectionLabel, { paddingHorizontal: 14, marginTop: 12, marginBottom: 8 }]}>SUBMITTED DOCUMENTS</Text>
        <View style={styles.docReviewRow}>
          {/* ID / Passport */}
          <View style={styles.docReviewBox}>
            <Text style={styles.docReviewLabel}>{idLabel.toUpperCase()}</Text>
            {hasId ? (
              <TouchableOpacity
                onPress={() => setDocViewer({ url: docUrl(user.verification_document), label: `${user.name} — ${idLabel}` })}
                activeOpacity={0.85}
              >
                <Image source={{ uri: docUrl(user.verification_document) }} style={styles.docReviewImg} resizeMode="cover" />
                <View style={styles.docReviewViewBtn}>
                  <Ionicons name="eye-outline" size={13} color={COLORS.white} />
                  <Text style={styles.docReviewViewBtnText}>View</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.docReviewImg, styles.docReviewEmpty]}>
                <Ionicons name="document-outline" size={22} color={COLORS.muted} />
                <Text style={styles.docReviewEmptyText}>Not submitted</Text>
              </View>
            )}
          </View>

          {/* Passport Sized Photo */}
          <View style={styles.docReviewBox}>
            <Text style={styles.docReviewLabel}>PASSPORT SIZED PHOTO</Text>
            {hasPhoto ? (
              <TouchableOpacity
                onPress={() => setDocViewer({ url: docUrl(user.passport_photo), label: `${user.name} — Passport Sized Photo` })}
                activeOpacity={0.85}
              >
                <Image source={{ uri: docUrl(user.passport_photo) }} style={styles.docReviewImg} resizeMode="cover" />
                <View style={styles.docReviewViewBtn}>
                  <Ionicons name="eye-outline" size={13} color={COLORS.white} />
                  <Text style={styles.docReviewViewBtnText}>View</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.docReviewImg, styles.docReviewEmpty]}>
                <Ionicons name="person-circle-outline" size={22} color={COLORS.muted} />
                <Text style={styles.docReviewEmptyText}>Not submitted</Text>
              </View>
            )}
          </View>
        </View>

        {/* Reject note panel */}
        {isRejecting && (
          <View style={styles.requestInfoPanel}>
            <Text style={styles.requestInfoLabel}>REASON FOR REJECTION (SENT TO USER)</Text>
            <TextInput
              style={styles.requestInfoInput}
              placeholder="e.g. The ID image is blurry. Please upload a clearer photo."
              placeholderTextColor={COLORS.muted}
              value={rejectNote}
              onChangeText={setRejectNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {rejectNoteError ? (
              <View style={styles.panelErrorBox}>
                <Ionicons name="alert-circle-outline" size={14} color={COLORS.danger} />
                <Text style={styles.panelErrorText}>{rejectNoteError}</Text>
              </View>
            ) : null}
            <View style={styles.requestInfoActions}>
              <TouchableOpacity
                style={styles.cancelNoteBtn}
                onPress={() => { setRejectDocMode(null); setRejectNote(''); setRejectNoteError(''); }}
              >
                <Text style={styles.cancelNoteBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectBtn, isActing && { opacity: 0.6 }]}
                onPress={() => handleRejectDoc(user.id, user.name)}
                disabled={isActing}
              >
                {isActing
                  ? <ActivityIndicator color={COLORS.danger} size="small" />
                  : <><Ionicons name="close-circle-outline" size={14} color={COLORS.danger} /><Text style={styles.rejectBtnText}>Confirm Reject</Text></>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action buttons */}
        {!isRejecting && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.rejectBtn, isActing && styles.btnDisabled]}
              onPress={() => { setRejectDocMode(user.id); setRejectNote(''); setRejectNoteError(''); }}
              disabled={isActing}
            >
              <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.approveBtn, isActing && styles.btnDisabled]}
              onPress={() => handleApproveDoc(user.id, user.name)}
              disabled={isActing}
            >
              {isActing
                ? <ActivityIndicator color={COLORS.white} size="small" />
                : <><Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} /><Text style={styles.approveBtnText}>Approve Documents</Text></>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const totalPending = vendors.length + couriers.length;

  const getCurrentData = () => {
    switch (activeTab) {
      case 'Vendors':  return { items: vendors,  type: 'vendor' };
      case 'Couriers': return { items: couriers, type: 'courier' };
      case 'Rejected': return { items: rejected, type: 'rejected' };
      default:         return { items: [...vendors, ...couriers], type: 'all' };
    }
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const { items } = getCurrentData();

  const openInBrowser = (url) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Document viewer modal ── */}
      <Modal
        visible={!!docViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setDocViewer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{docViewer?.label}</Text>
              <TouchableOpacity onPress={() => setDocViewer(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalImageWrap}>
              {docViewer?.url ? (
                <Image
                  source={{ uri: docViewer.url }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.modalNoImage}>
                  <Ionicons name="image-outline" size={48} color={COLORS.muted} />
                  <Text style={styles.modalNoImageText}>Unable to load image</Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalOpenBtn}
                onPress={() => openInBrowser(docViewer?.url)}
                activeOpacity={0.8}
              >
                <Ionicons name="open-outline" size={16} color={COLORS.primary} />
                <Text style={styles.modalOpenBtnText}>Open in full size</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setDocViewer(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.primary} />
          <View>
            <Text style={styles.headerTitle}>Approvals</Text>
            <Text style={styles.headerSubtitle}>{totalPending} pending review</Text>
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
            onRefresh={() => { setRefreshing(true); fetchAll(); }}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ── Alert Banner ── */}
        {longWaitingCount > 0 && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning-outline" size={20} color={COLORS.warning} />
            <Text style={styles.alertText}>
              {longWaitingCount} vendor application{longWaitingCount > 1 ? 's have' : ' has'} been waiting over 24 hours.
            </Text>
          </View>
        )}

        {actionMsg && (
          <View style={[styles.actionMsgBanner, actionMsg.type === 'error' ? styles.actionMsgError : styles.actionMsgSuccess]}>
            <Ionicons
              name={actionMsg.type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
              size={16}
              color={actionMsg.type === 'error' ? COLORS.danger : COLORS.success}
            />
            <Text style={[styles.actionMsgText, { color: actionMsg.type === 'error' ? COLORS.danger : COLORS.success }]}>
              {actionMsg.text}
            </Text>
          </View>
        )}

        {/* ── Tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {TABS.map((tab) => {
            const count = tab === 'All'       ? totalPending
              : tab === 'Vendors'   ? vendors.length
              : tab === 'Couriers'  ? couriers.length
              : tab === 'Documents' ? docUsers.length
              : rejected.length;
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

        {/* ── Document reviews tab ── */}
        {activeTab === 'Documents' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PENDING DOCUMENT REVIEWS</Text>
            {docUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={COLORS.success} />
                <Text style={styles.emptyText}>No documents awaiting review</Text>
              </View>
            ) : (
              docUsers.map(renderDocReviewCard)
            )}
          </View>
        )}

        {/* ── Pending applications section ── */}
        {activeTab !== 'Documents' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'Rejected' ? 'REJECTED'
                : activeTab === 'Couriers' ? 'PENDING COURIERS'
                : activeTab === 'Vendors'  ? 'PENDING VENDORS'
                : 'PENDING APPLICATIONS'}
            </Text>

            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success} />
                <Text style={styles.emptyText}>No applications to review</Text>
              </View>
            ) : (
              items.map((item) =>
                item.vehicle_type !== undefined || item.business_name === undefined
                  ? renderCourierCard(item)
                  : renderVendorCard(item)
              )
            )}
          </View>
        )}

        {/* ── Recently Approved ── */}
        {recentlyApproved.length > 0 && activeTab !== 'Rejected' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENTLY APPROVED</Text>
            {recentlyApproved.map((item) => (
              <View key={item.id} style={styles.approvedCard}>
                <View style={styles.approvedHeader}>
                  <View style={styles.approvedIcon}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  </View>
                  <View style={styles.approvedMeta}>
                    <Text style={styles.approvedName}>{item.name}</Text>
                    <Text style={styles.approvedSub}>
                      Approved {new Date(item.approved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Detail row helper ─────────────────────────────────────────────────────────

function DetailRow({ icon, label, value, warn, styles, COLORS }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelWrap}>
        <Ionicons name={icon} size={13} color={COLORS.muted} style={{ marginRight: 5 }} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, warn && styles.detailValueWarn]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (COLORS) => StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:    { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 12, color: COLORS.subtext },
  notificationBtn: { padding: 8, minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  notificationBadge: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },

  // Alert banner
  alertBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.warningBg, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    margin: 16, gap: 10,
  },
  alertText: { flex: 1, fontSize: 13, color: COLORS.warningText },

  actionMsgBanner:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  actionMsgSuccess: { backgroundColor: COLORS.successBg, borderWidth: 1, borderColor: COLORS.successBorder },
  actionMsgError:   { backgroundColor: COLORS.dangerBg, borderWidth: 1, borderColor: COLORS.dangerBorder },
  actionMsgText:    { flex: 1, fontSize: 13, fontWeight: '600' },

  // Tabs
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.card, paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.background },
  tabActive: { backgroundColor: COLORS.primary },
  tabText:       { fontSize: 12, fontWeight: '600', color: COLORS.subtext },
  tabTextActive: { color: COLORS.white },

  // Section
  section:      { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.subtext, marginBottom: 12, letterSpacing: 0.8 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: COLORS.muted, letterSpacing: 1, marginBottom: 6 },

  // Card
  card: {
    backgroundColor: COLORS.card, borderRadius: 14,
    marginBottom: 14, borderWidth: 1.5, borderColor: COLORS.borderWarm,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardFlagged: { borderColor: COLORS.warningBorder },

  // Flag banner (no document)
  flagBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: COLORS.warningBg, paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.warningBorder,
  },
  flagBannerText: { fontSize: 12, color: COLORS.warningText, fontWeight: '600', flex: 1 },

  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 },
  cardIcon: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: COLORS.iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardMeta:   { flex: 1 },
  cardName:   { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  cardSub:    { fontSize: 12, color: COLORS.subtext },
  pendingBadge:     { backgroundColor: COLORS.warningBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.warning },

  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },

  // Detail grid
  detailGrid: { paddingHorizontal: 14 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  detailLabelWrap: { flexDirection: 'row', alignItems: 'center' },
  detailLabel:     { fontSize: 12, color: COLORS.subtext },
  detailValue:     { fontSize: 12, fontWeight: '700', color: COLORS.text, maxWidth: '60%', textAlign: 'right' },
  detailValueWarn: { color: COLORS.muted, fontStyle: 'italic' },

  // Verification section
  verSection: { paddingHorizontal: 14, paddingBottom: 6, gap: 6 },
  verRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, flex: 1 },

  passportPhotoRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.infoBg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: COLORS.infoBorder },
  passportThumbWrap:   { width: 64, height: 64, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  passportThumb:       { width: 64, height: 64 },
  passportThumbOverlay:{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', paddingVertical: 3 },
  passportPhotoLabel:  { fontSize: 10, fontWeight: '700', color: COLORS.infoText, letterSpacing: 0.8 },
  verBadgeNone:     { backgroundColor: COLORS.warningBg, borderWidth: 1, borderColor: COLORS.warningBorder },
  verBadgePending:  { backgroundColor: COLORS.infoBg,    borderWidth: 1, borderColor: COLORS.infoBorder },
  verBadgeApproved: { backgroundColor: COLORS.successBg, borderWidth: 1, borderColor: COLORS.successBorder },
  verBadgeRejected: { backgroundColor: COLORS.dangerBg,  borderWidth: 1, borderColor: COLORS.dangerBorder },
  verBadgeText:  { fontSize: 12, fontWeight: '700', flex: 1 },
  viewDocBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.card },
  viewDocBtnText:{ fontSize: 12, fontWeight: '700', color: COLORS.primary },

  // Document viewer modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: {
    width: '100%', maxWidth: 600, backgroundColor: COLORS.card,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle:    { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 10 },
  modalCloseBtn: { padding: 4 },
  modalImageWrap: { backgroundColor: COLORS.background, minHeight: 320, alignItems: 'center', justifyContent: 'center' },
  modalImage:     { width: '100%', height: 360 },
  modalNoImage:   { alignItems: 'center', paddingVertical: 48 },
  modalNoImageText: { fontSize: 13, color: COLORS.muted, marginTop: 10 },
  modalFooter:   { flexDirection: 'row', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
  modalOpenBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.primary },
  modalOpenBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  modalDoneBtn:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 10, backgroundColor: COLORS.primary },
  modalDoneBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },

  // Actions
  actionRow: { flexDirection: 'row', gap: 8, padding: 14, paddingTop: 12 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 11, borderRadius: 10,
    backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.danger,
  },
  rejectBtnText:  { fontSize: 13, fontWeight: '700', color: COLORS.danger },
  requestInfoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 11, borderRadius: 10,
    backgroundColor: COLORS.infoBg, borderWidth: 1.5, borderColor: COLORS.infoBorder,
  },
  requestInfoBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.infoText },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 11, borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  approveBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  btnDisabled:    { opacity: 0.6 },

  // Request info panel
  requestInfoPanel: {
    marginHorizontal: 14, marginBottom: 4,
    backgroundColor: COLORS.infoBg, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.infoBorder,
    padding: 12,
  },
  requestInfoLabel: { fontSize: 10, fontWeight: '800', color: COLORS.infoText, letterSpacing: 1, marginBottom: 6 },
  docCheckRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  docCheckBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8,
    borderWidth: 1.5, borderColor: COLORS.infoBorder, backgroundColor: COLORS.card,
  },
  docCheckBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  docCheckLabel: { fontSize: 12, fontWeight: '600', color: COLORS.muted },
  docCheckLabelActive: { color: COLORS.primary },
  requestInfoInput: {
    backgroundColor: COLORS.card, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.infoBorder,
    padding: 10, fontSize: 13, color: COLORS.text,
    minHeight: 72, marginBottom: 10,
    ...require('react-native').Platform.select({ web: { outlineStyle: 'none' } }),
  },
  requestInfoActions: { flexDirection: 'row', gap: 8 },
  panelErrorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.dangerBg, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.dangerBorder,
    paddingVertical: 8, paddingHorizontal: 10, marginBottom: 8,
  },
  panelErrorText: { fontSize: 12, color: COLORS.danger, flex: 1, fontWeight: '600' },
  sentConfirmBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginBottom: 8,
    backgroundColor: COLORS.successBg, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.successBorder,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  sentConfirmText: { fontSize: 13, fontWeight: '600', color: COLORS.successText, flex: 1 },
  cancelNoteBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', backgroundColor: COLORS.card,
  },
  cancelNoteBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.subtext },
  sendNoteBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9, borderRadius: 8, backgroundColor: COLORS.info,
  },
  sendNoteBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },

  // Document review cards
  docReviewRow:      { flexDirection: 'row', gap: 10, paddingHorizontal: 14, marginBottom: 12 },
  docReviewBox:      { flex: 1 },
  docReviewLabel:    { fontSize: 10, fontWeight: '700', color: COLORS.subtext, letterSpacing: 0.5, marginBottom: 6 },
  docReviewImg:      { width: '100%', height: 120, borderRadius: 10, backgroundColor: COLORS.background, overflow: 'hidden' },
  docReviewViewBtn:  {
    position: 'absolute', bottom: 6, right: 6,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  docReviewViewBtnText: { fontSize: 11, color: COLORS.white, fontWeight: '600' },
  docReviewEmpty:    { alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  docReviewEmptyText:{ fontSize: 10, color: COLORS.muted },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText:  { fontSize: 14, color: COLORS.subtext, marginTop: 8 },

  // Approved card
  approvedCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.successBorder,
  },
  approvedHeader: { flexDirection: 'row', alignItems: 'center' },
  approvedIcon:   { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.successLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  approvedMeta:   { flex: 1 },
  approvedName:   { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  approvedSub:    { fontSize: 12, color: COLORS.subtext },
  activeBadge:     { backgroundColor: COLORS.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  activeBadgeText: { fontSize: 11, fontWeight: 'bold', color: COLORS.success },
});
