import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Commission } from '@shared/types/commission';
import { useRouter } from 'expo-router';

interface CommissionCardProps { item: Commission }

const statusColor: Record<string, { bg: string; text: string }> = {
  '招募中': { bg: '#E5F3FF', text: '#007AFF' },
  '进行中': { bg: '#FFF3CD', text: '#856404' },
  '已完成': { bg: '#D1F2D1', text: '#1A7C3E' },
  '待验收': { bg: '#FFE5E5', text: '#C0392B' },
};

export default function CommissionCard({ item }: CommissionCardProps) {
  const router = useRouter();
  const sc = statusColor[item.tag] ?? { bg: '#F3F4F5', text: '#3A3A3C' };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/commission/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>{item.tag}</Text>
        </View>
        <Text style={styles.purpose}>{item.purpose}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{item.category}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.meta}>{item.style || '风格不限'}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>{item.priceRange}</Text>
        <View style={styles.statsRow}>
          <MaterialCommunityIcons name="account-multiple-outline" size={13} color="#8A8A9A" />
          <Text style={styles.statsText}> {item.applicants}</Text>
          <MaterialCommunityIcons name="clock-outline" size={13} color="#8A8A9A" style={styles.ml8} />
          <Text style={styles.statsText}> {item.deadline}</Text>
        </View>
      </View>

      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.authorNickname[0]}</Text>
        </View>
        <Text style={styles.authorName}>{item.authorNickname}</Text>
        {item.authorVerification === 'enterprise' && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>企业认证</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: 'Manrope_700Bold' },
  purpose: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  title: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 8, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  meta: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  metaDot: { marginHorizontal: 6, color: '#C7C7CC' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA', paddingTop: 10 },
  price: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: '#007AFF' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statsText: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  ml8: { marginLeft: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { fontSize: 11, color: '#FFFFFF', fontFamily: 'Manrope_700Bold' },
  authorName: { fontSize: 13, color: '#3A3A3C', fontFamily: 'Manrope_400Regular', flex: 1 },
  verifiedBadge: { backgroundColor: '#E5F3FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  verifiedText: { fontSize: 11, color: '#007AFF', fontFamily: 'Manrope_700Bold' },
});
