// src/hooks/useKeyboardHeight.ts
import { useEffect, useState } from "react";
import { Keyboard, Platform, type KeyboardEventName } from "react-native";

export default function useKeyboardHeight() {
  const [h, setH] = useState(0);

  useEffect(() => {
    const showEvent: KeyboardEventName =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent: KeyboardEventName =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subShow = Keyboard.addListener(showEvent, (e) => {
      const kh = e?.endCoordinates?.height ?? 0;
      setH(kh);
    });

    const subHide = Keyboard.addListener(hideEvent, () => setH(0));

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  return h;
}