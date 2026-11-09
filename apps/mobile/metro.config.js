export const metro = {
  resolver: {
    extraNodeModules: new Proxy({}, { get: () => null }),
  },
};
