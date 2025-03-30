import { Tabs } from 'expo-router';
import { Activity, Award, Trophy, User, Wallet } from 'lucide-react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { TabBarIconProps } from '../../types';
import theme from '../theme';

const { colors } = theme;

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
          title: 'Home',
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <Trophy size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: 'Mine',
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Rank',
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <Award size={size} color={color} />
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
          title: 'Me',
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
