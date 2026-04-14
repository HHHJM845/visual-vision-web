import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TopAppBarProps {
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export default function TopAppBar({ title, showLogo, showBack, rightElement }: TopAppBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <BlurView intensity={60} tint="light" style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={26} color="#1C1C1E" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}

        <View style={styles.center}>
          {showLogo ? (
            <Text style={styles.logo}>跃然</Text>
          ) : (
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          )}
        </View>

        <View style={styles.iconBtn}>{rightElement}</View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(242,242,247,0.85)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  inner: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  center: { flex: 1, alignItems: 'center' },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  logo: {
    fontSize: 22,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#007AFF',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: '#1C1C1E',
  },
});
