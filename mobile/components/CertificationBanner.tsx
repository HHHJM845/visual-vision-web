import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  role: 'aigcer' | 'client';
  onPress: () => void;
}

export default function CertificationBanner({ role, onPress }: Props) {
  const label = role === 'aigcer' ? '完成AI制作者认证，接受委托' : '完成认证，发布承制项目';
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mx-4 mb-4 bg-primary rounded-xl p-4 flex-row items-center justify-between"
    >
      <View className="flex-1">
        <Text className="text-white font-bold text-sm">认证指南</Text>
        <Text className="text-blue-100 text-xs mt-0.5">{label}</Text>
      </View>
      <Text className="text-white text-lg">→</Text>
    </TouchableOpacity>
  );
}
