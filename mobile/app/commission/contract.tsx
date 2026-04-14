import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TopAppBar from '@components/TopAppBar';
import KineticButton from '@components/KineticButton';
import { mockContract } from '@shared/data/mockExtended';

export default function ContractScreen() {
  const c = mockContract;
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showBack title="合同与托管" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Escrow Status */}
        <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.escrowCard}>
          <Text style={styles.escrowLabel}>托管金额</Text>
          <Text style={styles.escrowAmount}>{c.escrowAmount}</Text>
          <View style={styles.escrowBadge}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#007AFF" />
            <Text style={styles.escrowBadgeText}>资金安全托管中</Text>
          </View>
        </LinearGradient>

        {/* Contract Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>合同信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>项目</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{c.commissionTitle}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>总金额</Text>
            <Text style={[styles.infoValue, styles.priceText]}>{c.amount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>签署时间</Text>
            <Text style={styles.infoValue}>{c.signedAt}</Text>
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>里程碑</Text>
          {c.milestones.map((m, i) => (
            <View key={i} style={styles.milestone}>
              <View style={[styles.milestoneDot, m.status === 'done' ? styles.dotDone : styles.dotPending]} />
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneLabel}>{m.label}</Text>
                <Text style={styles.milestoneDate}>{m.dueDate}</Text>
              </View>
              <Text style={[styles.milestoneAmount, m.status === 'done' && styles.amountDone]}>{m.amount}</Text>
            </View>
          ))}
        </View>

        <KineticButton label="下载合同" onPress={() => {}} variant="outline" fullWidth style={{ marginTop: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { flex: 1 },
  content: { paddingTop: 56 + 16, paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  escrowCard: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 4 },
  escrowLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Manrope_400Regular', marginBottom: 6 },
  escrowAmount: { fontSize: 36, fontFamily: 'SpaceGrotesk_700Bold', color: '#FFFFFF', marginBottom: 12 },
  escrowBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  escrowBadgeText: { fontSize: 12, color: '#007AFF', fontFamily: 'Manrope_700Bold' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 13, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  infoValue: { fontSize: 13, color: '#1C1C1E', fontFamily: 'Manrope_600SemiBold', flex: 1, textAlign: 'right' },
  priceText: { color: '#007AFF' },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  milestoneDot: { width: 10, height: 10, borderRadius: 5 },
  dotDone: { backgroundColor: '#34C759' },
  dotPending: { backgroundColor: '#E5E5EA' },
  milestoneInfo: { flex: 1 },
  milestoneLabel: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: '#1C1C1E' },
  milestoneDate: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  milestoneAmount: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#8A8A9A' },
  amountDone: { color: '#34C759' },
});
