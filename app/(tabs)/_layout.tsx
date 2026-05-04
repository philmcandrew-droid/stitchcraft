import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { SyncStatusBar } from '@/components/SyncStatusBar';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  return (
    <View style={{ flex: 1 }}>
      <SyncStatusBar />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: palette.tint,
            tabBarInactiveTintColor: palette.tabIconDefault,
            headerShown: useClientOnlyValue(false, true),
            headerStyle: { backgroundColor: palette.tabBar },
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: '700', fontSize: 18, color: palette.text },
            tabBarStyle: {
              backgroundColor: palette.tabBar,
              borderTopColor: palette.tabBarBorder,
              paddingTop: 4,
              height: 58,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Welcome',
              tabBarLabel: 'Home',
              tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            }}
          />
          <Tabs.Screen
            name="tracker"
            options={{
              title: 'Stitch tracker',
              tabBarLabel: 'Track',
              tabBarIcon: ({ color }) => <TabBarIcon name="th" color={color} />,
            }}
          />
          <Tabs.Screen
            name="designer"
            options={{
              title: 'Chart designer',
              tabBarLabel: 'Design',
              tabBarIcon: ({ color }) => <TabBarIcon name="paint-brush" color={color} />,
            }}
          />
          <Tabs.Screen
            name="convert"
            options={{
              title: 'Photo to chart',
              tabBarLabel: 'Photo',
              tabBarIcon: ({ color }) => <TabBarIcon name="magic" color={color} />,
            }}
          />
          <Tabs.Screen
            name="ai-suggest"
            options={{
              title: 'AI inspiration',
              tabBarLabel: 'AI',
              tabBarIcon: ({ color }) => <TabBarIcon name="lightbulb-o" color={color} />,
            }}
          />
          <Tabs.Screen
            name="gallery"
            options={{
              title: 'Your gallery',
              tabBarLabel: 'Gallery',
              tabBarIcon: ({ color }) => <TabBarIcon name="picture-o" color={color} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
