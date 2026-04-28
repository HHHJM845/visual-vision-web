import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={56} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>支付成功</Text>
        <Text style={styles.subtitle}>款项已安全转入托管账户，项目正式启动！</Text>

        <View style={styles.infoCard}>
          <InfoRow label="支付金额" value="¥4,000" />
          <InfoRow label="收款方" value="创作者小明" />
          <InfoRow label="项目名称" value="科幻短片《星际迷途》" />
          <InfoRow label="里程碑" value="项目启动 & 初稿概念" />
          <InfoRow label="交易时间" value="2026-04-14 10:23" />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.primaryBtnText}>返回首页</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/commission/milestone')}>
          <Text style={styles.secondaryBtnText}>查看项目进度</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  label: { fontSize: 14, color: '#8A8A9A' },
  value: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8A8A9A', textAlign: 'center', marginBottom: 32, paddingHorizontal: 16 },
  infoCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#1DA1F2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: '#1DA1F2' },
});
