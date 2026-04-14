import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopAppBar from '@components/TopAppBar';
import KineticButton from '@components/KineticButton';

const MOCK_SAMPLES = [
  { id: '1', title: '样片 A — 前10秒', duration: '0:10', status: 'pending' },
  { id: '2', title: '样片 B — 氛围版', duration: '0:15', status: 'pending' },
];

export default function SampleReviewScreen() {
  const [approved, setApproved] = useState<string[]>([]);

  const toggle = (id: string) => {
    setApproved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submit = () => {
    if (approved.length === 0) { Alert.alert('提示', '请至少选择一个样片'); return; }
    Alert.alert('验收完成', `已批准 ${approved.length} 个样片，款项将在24小时内释放`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showBack title="样片验收" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>请审核以下样片，选择满意的版本进行确认验收</Text>

        {MOCK_SAMPLES.map(s => (
          <TouchableOpacity key={s.id} style={[styles.sampleCard, approved.includes(s.id) && styles.sampleCardSelected]} onPress={() => toggle(s.id)} activeOpacity={0.9}>
            <View style={styles.sampleThumb}>
              <MaterialCommunityIcons name="play-circle-outline" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.sampleInfo}>
              <Text style={styles.sampleTitle}>{s.title}</Text>
              <Text style={styles.sampleDuration}>{s.duration}</Text>
            </View>
            <MaterialCommunityIcons
              name={approved.includes(s.id) ? 'check-circle' : 'circle-outline'}
              size={24}
              color={approved.includes(s.id) ? '#007AFF' : '#C7C7CC'}
            />
          </TouchableOpacity>
        ))}

        <KineticButton label={`确认验收 (${approved.length})`} onPress={submit} fullWidth style={{ marginTop: 16 }} disabled={approved.length === 0} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingTop: 56 + 16, paddingHorizontal: 16, paddingBottom: 32 },
  hint: { fontSize: 14, color: '#8A8A9A', fontFamily: 'Manrope_400Regular', marginBottom: 20, lineHeight: 20 },
  sampleCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderColor: 'transparent' },
  sampleCardSelected: { borderColor: '#007AFF', backgroundColor: '#F0F7FF' },
  sampleThumb: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center' },
  sampleInfo: { flex: 1 },
  sampleTitle: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 4 },
  sampleDuration: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
});
