import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';

interface Props {
  userCoords: { latitude: number; longitude: number } | null;
  recyclerCoords: { latitude: number; longitude: number } | null;
}

export default function ActiveOrderMap({ userCoords, recyclerCoords }: Props) {
  if (!userCoords || !recyclerCoords) return null;

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userCoords.latitude},${userCoords.longitude}&destination=${recyclerCoords.latitude},${recyclerCoords.longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.dot} />
        <View style={styles.info}>
          <Text style={styles.label}>Your Location</Text>
          <Text style={styles.coord}>{userCoords.latitude.toFixed(4)}, {userCoords.longitude.toFixed(4)}</Text>
        </View>
      </View>
      <View style={styles.line} />
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: '#16a34a' }]} />
        <View style={styles.info}>
          <Text style={styles.label}>Recycler Location</Text>
          <Text style={styles.coord}>{recyclerCoords.latitude.toFixed(4)}, {recyclerCoords.longitude.toFixed(4)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.mapsBtn} onPress={openDirections} activeOpacity={0.8}>
        <Text style={styles.mapsBtnText}>🗺️  Open Directions in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    marginRight: 12,
  },
  line: {
    width: 2,
    height: 20,
    backgroundColor: '#86EFAC',
    marginLeft: 5,
    marginVertical: 2,
  },
  info: {
    flex: 1,
  },
  label: {
    fontWeight: '700',
    fontSize: 13,
    color: '#14532D',
  },
  coord: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 1,
  },
  mapsBtn: {
    marginTop: 16,
    backgroundColor: '#15803D',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mapsBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
