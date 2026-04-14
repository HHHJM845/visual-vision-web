import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <MaterialCommunityIcons
      name={name as any}
      size={24}
      color={focused ? '#007AFF' : '#8A8A9A'}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8A8A9A',
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen name="index" options={{ title: '工作台', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'view-dashboard' : 'view-dashboard-outline'} focused={focused} /> }} />
      <Tabs.Screen name="plaza" options={{ title: '广场', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} /> }} />
      <Tabs.Screen name="discover" options={{ title: '发现', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} /> }} />
      <Tabs.Screen name="messages" options={{ title: '消息', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'message' : 'message-outline'} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: '我的', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'account-circle' : 'account-circle-outline'} focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    height: 64,
    paddingBottom: 10,
    paddingTop: 6,
  },
  label: { fontSize: 10, fontFamily: 'Manrope_600SemiBold' },
});
