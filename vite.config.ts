import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    // Route tree must be regenerated before TypeScript sees the sources.
    // EnableRouteGeneration: false は scaffold（空ファイルの自動生成）を止める。
    // 副作用として routeTree.gen.ts の自動再生成も止まるため、ルート追加/変更時は
    // 手動で `bun run gen:routes` を実行する。
    tanstackRouter({ autoCodeSplitting: true, enableRouteGeneration: false, target: "react" }),
    react({ compiler: true }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    proxy: {
      // Elysia 開発サーバー（:3001）へ転送する。本番は同一 Worker が配信する。
      "/api": "http://localhost:3001",
      "/card": "http://localhost:3001",
    },
  },
});
