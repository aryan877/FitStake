// Import the nodeify shims first
import './shim';

// Add buffer for Solana integration first
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Polyfill for Anchor and other Node.js dependencies
import 'fast-text-encoding';
import 'react-native-get-random-values';
// Import the crypto module from expo-crypto
import * as Crypto from 'expo-crypto';

// Ensure crypto is available
if (!global.crypto) {
  global.crypto = {};
}

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

// Additional TextEncoder/Decoder polyfills
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('text-encoding').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('text-encoding').TextDecoder;
}

// Polyfill for EventTarget (missing in React Native's Hermes engine)
if (typeof globalThis.EventTarget === 'undefined') {
  class EventTargetPolyfill {
    constructor() {
      this._listeners = {};
    }

    addEventListener(type, callback) {
      if (!(type in this._listeners)) {
        this._listeners[type] = [];
      }
      this._listeners[type].push(callback);
    }

    removeEventListener(type, callback) {
      if (!(type in this._listeners)) {
        return;
      }
      const stack = this._listeners[type];
      const index = stack.indexOf(callback);
      if (index !== -1) {
        stack.splice(index, 1);
      }
    }

    dispatchEvent(event) {
      if (!(event.type in this._listeners)) {
        return true;
      }
      const stack = this._listeners[event.type].slice();

      for (let i = 0; i < stack.length; i++) {
        stack[i].call(this, event);
      }
      return !event.defaultPrevented;
    }
  }

  // Apply the polyfill
  globalThis.EventTarget = EventTargetPolyfill;
}

// Polyfill for Event class (missing in React Native's Hermes engine)
if (typeof globalThis.Event === 'undefined') {
  // First ensure EventTarget exists
  if (typeof globalThis.EventTarget === 'undefined') {
    globalThis.EventTarget = class EventTarget {};
  }

  class EventPolyfill {
    constructor(type, eventInitDict) {
      this.type = type;
      this.target = eventInitDict?.target || null;
      this.currentTarget = null;
      this.defaultPrevented = false;
      this.bubbles = eventInitDict?.bubbles || false;
      this.cancelable = eventInitDict?.cancelable || false;
      this.timeStamp = Date.now();
      this.eventPhase = EventPolyfill.NONE;
      this._stopPropagation = false;
    }

    stopPropagation() {
      this._stopPropagation = true;
    }

    preventDefault() {
      if (this.cancelable) {
        this.defaultPrevented = true;
      }
    }
  }

  // Add static properties
  EventPolyfill.NONE = 0;
  EventPolyfill.CAPTURING_PHASE = 1;
  EventPolyfill.AT_TARGET = 2;
  EventPolyfill.BUBBLING_PHASE = 3;

  // Apply the polyfill
  globalThis.Event = EventPolyfill;
}

// Additional DOM interface polyfills that might be required
if (typeof globalThis.Node === 'undefined') {
  globalThis.Node = {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_FRAGMENT_NODE: 11,
  };
}

// Polyfill for AbortSignal methods (missing in React Native)
if (typeof AbortSignal !== 'undefined') {
  // Polyfill for AbortSignal.timeout
  if (typeof AbortSignal.timeout !== 'function') {
    AbortSignal.timeout = function timeout(milliseconds) {
      const controller = new AbortController();
      const signal = controller.signal;

      if (milliseconds <= 0) {
        controller.abort();
        return signal;
      }

      const timeout = setTimeout(() => {
        controller.abort();
      }, milliseconds);

      // Clean up the timeout if the signal is aborted
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
      });

      return signal;
    };
  }

  // Polyfill for AbortSignal.any
  if (typeof AbortSignal.any !== 'function') {
    AbortSignal.any = function any(signals) {
      if (!Array.isArray(signals) || signals.length === 0) {
        throw new TypeError('AbortSignal.any requires at least one signal');
      }

      const controller = new AbortController();
      const combinedSignal = controller.signal;

      // Helper function to handle aborts
      const onAbort = (abortedSignal) => {
        // Set the reason if available
        if (abortedSignal.reason) {
          controller.abort(abortedSignal.reason);
        } else {
          controller.abort();
        }

        // Clean up event listeners
        signals.forEach((signal) => {
          if (signal && typeof signal.removeEventListener === 'function') {
            signal.removeEventListener('abort', onAbort);
          }
        });
      };

      // Set up listeners for all signals
      let alreadyAborted = false;
      signals.forEach((signal) => {
        if (!signal) return;

        // If any signal is already aborted, abort the combined signal
        if (signal.aborted) {
          alreadyAborted = true;
          onAbort(signal);
          return;
        }

        // Add listener for future aborts
        signal.addEventListener('abort', () => onAbort(signal));
      });

      // Handle case where a signal was already aborted
      if (alreadyAborted) {
        controller.abort();
      }

      return combinedSignal;
    };
  }
}

// Then import the expo router
import 'expo-router/entry';
