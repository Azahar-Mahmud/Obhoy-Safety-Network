import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import DirectoryScreen from '../screens/DirectoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../i18n';

export type MainTabParamList = {
  HomeTab: undefined;
  MapTab: undefined;
  HelpTab: undefined;
  MeTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  useLanguage();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            bottom: Platform.OS === 'android' ? Math.max(insets.bottom, 12) : Math.max(insets.bottom, 16),
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          let iconName: keyof typeof Feather.glyphMap = 'home';

          if (route.name === 'HomeTab') iconName = 'home';
          else if (route.name === 'MapTab') iconName = 'map';
          else if (route.name === 'HelpTab') iconName = 'help-circle';
          else if (route.name === 'MeTab') iconName = 'user';

          return (
            <View style={[styles.iconDot, focused && { backgroundColor: colors.primaryLight }]}>
              <Feather
                name={iconName}
                size={20}
                color={focused ? colors.primary : colors.textSecondary}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen as any}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapScreen as any}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen
        name="HelpTab"
        component={DirectoryScreen as any}
        options={{ tabBarLabel: 'Help' }}
      />
      <Tab.Screen
        name="MeTab"
        component={SettingsScreen as any}
        options={{ tabBarLabel: 'Me' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    paddingTop: 6,
    paddingBottom: 6,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  iconDot: {
    width: 44,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});