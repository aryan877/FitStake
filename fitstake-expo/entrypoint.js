// Import the nodeify shims first
import './shim';

// Add buffer for Solana integration first
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Polyfill for Anchor and other Node.js dependencies
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

// Additional TextEncoder/Decoder polyfills if needed
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('text-encoding').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('text-encoding').TextDecoder;
}

// Then import the expo router
import 'expo-router/entry';
