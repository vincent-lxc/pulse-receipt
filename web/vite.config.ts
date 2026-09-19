import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 43147,
    strictPort: true,
    proxy: {
      "/rpc/testnet": {
        target: "https://rpc.testnet.arc.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rpc\/testnet/, ""),
      },
      "/rpc/mainnet": {
        target: "https://rpc.mainnet.arc.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rpc\/mainnet/, ""),
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 43147,
    strictPort: true,
  },
});
