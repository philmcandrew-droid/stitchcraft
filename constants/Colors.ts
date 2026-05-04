const tintLight = '#7a5f89';
const tintDark = '#e8d4f5';

const light = {
  text: '#2a2435',
  textMuted: '#6b6274',
  background: '#f8f5fa',
  tint: tintLight,
  tabIconDefault: '#b5aabf',
  tabIconSelected: tintLight,
  card: '#ffffff',
  cardBorder: '#e6dce8',
  surfaceSoft: '#efe6f3',
  hero: '#ebe2f0',
  accentStrong: '#634a72',
  danger: '#b84455',
  success: '#3d7a52',
  link: '#6a4d7c',
  tabBar: '#fffdfb',
  tabBarBorder: '#ebe4ef',
  pill: '#f0e8f5',
  shadow: 'rgba(42, 36, 53, 0.08)',
};

const dark = {
  text: '#f3edf8',
  textMuted: '#a99eb4',
  background: '#131118',
  tint: tintDark,
  tabIconDefault: '#6d6578',
  tabIconSelected: tintDark,
  card: '#1f1b26',
  cardBorder: '#322a38',
  surfaceSoft: '#1a171e',
  hero: '#221d2a',
  accentStrong: '#d4b8e8',
  danger: '#ff8a9a',
  success: '#7ecf9a',
  link: '#d4b8e8',
  tabBar: '#16141a',
  tabBarBorder: '#2a2430',
  pill: '#252030',
  shadow: 'rgba(0, 0, 0, 0.35)',
};

export type CraftColorScheme = typeof light;

export default {
  light,
  dark,
};
