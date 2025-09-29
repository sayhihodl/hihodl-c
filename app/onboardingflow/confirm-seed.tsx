import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';

// --- Paleta HiHODL ---
const BG = '#0B0E16';
const PRIMARY = '#FFB703';
const DEEP_BLUE = '#0D3D52';
const CARD = '#121826';
const TEXT = '#E8F3F9';
const MUTED = '#A5B7C6';

const SEED_12 = [
  'future','frequent','target','abuse','organ','bubble',
  'drum','disagree','exit','agree','dizzy','oxygen',
]; // ← sustituye por la seed del usuario cuando ya la tengas

// Comprobaciones (posiciones 1-indexed como en la UI)
const CHECKS = [3, 7, 12];

// util: barajar
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 6 opciones: correcta + 5 distractores
function candidates(correct: string, pool: string[]) {
  const distractors = shuffle(pool.filter(w => w !== correct)).slice(0, 5);
  return shuffle([correct, ...distractors]);
}

export default function ConfirmSeed() {
  const [step, setStep] = useState(0);            // índice en CHECKS
  const [choice, setChoice] = useState<string>(); // selección del usuario

  const position = CHECKS[step];                  // 3,7,12…
  const correctWord = SEED_12[position - 1];

  const options = useMemo(
    () => candidates(correctWord, SEED_12),
    [correctWord]
  );

  const onNext = () => {
    if (!choice) return;
    if (choice !== correctWord) {
      // feedback sencillo: resetea la selección; aquí puedes añadir vibración/toast
      setChoice(undefined);
      return;
    }
    if (step < CHECKS.length - 1) {
      setStep(s => s + 1);
      setChoice(undefined);
    } else {
      // éxito (último paso). Navega a la siguiente pantalla del onboarding
      router.replace('/onboarding/success'); // cámbialo a tu ruta real
    }
  };

  const onBack = () => {
    if (step === 0) router.back();
    else {
      setStep(s => s - 1);
      setChoice(undefined);
    }
  };

  return (
    <View style={styles.wrap}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable hitSlop={16} onPress={onBack}>
          <Text style={styles.backChevron}>{'‹'}</Text>
        </Pressable>

        {/* Dots de progreso */}
        <View style={styles.dots}>
          {CHECKS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i <= step ? styles.dotActive : undefined,
              ]}
            />
          ))}
        </View>
        <View style={{ width: 24 }} />{/* spacer simétrico al back */}
      </View>

      {/* Título */}
      <Text style={styles.h1}>Confirm Seed Phrase</Text>
      <Text style={styles.sub}>
        Select each word in the order it was{'\n'}presented to you
      </Text>

      {/* Número grande + palabra elegida (opcional) */}
      <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={styles.indexTxt}>{position}. {choice ?? ''}</Text>
      </View>

      {/* Grid 2x3 de opciones */}
      <FlatList
        data={options}
        keyExtractor={(w) => w}
        numColumns={3}
        columnWrapperStyle={{ gap: 14 }}
        contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}
        renderItem={({ item }) => {
          const selected = item === choice;
          return (
            <Pressable
              style={[styles.word, selected && styles.wordActive]}
              onPress={() => setChoice(item)}
            >
              <Text style={[styles.wordTxt, selected && styles.wordTxtActive]}>
                {item}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Next */}
      <Pressable
        onPress={onNext}
        disabled={!choice}
        style={[styles.next, !choice && styles.nextDisabled]}
      >
        <Text style={styles.nextTxt}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BG, paddingTop: 12 },
  topBar: {
    height: 56, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backChevron: { color: TEXT, fontSize: 28, lineHeight: 28, paddingHorizontal: 8 },
  dots: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2A3142' },
  dotActive: { backgroundColor: PRIMARY },

  h1: { color: TEXT, fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  sub: { color: MUTED, fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 8 },

  indexTxt: { color: '#8ED1FF', fontSize: 48, fontWeight: '800' },

  word: {
    flex: 1,
    height: 44,
    backgroundColor: CARD,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordActive: { borderWidth: 2, borderColor: PRIMARY, backgroundColor: '#182235' },
  wordTxt: { color: TEXT, fontSize: 14, fontWeight: '700' },
  wordTxtActive: { color: TEXT },

  next: {
    height: 54, marginTop: 20, marginHorizontal: 20, marginBottom: 24,
    borderRadius: 16, backgroundColor: DEEP_BLUE, alignItems: 'center', justifyContent: 'center',
  },
  nextDisabled: { opacity: 0.4 },
  nextTxt: { color: TEXT, fontSize: 16, fontWeight: '800' },
});