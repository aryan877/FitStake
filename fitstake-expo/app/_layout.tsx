import { PrivyElements, PrivyProvider, usePrivy } from '@privy-io/expo';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import OnboardingModal from './components/OnboardingModal';
import SplashScreen from './components/SplashScreen';
import ToastContainer from './components/Toast';
import { authApi } from './services/api';
import theme from './theme';

const { colors, fontSize, fontWeight, spacing } = theme;

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

const isExpoGo = Constants.executionEnvironment !== 'standalone';
const expoGoAppId = 'host.exp.Exponent';
const expoGoUrlScheme = 'exp';

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

// The component that wraps the app and handles onboarding
function AppWithOnboarding() {
  const { user, isReady } = usePrivy();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [onboardingComplete, setOnboardingComplete] = React.useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = React.useState(false);

  // Check if the user has a profile in the backend
  React.useEffect(() => {
    const checkUserProfile = async () => {
      if (!isReady || !user) return;

      try {
        setIsCheckingProfile(true);
        const response = await authApi.getUserProfile();
        // If we get a successful response, the user has a profile
        if (response.data) {
          setOnboardingComplete(true);
        }
      } catch (error: any) {
        // If we get a 404, the user doesn't have a profile
        if (error.response?.status === 404) {
          setShowOnboarding(true);
        } else {
          console.error('Error checking user profile:', error);
        }
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkUserProfile();
  }, [isReady, user]);

  // Handle route changes based on auth state
  React.useEffect(() => {
    if (!isReady) return;

    if (user) {
      // If authenticated but onboarding not complete, show onboarding
      if (!onboardingComplete) {
        setShowOnboarding(true);
      } else {
        // Otherwise, navigate to the app
        router.replace('/(tabs)');
      }
    } else {
      // If not authenticated, go to sign-in
      router.replace('/sign-in');
    }
  }, [isReady, user, onboardingComplete, router]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setOnboardingComplete(true);
    router.replace('/(tabs)');
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="+not-found"
          options={{ presentation: 'modal', headerShown: true }}
        />
      </Stack>
      <StatusBar style="light" />
      <PrivyElements />
      <ToastContainer />
      <OnboardingModal
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
        onClose={handleCloseOnboarding}
      />
    </>
  );
}

export default function RootLayout() {
  const isFrameworkReady = useFrameworkReady();
  const [privyInitError, setPrivyInitError] = React.useState<Error | null>(
    null
  );
  const [isSplashVisible, setIsSplashVisible] = React.useState(true);

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
      <SplashScreen
        onFinish={() => {
          // In a real implementation, we'd wait for framework ready
          // But here we want to show the splash screen regardless
        }}
      />
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
          backgroundColor: colors.black,
          padding: spacing.md,
        }}
      >
        <Text
          style={{
            color: colors.accent.error,
            fontSize: fontSize.lg,
            fontWeight: fontWeight.bold,
            marginBottom: spacing.sm,
          }}
        >
          Initialization Error
        </Text>
        <Text
          style={{
            color: colors.white,
            textAlign: 'center',
            marginBottom: spacing.lg,
          }}
        >
          {privyInitError.message}
        </Text>
        <Text style={{ color: colors.gray[400], textAlign: 'center' }}>
          Please check your configuration and try again.
        </Text>
      </View>
    );
  }

  try {
    // If splash is still visible, show it before the main app
    if (isSplashVisible) {
      return <SplashScreen onFinish={() => setIsSplashVisible(false)} />;
    }

    return (
      <SafeAreaProvider>
        <PrivyProvider appId={PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID}>
          <AppWithOnboarding />
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
          backgroundColor: colors.black,
          padding: spacing.md,
        }}
      >
        <Text
          style={{
            color: colors.accent.error,
            fontSize: fontSize.lg,
            fontWeight: fontWeight.bold,
            marginBottom: spacing.sm,
          }}
        >
          Privy Initialization Failed
        </Text>
        <Text style={{ color: colors.white, textAlign: 'center' }}>
          {(error as Error).message}
        </Text>
      </View>
    );
  }
}
