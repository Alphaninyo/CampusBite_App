import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export default function RiderMapView({ lat, lng, locationUpdatedAt }) {
  if (!lat || !lng) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Waiting for rider location...</Text>
      </View>
    );
  }

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008},${lat - 0.008},${lng + 0.008},${lat + 0.008}&layer=mapnik&marker=${lat},${lng}`;

  const updatedText = locationUpdatedAt
    ? `Updated ${Math.round((Date.now() - new Date(locationUpdatedAt).getTime()) / 1000)}s ago`
    : null;

  return (
    <View style={styles.container}>
      <iframe
        src={src}
        style={{ width: '100%', height: '100%', border: 'none', borderRadius: 10 }}
        title="Rider Live Location"
      />
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
