// src/components/ProgressIndicator.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '@/theme/colors';

type ProgressIndicatorProps = {
  current: number;
  total: number;
  showLabel?: boolean;
};

export function ProgressIndicator({ current, total, showLabel = true }: ProgressIndicatorProps) {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <View style={styles.backgroundBar} />
        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
      </View>
      {showLabel && (
        <Text style={styles.label}>
          Step {current} of {total}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  barContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundBar: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.cta,
    borderRadius: 2,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});

