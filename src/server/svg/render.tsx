// Satori より先に評価させる（satori の評価時に harfbuzzjs が location を読む）。
import "./emscripten-location";
import { type ReactElement } from "react";
import { type Maybe, Result, Unit } from "true-myth";
import satori, { type Font, init } from "satori/standalone";

import { asyncResult } from "../async-result";
import { type LoadedFont, loadBaseFonts, loadJapaneseSubset } from "./fonts";
import { collectStrings, nonAsciiChars } from "./text";
import { loadYoga } from "./yoga";

/**
 * 共有カード部品（src/cards）を SVG 文字列へ描画する。
 * satori は CSS のサブセットしか実装しないため、カード側は flex と
 * インラインスタイルだけで組んである。
 */

const state: { ready: boolean } = { ready: false };

async function ensureReady(): Promise<Result<Unit, string>> {
  if (state.ready) {
    return Result.ok(Unit);
  }
  const yoga: Result<WebAssembly.Module, string> = await loadYoga();
  if (yoga.isErr) {
    return Result.err(yoga.error);
  }
  const initialized: Result<void, unknown> = await asyncResult(init(yoga.value));
  if (initialized.isErr) {
    return Result.err(`satori init failed: ${String(initialized.error)}`);
  }
  state.ready = true;
  return Result.ok(Unit);
}

/**
 * 基本フォントに無い文字を補う。呼び出し側が事前に集めた日本語フォントを
 * そのまま返す（satori は languageCode 単位で結果をキャッシュするため、
 * 1 つのサブセットを全セグメントへ使い回す）。
 */
function createAssetLoader(
  japanese: Maybe<ArrayBuffer>,
): (code: string, segment: string) => Promise<Font[]> {
  return async (code: string, _segment: string): Promise<Font[]> => {
    if (code === "emoji" || japanese.isNothing) {
      return [];
    }
    return [
      { data: japanese.value, lang: "ja-JP", name: "Noto Sans JP", style: "normal", weight: 400 },
    ];
  };
}

export interface SvgOptions {
  readonly height: number;
  /** カード内の日本語を覆う Noto Sans JP サブセット。 */
  readonly japanese: Maybe<ArrayBuffer>;
  readonly width: number;
}

export async function renderSvg(
  element: ReactElement,
  options: SvgOptions,
): Promise<Result<string, string>> {
  const ready: Result<Unit, string> = await ensureReady();
  if (ready.isErr) {
    return Result.err(ready.error);
  }
  const fonts: Result<readonly LoadedFont[], string> = await loadBaseFonts();
  if (fonts.isErr) {
    return Result.err(fonts.error);
  }
  const loadAdditionalAsset: (code: string, segment: string) => Promise<Font[]> = createAssetLoader(
    options.japanese,
  );
  const rendered: Result<string, unknown> = await asyncResult(
    satori(element, {
      // 文字を path へ埋め込む（ブラウザ側でフォント無しでも同じ見た目になる）。
      embedFont: true,
      fonts: [...fonts.value],
      height: options.height,
      loadAdditionalAsset,
      width: options.width,
    }),
  );
  return rendered.mapErr((error) => `satori render failed: ${String(error)}`);
}

/** カードのデータから日本語サブセットを用意する（不要なら失敗として返す）。 */
export async function loadCardJapanese(data: unknown): Promise<Result<ArrayBuffer, string>> {
  const text: string = nonAsciiChars(collectStrings(data));
  if (text === "") {
    return Result.err("no japanese text");
  }
  return loadJapaneseSubset(text);
}
