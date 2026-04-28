import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const MOCK_MESSAGES = [
  { id: '1', text: '您好！看到您的申请了，作品集很不错。', sender: 'other', time: '10:00' },
  { id: '2', text: '感谢关注！我对这个科幻短片项目非常感兴趣。', sender: 'me', time: '10:02' },
  { id: '3', text: '您有没有类似风格的作品可以参考？', sender: 'other', time: '10:05' },
  { id: '4', text: '有的，我去年做过一个宇宙主题的AI短片，获得了XX大赛的优秀奖。', sender: 'me', time: '10:07' },
  { id: '5', text: '很好！期望报酬可以谈吗？我们预算在14000-16000之间。', sender: 'other', time: '10:10' },
  { id: '6', text: '可以的，15000我能接受，可以保证按时交付。', sender: 'me', time: '10:12' },
  { id: '7', text: '好的，我们决定接受您的申请！请尽快开始项目启动。', sender: 'other', time: '10:15' },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const flatRef = useRef<FlatList>(null);

  const send = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: String(Date.now()),
      text: input.trim(),
      sender: 'me' as const,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>星辰影业</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.msgRow, item.sender === 'me' && styles.msgRowMe]}>
              {item.sender === 'other' && (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>星</Text>
                </View>
              )}
              <View style={[styles.bubble, item.sender === 'me' ? styles.bubbleMe : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, item.sender === 'me' && styles.bubbleTextMe]}>
                  {item.text}
                </Text>
                <Text style={[styles.timeText, item.sender === 'me' && styles.timeTextMe]}>
                  {item.time}
                </Text>
              </View>
            </View>
          )}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="输入消息..."
            placeholderTextColor="#C0C8D4"
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send}>
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  kav: { flex: 1 },
  list: { padding: 16, gap: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMe: { flexDirection: 'row-reverse' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1DA1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  bubble: {
    maxWidth: '70%',
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 14,
  },
  bubbleOther: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: '#1DA1F2', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: '#1A1A2E', lineHeight: 20 },
  bubbleTextMe: { color: '#FFFFFF' },
  timeText: { fontSize: 10, color: '#8A8A9A', marginTop: 4 },
  timeTextMe: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF0',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A2E',
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1DA1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
