module.exports = {
  presets: ["babel-preset-expo"],
  plugins: [
    [
      "module-resolver",
      {
        root: ["."],
        alias: {
          "@shared": "../../packages/shared/src",
          "@src": "./src",
          "@components": "./src/components",
          "@lib": "./src/lib",
          "@features": "./src/features",
        },
      },
    ],
  ],
};
