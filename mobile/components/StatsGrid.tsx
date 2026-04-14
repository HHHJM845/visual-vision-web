import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatItem {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export default function StatsGrid({ items }: { items: StatItem[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item, i) => (
        <View key={i} style={styles.cell}>
          {item.icon && (
            <MaterialCommunityIcons
              name={item.icon as any}
              size={20}
              color={item.color ?? '#007AFF'}
              style={styles.icon}
            />
          )}
          <Text style={[styles.value, item.color ? { color: item.color } : null]}>
            {item.value}
          </Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  icon: { marginBottom: 6 },
  value: { fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold', color: '#1C1C1E', marginBottom: 2 },
  label: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
});
