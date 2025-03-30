import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import theme from '../theme';

const { colors, fontSize, fontWeight, spacing } = theme;

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const barWidthAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simple, clean animation sequence
    Animated.sequence([
      // Fade in logo
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      // Show progress bar
      Animated.timing(barWidthAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
        easing: Easing.inOut(Easing.ease),
      }),
      // Fade in tagline
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      // Short delay before finishing
      Animated.delay(500),
    ]).start(() => {
      // Animation finished, notify parent
      onFinish();
    });
  }, [fadeAnim, barWidthAnim, textFadeAnim, onFinish]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0D0D0D']}
        style={styles.background}
      />

      <View style={styles.contentContainer}>
        {/* Simple FitStake wordmark */}
        <Animated.Text style={[styles.logoText, { opacity: fadeAnim }]}>
          FIT<Animated.Text style={styles.accentText}>STAKE</Animated.Text>
        </Animated.Text>

        {/* Minimal progress bar */}
        <View style={styles.barContainer}>
          <Animated.View
            style={[
              styles.bar,
              {
                width: barWidthAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Simple tagline */}
        <Animated.Text style={[styles.tagline, { opacity: textFadeAnim }]}>
          fitness · accountability · rewards
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  logoText: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  accentText: {
    color: colors.accent.primary,
  },
  barContainer: {
    height: 2,
    width: '100%',
    backgroundColor: colors.gray[800],
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  bar: {
    height: '100%',
    backgroundColor: colors.accent.primary,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    letterSpacing: 1,
    textTransform: 'lowercase',
  },
});
