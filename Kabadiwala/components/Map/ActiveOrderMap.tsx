import React from 'react';
import { View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function ActiveOrderMap({ userCoords, recyclerCoords }: { userCoords: any, recyclerCoords: any }) {
  if (!userCoords || !recyclerCoords) return null;
  return (
    <View style={{ height: 250, width: '100%' }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={userCoords} title="You" pinColor="blue" />
        <Marker coordinate={recyclerCoords} title="Recycler" pinColor="green" />
        <Polyline
          coordinates={[userCoords, recyclerCoords]}
          strokeColor="#15803D"
          strokeWidth={4}
        />
      </MapView>
    </View>
  );
}
