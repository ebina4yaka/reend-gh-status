import { Elysia } from "elysia";
import { Maybe, type Result } from "true-myth";
import * as valibot from "valibot";

import { CARD_SIZES, CARD_WIDTH, type CardSize, cardTokens } from "@/cards/tokens";
import { CardQuerySchema, isCardType, normalizeCardType } from "@/shared/cards";
import type { ApiResponse, GithubSnapshot } from "@/shared/github";

import { buildCard } from "@/cards/build";
import { type GithubFailure, describeFailure } from "./github/client";
import { formatSyncCaption } from "@/lib/format";

import { loadSnapshot } from "./snapshot";
import { loadCardJapanese, renderSvg } from "./svg/render";

export type { GithubSnapshot } from "@/shared/github";

/** 失敗の種類を HTTP ステータスへ写す。 */
function failureStatus(failure: GithubFailure): number {
  if (failure.kind === "missing-username" || failure.kind === "missing-token") {
    return 503;
  }
  if (failure.kind === "not-found") {
    return 404;
  }
  if (failure.kind === "rate-limited") {
    return 429;
  }
  return 502;
}

function errorResponse(failure: GithubFailure): ApiResponse<never> {
  const described: ReturnType<typeof describeFailure> = describeFailure(failure);
  return { message: described.message, reason: described.reason, status: "error" };
}

/**
 * アプリのルート定義。開発は Bun（main.ts）、本番は Cloudflare Workers（worker.ts）で
 * 同じアプリを動かす。`App` 型は Eden Treaty のクライアント（src/lib/api.ts）が参照する。
 */
// oxlint-disable-next-line typescript/explicit-function-return-type -- App = ReturnType<typeof createApp>; inlining the Elysia type is un-maintainable.
export function createApp() {
  return (
    new Elysia()
      .route("QUERY", "/api/health", () => ({ status: "ok" as const }))
      // ダッシュボードは 5 枚のカードを 1 回のスナップショットで描く。
      .route("QUERY", "/api/snapshot", async ({ set }): Promise<ApiResponse<GithubSnapshot>> => {
        const loaded: Result<GithubSnapshot, GithubFailure> = await loadSnapshot();
        if (loaded.isErr) {
          set.status = failureStatus(loaded.error);
          return errorResponse(loaded.error);
        }
        return { data: loaded.value, fetchedAt: new Date().toISOString(), status: "ok" };
      })
      /**
       * README 埋め込み用の SVG。ここだけ GET を使う。
       * GitHub の camo は <img src> に GET しか送れず、ボディも付けられないため、
       * PRTS の QUERY 規約の例外とする（カード取得は読み取り専用）。
       */
      .route("GET", "/card/:type", async ({ params, query, set }) => {
        const type: string = normalizeCardType(params.type);
        if (!isCardType(type)) {
          set.status = 404;
          return "unknown card type";
        }
        const parsed = valibot.safeParse(CardQuerySchema, query);
        if (!parsed.success) {
          set.status = 400;
          return "invalid query";
        }
        const loaded: Result<GithubSnapshot, GithubFailure> = await loadSnapshot();
        if (loaded.isErr) {
          set.status = failureStatus(loaded.error);
          return describeFailure(loaded.error).message;
        }
        const tokens = cardTokens(parsed.output.theme, parsed.output.accent);
        const size: CardSize = CARD_SIZES[type] ?? { height: 220 };
        const japaneseResult: Result<ArrayBuffer, string> = await loadCardJapanese(loaded.value);
        const japanese: Maybe<ArrayBuffer> = japaneseResult.match<Maybe<ArrayBuffer>>({
          Err: () => Maybe.nothing(),
          Ok: (value: ArrayBuffer) => Maybe.just(value),
        });
        const svg: Result<string, string> = await renderSvg(
          buildCard({
            caption: formatSyncCaption(new Date().toISOString()),
            snapshot: loaded.value,
            tokens,
            type,
          }),
          {
            height: size.height,
            japanese,
            width: CARD_WIDTH,
          },
        );
        if (svg.isErr) {
          set.status = 500;
          return svg.error;
        }
        set.headers["cache-control"] = "public, max-age=600, s-maxage=1800";
        set.headers["content-security-policy"] = "default-src 'none'; style-src 'unsafe-inline'";
        set.headers["content-type"] = "image/svg+xml; charset=utf-8";
        set.headers["x-content-type-options"] = "nosniff";
        return svg.value;
      })
  );
}

export type App = ReturnType<typeof createApp>;
