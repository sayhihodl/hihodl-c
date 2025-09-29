// components/BannerCarousel.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';

const { width: W } = Dimensions.get('window');
const H_PADDING = 16;          // mismo margen que el resto de la pantalla
const PEEK = 12;               // lo que se ve del siguiente banner
const CARD_W = W - H_PADDING * 2 - PEEK;

type Banner = { id: string; title: string; subtitle?: string };

export default function BannerCarousel({ data }: { data: Banner[] }) {
  const [visible, setVisible] = useState(true);
  const banners = useMemo(() => data ?? [], [data]);

  if (!visible || banners.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <FlatList
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        snapToInterval={CARD_W + PEEK}
        decelerationRate="fast"
        contentContainerStyle={{ paddingLeft: H_PADDING, paddingRight: H_PADDING - PEEK }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => setVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    marginBottom: 12,
  },
  card: {
    width: CARD_W,
    marginRight: PEEK,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(27,45,54,0.85)', // sólido + cristal
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',   // borde tenue
  },
  title: { color: '#fff', fontWeight: '700', fontSize: 16, flexShrink: 1 },
  subtitle: { color: '#9eb4bd', fontSize: 14, marginTop: 2, flexShrink: 1 },
  close: { color: '#9eb4bd', fontSize: 22, lineHeight: 22, paddingHorizontal: 2 },
});