import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRole } from '@shared/contexts/RoleContext';
import StatsGrid from '@components/StatsGrid';
import KineticButton from '@components/KineticButton';

const MOCK_USER = { nickname: '创作者小明', verified: false, avatarInitial: '明' };

const creatorStats = [
  { label: '应征中', value: 3, icon: 'file-send-outline' },
  { label: '进行中', value: 2, icon: 'play-circle-outline' },
  { label: '已完成', value: 18, icon: 'check-circle-outline' },
  { label: '累计收入', value: '¥4,200', icon: 'currency-cny', color: '#007AFF' },
];
const clientStats = [
  { label: '已发布', value: 5, icon: 'bullhorn-outline' },
  { label: '招募中', value: 2, icon: 'account-search-outline' },
  { label: '进行中', value: 1, icon: 'play-circle-outline' },
  { label: '待验收', value: 1, icon: 'clock-alert-outline', color: '#FF9500' },
];

const creatorApps = [
  { id: 1, title: '科幻短片《星际迷途》AI影像制作', status: '进行中', progress: 65, price: '¥16,000' },
  { id: 2, title: '古风仙侠MV《问道》AI特效', status: '审核中', progress: 30, price: '¥5,500' },
];
const clientProjects = [
  { id: 1, title: '科幻短片《星际迷途》', applicants: 12, deadline: '2026-05-15', status: '招募中' },
  { id: 2, title: '产品宣传短片制作', applicants: 6, deadline: '2026-04-30', status: '进行中' },
];

const statusColor: Record<string, { bg: string; text: string }> = {
  '进行中': { bg: '#E5F3FF', text: '#007AFF' },
  '审核中': { bg: '#FFF3CD', text: '#856404' },
  '招募中': { bg: '#D1F2D1', text: '#1A7C3E' },
  '已完成': { bg: '#F3F4F5', text: '#3A3A3C' },
};

export default function WorkbenchScreen() {
  const router = useRouter();
  const { isCreator, setRole } = useRole();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>你好，{MOCK_USER.nickname}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, MOCK_USER.verified ? styles.badgeV : styles.badgeU]}>
              <Text style={[styles.badgeT, { color: MOCK_USER.verified ? '#FFFFFF' : '#8A8A9A' }]}>
                {MOCK_USER.verified ? '已认证' : '未认证'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/notification/1')} style={styles.notifBtn}>
          <MaterialCommunityIcons name="bell-outline" size={24} color="#1C1C1E" />
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>

      {/* Role switcher */}
      <View style={styles.roleSwitcher}>
        <TouchableOpacity
          style={[styles.roleBtn, isCreator && styles.roleBtnActive]}
          onPress={() => setRole('creator')}
        >
          <Text style={[styles.roleBtnText, isCreator && styles.roleBtnTextActive]}>创作者</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, !isCreator && styles.roleBtnActive]}
          onPress={() => setRole('client')}
        >
          <Text style={[styles.roleBtnText, !isCreator && styles.roleBtnTextActive]}>委托方</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Certification banner */}
        {!MOCK_USER.verified && (
          <LinearGradient colors={['#007AFF', '#00C6FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.banner}>
            <MaterialCommunityIcons name="shield-check-outline" size={20} color="#FFFFFF" />
            <Text style={styles.bannerText}>完成认证，解锁更多功能</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        )}

        {/* Stats */}
        <View style={styles.section}>
          <StatsGrid items={isCreator ? creatorStats : clientStats} />
        </View>

        {/* Recent list */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{isCreator ? '我的申请' : '我的企划'}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/plaza')}>
              <Text style={styles.seeAll}>查看全部</Text>
            </TouchableOpacity>
          </View>

          {isCreator ? creatorApps.map(app => {
            const sc = statusColor[app.status] ?? { bg: '#F3F4F5', text: '#3A3A3C' };
            return (
              <TouchableOpacity key={app.id} style={styles.card} onPress={() => router.push(`/commission/${app.id}`)}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{app.title}</Text>
                  <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{app.status}</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${app.progress}%` as any }]} />
                </View>
                <View style={styles.cardBottom}>
                  <Text style={styles.progressText}>{app.progress}% 完成</Text>
                  <Text style={styles.priceText}>{app.price}</Text>
                </View>
              </TouchableOpacity>
            );
          }) : clientProjects.map(p => {
            const sc = statusColor[p.status] ?? { bg: '#F3F4F5', text: '#3A3A3C' };
            return (
              <TouchableOpacity key={p.id} style={styles.card} onPress={() => router.push(`/commission/${p.id}`)}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{p.title}</Text>
                  <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{p.status}</Text>
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <View style={styles.meta}>
                    <MaterialCommunityIcons name="account-multiple-outline" size={13} color="#8A8A9A" />
                    <Text style={styles.metaText}>{p.applicants} 人申请</Text>
                  </View>
                  <View style={styles.meta}>
                    <MaterialCommunityIcons name="clock-outline" size={13} color="#8A8A9A" />
                    <Text style={styles.metaText}>{p.deadline}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {!isCreator && (
          <View style={styles.publishSection}>
            <KineticButton label="发布新企划" onPress={() => router.push('/commission/new')} fullWidth />
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  greeting: { fontSize: 18, fontFamily: 'Manrope_700Bold', color: '#1C1C1E' },
  badgeRow: { flexDirection: 'row', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeV: { backgroundColor: '#007AFF' },
  badgeU: { backgroundColor: '#F3F4F5' },
  badgeT: { fontSize: 11, fontFamily: 'Manrope_700Bold' },
  notifBtn: { padding: 4, position: 'relative' },
  dot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#FFFFFF' },
  roleSwitcher: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 12, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  roleBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center', backgroundColor: '#F3F4F5' },
  roleBtnActive: { backgroundColor: '#007AFF' },
  roleBtnText: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#8A8A9A' },
  roleBtnTextActive: { color: '#FFFFFF' },
  banner: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 0, padding: 14, borderRadius: 12, gap: 8 },
  bannerText: { flex: 1, color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 14 },
  section: { padding: 16, paddingBottom: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: '#1C1C1E' },
  seeAll: { fontSize: 13, color: '#007AFF', fontFamily: 'Manrope_600SemiBold' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { flex: 1, fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginRight: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: 'Manrope_700Bold' },
  progressBar: { height: 4, backgroundColor: '#F3F4F5', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: '#007AFF', borderRadius: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  priceText: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#007AFF' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  publishSection: { padding: 16, paddingTop: 20 },
});
