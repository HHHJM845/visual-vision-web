import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Modal, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { mockCommissions } from '@shared/data/mockData';
import { useRole } from '@shared/contexts/RoleContext';
import TopAppBar from '@components/TopAppBar';
import KineticButton from '@components/KineticButton';

export default function CommissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isCreator, isClient } = useRole();
  const [applyModal, setApplyModal] = useState(false);
  const [message, setMessage] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');

  const commission = mockCommissions.find(c => c.id === Number(id));

  if (!commission) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopAppBar showBack title="企划详情" />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>企划不存在</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleApply = () => {
    if (!message.trim()) {
      Alert.alert('提示', '请填写申请留言');
      return;
    }
    Alert.alert('申请成功', '您的申请已提交，请等待委托方审核。', [
      { text: '确定', onPress: () => { setApplyModal(false); router.back(); } },
    ]);
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    '招募中': { bg: '#E5F3FF', text: '#007AFF' },
    '进行中': { bg: '#FFF3CD', text: '#856404' },
    '已完成': { bg: '#D1F2D1', text: '#1A7C3E' },
  };
  const sc = statusColors[commission.tag] ?? { bg: '#F3F4F5', text: '#3A3A3C' };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showBack title={commission.title} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Hero */}
        <View style={styles.card}>
          <View style={styles.heroTop}>
            <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusText, { color: sc.text }]}>{commission.tag}</Text>
            </View>
            <Text style={styles.purpose}>{commission.purpose}</Text>
          </View>
          <Text style={styles.price}>{commission.priceRange}</Text>

          <View style={styles.metaGrid}>
            <MetaItem icon="grid-outline" label="类别" value={commission.category} />
            <MetaItem icon="palette-outline" label="风格" value={commission.style || '不限'} />
            <MetaItem icon="clock-outline" label="截止" value={commission.deadline} />
            <MetaItem icon="account-multiple-outline" label="申请" value={`${commission.applicants} 人`} />
          </View>
        </View>

        {/* Author */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>委托方信息</Text>
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorAvatarText}>{commission.authorNickname[0]}</Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{commission.authorNickname}</Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={13} color="#FF9500" />
                <Text style={styles.ratingText}>4.8 (23 评价)</Text>
              </View>
            </View>
            <Text style={styles.completionRate}>完成率 96%</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>企划描述</Text>
          <Text style={styles.description}>{commission.description}</Text>
        </View>

        {/* Fee info */}
        <View style={styles.feeCard}>
          <MaterialCommunityIcons name="information-outline" size={16} color="#8A8A9A" />
          <Text style={styles.feeText}>平台服务费: 5%（由平台从报酬中收取）</Text>
        </View>

        {/* Client: view applicants */}
        {isClient && (
          <TouchableOpacity style={styles.applicantsBtn} onPress={() => router.push('/commission/applicants')}>
            <MaterialCommunityIcons name="account-multiple-outline" size={18} color="#007AFF" />
            <Text style={styles.applicantsBtnText}>查看申请列表 ({commission.applicants})</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#007AFF" />
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom action */}
      {isCreator && (
        <View style={styles.bottomBar}>
          <KineticButton label="立即申请" onPress={() => setApplyModal(true)} fullWidth />
        </View>
      )}

      {/* Apply Modal */}
      <Modal visible={applyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>申请企划</Text>
              <TouchableOpacity onPress={() => setApplyModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>申请留言 *</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="介绍您的创作经验和为何适合该项目..."
              placeholderTextColor="#C7C7CC"
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />

            <Text style={styles.inputLabel}>期望报酬</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="如：¥15,000"
              placeholderTextColor="#C7C7CC"
              value={expectedPrice}
              onChangeText={setExpectedPrice}
            />

            <KineticButton label="提交申请" onPress={handleApply} fullWidth />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MetaItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={metaStyles.item}>
      <MaterialCommunityIcons name={icon as any} size={14} color="#8A8A9A" />
      <Text style={metaStyles.label}>{label}:</Text>
      <Text style={metaStyles.value}>{value}</Text>
    </View>
  );
}

const metaStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, width: '50%' },
  label: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  value: { fontSize: 12, color: '#1C1C1E', fontFamily: 'Manrope_600SemiBold', flex: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { flex: 1 },
  content: { paddingTop: 56 + 8, paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: 'Manrope_700Bold' },
  purpose: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  price: { fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold', color: '#007AFF', marginBottom: 14 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cardTitle: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  authorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center' },
  authorAvatarText: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Manrope_700Bold' },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  completionRate: { fontSize: 12, color: '#34C759', fontFamily: 'Manrope_700Bold' },
  description: { fontSize: 14, color: '#3A3A3C', lineHeight: 22, fontFamily: 'Manrope_400Regular' },
  feeCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F5', borderRadius: 12, padding: 12 },
  feeText: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular', flex: 1 },
  applicantsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E5F3FF', borderRadius: 12, padding: 14 },
  applicantsBtnText: { flex: 1, fontSize: 14, color: '#007AFF', fontFamily: 'Manrope_600SemiBold' },
  bottomBar: { backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Manrope_700Bold', color: '#1C1C1E' },
  inputLabel: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 8 },
  textArea: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 12, fontSize: 14, color: '#1C1C1E', fontFamily: 'Manrope_400Regular', minHeight: 100, marginBottom: 16, backgroundColor: '#F8F8F8' },
  modalInput: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 12, fontSize: 14, color: '#1C1C1E', fontFamily: 'Manrope_400Regular', marginBottom: 20, backgroundColor: '#F8F8F8' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  backLink: { fontSize: 14, color: '#007AFF', fontFamily: 'Manrope_600SemiBold' },
});
