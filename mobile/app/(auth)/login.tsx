import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '@shared/services/authService';
import { useAuth } from '@shared/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('提示', '请填写邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      const user = await login({ account: email, password });
      setUser(user);
      router.replace('/(tabs)/');
    } catch (e: unknown) {
      Alert.alert('登录失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          <Text className="text-3xl font-bold text-text-main mb-2">欢迎回来</Text>
          <Text className="text-text-sub mb-8">AI 影视承制平台</Text>

          <Text className="text-sm font-medium text-text-main mb-1">邮箱</Text>
          <TextInput
            className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
            placeholder="输入邮箱地址"
            placeholderTextColor="#8A8A9A"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text className="text-sm font-medium text-text-main mb-1">密码</Text>
          <TextInput
            className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-6 text-text-main"
            placeholder="输入密码"
            placeholderTextColor="#8A8A9A"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`rounded-full py-3.5 items-center mb-4 ${loading ? 'bg-blue-300' : 'bg-primary'}`}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? '登录中...' : '登录'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="items-center">
            <Text className="text-text-sub">
              还没有账号？<Text className="text-primary font-medium">立即注册</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
