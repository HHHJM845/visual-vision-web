import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import KineticButton from '@components/KineticButton';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); router.replace('/(tabs)'); }, 800);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.logoBox}>
              <MaterialCommunityIcons name="movie-open-play" size={38} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.appName}>跃然承制</Text>
            <Text style={styles.slogan}>AI影视承制平台</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>邮箱</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={18} color="#8A8A9A" />
              <TextInput
                style={styles.input}
                placeholder="请输入邮箱"
                placeholderTextColor="#C7C7CC"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>密码</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={18} color="#8A8A9A" />
              <TextInput
                style={styles.input}
                placeholder="请输入密码"
                placeholderTextColor="#C7C7CC"
                secureTextEntry={!showPwd}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)}>
                <MaterialCommunityIcons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8A8A9A" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>忘记密码？</Text>
            </TouchableOpacity>

            <KineticButton label={loading ? '登录中...' : '登录'} onPress={handleLogin} disabled={loading} fullWidth />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>或</Text>
              <View style={styles.divider} />
            </View>

            <KineticButton
              label="没有账号？立即注册"
              onPress={() => router.push('/(auth)/register')}
              variant="outline"
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  kav: { flex: 1 },
  content: { flexGrow: 1, padding: 24 },
  logoSection: { alignItems: 'center', paddingTop: 48, paddingBottom: 40 },
  logoBox: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  appName: { fontSize: 26, fontFamily: 'SpaceGrotesk_700Bold', color: '#1C1C1E', marginBottom: 6 },
  slogan: { fontSize: 14, fontFamily: 'Manrope_400Regular', color: '#8A8A9A' },
  form: {},
  label: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, height: 52, backgroundColor: '#FFFFFF', gap: 10 },
  input: { flex: 1, fontSize: 15, color: '#1C1C1E', fontFamily: 'Manrope_400Regular' },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { fontSize: 13, color: '#007AFF', fontFamily: 'Manrope_600SemiBold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5EA' },
  dividerText: { fontSize: 13, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
});
