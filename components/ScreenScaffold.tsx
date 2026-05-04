import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

type ScreenScaffoldProps = {
  title: string;
  description: string;
};

export function ScreenScaffold({ title, description }: ScreenScaffoldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text style={styles.body}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '100%',
    maxWidth: 320,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.85,
  },
});
