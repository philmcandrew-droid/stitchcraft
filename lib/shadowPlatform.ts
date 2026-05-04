import { Platform, type ViewStyle } from 'react-native';

/**
 * react-native-web can throw "Indexed property setter is not supported" when applying
 * some shadow* combinations to the DOM. On web we use a single `boxShadow` string instead.
 */
export function cardShadowStyle(
  shadowColor: string,
  opts?: { offsetY?: number; opacity?: number; radius?: number; elevation?: number },
): ViewStyle {
  const offsetY = opts?.offsetY ?? 4;
  const opacity = opts?.opacity ?? 0.12;
  const radius = opts?.radius ?? 12;
  const elevation = opts?.elevation ?? 2;

  if (Platform.OS === 'web') {
    const color =
      shadowColor.startsWith('rgba') || shadowColor.startsWith('rgb') || shadowColor.startsWith('#')
        ? shadowColor
        : `rgba(42,36,53,${opacity})`;
    return {
      boxShadow: `0px ${offsetY}px ${radius}px ${color}`,
    } as ViewStyle;
  }

  return {
    shadowColor,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}
