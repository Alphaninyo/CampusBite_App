import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, Alert, Modal,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

// Default to Nairobi, Kenya — adjust to your campus coordinates
const DEFAULT_REGION = {
  latitude:      -1.286389,
  longitude:     36.817223,
  latitudeDelta:  0.01,
  longitudeDelta: 0.01,
};

async function reverseGeocode(lat, lng) {
  try {
    // Use Nominatim (free, no API key)
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
  const mapRef = useRef(null);
  const [region,         setRegion]         = useState(DEFAULT_REGION);
  const [pinCoords,      setPinCoords]      = useState({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
  const [address,        setAddress]        = useState('');
  const [geocoding,      setGeocoding]      = useState(false);
  const [locating,       setLocating]       = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

  // When modal opens, try to jump to user's current location
  useEffect(() => {
    if (visible) goToMyLocation(false);
  }, [visible]);

  const goToMyLocation = async (showAlert = true) => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (showAlert) Alert.alert('Permission needed', 'Allow location access to use this feature.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = {
        latitude:  loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      const newRegion = { ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 };
      setPinCoords(coords);
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 600);
      updateAddress(coords.latitude, coords.longitude);
    } catch {
      if (showAlert) Alert.alert('Error', 'Could not get your location.');
    } finally {
      setLocating(false);
    }
  };

  const updateAddress = async (lat, lng) => {
    setGeocoding(true);
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr);
    setGeocoding(false);
  };

  const onRegionChangeComplete = (newRegion) => {
    const coords = { latitude: newRegion.latitude, longitude: newRegion.longitude };
    setPinCoords(coords);
    updateAddress(coords.latitude, coords.longitude);
  };

  const handleConfirm = () => {
    if (!address.trim()) {
      Alert.alert('No address', 'Move the map to select your delivery location first.');
      return;
    }
    onConfirm(address.trim(), pinCoords);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Drop pin on delivery location</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* ── Map ── */}
        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation
            showsMyLocationButton={false}
          />

          {/* Fixed center pin */}
          <View style={styles.pinContainer} pointerEvents="none">
            <Ionicons name="location" size={44} color={COLORS.primary} />
          </View>

          {/* My location button */}
          <TouchableOpacity style={styles.locBtn} onPress={() => goToMyLocation(true)}>
            {locating
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <Ionicons name="locate" size={22} color={COLORS.primary} />}
          </TouchableOpacity>
        </View>

        {/* ── Address Panel ── */}
        <View style={styles.panel}>
          <View style={styles.addressCard}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            {editingAddress ? (
              <TextInput
                style={styles.addressInput}
                value={address}
                onChangeText={setAddress}
                multiline
                autoFocus
                onBlur={() => setEditingAddress(false)}
                placeholder="Type delivery address"
                placeholderTextColor={COLORS.muted}
              />
            ) : (
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setEditingAddress(true)}>
                {geocoding
                  ? <ActivityIndicator size="small" color={COLORS.gray} />
                  : <Text style={styles.addressText} numberOfLines={3}>
                      {address || 'Move the map to choose your location'}
                    </Text>}
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setEditingAddress(true)} style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={16} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, (!address.trim() || geocoding) && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!address.trim() || geocoding}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
            <Text style={styles.confirmBtnText}>Confirm Delivery Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderWarm,
  },
  closeBtn:    { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, flex: 1, textAlign: 'center' },

  mapWrap: { flex: 1, position: 'relative' },
  map:     { flex: 1 },

  // Fixed pin at exact center of map
  pinContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 44, // offset pin tip to center
    alignItems: 'center', justifyContent: 'flex-end',
    pointerEvents: 'none',
  },

  locBtn: {
    position: 'absolute', right: 16, bottom: 16,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },

  panel: {
    backgroundColor: COLORS.white, padding: 16,
    borderTopWidth: 1, borderTopColor: COLORS.borderWarm,
  },
  addressCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.background, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.borderWarm, marginBottom: 14,
  },
  addressText:  { flex: 1, fontSize: 14, color: COLORS.black, lineHeight: 20 },
  addressInput: { flex: 1, fontSize: 14, color: COLORS.black, lineHeight: 20, minHeight: 40 },
  editBtn:      { padding: 4 },

  confirmBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  confirmBtnDisabled: { backgroundColor: COLORS.muted, shadowOpacity: 0 },
  confirmBtnText:     { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
});
