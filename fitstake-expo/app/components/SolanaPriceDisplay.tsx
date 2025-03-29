import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSolanaPrice } from '../../hooks/useSolanaPrice';
import theme from '../theme';

const { colors, fontSize, fontWeight, spacing } = theme;

interface SolanaPriceDisplayProps {
  solAmount?: number;
  showUsdEquivalent?: boolean;
  showSolAmount?: boolean;
  compact?: boolean;
  variant?: 'primary' | 'secondary' | 'light' | 'dark';
}

const SolanaPriceDisplay: React.FC<SolanaPriceDisplayProps> = ({
  solAmount,
  showUsdEquivalent = true,
  showSolAmount = true,
  compact = false,
  variant = 'primary',
}) => {
  const { price, loading, error, formatUSD } = useSolanaPrice();

  // Get color based on variant
  const getColor = () => {
    switch (variant) {
      case 'primary':
        return colors.accent.primary;
      case 'secondary':
        return colors.accent.secondary;
      case 'light':
        return colors.white;
      case 'dark':
        return colors.gray[300];
      default:
        return colors.accent.primary;
    }
  };

  const color = getColor();

  // Handle loading state with a more minimal indicator
  if (loading) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <Text style={[styles.priceText, { color }]}>
          {solAmount ? '$...' : 'SOL: $...'}
        </Text>
      </View>
    );
  }

  // Handle error state with a fallback value
  if (error) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <Text style={[styles.priceText, { color }]}>
          {solAmount ? '$???' : 'SOL: $???'}
        </Text>
      </View>
    );
  }

  // Simple display of current SOL price
  if (!solAmount) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <Text style={[styles.priceText, { color }]}>
          SOL: ${price.toFixed(2)}
        </Text>
      </View>
    );
  }

  // Display for conversion from SOL to USD
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {showSolAmount && (
        <Text style={[styles.amountText, { color }]}>
          {solAmount.toFixed(2)} SOL
        </Text>
      )}
      {showUsdEquivalent && (
        <Text style={[styles.usdText, { color }]}>
          {compact ? '$' : '≈ $'}
          {formatUSD(solAmount)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.xs,
  },
  compactContainer: {
    gap: 2,
  },
  priceText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  amountText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  usdText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
  },
});

export default SolanaPriceDisplay;
