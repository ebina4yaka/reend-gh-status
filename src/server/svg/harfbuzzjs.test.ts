import { describe, expect, test } from "bun:test";
import type { HarfbuzzApi } from "harfbuzzjs/hbjs.js";

import harfbuzz from "./harfbuzzjs";

/**
 * Harfbuzzjs の差し替え。本番（wrangler）では CompiledWasm を
 * instantiateWasm で渡し、Bun では hb.wasm の import がパス文字列に
 * なるのでファイルからコンパイルする。どちらも API が使える形で
 * 解決することを見る。
 */
describe("harfbuzzjs の差し替え", () => {
  test("同梱の wasm を渡して HarfBuzz を初期化できる", async () => {
    const api: HarfbuzzApi = await harfbuzz;
    expect(typeof api.createBlob).toBe("function");
    expect(typeof api.createBuffer).toBe("function");
    expect(typeof api.createFace).toBe("function");
    expect(typeof api.createFont).toBe("function");
  });
});
