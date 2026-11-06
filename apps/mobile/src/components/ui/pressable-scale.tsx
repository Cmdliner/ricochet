import type { GestureResponderEvent } from "react-native";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

type PressableScaleProps = PressableProps & {
  scaleTo?: number;
  className?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

/** The animation lives on a wrapper because className styles do not reach Reanimated views. */
export function PressableScale({ scaleTo = 0.97, onPressIn, onPressOut, className, containerStyle, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleIn = (event: GestureResponderEvent) => {
    scale.value = withSpring(scaleTo, { damping: 18, stiffness: 420 });
    onPressIn?.(event);
  };
  const handleOut = (event: GestureResponderEvent) => {
    scale.value = withSpring(1, { damping: 14, stiffness: 320 });
    onPressOut?.(event);
  };

  return (
    <Animated.View style={[style, containerStyle]}>
      <Pressable className={className} onPressIn={handleIn} onPressOut={handleOut} {...rest} />
    </Animated.View>
  );
}
