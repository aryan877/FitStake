import { AlertCircle, CheckCircle, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ToastConfig } from '../../types';
import theme from '../theme';

const { colors, spacing, fontSize, fontWeight, borderRadius } = theme;

let toastQueue: ToastConfig[] = [];
let showToastFunction: ((config: ToastConfig) => void) | null = null;

export const showToast = (config: ToastConfig) => {
  if (showToastFunction) {
    showToastFunction(config);
  } else {
    toastQueue.push(config);
  }
};

export const showSuccessToast = (message: string, duration = 3000) => {
  showToast({ message, type: 'success', duration });
};

export const showErrorToast = (message: string, duration = 4000) => {
  showToast({ message, type: 'error', duration });
};

export const showInfoToast = (message: string, duration = 3000) => {
  showToast({ message, type: 'info', duration });
};

export default function ToastContainer() {
  const [visible, setVisible] = useState(false);
  const [currentToast, setCurrentToast] = useState<ToastConfig | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const showToastInternal = (config: ToastConfig) => {
    if (visible) {
      // If a toast is already showing, hide it first
      hideToast(() => {
        setCurrentToast(config);
        setVisible(true);
        startTimer(config.duration);
        fadeIn();
      });
    } else {
      setCurrentToast(config);
      setVisible(true);
      startTimer(config.duration);
      fadeIn();
    }
  };

  const startTimer = (duration = 3000) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    timeout.current = setTimeout(() => {
      hideToast();
    }, duration);
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = (callback?: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(callback);
  };

  const hideToast = (callback?: () => void) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    fadeOut(() => {
      setVisible(false);
      if (callback) callback();

      // Check if there are more toasts in the queue
      if (toastQueue.length > 0) {
        const nextToast = toastQueue.shift();
        if (nextToast) {
          setTimeout(() => {
            showToastInternal(nextToast);
          }, 300);
        }
      }
    });
  };

  useEffect(() => {
    showToastFunction = showToastInternal;

    // Check if there are toasts waiting in the queue
    if (toastQueue.length > 0) {
      const nextToast = toastQueue.shift();
      if (nextToast) {
        showToastInternal(nextToast);
      }
    }

    return () => {
      showToastFunction = null;
    };
  }, []);

  if (!visible || !currentToast) return null;

  const getToastColor = () => {
    switch (currentToast.type) {
      case 'success':
        return colors.accent.primary;
      case 'error':
        return colors.accent.error;
      case 'info':
        return colors.accent.secondary;
      default:
        return colors.accent.primary;
    }
  };

  const getToastIcon = () => {
    switch (currentToast.type) {
      case 'success':
        return <CheckCircle size={24} color={colors.white} />;
      case 'error':
        return <X size={24} color={colors.white} />;
      case 'info':
        return <AlertCircle size={24} color={colors.white} />;
      default:
        return <AlertCircle size={24} color={colors.white} />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: getToastColor(), opacity: fadeAnim },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>{getToastIcon()}</View>
        <Text style={styles.message}>{currentToast.message}</Text>
      </View>
      <TouchableOpacity onPress={() => hideToast()} style={styles.closeButton}>
        <X size={20} color={colors.white} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  message: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
});
