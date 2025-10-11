// app/dashboard/search.tsx
import { useRouter, type Href } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

// ✅ SafeAreaView desde el paquete correcto
import { SafeAreaView } from 'react-native-safe-area-context';

// 👇 importa del path correcto y trae los types
import { usePortfolioStore, type ChainId, type CurrencyId } from '@/store/portfolio.store';

const CHAIN_LABEL: Record<ChainId, string> = {
  'solana:mainnet': 'Solana',
  'eip155:1': 'Ethereum',
  'eip155:8453': 'Base',
  'eip155:137': 'Polygon',
};

// etiquetas por moneda
const CURRENCY_LABEL: Record<CurrencyId, string> = {
  'USDC.circle': 'USDC',
  'SOL.native':  'Solana',
  'ETH.native':  'Ethereum',
  'POL.native':  'Polygon',
  'USDT.tether': 'Tether',  // ← faltaba esta
};

type Item = {
  id: string;
  title: string;
  subtitle: string;
  currencyId: CurrencyId;
  chainId: ChainId;
};

export default function SearchScreen() {
  const router = useRouter();
  const positions = usePortfolioStore((s) => s.positions);
  const [q, setQ] = useState('');

  const items = useMemo<Item[]>(() => {
    const base: Item[] = positions.map((p) => ({
      id: `${p.currencyId}:${p.chainId}`,
      title: CURRENCY_LABEL[p.currencyId],
      subtitle: CHAIN_LABEL[p.chainId],
      currencyId: p.currencyId,
      chainId: p.chainId,
    }));
    const term = q.trim().toLowerCase();
    if (!term) return base;
    return base.filter(
      (i) => i.title.toLowerCase().includes(term) || i.subtitle.toLowerCase().includes(term)
    );
  }, [positions, q]);

  const goSend = useCallback((currencyId: CurrencyId, chainId: ChainId) => {
    const href: Href = {
      pathname: '/(drawer)/(tabs)/send' as const,
      params: { currencyId: String(currencyId), chainId: String(chainId) },
    };
    router.push(href);
  }, [router]);

  return (
    <SafeAreaView style={styles.wrap}>
      <Text style={styles.title}>Search</Text>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search assets or networks…"
        placeholderTextColor="#7aa6b4"
        style={styles.input}
        returnKeyType="search"
        onSubmitEditing={() => items[0] && goSend(items[0].currencyId, items[0].chainId)}
      />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => goSend(item.currencyId, item.chainId)}>
            <View>
              <Text style={styles.titleRow}>{item.title}</Text>
              <Text style={styles.subRow}>{item.subtitle}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No results</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0E1722', padding: 20, gap: 52 },
  title: { color: '#fff', fontWeight: '900', fontSize: 20 },
  input: {
    backgroundColor: '#08232E',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    fontWeight: '700',
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { color: '#fff', fontWeight: '800' },
  subRow: { color: '#CFE3EC', fontSize: 12 },
  chev: { color: '#CFE3EC', fontSize: 18, fontWeight: '900' },
  empty: { color: '#7aa6b4', textAlign: 'center', marginTop: 24 },
});