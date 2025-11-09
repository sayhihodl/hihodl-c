import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CTAButton } from '@/ui/CTAButton';
import colors from '@/theme/colors';

// ✅ importa las imágenes con el alias @assets (carpeta /assets)
// app/onboarding/carousel.tsx  ✅ CORRECTO
const IMG1 = require('@assets/onboarding/onboarding-1-adv.png');
const IMG2 = require('@assets/onboarding/onboarding-2-adv.png');
const IMG3 = require('@assets/onboarding/onboarding-3-adv.png');

const { width, height } = Dimensions.get('window');

// 🔤 Textos editables
const SLIDES = [
  { key: 's1', image: IMG1, title: 'Create your wallet', body: 'Set it up in seconds with a simple, secure flow.' },
  { key: 's2', image: IMG2, title: 'Your keys, Your coins', body: 'Your data stays yours. Rotating addresses, no hidden trackers, no shady permissions. Just clean crypto.' },
  { key: 's3', image: IMG3, title: 'Three wallets, Total Control', body: 'Daily, Savings, Social. Switch, send, and manage your crypto your way ' },
];

export default function Carousel() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
    }
  ).current;

  const viewabilityConfig = useMemo(
    () => ({ viewAreaCoveragePercentThreshold: 60 }),
    []
  );

  const goBack = () => {
    if (index === 0) return router.back();
    listRef.current?.scrollToIndex({ index: index - 1, animated: true });
  };

  const goNext = () => {
    if (index === SLIDES.length - 1) return router.replace('/onboarding/entry');
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(it) => it.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            <ImageBackground source={item.image} resizeMode="cover" style={StyleSheet.absoluteFillObject as any} />
            <View style={[styles.overlay, { paddingBottom: insets.bottom + 140 }]} pointerEvents="none">
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </View>
        )}
      />

      {/* Controles inferiores */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        {index > 0 && (
          <TouchableOpacity 
            onPress={goBack} 
            hitSlop={12} 
            style={styles.smallBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous slide"
          >
            <Text style={styles.smallTxt}>Back</Text>
          </TouchableOpacity>
        )}

        <View 
          style={styles.dots}
          accessibilityRole="tablist"
          accessibilityLabel={`Slide ${index + 1} of ${SLIDES.length}`}
        >
          {SLIDES.map((_, i) => (
            <View 
              key={i} 
              style={[styles.dot, index === i && styles.dotActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: index === i }}
            />
          ))}
        </View>

        {index === SLIDES.length - 1 ? (
          <CTAButton
            title="Start"
            onPress={goNext}
            variant="primary"
            fullWidth={false}
            style={styles.ctaButton}
          />
        ) : (
          <TouchableOpacity
            onPress={goNext}
            hitSlop={12}
            style={styles.smallBtnNext}
            accessibilityRole="button"
            accessibilityLabel="Go to next slide"
          >
            <Text style={styles.smallTxt}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0F1A' },

  overlay: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
    marginBottom: 16,
    minHeight: 44,
    justifyContent: 'center',
    letterSpacing: -0.5,
  },
  body: {
    color: '#DAE6EE',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 340,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
    minHeight: 88,
    justifyContent: 'center',
    fontWeight: '500',
  },

  controls: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  smallBtnNext: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  smallTxt: { color: colors.textMuted, fontWeight: '700', fontSize: 15 },
  ctaButton: { paddingHorizontal: 24, minWidth: 100 },

  dots: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: { 
    backgroundColor: colors.cta,
    width: 24,
    shadowColor: colors.cta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
});