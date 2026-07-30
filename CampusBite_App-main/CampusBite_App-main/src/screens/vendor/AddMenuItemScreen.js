import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';

export default function AddMenuItemScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'Main Course', is_available: true, image: null });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const categories = ['Main Course', 'Drinks', 'Snacks'];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      set('image', result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!form.name.trim())  return Alert.alert('Error', 'Name is required.');
    if (!form.price.trim()) return Alert.alert('Error', 'Price is required.');
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) return Alert.alert('Error', 'Enter a valid price.');

    setLoading(true);
    try {
      await api.menu.create({ ...form, price });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Image Upload */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Item Image</Text>
        <TouchableOpacity style={styles.imageUploadBtn} onPress={pickImage}>
          {form.image ? (
            <Image source={{ uri: form.image }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={32} color={COLORS.gray} />
              <Text style={styles.imagePlaceholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Item Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Item Name *</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="fast-food-outline" size={18} color={COLORS.gray} />
          <TextInput style={styles.input} placeholder="e.g. Chapati + Beans" placeholderTextColor={COLORS.gray}
            value={form.name} onChangeText={(v) => set('name', v)} />
        </View>
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Description</Text>
        <View style={[styles.inputWrap, { alignItems: 'flex-start', paddingVertical: 12 }]}>
          <Ionicons name="document-text-outline" size={18} color={COLORS.gray} style={{ marginTop: 2 }} />
          <TextInput style={[styles.input, { minHeight: 60 }]} placeholder="Short description (optional)" placeholderTextColor={COLORS.gray}
            value={form.description} onChangeText={(v) => set('description', v)} multiline textAlignVertical="top" />
        </View>
      </View>

      {/* Price */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Price (KES) *</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.currencyLabel}>KES</Text>
          <TextInput style={styles.input} placeholder="e.g. 80" placeholderTextColor={COLORS.gray}
            value={form.price} onChangeText={(v) => set('price', v)} keyboardType="decimal-pad" />
        </View>
      </View>

      {/* Category */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, form.category === cat && styles.categoryChipActive]}
              onPress={() => set('category', cat)}
            >
              <Text style={[styles.categoryText, form.category === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Availability */}
      <View style={styles.switchCard}>
        <View style={styles.switchLeft}>
          <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.switchLabel}>Available now</Text>
        </View>
        <Switch value={form.is_available} onValueChange={(v) => set('is_available', v)}
          trackColor={{ false: '#ddd', true: COLORS.primary }} thumbColor={COLORS.white} />
      </View>

      {/* Submit */}
      <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
            <Text style={styles.buttonText}>Add Item</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: COLORS.gray, fontWeight: '600', marginBottom: 6, marginLeft: 2 },

  // Image Upload
  imageUploadBtn: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.borderWarm,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.gray,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    gap: 8,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 14 },
  currencyLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },

  // Category
  categoryRow: { flexDirection: 'row', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  categoryTextActive: { color: COLORS.white, fontWeight: '600' },

  // Switch
  switchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
    marginBottom: 24,
  },
  switchLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },

  // Button
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
});
