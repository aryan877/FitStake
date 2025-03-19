// Add buffer for Solana integration first
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Import required polyfills in the right order
import '@ethersproject/shims';
import 'fast-text-encoding';
import 'react-native-get-random-values';

// UUID polyfill (automatically adds crypto.randomUUID to global)
import 'react-native-random-uuid';

// Then import the expo router
import 'expo-router/entry';
