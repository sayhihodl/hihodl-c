// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// --- IMPORTANTE ---
// 1) Quita "svg" de assetExts
// 2) Añade "svg" a sourceExts
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== "svg");
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

// 3) Usa el transformer para SVG
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer");

// (opcional pero recomendable) Evita sourceExts duplicados
config.resolver.sourceExts = Array.from(new Set(config.resolver.sourceExts));

module.exports = config;