import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Role = 'creator' | 'client';

export default function RegisterScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('creator');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    if (!nickname || !email || !password) {
      Alert.alert('提示', '请填写所有必填项');
      return;
    }
    if (password.length < 6) {
      Alert.alert('提示', '密码至少6位');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('注册成功', '欢迎加入AI影视承制平台！', [
        { text: '开始使用', onPress: () => router.replace('/(tabs)') },
      ]);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>创建账号</Text>
            <View style={styles.backBtn} />
          </View>

          <Text style={styles.subtitle}>加入我们，开启您的AI影视创作之旅</Text>

          {/* Role selection */}
          <Text style={styles.label}>我是</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleCard, role === 'creator' && styles.roleCardActive]}
              onPress={() => setRole('creator')}
            >
              <Ionicons name="brush-outline" size={28} color={role === 'creator' ? '#1DA1F2' : '#8A8A9A'} />
              <Text style={[styles.roleTitle, role === 'creator' && styles.roleTitleActive]}>创作者</Text>
              <Text style={styles.roleDesc}>AI影视制作人</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleCard, role === 'client' && styles.roleCardActive]}
              onPress={() => setRole('client')}
            >
              <Ionicons name="business-outline" size={28} color={role === 'client' ? '#1DA1F2' : '#8A8A9A'} />
              <Text style={[styles.roleTitle, role === 'client' && styles.roleTitleActive]}>委托方</Text>
              <Text style={styles.roleDesc}>发布影视需求</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>昵称 *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color="#8A8A9A" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="请输入昵称"
              placeholderTextColor="#C0C8D4"
              value={nickname}
              onChangeText={setNickname}
            />
          </View>

          <Text style={styles.label}>邮箱 *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#8A8A9A" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="请输入邮箱"
              placeholderTextColor="#C0C8D4"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={styles.label}>密码 *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#8A8A9A" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="至少6位密码"
              placeholderTextColor="#C0C8D4"
              secureTextEntry={!showPwd}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8A8A9A" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerBtnText}>{loading ? '注册中...' : '立即注册'}</Text>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginHint}>已有账号？</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>去登录</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  kav: { flex: 1 },
  content: { flexGrow: 1, padding: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginHorizontal: -8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#8A8A9A', marginBottom: 24, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#1A1A2E', marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
    gap: 6,
  },
  roleCardActive: { borderColor: '#1DA1F2', backgroundColor: '#E8F4FD' },
  roleTitle: { fontSize: 15, fontWeight: '700', color: '#8A8A9A' },
  roleTitleActive: { color: '#1DA1F2' },
  roleDesc: { fontSize: 11, color: '#8A8A9A' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF0',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 52,
    backgroundColor: '#F8F9FA',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1A1A2E' },
  eyeBtn: { padding: 4 },
  registerBtn: {
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1DA1F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.7 },
  registerBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  loginHint: { fontSize: 14, color: '#8A8A9A' },
  loginLink: { fontSize: 14, color: '#1DA1F2', fontWeight: '600' },
});
