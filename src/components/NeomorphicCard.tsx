import React from 'react';
import { PressableProps, StyleSheet, View, ViewProps } from 'react-native';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import AnimatedPressable from './AnimatedPressable';

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
      <AnimatedPressable
        onPress={onPress}
        lifted
        style={cardStyle}
        {...props}
      >
        {children}
      </AnimatedPressable>
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
});
