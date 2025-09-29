// app/menu/privacy.tsx
import { View, Text, StyleSheet } from "react-native";
export default function Privacy() {
  return (
    <View style={s.c}><Text style={s.t}>Privacy</Text></View>
  );
}
const s = StyleSheet.create({ c:{flex:1,backgroundColor:"#041E26",justifyContent:"center",alignItems:"center"}, t:{color:"#fff",fontSize:18} });