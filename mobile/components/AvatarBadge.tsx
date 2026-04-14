import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AvatarBadgeProps {
  name: string;
  imageUri?: string;
  size?: number;
  verified?: boolean;
  online?: boolean;
}

export default function AvatarBadge({ name, imageUri, size = 40, verified, online }: AvatarBadgeProps) {
  const initials = name.slice(0, 1);
  return (
    <View style={{ width: size, height: size }}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
        </View>
      )}
      {verified && (
        <View style={[styles.badge, styles.badgeVerified, { right: -2, bottom: -2 }]}>
          <MaterialCommunityIcons name="check-circle" size={14} color="#007AFF" />
        </View>
      )}
      {online && !verified && (
        <View style={[styles.badge, styles.badgeOnline, { right: 0, bottom: 0 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {},
  placeholder: {
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold' },
  badge: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  badgeVerified: { padding: 0 },
  badgeOnline: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
