import { Text as NativeText, type TextProps } from "react-native";

/** React Native does not pass fonts down from a parent, so each Text sets its own. Uses Inter unless a `font-…` class says otherwise. */
export function Text({ className = "", ...rest }: TextProps & { className?: string }) {
  const hasFont = /(^|\s)font-(sans|display)/.test(className);
  return <NativeText className={hasFont ? className : `font-sans ${className}`} {...rest} />;
}
