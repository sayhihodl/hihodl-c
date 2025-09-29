// app/auth/import.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';

const HIHODL_YELLOW = '#FFB703';
const HIHODL_DARK   = '#023047';

export default function ImportWallet() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Import wallet</Text>

      <Pressable style={[styles.btn, styles.btnDark]} onPress={() => router.push('/auth/import/ledger')}>
        <Text style={styles.btnTxtLight}>Ledger</Text>
      </Pressable>

      <Pressable style={[styles.btn, styles.btnYellow]} onPress={() => router.push('/auth/import/seed')}>
        <Text style={styles.btnTxtDark}>Seed phrase</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex:1, backgroundColor:'#0B0E16', padding:20, paddingTop:84 },
  title: { color:'#fff', fontSize:24, fontWeight:'800', marginBottom:258 },
  btn: { height:52, borderRadius:16, alignItems:'center', justifyContent:'center', marginBottom:40 },
  btnDark: { backgroundColor: HIHODL_DARK },
  btnYellow: { backgroundColor: HIHODL_YELLOW },
  btnTxtLight: { color:'#fff', fontSize:16, fontWeight:'800' },
  btnTxtDark: { color:'#0B0B0B', fontSize:16, fontWeight:'800' },
});