import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export default function EmptyState({ title, subtitle, ctaLabel, onCta }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-4">
        <Text className="text-4xl">🎬</Text>
      </View>
      <Text className="text-lg font-semibold text-text-main text-center mb-2">{title}</Text>
      {subtitle && (
        <Text className="text-sm text-text-sub text-center mb-6">{subtitle}</Text>
      )}
      {ctaLabel && onCta && (
        <TouchableOpacity
          onPress={onCta}
          className="bg-primary px-8 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
