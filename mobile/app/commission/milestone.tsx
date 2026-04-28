import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const MILESTONES = [
  { id: 1, title: '项目启动 & 初稿概念', deadline: '2026-04-20', status: 'completed', payment: '¥4,000' },
  { id: 2, title: '风格确认 & 关键帧制作', deadline: '2026-04-30', status: 'in_progress', payment: '¥4,000' },
  { id: 3, title: '完整影像输出', deadline: '2026-05-10', status: 'pending', payment: '¥5,000' },
  { id: 4, title: '修改 & 最终交付', deadline: '2026-05-15', status: 'pending', payment: '¥3,000' },
];

export default function MilestoneScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>项目里程碑</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>¥16,000</Text>
            <Text style={styles.summaryLabel}>总报酬</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#34C759' }]}>¥4,000</Text>
            <Text style={styles.summaryLabel}>已结算</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#1DA1F2' }]}>¥12,000</Text>
            <Text style={styles.summaryLabel}>待结算</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {MILESTONES.map((m, idx) => (
            <View key={m.id} style={styles.milestoneRow}>
              {/* Line */}
              <View style={styles.lineCol}>
                <View style={[styles.dot, m.status === 'completed' ? styles.dotDone : m.status === 'in_progress' ? styles.dotActive : styles.dotPending]} />
                {idx < MILESTONES.length - 1 && <View style={[styles.line, m.status === 'completed' ? styles.lineDone : styles.linePending]} />}
              </View>

              {/* Content */}
              <View style={[styles.milestoneCard, m.status === 'in_progress' && styles.milestoneCardActive]}>
                <View style={styles.milestoneTop}>
                  <Text style={styles.milestoneTitle}>{m.title}</Text>
                  <MilestoneStatusBadge status={m.status} />
                </View>
                <View style={styles.milestoneMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color="#8A8A9A" />
                    <Text style={styles.metaText}>{m.deadline}</Text>
                  </View>
                  <Text style={styles.milestonePayment}>{m.payment}</Text>
                </View>
                {m.status === 'in_progress' && (
                  <TouchableOpacity style={styles.submitWorkBtn}>
                    <Text style={styles.submitWorkBtnText}>提交作品</Text>
                  </TouchableOpacity>
                )}
                {m.status === 'completed' && (
                  <View style={styles.completedRow}>
                    <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                    <Text style={styles.completedText}>已完成并结款</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MilestoneStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    completed: { bg: '#D4EDDA', text: '#155724', label: '已完成' },
    in_progress: { bg: '#CCE5FF', text: '#004085', label: '进行中' },
    pending: { bg: '#E2E3E5', text: '#6C757D', label: '未开始' },
  };
  const s = map[status] || map.pending;
  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: s.text }}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
  },
  backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: '#1A1A2E' },
  scroll: { flex: 1 },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  summaryLabel: { fontSize: 12, color: '#8A8A9A', marginTop: 4 },
  summaryDivider: { width: 1, backgroundColor: '#E8ECF0' },
  timeline: { paddingHorizontal: 16 },
  milestoneRow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  lineCol: { width: 20, alignItems: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, marginTop: 16, zIndex: 1 },
  dotDone: { backgroundColor: '#34C759' },
  dotActive: { backgroundColor: '#1DA1F2', borderWidth: 3, borderColor: '#E8F4FD' },
  dotPending: { backgroundColor: '#E2E3E5' },
  line: { width: 2, flex: 1, minHeight: 20 },
  lineDone: { backgroundColor: '#34C759' },
  linePending: { backgroundColor: '#E2E3E5' },
  milestoneCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneCardActive: {
    borderWidth: 1.5,
    borderColor: '#1DA1F2',
  },
  milestoneTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  milestoneTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1A2E', lineHeight: 20 },
  milestoneMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#8A8A9A' },
  milestonePayment: { fontSize: 14, fontWeight: '700', color: '#1DA1F2' },
  submitWorkBtn: {
    backgroundColor: '#1DA1F2',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitWorkBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  completedText: { fontSize: 12, color: '#34C759', fontWeight: '500' },
});
