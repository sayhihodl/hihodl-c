// lib/onBack.ts
import { router, type Href } from "expo-router";

export const onBack = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    const homeHref: Href = {
      pathname: "/(tabs)/(home)" as any,
    };
    router.replace(homeHref);
  }
};