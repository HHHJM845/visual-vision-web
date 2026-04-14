import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TopAppBar from '@components/TopAppBar';
import AvatarBadge from '@components/AvatarBadge';

const MOCK_CONVOS = [
  { id: '1', name: '委托方：星河影业', lastMsg: '样片看起来很棒！继续加油', time: '刚刚', unread: 2, online: true },
  { id: '2', name: '平台客服', lastMsg: '您的认证申请已通过审核', time: '10分钟前', unread: 1, online: false },
  { id: '3', name: '创作者：云上制作', lastMsg: '合同已签署，请查收', time: '1小时前', unread: 0, online: true },
  { id: '4', name: '委托方：光影科技', lastMsg: '期待您的方案', time: '昨天', unread: 0, online: false },
];

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar title="消息" />
      <FlatList
        data={MOCK_CONVOS}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingTop: 56 + insets.top }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => router.push(`/chat/${item.id}`)} activeOpacity={0.9}>
            <AvatarBadge name={item.name} size={48} online={item.online} />
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <View style={styles.msgRow}>
                <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMsg}</Text>
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5EA', marginLeft: 76 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', flex: 1 },
  time: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  msgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMsg: { fontSize: 13, color: '#8A8A9A', fontFamily: 'Manrope_400Regular', flex: 1 },
  unreadBadge: { backgroundColor: '#007AFF', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginLeft: 8 },
  unreadText: { fontSize: 11, color: '#FFFFFF', fontFamily: 'Manrope_700Bold' },
});
