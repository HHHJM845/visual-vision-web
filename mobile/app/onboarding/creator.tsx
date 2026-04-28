import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const STYLES = ['写实', '唯美写意', '科技感', '水墨', '赛博朋克', '二次元', '纪录片', '实验风格'];
const TOOLS = ['Midjourney', 'Sora', 'Stable Diffusion', 'Runway', 'Kling', 'Pika', 'ComfyUI'];

export default function CreatorOnboardingScreen() {
  const router = useRouter();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleSubmit = () => {
    if (selectedStyles.length === 0) {
      Alert.alert('提示', '请至少选择一种擅长风格');
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
        <Text style={styles.headerTitle}>创作者认证</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Ionicons name="shield-checkmark-outline" size={32} color="#1DA1F2" />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>成为认证创作者</Text>
            <Text style={styles.bannerSub}>完成认证后可接受委托、获得更多曝光机会</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>擅长风格 *</Text>
          <View style={styles.chipGrid}>
            {STYLES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, selectedStyles.includes(s) && styles.chipActive]}
                onPress={() => toggle(selectedStyles, setSelectedStyles, s)}
              >
                <Text style={[styles.chipText, selectedStyles.includes(s) && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>常用工具</Text>
          <View style={styles.chipGrid}>
            {TOOLS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, selectedTools.includes(t) && styles.chipActive]}
                onPress={() => toggle(selectedTools, setSelectedTools, t)}
              >
                <Text style={[styles.chipText, selectedTools.includes(t) && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>创作者简介</Text>
          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={5}
            placeholder="介绍您的创作背景、代表作品、合作经历等..."
            placeholderTextColor="#C0C8D4"
            value={bio}
            onChangeText={setBio}
            textAlignVertical="top"
          />
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
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  chipActive: { backgroundColor: '#1DA1F2', borderColor: '#1DA1F2' },
  chipText: { fontSize: 13, color: '#8A8A9A', fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF' },
  textarea: {
    borderWidth: 1,
    borderColor: '#E8ECF0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1A1A2E',
    minHeight: 120,
  },
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
