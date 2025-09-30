import { View, TextInput, Pressable, StyleSheet, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { legacy } from "@/theme/colors";

const { TEXT, SUB } = legacy;

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  height?: number;
  onPaste?: () => void;
  onClear?: () => void;
  containerStyle?: any;
  inputProps?: TextInputProps;
};

export default function SearchField({
  value, onChangeText, placeholder, height = 50, onPaste, onClear, containerStyle, inputProps,
}: Props) {
  return (
    <View style={[styles.searchInHeader, { height }, containerStyle]}>
      <Ionicons name="search" size={18} color={SUB} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={SUB}
        style={styles.input}
        returnKeyType="search"
        {...inputProps}
      />
      {onPaste && (
        <Pressable onPress={onPaste} hitSlop={8} accessibilityLabel="Paste">
          <Ionicons name="clipboard-outline" size={18} color={SUB} />
        </Pressable>
      )}
      {!!value && onClear && (
        <Pressable onPress={onClear} hitSlop={8} accessibilityLabel="Clear">
          <Ionicons name="close-circle" size={18} color={SUB} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchInHeader: {
    borderRadius: 14, paddingHorizontal: 12,
    backgroundColor: "rgba(3, 12, 16, 0.35)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  input: { flex: 1, color: TEXT, fontSize: 15 },
});