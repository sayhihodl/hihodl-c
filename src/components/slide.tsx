// components/ui/slide.tsx
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export type SlideDef = { title: string; body: string; image: any };
export type SlideProps = {
  slides: SlideDef[];
  index: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
};

type DotProps = { active: boolean };

const Dot: React.FC<DotProps> = ({ active }) => (
  <View style={[styles.dot, active ? styles.dotActive : undefined]} />
);

export default function Slide({ slides, index, onNext, onPrev, onSkip }: SlideProps) {
  const s = slides[index];

  return (
    <View style={styles.slide}>
      <Image source={s.image} style={styles.slideImg} resizeMode="contain" />
      <Text style={styles.title}>{s.title}</Text>
      <Text style={styles.body}>{s.body}</Text>

      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <Dot key={`dot-${i}`} active={i === index} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        {index > 0 && (
          <TouchableOpacity onPress={onPrev} style={[styles.btn, styles.btnGhost]}>
            <Text style={[styles.btnText, { color: '#111827' }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onNext} style={styles.btn}>
          <Text style={styles.btnText}>
            {index === slides.length - 1 ? 'Get started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onSkip} style={{ marginTop: 12 }}>
        <Text style={{ color: '#6B7280' }}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { width: '100%', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 24 },
  slideImg: { width: 240, height: 180 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', color: '#fff' },
  body: { textAlign: 'center', color: '#CFE3EC' },
  dotsRow: { flexDirection: 'row', gap: 6, marginVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#3A4A55' },
  dotActive: { backgroundColor: '#FFB703' },
  btn: {
    backgroundColor: '#023047',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnGhost: { backgroundColor: '#F3F4F6' },
  btnText: { color: 'white', fontWeight: '700' },
});