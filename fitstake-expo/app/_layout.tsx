import { PrivyElements, PrivyProvider } from '@privy-io/expo';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '../hooks/useFrameworkReady';

// Get environment variables for Privy
const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID as string;
const PRIVY_CLIENT_ID = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID as string;

if (!PRIVY_APP_ID || !PRIVY_CLIENT_ID) {
  throw new Error('Privy environment variables are not properly configured');
}

// Get the app's bundle identifier
const bundleId =
  Application.applicationId ||
  (Platform.OS === 'ios'
    ? Constants.expoConfig?.ios?.bundleIdentifier
    : Constants.expoConfig?.android?.package);

// Get the URL scheme
const urlScheme = Constants.expoConfig?.scheme || 'fitstake';

// Determine if running in Expo Go - invert logic to match actual Expo Go behavior
const isExpoGo = Constants.executionEnvironment !== 'standalone';
const expoGoAppId = 'host.exp.Exponent';
const expoGoUrlScheme = 'exp';

console.log('Application ID:', bundleId);
console.log('URL Scheme:', urlScheme);
console.log('Execution Environment:', Constants.executionEnvironment);
console.log('Is Expo Go:', isExpoGo);

// Define the global ErrorUtils type that exists in React Native but isn't in TS definitions
declare global {
  interface Global {
    ErrorUtils?: {
      setGlobalHandler?: (callback: (error: Error) => void) => {
        remove?: () => void;
      };
    };
  }
}

export default function RootLayout() {
  const isFrameworkReady = useFrameworkReady();
  const [privyInitError, setPrivyInitError] = React.useState<Error | null>(
    null
  );

  React.useEffect(() => {
    // Log environment info
    console.log('Environment:', {
      isExpoGo,
      bundleId,
      urlScheme,
      usingValues: {
        appId: isExpoGo ? expoGoAppId : bundleId,
        scheme: isExpoGo ? expoGoUrlScheme : urlScheme,
      },
    });

    // Log Privy config values to verify they are set correctly
    console.log('Privy Config:', {
      appId: PRIVY_APP_ID,
      clientIdLength: PRIVY_CLIENT_ID ? PRIVY_CLIENT_ID.length : 0,
    });

    // Set up global error handler to catch unhandled errors
    const errorHandler = (error: Error) => {
      console.error('Unhandled error in app:', error);
      setPrivyInitError(error);
    };

    // Add global error handler - using proper typing
    const subscription = (global as any).ErrorUtils?.setGlobalHandler?.(
      errorHandler
    );

    return () => {
      // Clean up error handler
      subscription?.remove?.();
    };
  }, []);

  // Only show loading for framework initialization
  if (!isFrameworkReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#121212',
        }}
      >
        <Text style={{ color: 'white' }}>Initializing framework...</Text>
      </View>
    );
  }

  // Show error state if there was a problem
  if (privyInitError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#121212',
          padding: 20,
        }}
      >
        <Text
          style={{
            color: '#ef4444',
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 8,
          }}
        >
          Initialization Error
        </Text>
        <Text style={{ color: 'white', textAlign: 'center', marginBottom: 20 }}>
          {privyInitError.message}
        </Text>
        <Text style={{ color: '#aaa', textAlign: 'center' }}>
          Please check your configuration and try again.
        </Text>
      </View>
    );
  }

  console.log('isFrameworkReady', isFrameworkReady);

  try {
    return (
      <SafeAreaProvider>
        <PrivyProvider
          appId={PRIVY_APP_ID}
          clientId={PRIVY_CLIENT_ID}
          config={{
            embedded: {
              solana: {
                createOnLogin: 'users-without-wallets',
              },
            },
          }}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="+not-found"
              options={{ presentation: 'modal', headerShown: true }}
            />
          </Stack>
          <StatusBar style="light" />
          <PrivyElements />
        </PrivyProvider>
      </SafeAreaProvider>
    );
  } catch (error) {
    console.error('Error rendering PrivyProvider:', error);
    Alert.alert('Error', `Failed to initialize: ${(error as Error).message}`);

    // Return fallback UI
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#121212',
          padding: 20,
        }}
      >
        <Text
          style={{
            color: '#ef4444',
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 8,
          }}
        >
          Privy Initialization Failed
        </Text>
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {(error as Error).message}
        </Text>
      </View>
    );
  }
}
