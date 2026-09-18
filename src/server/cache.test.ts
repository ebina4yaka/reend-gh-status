import { describe, expect, test } from "bun:test";

import { withCacheControl } from "./cache";

/**
 * Workers の fetch 応答はヘッダーが immutable で、clone した応答へ headers.set
 * すると "Can't modify immutable headers" で落ちる。元の応答を触らず、
 * ヘッダーを作り直した別の Response を返すことを固定する。
 */
describe("withCacheControl", () => {
  test("キャッシュ用ヘッダーを足した別の応答を返す", async () => {
    const original: Response = new Response('{"ok":true}', {
      headers: { "content-type": "application/json" },
      status: 200,
    });
    const stored: Response = withCacheControl(original, 600);
    expect(stored).not.toBe(original);
    expect(stored.headers).not.toBe(original.headers);
    expect(stored.headers.get("cache-control")).toBe("public, max-age=600");
    expect(stored.headers.get("content-type")).toBe("application/json");
    expect(stored.status).toBe(200);
  });

  test("元の応答のヘッダーと本文を変更しない", async () => {
    const original: Response = new Response("payload");
    const stored: Response = withCacheControl(original, 60);
    // 共有している応答へ set してしまうと、ここに cache-control が付く。
    expect(original.headers.get("cache-control")).toBeNull();
    expect(await original.text()).toBe("payload");
    expect(await stored.text()).toBe("payload");
  });
});
