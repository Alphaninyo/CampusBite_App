import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Modal, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { api } from '../../api';

export default function VendorPromoCodesScreen() {
  const [codes,       setCodes]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [saving,      setSaving]      = useState(false);

  // Create form
  const [form, setForm] = useState({
    code:             '',
    discount_type:    'percent',
    discount_value:   '',
    min_order_amount: '',
    max_uses:         '',
    expires_at:       '',
  });
  const [formError, setFormError] = useState('');

  useFocusEffect(
    useCallback(() => { fetchCodes(); }, [])
  );

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const { data } = await api.promoCodes.getMy();
      setCodes(data.promo_codes || []);
    } catch {
      Alert.alert('Error', 'Could not load promo codes.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ code: '', discount_type: 'percent', discount_value: '', min_order_amount: '', max_uses: '', expires_at: '' });
    setFormError('');
  };

  const handleCreate = async () => {
    if (!form.code.trim()) { setFormError('Promo code is required.'); return; }
    if (!form.discount_value || isNaN(parseFloat(form.discount_value)) || parseFloat(form.discount_value) <= 0) {
      setFormError('Enter a valid discount value.'); return;
    }
    if (form.discount_type === 'percent' && parseFloat(form.discount_value) > 100) {
      setFormError('Percentage cannot exceed 100.'); return;
    }

    setSaving(true);
    setFormError('');
    try {
      const { data } = await api.promoCodes.create({
        code:             form.code.trim().toUpperCase(),
        discount_type:    form.discount_type,
        discount_value:   parseFloat(form.discount_value),
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_uses:         form.max_uses ? parseInt(form.max_uses) : undefined,
        expires_at:       form.expires_at.trim() || undefined,
      });
      setCodes((prev) => [data.promo_code, ...prev]);
      setShowModal(false);
      resetForm();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create promo code.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id, currentlyActive) => {
    try {
      const { data } = await api.promoCodes.toggle(id);
      setCodes((prev) => prev.map((c) => c.id === id ? data.promo_code : c));
    } catch {
      Alert.alert('Error', 'Could not toggle promo code.');
    }
  };

  const handleDelete = (id, code) => {
    Alert.alert('Delete Promo Code', `Delete "${code}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.promoCodes.delete(id);
            setCodes((prev) => prev.filter((c) => c.id !== id));
          } catch {
            Alert.alert('Error', 'Could not delete promo code.');
          }
        },
      },
    ]);
  };

  const formatExpiry = (expires_at) => {
    if (!expires_at) return 'Never';
    return new Date(expires_at).toLocaleDateString();
  };

  const isExpired = (expires_at) => expires_at && new Date() > new Date(expires_at);

  const renderCode = ({ item }) => {
    const expired = isExpired(item.expires_at);
    return (
      <View style={[styles.codeCard, !item.is_active && styles.codeCardInactive]}>
        <View style={styles.codeHeader}>
          <View style={styles.codeBadge}>
            <Ionicons name="pricetag-outline" size={14} color={COLORS.primary} />
            <Text style={styles.codeText}>{item.code}</Text>
          </View>
          <Switch
            value={item.is_active}
            onValueChange={() => handleToggle(item.id, item.is_active)}
            trackColor={{ false: COLORS.borderWarm, true: COLORS.primary + '66' }}
            thumbColor={item.is_active ? COLORS.primary : COLORS.muted}
          />
        </View>

        <View style={styles.codeDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="cut-outline" size={13} color={COLORS.gray} />
            <Text style={styles.detailText}>
              {item.discount_type === 'percent'
                ? `${parseFloat(item.discount_value)}% off`
                : `KES ${parseFloat(item.discount_value).toFixed(0)} off`}
            </Text>
          </View>
          {parseFloat(item.min_order_amount) > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="cart-outline" size={13} color={COLORS.gray} />
              <Text style={styles.detailText}>Min order: KES {parseFloat(item.min_order_amount).toFixed(0)}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={13} color={COLORS.gray} />
            <Text style={styles.detailText}>
              Used: {item.uses_count}{item.max_uses ? ` / ${item.max_uses}` : ' (unlimited)'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={13} color={expired ? COLORS.danger : COLORS.gray} />
            <Text style={[styles.detailText, expired && { color: COLORS.danger }]}>
              Expires: {formatExpiry(item.expires_at)}{expired ? ' — Expired' : ''}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.code)}>
          <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={codes}
        keyExtractor={(i) => i.id}
        renderItem={renderCode}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.headerTitle}>Promo Codes</Text>
            <Text style={styles.headerSub}>
              Create discount codes for your customers. Share the code — they enter it at checkout.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="pricetag-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No promo codes yet</Text>
            <Text style={styles.emptySub}>Tap the button below to create your first one</Text>
          </View>
        }
      />

      <View style={styles.fabWrap}>
        <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setShowModal(true); }}>
          <Ionicons name="add" size={24} color={COLORS.white} />
          <Text style={styles.fabText}>New Code</Text>
        </TouchableOpacity>
      </View>

      {/* ── Create Modal ── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Create Promo Code</Text>

            <Text style={styles.label}>Code *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. SAVE20"
              placeholderTextColor={COLORS.muted}
              value={form.code}
              onChangeText={(v) => setForm((f) => ({ ...f, code: v.toUpperCase() }))}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Discount Type *</Text>
            <View style={styles.typeRow}>
              {['percent', 'fixed'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, form.discount_type === t && styles.typeBtnActive]}
                  onPress={() => setForm((f) => ({ ...f, discount_type: t }))}
                >
                  <Text style={[styles.typeBtnText, form.discount_type === t && styles.typeBtnTextActive]}>
                    {t === 'percent' ? '% Percent' : 'KES Fixed'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>
              Discount Value * {form.discount_type === 'percent' ? '(0–100%)' : '(KES)'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={form.discount_type === 'percent' ? 'e.g. 15' : 'e.g. 50'}
              placeholderTextColor={COLORS.muted}
              value={form.discount_value}
              onChangeText={(v) => setForm((f) => ({ ...f, discount_value: v }))}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Min Order Amount (KES, optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 200"
              placeholderTextColor={COLORS.muted}
              value={form.min_order_amount}
              onChangeText={(v) => setForm((f) => ({ ...f, min_order_amount: v }))}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Max Uses (optional, blank = unlimited)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 50"
              placeholderTextColor={COLORS.muted}
              value={form.max_uses}
              onChangeText={(v) => setForm((f) => ({ ...f, max_uses: v }))}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Expiry Date (optional, YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2025-12-31"
              placeholderTextColor={COLORS.muted}
              value={form.expires_at}
              onChangeText={(v) => setForm((f) => ({ ...f, expires_at: v }))}
            />

            {!!formError && <Text style={styles.formError}>{formError}</Text>}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleCreate}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Text style={styles.saveBtnText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list:   { padding: 16, paddingBottom: 100 },

  listHeader: { marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  headerSub:   { fontSize: 13, color: COLORS.gray, lineHeight: 18 },

  codeCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.borderWarm,
  },
  codeCardInactive: { opacity: 0.6 },
  codeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  codeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  codeText: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1 },

  codeDetails: { gap: 6, marginBottom: 12 },
  detailRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText:  { fontSize: 13, color: COLORS.gray },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: COLORS.dangerBg, borderWidth: 1, borderColor: COLORS.dangerBorder,
  },
  deleteBtnText: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },

  empty:     { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 12 },
  emptySub:  { fontSize: 13, color: COLORS.gray, marginTop: 4 },

  fabWrap: { position: 'absolute', bottom: 24, right: 20 },
  fab: {
    backgroundColor: COLORS.primary, borderRadius: 16, flexDirection: 'row',
    alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14,
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  fabText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.borderWarm,
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },

  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.borderWarm, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text,
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.borderWarm,
  },
  typeBtnActive:     { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '20' },
  typeBtnText:       { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  typeBtnTextActive: { color: COLORS.primary },

  formError: { color: COLORS.danger, fontSize: 13, marginTop: 8 },

  modalBtns:    { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn:    { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.borderWarm },
  cancelBtnText:{ fontSize: 14, fontWeight: '600', color: COLORS.gray },
  saveBtn:      { flex: 2, backgroundColor: COLORS.primary, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: COLORS.muted },
  saveBtnText:  { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
});
