import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopAppBar from '@components/TopAppBar';
import CommissionCard from '@components/CommissionCard';
import FilterChips from '@components/FilterChips';
import { mockCommissions } from '@shared/data/mockData';

const FILTERS = ['全部', '剧情', '商业', '音乐MV', 'AI动画', '纪录片'];

export default function PlazaScreen() {
  const [selected, setSelected] = useState('全部');
  const insets = useSafeAreaInsets();

  const data = selected === '全部'
    ? mockCommissions
    : mockCommissions.filter(c => c.category === selected);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showLogo title="项目广场" />

      <View style={[styles.filterArea, { paddingTop: 56 + insets.top }]}>
        <FilterChips options={FILTERS} selected={selected} onSelect={setSelected} />
      </View>

      <FlatList
        data={data}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <CommissionCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  filterArea: { paddingVertical: 8 },
  list: { padding: 16, paddingTop: 8 },
});
