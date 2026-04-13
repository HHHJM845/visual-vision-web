import { View, Text, TouchableOpacity } from 'react-native';
import { Commission } from '@shared/types/commission';

interface Props {
  commission: Commission;
  onPress: () => void;
}

const TAG_COLORS: Record<string, string> = {
  '企业认证': 'bg-yellow-100 text-yellow-700',
  '实名认证': 'bg-blue-100 text-blue-700',
  '未认证': 'bg-gray-100 text-gray-500',
};

export default function CommissionCard({ commission, onPress }: Props) {
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(commission.deadline).getTime() - Date.now()) / 86400000),
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-card rounded-xl p-4 mb-3 mx-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-base font-semibold text-text-main flex-1 mr-2" numberOfLines={1}>
          {commission.title}
        </Text>
        <View className={`px-2 py-0.5 rounded-full ${TAG_COLORS[commission.tag] ?? 'bg-gray-100 text-gray-500'}`}>
          <Text className="text-xs">{commission.tag}</Text>
        </View>
      </View>
      <Text className="text-sm text-text-sub mb-3" numberOfLines={2}>
        {commission.description}
      </Text>
      <View className="flex-row justify-between">
        <Text className="text-sm font-medium text-primary">{commission.priceRange}</Text>
        <Text className="text-xs text-text-sub">{daysLeft > 0 ? `剩余 ${daysLeft} 天` : '已截止'}</Text>
      </View>
      <View className="flex-row mt-2 items-center">
        <Text className="text-xs text-text-sub mr-3">{commission.category}</Text>
        <Text className="text-xs text-text-sub">{commission.applicants} 人已申请</Text>
      </View>
    </TouchableOpacity>
  );
}
