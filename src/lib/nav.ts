import { router, type Href } from "expo-router";

let lastKey = "", lastAt = 0;
const isDuplicate = (k: string, win = 700) => {
  const now = Date.now();
  if (k === lastKey && now - lastAt < win) return true;
  lastKey = k; lastAt = now; return false;
};

export function goToTokenDetails(
  params: { id: string; chainId?: string; accountId?: string },
  opts?: { currentPathname?: string }
) {
  const href: Href = {
    pathname: "/(tabs)/(home)/token/[id]" as any, // 👈 nueva ruta
    params: {
      id: params.id,
      ...(params.chainId ? { chainId: params.chainId } : {}),
      ...(params.accountId ? { accountId: params.accountId } : {}),
    },
  };

  const key = `${href.pathname}?${JSON.stringify(href.params)}`;
  if (isDuplicate(key)) return;

  const path = opts?.currentPathname ?? "";
  // push desde Home; replace cuando ya estás en token
  if (path.startsWith("/(tabs)/(home)/token/")) router.replace(href);
  else router.push(href);
}