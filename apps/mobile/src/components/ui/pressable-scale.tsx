import type { GestureResponderEvent } from "react-native";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

type PressableScaleProps = PressableProps & {
  /** How small it gets while pressed. 0.97 is a gentle press, 0.9 is a firm one. */
  scaleTo?: number;
  className?: string;
  /** Layout for the animated wrapper, for example `{ flex: 1 }` when the button shares a row. */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * A pressable that sinks slightly under your finger and springs back.
 * The animation lives on a wrapper because className styles do not reach Reanimated views.
 */
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
