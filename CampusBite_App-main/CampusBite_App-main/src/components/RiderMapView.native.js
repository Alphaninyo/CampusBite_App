import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { COLORS } from '../constants';

export default function RiderMapView({ lat, lng, locationUpdatedAt }) {
  if (!lat || !lng) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Waiting for rider location...</Text>
      </View>
    );
  }

  const latitude  = parseFloat(lat);
  const longitude = parseFloat(lng);

  const updatedText = locationUpdatedAt
    ? `Updated ${Math.round((Date.now() - new Date(locationUpdatedAt).getTime()) / 1000)}s ago`
    : null;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude,
          longitude,
          latitudeDelta:  0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title="Rider Location"
          pinColor={COLORS.primary}
        />
      </MapView>
      {updatedText && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>📍 Live · {updatedText}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: { flex: 1 },
  placeholder: {
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { color: COLORS.gray, fontSize: 13 },
  badge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
