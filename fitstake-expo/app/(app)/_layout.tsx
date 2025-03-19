import { AuthBoundary } from '@privy-io/expo';
import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6366f1" />
      <Text style={styles.text}>Loading your profile...</Text>
    </View>
  );
}

function ErrorScreen({ error }: { error: Error }) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Error loading profile</Text>
      <Text style={styles.text}>{error.message}</Text>
    </View>
  );
}

export default function AppLayout() {
  return (
    <AuthBoundary
      loading={<LoadingScreen />}
      error={(error) => <ErrorScreen error={error} />}
      unauthenticated={<Redirect href="/sign-in" />}
    >
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </AuthBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
});
