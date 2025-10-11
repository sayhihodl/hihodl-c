// src/i18n/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

/* ========= JSONs ========= */
/* common + dashboard (base) */
import en_dashboard from "./resources/en/dashboard.json";
import en_common    from "./resources/en/common.json";

import nl_dashboard from "./resources/nl/dashboard.json";
import nl_common    from "./resources/nl/common.json";

import esES_dashboard from "./resources/es-ES/dashboard.json";
import esES_common    from "./resources/es-ES/common.json";
import esMX_dashboard from "./resources/es-MX/dashboard.json";
import esMX_common    from "./resources/es-MX/common.json";
import esAR_dashboard from "./resources/es-AR/dashboard.json";
import esAR_common    from "./resources/es-AR/common.json";

import fr_dashboard from "./resources/fr/dashboard.json";
import fr_common    from "./resources/fr/common.json";

import ptBR_dashboard from "./resources/pt-BR/dashboard.json";
import ptBR_common    from "./resources/pt-BR/common.json";

/* ========= Fase 2 + Asia Push (dashboard/common) ========= */
import de_dashboard from "./resources/de/dashboard.json";
import de_common    from "./resources/de/common.json";

import it_dashboard from "./resources/it/dashboard.json";
import it_common    from "./resources/it/common.json";

import tr_dashboard from "./resources/tr/dashboard.json";
import tr_common    from "./resources/tr/common.json";

/* Árabe solo para EAU (ar-AE) */
import ar_dashboard from "./resources/ar-AE/dashboard.json";
import ar_common    from "./resources/ar-AE/common.json";

import hi_dashboard from "./resources/hi/dashboard.json";
import hi_common    from "./resources/hi/common.json";

import zhCN_dashboard from "./resources/zh-CN/dashboard.json";
import zhCN_common    from "./resources/zh-CN/common.json";

import ja_dashboard from "./resources/ja/dashboard.json";
import ja_common    from "./resources/ja/common.json";

import th_dashboard from "./resources/th/dashboard.json";
import th_common    from "./resources/th/common.json";

import sw_dashboard from "./resources/sw/dashboard.json";
import sw_common    from "./resources/sw/common.json";

import ko_dashboard from "./resources/ko/dashboard.json";
import ko_common    from "./resources/ko/common.json";

import id_dashboard from "./resources/id/dashboard.json";
import id_common    from "./resources/id/common.json";

import vi_dashboard from "./resources/vi/dashboard.json";
import vi_common    from "./resources/vi/common.json";

/* ========= TX (namespace) ========= */
import en_tx   from "./resources/en/tx.json";
import nl_tx   from "./resources/nl/tx.json";
import esES_tx from "./resources/es-ES/tx.json";
import esMX_tx from "./resources/es-MX/tx.json";
import esAR_tx from "./resources/es-AR/tx.json";
import de_tx   from "./resources/de/tx.json";
import it_tx   from "./resources/it/tx.json";
import tr_tx   from "./resources/tr/tx.json";
import ar_tx   from "./resources/ar-AE/tx.json";
import fr_tx   from "./resources/fr/tx.json";
import ptBR_tx from "./resources/pt-BR/tx.json";
import hi_tx   from "./resources/hi/tx.json";
import zhCN_tx from "./resources/zh-CN/tx.json";
import ja_tx   from "./resources/ja/tx.json";
import th_tx   from "./resources/th/tx.json";
import sw_tx   from "./resources/sw/tx.json";
import ko_tx   from "./resources/ko/tx.json";
import id_tx   from "./resources/id/tx.json";
import vi_tx   from "./resources/vi/tx.json";

/* ========= PAYMENTS (namespace) ========= */
import en_payments   from "./resources/en/payments.json";
import esES_payments from "./resources/es-ES/payments.json";
import esMX_payments from "./resources/es-MX/payments.json";
import esAR_payments from "./resources/es-AR/payments.json";
import fr_payments   from "./resources/fr/payments.json";
import de_payments   from "./resources/de/payments.json";
import nl_payments   from "./resources/nl/payments.json";
import ptBR_payments from "./resources/pt-BR/payments.json";
import it_payments   from "./resources/it/payments.json";
import tr_payments   from "./resources/tr/payments.json";
import ar_payments   from "./resources/ar-AE/payments.json";
import hi_payments   from "./resources/hi/payments.json";
import zhCN_payments from "./resources/zh-CN/payments.json";
import ja_payments   from "./resources/ja/payments.json";
import th_payments   from "./resources/th/payments.json";
import sw_payments   from "./resources/sw/payments.json";
import ko_payments   from "./resources/ko/payments.json";
import id_payments   from "./resources/id/payments.json";
import vi_payments   from "./resources/vi/payments.json";

/* ========= SWAP (namespace) ========= */
import en_swap   from "./resources/en/swap.json";
import esES_swap from "./resources/es-ES/swap.json";
import esMX_swap from "./resources/es-MX/swap.json";
import esAR_swap from "./resources/es-AR/swap.json";
import fr_swap   from "./resources/fr/swap.json";
import de_swap   from "./resources/de/swap.json";
import nl_swap   from "./resources/nl/swap.json";
import ptBR_swap from "./resources/pt-BR/swap.json";
import it_swap   from "./resources/it/swap.json";
import tr_swap   from "./resources/tr/swap.json";
import ar_swap   from "./resources/ar-AE/swap.json";
import hi_swap   from "./resources/hi/swap.json";
import zhCN_swap from "./resources/zh-CN/swap.json";
import ja_swap   from "./resources/ja/swap.json";
import th_swap   from "./resources/th/swap.json";
import sw_swap   from "./resources/sw/swap.json";
import ko_swap   from "./resources/ko/swap.json";
import id_swap   from "./resources/id/swap.json";
import vi_swap   from "./resources/vi/swap.json";

/* ========= REFERRAL (namespace) ========= */
import en_referral   from "./resources/en/referral.json";
import esES_referral from "./resources/es-ES/referral.json";
import esMX_referral from "./resources/es-MX/referral.json";
import esAR_referral from "./resources/es-AR/referral.json";
import fr_referral   from "./resources/fr/referral.json";
import de_referral   from "./resources/de/referral.json";
import nl_referral   from "./resources/nl/referral.json";
import ptBR_referral from "./resources/pt-BR/referral.json";
import it_referral   from "./resources/it/referral.json";
import tr_referral   from "./resources/tr/referral.json";
import ar_referral   from "./resources/ar-AE/referral.json";
import hi_referral   from "./resources/hi/referral.json";
import zhCN_referral from "./resources/zh-CN/referral.json";
import ja_referral   from "./resources/ja/referral.json";
import th_referral   from "./resources/th/referral.json";
import sw_referral   from "./resources/sw/referral.json";
import ko_referral   from "./resources/ko/referral.json";
import id_referral   from "./resources/id/referral.json";
import vi_referral   from "./resources/vi/referral.json";

/* ========= Soporte ========= */
export type Lang = (typeof SUPPORTED)[number];
export const SUPPORTED = [
  // Core
  "en", "nl",
  // Español + variantes
  "es", "es-ES", "es-MX", "es-AR",
  // Europa/LatAm
  "fr", "pt-BR", "pt", "pt-br", "de", "it", "tr",
  // MENA / Asia / África
  "ar-AE", "hi", "zh-CN", "zh", "zh-cn", "ja", "th", "sw",
  // Asia Push
  "ko", "id", "vi",
] as const;

const resources = {
  /* Base */
  en: { common: en_common, dashboard: en_dashboard, tx: en_tx, payments: en_payments, swap: en_swap, referral: en_referral },
  nl: { common: nl_common, dashboard: nl_dashboard, tx: nl_tx, payments: nl_payments, swap: nl_swap, referral: nl_referral },

  /* Español (variantes) */
  "es-ES": { common: esES_common, dashboard: esES_dashboard, tx: esES_tx, payments: esES_payments, swap: esES_swap, referral: esES_referral },
  es:      { common: esES_common, dashboard: esES_dashboard, tx: esES_tx, payments: esES_payments, swap: esES_swap, referral: esES_referral },
  "es-MX": { common: esMX_common, dashboard: esMX_dashboard, tx: esMX_tx, payments: esMX_payments, swap: esMX_swap, referral: esMX_referral },
  "es-AR": { common: esAR_common, dashboard: esAR_dashboard, tx: esAR_tx, payments: esAR_payments, swap: esAR_swap, referral: esAR_referral },

  /* FR/PT-BR */
  fr:      { common: fr_common,   dashboard: fr_dashboard,   tx: fr_tx,   payments: fr_payments,   swap: fr_swap,   referral: fr_referral },
  "pt-BR": { common: ptBR_common, dashboard: ptBR_dashboard, tx: ptBR_tx, payments: ptBR_payments, swap: ptBR_swap, referral: ptBR_referral },

  // aliases PT
  pt:      { common: ptBR_common, dashboard: ptBR_dashboard, tx: ptBR_tx, payments: ptBR_payments, swap: ptBR_swap, referral: ptBR_referral },
  "pt-br": { common: ptBR_common, dashboard: ptBR_dashboard, tx: ptBR_tx, payments: ptBR_payments, swap: ptBR_swap, referral: ptBR_referral },

  /* Europa extra */
  de: { common: de_common, dashboard: de_dashboard, tx: de_tx, payments: de_payments, swap: de_swap, referral: de_referral },
  it: { common: it_common, dashboard: it_dashboard, tx: it_tx, payments: it_payments, swap: it_swap, referral: it_referral },
  tr: { common: tr_common, dashboard: tr_dashboard, tx: tr_tx, payments: tr_payments, swap: tr_swap, referral: tr_referral },

  /* Árabe solo EAU */
  "ar-AE": { common: ar_common, dashboard: ar_dashboard, tx: ar_tx, payments: ar_payments, swap: ar_swap, referral: ar_referral },
  ar:      { common: ar_common, dashboard: ar_dashboard, tx: ar_tx, payments: ar_payments, swap: ar_swap, referral: ar_referral },

  /* India / China */
  hi:      { common: hi_common,    dashboard: hi_dashboard,    tx: hi_tx,      payments: hi_payments,  swap: hi_swap,    referral: hi_referral },
  "zh-CN": { common: zhCN_common,  dashboard: zhCN_dashboard,  tx: zhCN_tx,    payments: zhCN_payments, swap: zhCN_swap,  referral: zhCN_referral },
  zh:      { common: zhCN_common,  dashboard: zhCN_dashboard,  tx: zhCN_tx,    payments: zhCN_payments, swap: zhCN_swap,  referral: zhCN_referral },
  "zh-cn": { common: zhCN_common,  dashboard: zhCN_dashboard,  tx: zhCN_tx,    payments: zhCN_payments, swap: zhCN_swap,  referral: zhCN_referral },

  /* Japón / Tailandia / Suajili */
  ja: { common: ja_common, dashboard: ja_dashboard, tx: ja_tx, payments: ja_payments, swap: ja_swap, referral: ja_referral },
  th: { common: th_common, dashboard: th_dashboard, tx: th_tx, payments: th_payments, swap: th_swap, referral: th_referral },
  sw: { common: sw_common, dashboard: sw_dashboard, tx: sw_tx, payments: sw_payments, swap: sw_swap, referral: sw_referral },

  /* Asia Push */
  ko: { common: ko_common, dashboard: ko_dashboard, tx: ko_tx, payments: ko_payments, swap: ko_swap, referral: ko_referral },
  id: { common: id_common, dashboard: id_dashboard, tx: id_tx, payments: id_payments, swap: id_swap, referral: id_referral },
  vi: { common: vi_common, dashboard: vi_dashboard, tx: vi_tx, payments: vi_payments, swap: vi_swap, referral: vi_referral },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    load: "all",
    supportedLngs: SUPPORTED as unknown as string[],
    nonExplicitSupportedLngs: true,
    lowerCaseLng: false,
    fallbackLng: {
      "zh-CN": ["zh-CN", "zh", "en"],
      "zh":    ["zh", "zh-CN", "en"],
      "zh-cn": ["zh-cn", "zh-CN", "zh", "en"],
      "pt-BR": ["pt-BR", "pt", "en"],
      "pt":    ["pt", "pt-BR", "en"],
      "pt-br": ["pt-br", "pt-BR", "pt", "en"],
      default: ["en"],
    },
    defaultNS: "common",
    ns: ["common","dashboard","tx","settings","profile","payments","swap","referral","security"],
    interpolation: { escapeValue: false },
    keySeparator: ".",
    nsSeparator: ":",
    returnNull: false,
  });

export async function setLang(code: string) {
  await i18n.changeLanguage(code);
}

export async function preloadNamespaces(ns: string[]) {
  await i18n.loadNamespaces(ns);
}

export default i18n;

export async function initI18n() {
  if ((i18n as any).isInitialized) return i18n;
  return i18n;
}