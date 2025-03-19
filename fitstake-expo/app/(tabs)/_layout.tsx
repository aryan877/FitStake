import { Tabs } from 'expo-router';
import { Activity, Trophy, User, Wallet } from 'lucide-react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import theme from '../theme';

const { colors } = theme;

interface TabBarIconProps {
  color: string;
  size: number;
}

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.gray[400],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Challenges',
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <Trophy size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <Wallet size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.black,
    borderTopColor: colors.gray[800],
    paddingBottom: 4,
    paddingTop: 4,
    height: 60,
  },
});
