import theme from '@/app/theme';
import { AvatarProps } from '@/types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const { colors } = theme;

// Generate color from string
const getColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 55%)`;
};

const Avatar = ({ user, size = 40, name }: AvatarProps) => {
  let initial = '?';
  let colorSeed = 'user';

  if (name) {
    initial = name.substring(0, 1).toUpperCase();
    colorSeed = name;
  } else if (user) {
    if (user.email?.address) {
      initial = user.email.address.substring(0, 1).toUpperCase();
      colorSeed = user.email.address;
    } else if (user.wallet?.address) {
      initial = user.wallet.address.substring(2, 3).toUpperCase();
      colorSeed = user.wallet.address;
    } else if (user.linked_accounts) {
      const account = user.linked_accounts.find(
        (acc: { type: string }) => acc.type === 'wallet' || acc.type === 'email'
      );
      if (account) {
        initial = account.address
          ? account.address.substring(2, 3).toUpperCase()
          : '?';
        colorSeed = account.address || 'user';
      }
    }
  }

  const backgroundColor = getColorFromString(colorSeed);
  const fontSize = size / 2.5;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{initial}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default Avatar;
