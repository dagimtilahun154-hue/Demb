import React from 'react';
import { View, StyleSheet, Text, useColorScheme } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface ProgressCircleProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  showIcon?: boolean;
}

export default function ProgressCircle({
  score,
  size = 120,
  strokeWidth = 14,
  showIcon = true,
}: ProgressCircleProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  // Emotive coloring: Red-Orange for low, Lavender/Blue for mid, Mint/Green for high balance
  let ringColorStart = colors.primaryLight;
  let ringColorEnd = colors.primary;
  let iconName: keyof typeof Ionicons.glyphMap = 'flash';

  if (score < 40) {
    ringColorStart = colors.tertiaryLight;
    ringColorEnd = '#ba1a1a'; // bold red
    iconName = 'alert-circle';
  } else if (score > 75) {
    ringColorStart = colors.secondaryLight;
    ringColorEnd = colors.secondary;
    iconName = 'checkmark-circle';
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={ringColorStart} />
            <Stop offset="100%" stopColor={ringColorEnd} />
          </LinearGradient>
        </Defs>

        {/* Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={scheme === 'light' ? '#ece6f0' : '#494552'}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Central Icon */}
      {showIcon && (
        <View style={styles.iconContainer}>
          <Ionicons
            name={iconName}
            size={size * 0.35}
            color={score < 40 ? '#ba1a1a' : score > 75 ? colors.secondary : colors.primary}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
