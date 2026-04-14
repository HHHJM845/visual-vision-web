import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopAppBar from './TopAppBar';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export default function PageLayout({ children, title, showLogo, showBack, rightElement, style }: PageLayoutProps) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={['bottom']}>
      <TopAppBar title={title} showLogo={showLogo} showBack={showBack} rightElement={rightElement} />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { flex: 1, paddingTop: 56 + 44 },
});
