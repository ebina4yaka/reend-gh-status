import { treaty } from "@elysiajs/eden";

import type { App } from "@/server/app";

/**
 * Typed API client (Eden Treaty).
 *
 * In the browser we hit the same origin — the vite dev proxy forwards /api
 * to the Elysia server; in production the Worker serves both.
 * Outside a browser (tests) fall back to the local API port.
 *
 * parseDate: false が必須。既定では Eden が ISO 8601 文字列を Date へ
 * 復元するため、共有カード部品（文字列前提で formatDate を通す）が
 * ブラウザだけで落ちる。サーバーの JSON は文字列のまま受け取る。
 */
export const api = treaty<App>(globalThis.location?.host ?? "localhost:3001", {
  parseDate: false,
});
