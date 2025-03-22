import theme from '@/app/theme';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

interface CollapsibleDescriptionProps {
  description: string;
  initiallyExpanded?: boolean;
}

export const CollapsibleDescription = ({
  description,
  initiallyExpanded = false,
}: CollapsibleDescriptionProps) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [isLongDescription, setIsLongDescription] = useState(false);
  const [textHeight, setTextHeight] = useState(0);
  const SHORT_TEXT_HEIGHT_THRESHOLD = 80; // roughly 3 lines of text

  // Measure the height of the text to determine if it's "long"
  const onTextLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setTextHeight(height);
    setIsLongDescription(height > SHORT_TEXT_HEIGHT_THRESHOLD);

    // If description is short, force expanded state
    if (height <= SHORT_TEXT_HEIGHT_THRESHOLD) {
      setExpanded(true);
    }
  };

  // Update the expanded state if description changes
  useEffect(() => {
    if (!isLongDescription) {
      setExpanded(true);
    }
  }, [isLongDescription]);

  return (
    <View style={styles.container}>
      {isLongDescription && (
        <Pressable
          style={styles.headerRow}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.title} numberOfLines={1}>
            Description
          </Text>
          {expanded ? (
            <ChevronUp size={16} color={colors.accent.primary} />
          ) : (
            <ChevronDown size={16} color={colors.accent.primary} />
          )}
        </Pressable>
      )}

      {!isLongDescription && (
        <Text style={styles.title} numberOfLines={1}>
          Description
        </Text>
      )}

      <View
        style={expanded ? styles.expandedContainer : styles.collapsedContainer}
        onLayout={!textHeight ? onTextLayout : undefined}
      >
        <Text
          style={styles.descriptionText}
          numberOfLines={expanded ? undefined : 2}
          onLayout={textHeight ? onTextLayout : undefined}
        >
          {description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  descriptionText: {
    fontSize: fontSize.md,
    color: colors.gray[300],
    lineHeight: fontSize.md * 1.4,
  },
  expandedContainer: {
    width: '100%',
  },
  collapsedContainer: {
    overflow: 'hidden',
    width: '100%',
  },
});

export default CollapsibleDescription;
