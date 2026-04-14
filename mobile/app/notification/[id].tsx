import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopAppBar from '@components/TopAppBar';
import { mockNotifications } from '@shared/data/mockExtended';

const iconMap = {
  commission: { name: 'file-document-outline', color: '#007AFF', bg: '#E5F3FF' },
  payment: { name: 'currency-cny', color: '#34C759', bg: '#D1F2D1' },
  review: { name: 'star-outline', color: '#FF9500', bg: '#FFF3CD' },
  system: { name: 'bell-outline', color: '#8A8A9A', bg: '#F3F4F5' },
};

export default function NotificationDetailScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showBack title="通知" />
      <ScrollView contentContainerStyle={styles.content}>
        {mockNotifications.map(n => {
          const ic = iconMap[n.type];
          return (
            <View key={n.id} style={[styles.card, !n.read && styles.cardUnread]}>
              <View style={[styles.iconBox, { backgroundColor: ic.bg }]}>
                <MaterialCommunityIcons name={ic.name as any} size={22} color={ic.color} />
              </View>
              <View style={styles.info}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{n.title}</Text>
                  {!n.read && <View style={styles.dot} />}
                </View>
                <Text style={styles.body}>{n.body}</Text>
                <Text style={styles.time}>{n.time}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingTop: 56 + 8, paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 14 },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: '#007AFF' },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
  title: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007AFF' },
  body: { fontSize: 13, color: '#3A3A3C', fontFamily: 'Manrope_400Regular', lineHeight: 19, marginBottom: 6 },
  time: { fontSize: 11, color: '#C7C7CC', fontFamily: 'Manrope_400Regular' },
});
