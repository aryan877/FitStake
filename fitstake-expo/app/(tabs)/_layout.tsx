import { Tabs } from 'expo-router';
import { Activity, Trophy, User, Wallet } from 'lucide-react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

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
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
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
    backgroundColor: '#1F2937',
    borderTopColor: '#374151',
    paddingBottom: 4,
    paddingTop: 4,
    height: 60,
  },
});
