import React from 'react';
import { Animated, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';

type AnimatedPressableProps = PressableProps & {
  children: React.ReactNode;
  lifted?: boolean;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export default function AnimatedPressable({
  children,
  lifted = false,
  onPressIn,
  onPressOut,
  style,
  ...props
}: AnimatedPressableProps) {
  const press = React.useRef(new Animated.Value(0)).current;
  const animatedStyle = {
    transform: [
      {
        scale: press.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.975],
        }),
      },
    ],
    opacity: press.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.96],
    }),
  };

  return (
    <AnimatedPressableBase
      {...props}
      onPressIn={event => {
        Animated.spring(press, {
          toValue: 1,
          damping: 14,
          stiffness: 260,
          useNativeDriver: true,
        }).start();
        onPressIn?.(event);
      }}
      onPressOut={event => {
        Animated.timing(press, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
        onPressOut?.(event);
      }}
      style={[lifted && styles.lifted, style, animatedStyle]}
    >
      {children}
    </AnimatedPressableBase>
  );
}

const styles = StyleSheet.create({
  lifted: {
    shadowColor: '#3A3546',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 5,
  },
});
