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
        <TouchableOpacity onPress={goBack} hitSlop={12} style={styles.smallBtn}>
          <Text style={styles.smallTxt}>{index === 0 ? 'Back' : 'Back'}</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, index === i && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity
          onPress={goNext}
          hitSlop={12}
          style={[styles.cta, index === SLIDES.length - 1 && styles.ctaPrimary]}
        >
          <Text style={[styles.ctaTxt, index === SLIDES.length - 1 && styles.ctaTxtDark]}>
            {index === SLIDES.length - 1 ? 'Start' : 'Next'}
          </Text>
        </TouchableOpacity>
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
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 2 },
    marginBottom: 15,
    minHeight: 40,
    justifyContent: 'center',
  },
  body: {
    color: '#DAE6EE',
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
    minHeight: 80,
    justifyContent: 'center',
  },

  controls: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  smallTxt: { color: '#CFE3EC', fontWeight: '700' },

  dots: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: { backgroundColor: '#FFB703' },

  cta: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  ctaPrimary: { backgroundColor: '#FFB703' },
  ctaTxt: { color: '#FFFFFF', fontWeight: '800' },
  ctaTxtDark: { color: '#0A1A24' },
});