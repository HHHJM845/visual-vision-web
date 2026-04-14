import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AvatarBadge from '@components/AvatarBadge';
import GlassCard from '@components/GlassCard';
import { mockWallet } from '@shared/data/mockExtended';

const MOCK_USER = { nickname: '创作者小明', bio: 'AI影视创作者 · Runway认证', verified: false };

const MENU_ITEMS = [
  { icon: 'file-document-outline', label: '我的合同', route: '/commission/contract' },
  { icon: 'folder-multiple-outline', label: '我的作品集', route: '/portfolio/1' },
  { icon: 'bell-outline', label: '通知中心', route: '/notification/1' },
  { icon: 'headset', label: '申诉与支持', route: '/support/appeal' },
  { icon: 'cog-outline', label: '设置', route: '/settings' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}>

        {/* Profile Header */}
        <View style={styles.header}>
          <AvatarBadge name={MOCK_USER.nickname} size={72} verified={MOCK_USER.verified} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{MOCK_USER.nickname}</Text>
            <Text style={styles.bio}>{MOCK_USER.bio}</Text>
            {!MOCK_USER.verified && (
              <TouchableOpacity style={styles.verifyCTA} onPress={() => router.push('/onboarding/role')}>
                <Text style={styles.verifyCTAText}>完成认证</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Wallet Card */}
        <View style={styles.px}>
          <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.walletCard}>
            <Text style={styles.walletLabel}>可用余额</Text>
            <Text style={styles.walletBalance}>{mockWallet.balance}</Text>
            <View style={styles.walletRow}>
              <View>
                <Text style={styles.walletSubLabel}>冻结中</Text>
                <Text style={styles.walletSubValue}>{mockWallet.frozen}</Text>
              </View>
              <View>
                <Text style={styles.walletSubLabel}>累计收入</Text>
                <Text style={styles.walletSubValue}>{mockWallet.totalEarned}</Text>
              </View>
              <View>
                <Text style={styles.walletSubLabel}>待提现</Text>
                <Text style={styles.walletSubValue}>{mockWallet.pendingPayout}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Menu */}
        <View style={[styles.px, styles.menuBox]}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuSep]}
              onPress={() => router.push(item.route as any)}
            >
              <MaterialCommunityIcons name={item.icon as any} size={22} color="#007AFF" />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, gap: 16 },
  headerInfo: { flex: 1 },
  name: { fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold', color: '#1C1C1E', marginBottom: 4 },
  bio: { fontSize: 13, fontFamily: 'Manrope_400Regular', color: '#8A8A9A', marginBottom: 8 },
  verifyCTA: { backgroundColor: '#E5F3FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  verifyCTAText: { fontSize: 12, color: '#007AFF', fontFamily: 'Manrope_700Bold' },
  px: { paddingHorizontal: 16 },
  walletCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Manrope_400Regular', marginBottom: 6 },
  walletBalance: { fontSize: 32, fontFamily: 'SpaceGrotesk_700Bold', color: '#FFFFFF', marginBottom: 16 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between' },
  walletSubLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Manrope_400Regular', textAlign: 'center', marginBottom: 4 },
  walletSubValue: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#FFFFFF', textAlign: 'center' },
  menuBox: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, gap: 12 },
  menuSep: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Manrope_600SemiBold', color: '#1C1C1E' },
});
