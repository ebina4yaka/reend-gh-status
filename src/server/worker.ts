import { Elysia } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";

import { createApp } from "./app";
import { type WorkerEnv, setWorkerEnv } from "./env";

// Ponytail: Elysia の CloudflareAdapter は fetch(request) しか受けず env をコンテキストに
// 入れない。リクエスト毎に env（ASSETS / secrets）を globalThis.env へ差し込み、
// 参照側の env.ts から読ませる。
const app = new Elysia({ adapter: CloudflareAdapter }).use(createApp()).compile();

export default {
  fetch(request: Request, env: WorkerEnv): Response | Promise<Response> {
    setWorkerEnv(env);
    return app.fetch(request);
  },
};
