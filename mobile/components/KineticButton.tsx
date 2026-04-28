import React, { useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface KineticButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function KineticButton({
  label, onPress, variant = 'primary', disabled, style, textStyle, fullWidth,
}: KineticButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={({ pressed }) => [styles.base, variant === 'outline' && styles.outline, variant === 'ghost' && styles.ghost, disabled && styles.disabled, pressed && { opacity: 0.9 }]}
      >
        {variant === 'primary' && (
          <LinearGradient
            colors={['#007AFF', '#00C6FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <Text style={[styles.label, variant === 'outline' && styles.labelOutline, variant === 'ghost' && styles.labelGhost, textStyle]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Manrope_700Bold' },
  labelOutline: { color: '#007AFF' },
  labelGhost: { color: '#007AFF' },
});
