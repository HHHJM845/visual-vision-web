import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TopAppBar from '@components/TopAppBar';
import KineticButton from '@components/KineticButton';

const CATEGORIES = ['科幻', '古风', '商业', '艺术', '游戏', '纪录', '其他'];
const STYLES = ['写实', '唯美', '科技感', '水墨', '赛博朋克', '不限'];
const PURPOSES = ['商业用途', '个人用途'];

export default function NewCommissionScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    style: '',
    priceMin: '',
    priceMax: '',
    deadline: '',
    purpose: '商业用途',
    format: '',
    resolution: '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = () => {
    if (!form.title || !form.description || !form.category) {
      Alert.alert('提示', '请填写标题、描述和类别');
      return;
    }
    Alert.alert('发布成功', '您的企划已成功发布！', [
      { text: '确定', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showBack title="发布企划" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>基本信息</Text>

          <Text style={styles.label}>企划标题 *</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入企划标题"
            placeholderTextColor="#C7C7CC"
            value={form.title}
            onChangeText={v => set('title', v)}
          />

          <Text style={styles.label}>详细描述 *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={5}
            placeholder="详细描述您的需求、风格参考、交付要求等..."
            placeholderTextColor="#C7C7CC"
            value={form.description}
            onChangeText={v => set('description', v)}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>预算与时间</Text>

          <Text style={styles.label}>报酬区间</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="最低 (如 5000)"
              placeholderTextColor="#C7C7CC"
              keyboardType="numeric"
              value={form.priceMin}
              onChangeText={v => set('priceMin', v)}
            />
            <Text style={styles.rangeDash}>—</Text>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="最高 (如 10000)"
              placeholderTextColor="#C7C7CC"
              keyboardType="numeric"
              value={form.priceMax}
              onChangeText={v => set('priceMax', v)}
            />
          </View>

          <Text style={styles.label}>截止日期</Text>
          <TextInput
            style={styles.input}
            placeholder="如：2026-06-30"
            placeholderTextColor="#C7C7CC"
            value={form.deadline}
            onChangeText={v => set('deadline', v)}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>要求</Text>

          <Text style={styles.label}>影片类别 *</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, form.category === c && styles.chipActive]}
                onPress={() => set('category', c)}
              >
                <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>风格要求</Text>
          <View style={styles.chipRow}>
            {STYLES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, form.style === s && styles.chipActive]}
                onPress={() => set('style', s)}
              >
                <Text style={[styles.chipText, form.style === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>用途</Text>
          <View style={styles.chipRow}>
            {PURPOSES.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, form.purpose === p && styles.chipActive]}
                onPress={() => set('purpose', p)}
              >
                <Text style={[styles.chipText, form.purpose === p && styles.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>交付格式</Text>
          <TextInput
            style={styles.input}
            placeholder="如：MP4, MOV, 4K"
            placeholderTextColor="#C7C7CC"
            value={form.format}
            onChangeText={v => set('format', v)}
          />
        </View>

        <KineticButton label="发布企划" onPress={handleSubmit} fullWidth style={{ marginTop: 8 }} />
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { flex: 1 },
  content: { paddingTop: 56 + 16, paddingHorizontal: 16, gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  sectionLabel: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 14 },
  label: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 8, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1C1C1E',
    fontFamily: 'Manrope_400Regular',
    backgroundColor: '#F8F8F8',
  },
  textarea: { minHeight: 120, paddingTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  halfInput: { flex: 1 },
  rangeDash: { fontSize: 16, color: '#8A8A9A' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F5',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#8A8A9A', fontFamily: 'Manrope_600SemiBold' },
  chipTextActive: { color: '#FFFFFF' },
});
