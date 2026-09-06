import React from 'react';
import { View, Text } from 'react-native';

export default function ActiveOrderMap({ userCoords, recyclerCoords }: { userCoords: any, recyclerCoords: any }) {
  if (!userCoords || !recyclerCoords) return null;
  
  return (
    <View style={{ height: 250, width: '100%', backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <Text style={{ fontWeight: 'bold', color: '#0F172A', fontSize: 16, marginBottom: 8 }}>
        Map Tracking Active (Native App Only)
      </Text>
      <Text style={{ color: '#475569', textAlign: 'center', marginBottom: 12 }}>
        Please open this app on your physical mobile device to view the live GPS route.
      </Text>
      <View style={{ backgroundColor: '#FFF', padding: 12, borderRadius: 8, width: '100%' }}>
        <Text style={{ color: '#0F172A', fontWeight: 'bold' }}>Kabadiwala:</Text>
        <Text style={{ color: '#475569', marginBottom: 8 }}>{userCoords.latitude.toFixed(4)}, {userCoords.longitude.toFixed(4)}</Text>
        
        <Text style={{ color: '#0F172A', fontWeight: 'bold' }}>Recycler:</Text>
        <Text style={{ color: '#475569' }}>{recyclerCoords.latitude.toFixed(4)}, {recyclerCoords.longitude.toFixed(4)}</Text>
      </View>
    </View>
  );
}
