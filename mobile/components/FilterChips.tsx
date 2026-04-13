import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}

export default function FilterChips({ options, selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-3">
      <View className="flex-row gap-2">
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            className={`px-3 py-1.5 rounded-full border ${
              selected === opt
                ? 'bg-primary border-primary'
                : 'bg-card border-gray-200'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                selected === opt ? 'text-white' : 'text-text-main'
              }`}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
