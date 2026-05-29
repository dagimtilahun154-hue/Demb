import React from 'react';
import { StyleSheet, View, ViewProps, Pressable, PressableProps } from 'react-native';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { useColorScheme } from 'react-native';

interface NeomorphicCardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: PressableProps['onPress'];
  activeOpacity?: number;
  bgColor?: string;
  glowColor?: string;
}

export default function NeomorphicCard({
  children,
  style,
  onPress,
  bgColor,
  glowColor,
  ...props
}: NeomorphicCardProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const isDark = scheme === 'dark';

  const cardStyle = [
    styles.card,
    {
      backgroundColor: bgColor || (isDark ? colors.surface : '#fdf7ff'),
      borderColor: isDark ? '#494552' : '#ffffff',
      borderWidth: isDark ? 1 : 2,
    },
    glowColor ? Shadows.glow(glowColor) : Shadows.neomorphicCard(isDark),
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: 20,
    overflow: 'visible',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
