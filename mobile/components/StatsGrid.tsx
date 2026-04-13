import { View, Text } from 'react-native';

interface Stat {
  value: string | number;
  label: string;
}

export default function StatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <View className="flex-row mx-4 mb-4 gap-2">
      {stats.map((s) => (
        <View key={s.label} className="flex-1 bg-card rounded-xl p-3 items-center shadow-sm">
          <Text className="text-xl font-bold text-primary">{s.value}</Text>
          <Text className="text-xs text-text-sub mt-0.5">{s.label}</Text>
        </View>
      ))}
    </View>
  );
}
