import Colors, { type CraftColorScheme } from '@/constants/Colors';

import { useColorScheme } from '@/components/useColorScheme';

export function useCraftColors(): CraftColorScheme {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
}
