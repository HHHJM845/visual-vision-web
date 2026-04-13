import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { register } from '@shared/services/authService';
import { useAuth } from '@shared/contexts/AuthContext';
import { UserRole } from '@shared/types/user';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password || !nickname) {
      Alert.alert('提示', '请填写所有字段');
      return;
    }
    setLoading(true);
    try {
      const user = await register({ email, password, nickname, role });
      setUser(user);
      router.replace(role === 'aigcer' ? '/onboarding/aigcer' : '/onboarding/client');
    } catch (e: unknown) {
      Alert.alert('注册失败', e instanceof Error ? e.message : '未知错误');
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
          <Text className="text-3xl font-bold text-text-main mb-2">创建账号</Text>
          <Text className="text-text-sub mb-8">加入 AI 影视承制平台</Text>

          <Text className="text-sm font-medium text-text-main mb-1">昵称</Text>
          <TextInput
            className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
            placeholder="你的昵称"
            placeholderTextColor="#8A8A9A"
            value={nickname}
            onChangeText={setNickname}
          />

          <Text className="text-sm font-medium text-text-main mb-1">邮箱</Text>
          <TextInput
            className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
            placeholder="邮箱地址"
            placeholderTextColor="#8A8A9A"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text className="text-sm font-medium text-text-main mb-1">密码</Text>
          <TextInput
            className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
            placeholder="至少 6 位"
            placeholderTextColor="#8A8A9A"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text className="text-sm font-medium text-text-main mb-2">我的角色</Text>
          <View className="flex-row gap-3 mb-6">
            {(['client', 'aigcer'] as UserRole[]).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                className={`flex-1 border rounded-xl py-3 items-center ${
                  role === r ? 'bg-primary border-primary' : 'bg-card border-gray-200'
                }`}
              >
                <Text className={`font-medium ${role === r ? 'text-white' : 'text-text-main'}`}>
                  {r === 'client' ? '🎬 委托方' : '🎨 AI制作者'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className={`rounded-full py-3.5 items-center mb-4 ${loading ? 'bg-blue-300' : 'bg-primary'}`}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? '注册中...' : '注册'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} className="items-center">
            <Text className="text-text-sub">
              已有账号？<Text className="text-primary font-medium">返回登录</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
