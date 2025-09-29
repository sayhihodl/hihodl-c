// app/auth/import/ledger.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function LedgerConnect() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Connect Your Ledger</Text>
      <Text style={styles.p}>
        1. Connect your Ledger via USB{'\n'}
        2. Open the Ethereum/Solana app{'\n'}
        3. Click “Connect”
      </Text>
      <Pressable style={styles.cta}><Text style={styles.ctaTxt}>Connect Ledger</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:{ flex:1, backgroundColor:'#0B0E16', padding:24, paddingTop:124 },
  h1:{ color:'#fff', fontSize:22, fontWeight:'800', marginBottom:192 },
  p:{ color:'#D9E6EF', fontSize:16, lineHeight:24, marginBottom:294 },
  cta:{ height:52, borderRadius:16, backgroundColor:'#0D3D52', alignItems:'center', justifyContent:'center' },
  ctaTxt:{ color:'#E8F3F9', fontSize:16, fontWeight:'800' },
});