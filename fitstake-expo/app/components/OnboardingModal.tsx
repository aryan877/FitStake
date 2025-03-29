import theme from '@/app/theme';
import { OnboardingModalProps } from '@/types';
import { useEmbeddedSolanaWallet, usePrivy } from '@privy-io/expo';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authApi } from '../services/api';

const { colors, fontSize, fontWeight, spacing } = theme;

type OnboardingStep =
  | 'wallet-creation'
  | 'wallet-created'
  | 'username-setup'
  | 'completed';

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] =
    useState<OnboardingStep>('wallet-creation');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { user } = usePrivy();
  const { wallets, create } = useEmbeddedSolanaWallet();

  // Check for existing user profile
  useEffect(() => {
    if (!user) return;

    const checkUserProfile = async () => {
      try {
        const response = await authApi.getUserProfile();
        if (response.data) {
          setUsername(response.data.username);
          setWalletAddress(response.data.walletAddress);
          setCurrentStep('completed');
          setTimeout(onComplete, 1000);
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error('Error checking user profile:', error);
        }
      }
    };

    checkUserProfile();
  }, [user, onComplete]);

  // Check for existing wallet
  useEffect(() => {
    if (!wallets?.length) return;

    const solanaWallet = wallets[0];
    if (solanaWallet?.address) {
      setWalletAddress(solanaWallet.address);
      if (currentStep === 'wallet-creation') {
        setCurrentStep('wallet-created');
        // Auto-transition to username setup after 2 seconds
        setTimeout(() => {
          setCurrentStep('username-setup');
        }, 2000);
      }
    }
  }, [wallets, currentStep]);

  const handleCreateWallet = async () => {
    try {
      setIsCreatingWallet(true);
      if (!create) throw new Error('Wallet creation not available');

      await create({ recoveryMethod: 'privy' });
      setCurrentStep('wallet-created');
      // Auto-transition to username setup after 2 seconds
      setTimeout(() => {
        setCurrentStep('username-setup');
      }, 2000);
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert(
        'Error',
        'There was an error creating your wallet. Please try again.'
      );
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }

    try {
      setIsCheckingUsername(true);
      const response = await authApi.checkUsername(username);

      if (!response.data.isAvailable) {
        setUsernameError('Username is already taken');
        return false;
      }

      setUsernameError(null);
      return true;
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Error checking username availability');
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameSubmit = async () => {
    if (!walletAddress) {
      Alert.alert(
        'Error',
        'Wallet address is not available. Please try again.'
      );
      return;
    }

    const isValid = await checkUsername(username);
    if (!isValid) return;

    try {
      setIsSavingProfile(true);
      await authApi.createOrUpdateUser(walletAddress, username);
      setCurrentStep('completed');
      setTimeout(onComplete, 1000);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(
        'Error',
        'There was an error saving your profile. Please try again.'
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const renderWalletCreationStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Create Your Wallet</Text>
      <Text style={styles.description}>
        You need a wallet to use FitStake. This wallet will hold your rewards
        and allow you to participate in challenges.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handleCreateWallet}
        disabled={isCreatingWallet}
      >
        {isCreatingWallet ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Create Wallet</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderWalletCreatedStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Wallet Created!</Text>
      <Text style={styles.description}>
        Your wallet has been successfully created.
      </Text>
      <View style={styles.successIconContainer}>
        <Text style={styles.successIcon}>✓</Text>
      </View>
      <Text style={styles.walletAddress}>
        {walletAddress
          ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
          : ''}
      </Text>
      <Text style={styles.redirectingText}>Moving to username setup...</Text>
    </View>
  );

  const renderUsernameSetupStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Choose a Username</Text>
      <Text style={styles.description}>
        Choose a unique username that will identify you on FitStake.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={colors.gray[400]}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={handleUsernameSubmit}
        disabled={isCheckingUsername || isSavingProfile || !username}
      >
        {isCheckingUsername || isSavingProfile ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCompletedStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Setup Complete!</Text>
      <Text style={styles.description}>
        You're all set to start using FitStake.
      </Text>
      <ActivityIndicator color={colors.accent.primary} />
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'wallet-creation':
        return renderWalletCreationStep();
      case 'wallet-created':
        return renderWalletCreatedStep();
      case 'username-setup':
        return renderUsernameSetupStep();
      case 'completed':
        return renderCompletedStep();
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>{renderStep()}</View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: colors.gray[900],
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.md,
    color: colors.gray[300],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  input: {
    width: '100%',
    backgroundColor: colors.gray[800],
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.accent.error,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  successIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  successIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  walletAddress: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    marginBottom: spacing.md,
  },
  redirectingText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    fontStyle: 'italic',
  },
});

export default OnboardingModal;
