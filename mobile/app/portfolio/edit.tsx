import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopAppBar from '@components/TopAppBar';
import KineticButton from '@components/KineticButton';

export default function PortfolioEditScreen() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);

  const pickMedia = async () => {
    // expo-image-picker not installed; show placeholder
    Alert.alert('选择媒体', '请从相册选择视频或图片');
  };

  const submit = () => {
    if (!title) { Alert.alert('提示', '请填写作品标题'); return; }
    Alert.alert('发布成功', '作品已提交审核');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showBack title="编辑作品" />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Media upload area */}
        <TouchableOpacity style={styles.uploadArea} onPress={pickMedia} activeOpacity={0.8}>
          {mediaUri ? (
            <Text style={styles.uploadedText}>已选择媒体文件</Text>
          ) : (
            <>
              <MaterialCommunityIcons name="cloud-upload-outline" size={40} color="#C7C7CC" />
              <Text style={styles.uploadHint}>点击上传视频或图片</Text>
              <Text style={styles.uploadSub}>支持 MP4、MOV、JPG、PNG</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.label}>作品标题</Text>
          <TextInput
            style={styles.input}
            placeholder="给你的作品起个名字"
            placeholderTextColor="#C7C7CC"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>作品描述</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder="介绍制作过程、使用的AI工具等"
            placeholderTextColor="#C7C7CC"
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={4}
          />
        </View>

        <KineticButton label="发布作品" onPress={submit} fullWidth style={{ marginTop: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingTop: 56 + 16, paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  uploadArea: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E5EA', borderStyle: 'dashed', padding: 40, alignItems: 'center', gap: 8 },
  uploadHint: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#3A3A3C' },
  uploadSub: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  uploadedText: { fontSize: 14, color: '#34C759', fontFamily: 'Manrope_700Bold' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 4 },
  label: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 8, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1C1C1E', fontFamily: 'Manrope_400Regular', backgroundColor: '#F8F8F8' },
  inputMulti: { height: 100, textAlignVertical: 'top' },
});
