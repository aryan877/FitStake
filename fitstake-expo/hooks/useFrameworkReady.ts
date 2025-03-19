import { useEffect, useState } from 'react';
import { LogBox } from 'react-native';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    LogBox.ignoreLogs([
      'Warning: Failed prop type',
      'Non-serializable values were found in the navigation state',
      'Unsupported top level event type "topInsetsChange" dispatched',
      'Unable to generate uuidv4',
      'Cannot convert undefined value to object',
    ]);

    setTimeout(() => {
      try {
        if (typeof global.crypto?.randomUUID === 'function')
          console.log(
            'Crypto functions initialized successfully',
            global.crypto.randomUUID()
          );
        setIsReady(true);
      } catch (error) {
        console.error('Framework initialization error:', error);
        setIsReady(true);
      }
    }, 100);
  }, []);

  return isReady;
}
