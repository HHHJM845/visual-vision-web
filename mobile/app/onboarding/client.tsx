import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type VerifyType = 'realname' | 'enterprise';

export default function ClientOnboardingScreen() {
  const router = useRouter();
  const [verifyType, setVerifyType] = useState<VerifyType>('realname');
  const [realName, setRealName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (verifyType === 'realname' && (!realName || !idNumber)) {
      Alert.alert('提示', '请填写姓名和身份证号');
      return;
    }
    if (verifyType === 'enterprise' && (!companyName || !businessLicense)) {
      Alert.alert('提示', '请填写公司名称和营业执照号');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('认证申请已提交', '我们将在1-3个工作日内完成审核，请留意通知。', [
        { text: '确定', onPress: () => router.back() },
      ]);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>委托方认证</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Ionicons name="business-outline" size={32} color="#1DA1F2" />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>成为认证委托方</Text>
            <Text style={styles.bannerSub}>完成认证后可发布企划、获得更高信任度</Text>
          </View>
        </View>

        {/* Verify type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>认证类型</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeCard, verifyType === 'realname' && styles.typeCardActive]}
              onPress={() => setVerifyType('realname')}
            >
              <Ionicons name="person-outline" size={24} color={verifyType === 'realname' ? '#1DA1F2' : '#8A8A9A'} />
              <Text style={[styles.typeTitle, verifyType === 'realname' && styles.typeTitleActive]}>实名认证</Text>
              <Text style={styles.typeDesc}>个人用户</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeCard, verifyType === 'enterprise' && styles.typeCardActive]}
              onPress={() => setVerifyType('enterprise')}
            >
              <Ionicons name="business-outline" size={24} color={verifyType === 'enterprise' ? '#1DA1F2' : '#8A8A9A'} />
              <Text style={[styles.typeTitle, verifyType === 'enterprise' && styles.typeTitleActive]}>企业认证</Text>
              <Text style={styles.typeDesc}>企业用户</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        <View style={styles.section}>
          {verifyType === 'realname' ? (
            <>
              <Text style={styles.label}>真实姓名 *</Text>
              <TextInput style={styles.input} placeholder="请输入真实姓名" placeholderTextColor="#C0C8D4" value={realName} onChangeText={setRealName} />
              <Text style={styles.label}>身份证号 *</Text>
              <TextInput style={styles.input} placeholder="请输入身份证号" placeholderTextColor="#C0C8D4" value={idNumber} onChangeText={setIdNumber} />
            </>
          ) : (
            <>
              <Text style={styles.label}>公司名称 *</Text>
              <TextInput style={styles.input} placeholder="请输入公司全称" placeholderTextColor="#C0C8D4" value={companyName} onChangeText={setCompanyName} />
              <Text style={styles.label}>营业执照注册号 *</Text>
              <TextInput style={styles.input} placeholder="请输入营业执照号" placeholderTextColor="#C0C8D4" value={businessLicense} onChangeText={setBusinessLicense} />
            </>
          )}

          <View style={styles.hint}>
            <Ionicons name="lock-closed-outline" size={14} color="#8A8A9A" />
            <Text style={styles.hintText}>您的信息将严格保密，仅用于身份验证</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>{loading ? '提交中...' : '提交认证申请'}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  bannerSub: { fontSize: 12, color: '#8A8A9A', marginTop: 4 },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
    gap: 6,
  },
  typeCardActive: { borderColor: '#1DA1F2', backgroundColor: '#E8F4FD' },
  typeTitle: { fontSize: 14, fontWeight: '700', color: '#8A8A9A' },
  typeTitleActive: { color: '#1DA1F2' },
  typeDesc: { fontSize: 11, color: '#8A8A9A' },
  label: { fontSize: 13, fontWeight: '600', color: '#1A1A2E', marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E8ECF0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A2E',
  },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  hintText: { fontSize: 12, color: '#8A8A9A' },
  submitBtn: {
    backgroundColor: '#1DA1F2',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
