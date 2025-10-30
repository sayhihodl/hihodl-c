import { Platform, ToastAndroid, Alert } from "react-native";

export function showToast(message: string) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  // iOS fallback: lightweight alert as placeholder toast
  try {
    Alert.alert("", message);
  } catch {}
}


