import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TopAppBar from '@components/TopAppBar';
import GlassCard from '@components/GlassCard';
import { mockAIEfficiency } from '@shared/data/mockExtended';

const AI_TOOLS = [
  { name: 'Sora', desc: 'OpenAI 文本转视频', color: '#007AFF', icon: 'video-outline' },
  { name: 'Runway', desc: '多模态视频生成', color: '#FF6B35', icon: 'camera-outline' },
  { name: 'Kling', desc: '快手可灵，国产视频生成', color: '#8B5CF6', icon: 'movie-open-outline' },
  { name: 'ComfyUI', desc: '节点式工作流', color: '#10B981', icon: 'sitemap-outline' },
];

const TRENDS = [
  { id: 1, title: 'AI影视进入"亿级制作"时代', hot: '18.2k', tag: '行业' },
  { id: 2, title: 'Sora v2 发布，60s视频成本降90%', hot: '12.4k', tag: '技术' },
  { id: 3, title: '国产AI模型Kling 2.0开放API', hot: '9.8k', tag: '工具' },
  { id: 4, title: '承制平台月交易额突破1亿元', hot: '7.2k', tag: '平台' },
];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showLogo />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: 56 + insets.top }]}>

        {/* AI Efficiency Banner */}
        <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.efficiencyBanner}>
          <View style={styles.effRow}>
            <View>
              <Text style={styles.effLabel}>AI 生产提速</Text>
              <Text style={styles.effValue}>{mockAIEfficiency.productionSpeed}</Text>
            </View>
            <View>
              <Text style={styles.effLabel}>质量评分</Text>
              <Text style={styles.effValue}>{mockAIEfficiency.qualityScore}</Text>
            </View>
            <View>
              <Text style={styles.effLabel}>使用工具</Text>
              <Text style={styles.effValue}>{mockAIEfficiency.toolsUsed.length}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* AI Tools Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 工具矩阵</Text>
          <View style={styles.toolsGrid}>
            {AI_TOOLS.map(tool => (
              <GlassCard key={tool.name} style={styles.toolCard}>
                <View style={[styles.toolIcon, { backgroundColor: tool.color + '20' }]}>
                  <MaterialCommunityIcons name={tool.icon as any} size={22} color={tool.color} />
                </View>
                <Text style={styles.toolName}>{tool.name}</Text>
                <Text style={styles.toolDesc} numberOfLines={2}>{tool.desc}</Text>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* AI Trends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 行业趋势</Text>
          {TRENDS.map(t => (
            <TouchableOpacity key={t.id} style={styles.trendItem} activeOpacity={0.8}>
              <View style={styles.trendLeft}>
                <View style={styles.trendTag}>
                  <Text style={styles.trendTagText}>{t.tag}</Text>
                </View>
                <Text style={styles.trendTitle}>{t.title}</Text>
              </View>
              <View style={styles.trendRight}>
                <MaterialCommunityIcons name="fire" size={14} color="#FF3B30" />
                <Text style={styles.hotText}>{t.hot}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingBottom: 16 },
  efficiencyBanner: { margin: 16, borderRadius: 16, padding: 20 },
  effRow: { flexDirection: 'row', justifyContent: 'space-around' },
  effLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'Manrope_400Regular', textAlign: 'center', marginBottom: 4 },
  effValue: { fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold', color: '#FFFFFF', textAlign: 'center' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 12 },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toolCard: { width: '47%' },
  toolIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  toolName: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 4 },
  toolDesc: { fontSize: 11, fontFamily: 'Manrope_400Regular', color: '#8A8A9A', lineHeight: 16 },
  trendItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trendLeft: { flex: 1, marginRight: 12 },
  trendTag: { backgroundColor: '#E5F3FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  trendTagText: { fontSize: 11, color: '#007AFF', fontFamily: 'Manrope_700Bold' },
  trendTitle: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: '#1C1C1E', lineHeight: 20 },
  trendRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hotText: { fontSize: 13, color: '#FF3B30', fontFamily: 'Manrope_700Bold' },
});
