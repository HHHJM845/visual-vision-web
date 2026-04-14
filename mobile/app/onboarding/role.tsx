import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRole } from '@shared/contexts/RoleContext';
import KineticButton from '@components/KineticButton';

export default function RoleSelectScreen() {
  const router = useRouter();
  const { setRole } = useRole();

  const choose = (role: 'creator' | 'client') => {
    setRole(role);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <View style={styles.content}>
        <Text style={styles.headline}>你是？</Text>
        <Text style={styles.sub}>选择你的身份，开始探索跃然承制</Text>

        <TouchableOpacity style={styles.card} onPress={() => choose('creator')} activeOpacity={0.9}>
          <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.iconBox}>
            <MaterialCommunityIcons name="palette-outline" size={36} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>创作者</Text>
            <Text style={styles.cardDesc}>接受委托、创作AI影视内容、展示作品</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => choose('client')} activeOpacity={0.9}>
          <LinearGradient colors={['#FF6B35', '#FF9500']} style={styles.iconBox}>
            <MaterialCommunityIcons name="briefcase-outline" size={36} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>委托方</Text>
            <Text style={styles.cardDesc}>发布企划、寻找创作者、管理项目进度</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#C7C7CC" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  headline: { fontSize: 32, fontFamily: 'SpaceGrotesk_700Bold', color: '#1C1C1E', marginBottom: 8 },
  sub: { fontSize: 15, fontFamily: 'Manrope_400Regular', color: '#8A8A9A', marginBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  iconBox: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 4 },
  cardDesc: { fontSize: 13, fontFamily: 'Manrope_400Regular', color: '#8A8A9A', lineHeight: 18 },
});
