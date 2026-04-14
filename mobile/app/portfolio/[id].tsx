import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import TopAppBar from '@components/TopAppBar';
import AvatarBadge from '@components/AvatarBadge';
import { mockSampleWorks } from '@shared/data/mockExtended';

const { width } = Dimensions.get('window');

export default function PortfolioDetailScreen() {
  const router = useRouter();
  const work = mockSampleWorks[0];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <TopAppBar showBack title={work.title} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Video placeholder */}
        <View style={styles.videoThumb}>
          <MaterialCommunityIcons name="play-circle" size={64} color="rgba(255,255,255,0.9)" />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="eye-outline" size={16} color="#8A8A9A" />
            <Text style={styles.statText}>{work.views}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="heart-outline" size={16} color="#8A8A9A" />
            <Text style={styles.statText}>{work.likes}</Text>
          </View>
        </View>

        {/* Author */}
        <View style={styles.authorRow}>
          <AvatarBadge name="创作者小明" size={40} verified />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>创作者小明</Text>
            <Text style={styles.authorBio}>AI影视创作者</Text>
          </View>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followBtnText}>关注</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.descCard}>
          <Text style={styles.descTitle}>作品介绍</Text>
          <Text style={styles.desc}>使用 Sora + ComfyUI 生成，融合星际概念与中国科幻美学，制作周期 3 天，累计渲染时长 48 小时。</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingTop: 56, paddingBottom: 32 },
  videoThumb: { width, height: width * 0.56, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 20, padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, color: '#8A8A9A', fontFamily: 'Manrope_600SemiBold' },
  authorRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', gap: 12, marginTop: 8, borderRadius: 16, marginHorizontal: 16 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E' },
  authorBio: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  followBtn: { backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  followBtnText: { fontSize: 13, color: '#FFFFFF', fontFamily: 'Manrope_700Bold' },
  descCard: { margin: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  descTitle: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 8 },
  desc: { fontSize: 14, color: '#3A3A3C', fontFamily: 'Manrope_400Regular', lineHeight: 22 },
});
