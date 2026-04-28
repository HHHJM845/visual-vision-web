import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, StatusBar, Alert, Modal, Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [logoutModal, setLogoutModal] = useState(false);

  const SECTIONS = [
    {
      title: '账号',
      items: [
        { icon: 'person-outline', label: '个人信息', onPress: () => {} },
        { icon: 'lock-closed-outline', label: '修改密码', onPress: () => {} },
        { icon: 'phone-portrait-outline', label: '绑定手机号', onPress: () => {} },
      ],
    },
    {
      title: '通知',
      items: [
        {
          icon: 'notifications-outline',
          label: '推送通知',
          right: <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: '#1DA1F2' }} />,
          onPress: () => {},
        },
      ],
    },
    {
      title: '关于',
      items: [
        { icon: 'document-text-outline', label: '用户协议', onPress: () => {} },
        { icon: 'shield-outline', label: '隐私政策', onPress: () => {} },
        { icon: 'information-circle-outline', label: '版本信息', note: 'v1.0.0', onPress: () => {} },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, idx < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={item.onPress}
                >
                  <Ionicons name={item.icon as any} size={20} color="#8A8A9A" />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <View style={styles.menuRight}>
                    {(item as any).note && <Text style={styles.noteText}>{(item as any).note}</Text>}
                    {(item as any).right || <Ionicons name="chevron-forward" size={16} color="#C0C8D4" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutBtn} onPress={() => setLogoutModal(true)}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={logoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>退出登录</Text>
            <Text style={styles.modalMsg}>确定要退出登录吗？</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setLogoutModal(false)}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => { setLogoutModal(false); router.replace('/(auth)/login'); }}
              >
                <Text style={styles.confirmBtnText}>退出</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#8A8A9A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  menuLabel: { flex: 1, fontSize: 15, color: '#1A1A2E' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteText: { fontSize: 13, color: '#8A8A9A' },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#FF3B30' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: 280,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  modalMsg: { fontSize: 14, color: '#8A8A9A', textAlign: 'center', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, color: '#8A8A9A', fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 15, color: '#FFFFFF', fontWeight: '600' },
});
