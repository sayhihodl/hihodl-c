module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@": "./src",
            "@assets": "./assets",
            "@app": "./app",
          },
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json", "*.d.ts","**/*.ts", "**/*.tsx",],
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};