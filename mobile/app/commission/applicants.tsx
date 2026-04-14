import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopAppBar from '@components/TopAppBar';
import AvatarBadge from '@components/AvatarBadge';

const MOCK_APPLICANTS = [
  { id: 'a1', name: '创作者小明', expectedPrice: '¥16,000', message: '我有丰富的科幻类AI影像制作经验...', status: 'pending', appliedAt: '2026-04-12' },
  { id: 'a2', name: 'AI导演小王', expectedPrice: '¥14,500', message: '擅长Sora和Midjourney组合创作...', status: 'pending', appliedAt: '2026-04-11' },
  { id: 'a3', name: '星际影像派', expectedPrice: '¥18,000', message: '曾制作多部科幻短片获奖作品...', status: 'accepted', appliedAt: '2026-04-10' },
  { id: 'a4', name: '梦境创作者', expectedPrice: '¥12,000', message: '价格优惠，7天交付保证...', status: 'rejected', appliedAt: '2026-04-09' },
];

const statusMap: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FFF3CD', text: '#856404', label: '待审核' },
  accepted: { bg: '#D1F2D1', text: '#1A7C3E', label: '已接受' },
  rejected: { bg: '#FFE5E5', text: '#C0392B', label: '已拒绝' },
};

export default function ApplicantsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [applicants, setApplicants] = useState(MOCK_APPLICANTS);

  const handleAccept = (id: string) => {
    Alert.alert('确认接受', '接受该申请后其他申请将自动关闭。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认', onPress: () => {
          setApplicants(prev => prev.map(a => ({
            ...a,
            status: a.id === id ? 'accepted' : a.status === 'accepted' ? 'rejected' : a.status,
          })));
        },
      },
    ]);
  };

  const handleReject = (id: string) => {
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showBack title="申请者列表" />

      <FlatList
        data={applicants}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingTop: 56 + insets.top + 8 }]}
        renderItem={({ item }) => {
          const s = statusMap[item.status] || statusMap.pending;
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <AvatarBadge name={item.name} size={44} />
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.date}>申请于 {item.appliedAt}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                </View>
              </View>

              <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
              <Text style={styles.price}>期望报酬: <Text style={styles.priceVal}>{item.expectedPrice}</Text></Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.portfolioBtn} onPress={() => router.push('/portfolio/1')}>
                  <Text style={styles.portfolioBtnText}>查看作品集</Text>
                </TouchableOpacity>
                {item.status === 'pending' && (
                  <>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                      <Text style={styles.rejectBtnText}>拒绝</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
                      <Text style={styles.acceptBtnText}>邀请合作</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  info: { flex: 1 },
  name: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E' },
  date: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: 'Manrope_700Bold' },
  message: { fontSize: 13, color: '#3A3A3C', lineHeight: 20, marginBottom: 8, fontFamily: 'Manrope_400Regular' },
  price: { fontSize: 13, color: '#8A8A9A', fontFamily: 'Manrope_400Regular', marginBottom: 12 },
  priceVal: { color: '#007AFF', fontFamily: 'Manrope_700Bold' },
  actionRow: { flexDirection: 'row', gap: 8 },
  portfolioBtn: { flex: 1, borderWidth: 1, borderColor: '#007AFF', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  portfolioBtnText: { fontSize: 13, color: '#007AFF', fontFamily: 'Manrope_600SemiBold' },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  rejectBtnText: { fontSize: 13, color: '#8A8A9A', fontFamily: 'Manrope_600SemiBold' },
  acceptBtn: { flex: 1, backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  acceptBtnText: { fontSize: 13, color: '#FFFFFF', fontFamily: 'Manrope_700Bold' },
});
