// Add buffer for Solana integration first
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Import required polyfills in the right order
import 'fast-text-encoding';
import 'react-native-get-random-values';
// Import the crypto module from expo-crypto instead of using v4 from uuid
import * as Crypto from 'expo-crypto';

// Ensure crypto is available
if (!global.crypto) {
  global.crypto = {};
}

// Ensure getRandomValues is available (should be provided by react-native-get-random-values)
if (!global.crypto.getRandomValues) {
  console.warn(
    'crypto.getRandomValues is not available. This might cause issues with cryptographic operations.'
  );
}

// Proper UUID implementation using expo-crypto
if (typeof global.crypto.randomUUID !== 'function') {
  global.crypto.randomUUID = function randomUUID() {
    return Crypto.randomUUID();
  };
}

// Then import the expo router
import 'expo-router/entry';
