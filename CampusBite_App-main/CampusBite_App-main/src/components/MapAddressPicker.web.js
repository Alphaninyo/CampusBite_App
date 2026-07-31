/**
 * Web fallback for MapAddressPicker.
 * react-native-maps doesn't support web, so this shows a GPS-powered
 * address form with Nominatim reverse geocoding.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'CampusBiteApp/1.0' } }
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function MapAddressPicker({ visible, onConfirm, onClose }) {
  const [address,   setAddress]   = useState('');
  const [coords,    setCoords]    = useState(null);
  const [locating,  setLocating]  = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const handleGetLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow location access to auto-fill your address.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setGeocoding(true);
      const addr = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
      setAddress(addr);
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      Alert.alert('Error', 'Could not get your location. Please type your address manually.');
    } finally {
      setLocating(false);
      setGeocoding(false);
    }
  };

  // Typing over a GPS-detected address invalidates the coordinates that came
  // with it — otherwise a manually-edited address could keep stale coords.
  const handleAddressChange = (text) => {
    setAddress(text);
    setCoords(null);
  };

  const handleConfirm = () => {
    if (!address.trim()) {
      Alert.alert('Address required', 'Please enter or detect your delivery address.');
      return;
    }
    onConfirm(address.trim(), coords);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.row}>
            <Text style={styles.title}>Delivery Address</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* GPS button */}
          <TouchableOpacity style={styles.gpsBtn} onPress={handleGetLocation} disabled={locating || geocoding}>
            {(locating || geocoding)
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <Ionicons name="locate" size={18} color={COLORS.primary} />}
            <Text style={styles.gpsBtnText}>
              {locating ? 'Getting location…' : geocoding ? 'Finding address…' : 'Use my current location'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or type manually</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} style={{ marginTop: 2 }} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Hostel B, Room 14 – Main Campus"
              placeholderTextColor={COLORS.muted}
              value={address}
              onChangeText={handleAddressChange}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, !address.trim() && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!address.trim()}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
            <Text style={styles.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.borderWarm,
    alignSelf: 'center', marginBottom: 20,
  },
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.black },

  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 14,
    padding: 14, backgroundColor: COLORS.iconBg,
  },
  gpsBtnText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  divider:    { flex: 1, height: 1, backgroundColor: COLORS.borderWarm },
  dividerText:{ fontSize: 12, color: COLORS.muted },

  inputWrap: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderWidth: 1.5, borderColor: COLORS.borderWarm, borderRadius: 14,
    padding: 12, marginBottom: 16,
  },
  input: { flex: 1, fontSize: 14, color: COLORS.black, minHeight: 60 },

  confirmBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  confirmBtnDisabled: { backgroundColor: COLORS.muted, shadowOpacity: 0 },
  confirmBtnText:     { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
});
