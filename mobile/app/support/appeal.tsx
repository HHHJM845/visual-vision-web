import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, StatusBar, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopAppBar from '@components/TopAppBar';
import KineticButton from '@components/KineticButton';

const APPEAL_TYPES = ['付款纠纷', '质量争议', '违约问题', '账号问题', '其他'];

export default function AppealSupportScreen() {
  const [type, setType] = useState('');
  const [desc, setDesc] = useState('');

  const submit = () => {
    if (!type || !desc) { Alert.alert('提示', '请选择问题类型并描述'); return; }
    Alert.alert('申诉已提交', '我们将在48小时内处理您的申诉，请保持通知开启。');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showBack title="申诉与支持" />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>问题类型</Text>
          <View style={styles.typeGrid}>
            {APPEAL_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, type === t && styles.typeChipSelected]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeText, type === t && styles.typeTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>问题描述</Text>
          <TextInput
            style={styles.textarea}
            placeholder="请详细描述您遇到的问题，包括相关订单号、截图等信息..."
            placeholderTextColor="#C7C7CC"
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={6}
          />
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={16} color="#007AFF" />
          <Text style={styles.infoText}>申诉处理时间：工作日 48 小时内，节假日顺延</Text>
        </View>

        <KineticButton label="提交申诉" onPress={submit} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingTop: 56 + 16, paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  sectionLabel: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F5', borderWidth: 1, borderColor: '#E5E5EA' },
  typeChipSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  typeText: { fontSize: 13, fontFamily: 'Manrope_600SemiBold', color: '#3A3A3C' },
  typeTextSelected: { color: '#FFFFFF' },
  textarea: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 12, fontSize: 14, color: '#1C1C1E', fontFamily: 'Manrope_400Regular', height: 130, textAlignVertical: 'top', backgroundColor: '#F8F8F8' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#E5F3FF', borderRadius: 12, padding: 12 },
  infoText: { flex: 1, fontSize: 13, color: '#007AFF', fontFamily: 'Manrope_400Regular', lineHeight: 18 },
});
