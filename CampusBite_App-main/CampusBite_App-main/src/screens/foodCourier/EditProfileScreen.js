import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';

const VEHICLE_TYPES = ['Electric Bicycle', 'Bicycle', 'Motorcycle', 'Walking'];

export default function EditProfileScreen({ navigation, route }) {
  const { user } = route.params || {};
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [vehicleType, setVehicleType] = useState('Electric Bicycle');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.foodCourier.getProfile();
      setVehicleType(data.profile.vehicle_type);
      setVehiclePlate(data.profile.vehicle_plate || '');
    } catch (err) {
      console.error(err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    if (!name || !phone) {
      Alert.alert('Error', 'Name and phone are required.');
      return;
    }

    setLoading(true);
    try {
      // Update user profile
      await api.auth.updateProfile({ name, phone });
      
      // Update courier profile
      await api.foodCourier.updateProfile({ vehicle_type: vehicleType, vehicle_plate: vehiclePlate });

      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = () => {
    Alert.alert(
      'Select Vehicle Type',
      'Choose your vehicle',
      VEHICLE_TYPES.map(v => ({
        text: v,
        onPress: () => setVehicleType(v)
      })).concat([{ text: 'Cancel', style: 'cancel' }])
    );
  };

  if (fetching) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F6' }}>
      <ActivityIndicator size="large" color="#E85D04" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: 16 }}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={styles.changeAvatarBtn}>
            <Text style={styles.changeAvatarText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor={COLORS.gray}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor={COLORS.gray}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#f5f5f5' }]}
            value={email}
            editable={false}
          />

          <Text style={styles.sectionTitle}>Vehicle Information</Text>

          <Text style={styles.label}>Vehicle Type</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={handleVehicleSelect}>
            <Text style={styles.pickerText}>{vehicleType}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <Text style={styles.label}>Vehicle Plate (Optional)</Text>
          <TextInput
            style={styles.input}
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
            placeholder="Enter vehicle plate number"
            placeholderTextColor={COLORS.gray}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e8e4',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  scrollView: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E85D04',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  changeAvatarBtn: { padding: 8 },
  changeAvatarText: { fontSize: 14, color: '#E85D04', fontWeight: '600' },
  formSection: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 8, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginTop: 24, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f0e8e4',
    fontSize: 15,
    color: COLORS.black,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f0e8e4',
  },
  pickerText: { fontSize: 15, color: COLORS.black },
  saveBtn: {
    backgroundColor: '#E85D04',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
