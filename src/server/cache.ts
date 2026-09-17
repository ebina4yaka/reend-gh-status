import { Maybe, Result } from "true-myth";

import { asyncResult } from "./async-result";

/**
 * Workers の Cache API を薄く包む。Bun 開発やテストでは `caches` が
 * 無い（または使えない）ので、その場合は素通しする。
 */

interface CacheLike {
  /** 仕様上、該当なしは undefined を返す（型は Response のまま扱い Maybe で包む）。 */
  match: (request: Request) => Promise<Response>;
  put: (request: Request, response: Response) => Promise<unknown>;
}

declare const caches: { default: CacheLike };

function getCache(): Maybe<CacheLike> {
  if (!("caches" in globalThis)) {
    return Maybe.nothing();
  }
  return Maybe.of(caches.default);
}

/**
 * 合成キー（GET）で応答をキャッシュする。GraphQL は POST のため
 * 元の Request では Cache API へ載せられない。
 */
export async function withCache(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<Result<Response, unknown>>,
): Promise<Result<Response, unknown>> {
  const cache: Maybe<CacheLike> = getCache();
  const cacheKey: Request = new Request(`https://cache.internal/${key}`);
  if (cache.isJust) {
    const hit: Maybe<Response> = Maybe.of(await cache.value.match(cacheKey));
    if (hit.isJust && hit.value.ok) {
      return Result.ok(hit.value);
    }
  }
  const fresh: Result<Response, unknown> = await loader();
  if (fresh.isOk && cache.isJust && fresh.value.ok) {
    const stored: Response = fresh.value.clone();
    stored.headers.set("cache-control", `public, max-age=${String(ttlSeconds)}`);
    await asyncResult(cache.value.put(cacheKey, stored));
  }
  return fresh;
}
