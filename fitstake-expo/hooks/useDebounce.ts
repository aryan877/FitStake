import { useCallback, useEffect, useRef } from 'react';

/**
 * A custom hook that provides a debounced version of the callback function.
 *
 * @param callback The function to debounce
 * @param delay The delay in milliseconds (default: 500ms)
 * @returns A debounced version of the callback function and a function to cancel the debounce
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay = 500
): [(...args: Parameters<T>) => void, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear the timeout when the component unmounts or when the callback changes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback]);

  // The debounced function
  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  // Function to cancel the debounce
  const cancelDebounce = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return [debouncedFn, cancelDebounce];
}

export default useDebounce;
