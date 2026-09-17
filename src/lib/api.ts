import { treaty } from "@elysiajs/eden";

import type { App } from "@/server/app";

/**
 * Typed API client (Eden Treaty).
 *
 * In the browser we hit the same origin — the vite dev proxy forwards /api
 * to the Elysia server; in production the Worker serves both.
 * Outside a browser (tests) fall back to the local API port.
 */
export const api = treaty<App>(globalThis.location?.host ?? "localhost:3001");
