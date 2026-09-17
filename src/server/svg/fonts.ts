import { Maybe, Result } from "true-myth";

import { asyncResult } from "../async-result";
import { getAssets } from "../env";

/**
 * Satori へ渡すフォント。satori は WOFF2 を読めないため WOFF / TTF を使う。
 * 基本フォント（Latin）は public/fonts から、日本語は Google Fonts の
 * 動的サブセットを実行時に取得する。
 */

export interface LoadedFont {
  readonly data: ArrayBuffer;
  readonly name: string;
  readonly style: "normal";
  readonly weight: 400 | 700 | 900;
}

interface FontSpec {
  readonly file: string;
  readonly name: string;
  readonly weight: 400 | 700 | 900;
}

const BASE_SPECS: readonly FontSpec[] = [
  { file: "Orbitron-Regular.ttf", name: "Orbitron", weight: 400 },
  { file: "Orbitron-Bold.ttf", name: "Orbitron", weight: 700 },
  { file: "Orbitron-Black.ttf", name: "Orbitron", weight: 900 },
  { file: "JetBrainsMono-Regular.ttf", name: "JetBrains Mono", weight: 400 },
  { file: "JetBrainsMono-Bold.ttf", name: "JetBrains Mono", weight: 700 },
];

const fontCache: { fonts: Maybe<readonly LoadedFont[]> } = { fonts: Maybe.nothing() };

async function readAsset(fileName: string): Promise<Result<ArrayBuffer, string>> {
  const assets = getAssets();
  if (assets.isJust) {
    const fetched: Result<Response, unknown> = await asyncResult(
      assets.value.fetch(`https://assets.internal/fonts/${fileName}`),
    );
    if (fetched.isErr) {
      return Result.err(`asset fetch failed: ${fileName}`);
    }
    const buffer: Result<ArrayBuffer, unknown> = await asyncResult(fetched.value.arrayBuffer());
    return buffer.mapErr(() => `asset read failed: ${fileName}`);
  }
  // Bun 開発サーバーはリポジトリ直下の public/ から読む。
  const file = Bun.file(`public/fonts/${fileName}`);
  const exists: boolean = await file.exists();
  if (!exists) {
    return Result.err(`asset not found: ${fileName}`);
  }
  const buffer: Result<ArrayBuffer, unknown> = await asyncResult(file.arrayBuffer());
  return buffer.mapErr(() => `asset read failed: ${fileName}`);
}

/** 基本フォント 5 種を読み込む（isolate 内でキャッシュする）。 */
export async function loadBaseFonts(): Promise<Result<readonly LoadedFont[], string>> {
  if (fontCache.fonts.isJust) {
    return Result.ok(fontCache.fonts.value);
  }
  const loaded: LoadedFont[] = [];
  // 5 ファイルだけなので逐次で読む（失敗したファイル名をそのまま返せる）。
  for (const spec of BASE_SPECS) {
    const data: Result<ArrayBuffer, string> = await readAsset(spec.file);
    if (data.isErr) {
      return Result.err(data.error);
    }
    loaded.push({ data: data.value, name: spec.name, style: "normal", weight: spec.weight });
  }
  fontCache.fonts = Maybe.just(loaded);
  return Result.ok(loaded);
}

// 日本語サブセットの isolate 内キャッシュ（上限付き。isolate のメモリを
// 守るため、超えたら全消しする）。
const CJK_CACHE_LIMIT: number = 64;
const cjkCache: Map<string, ArrayBuffer> = new Map<string, ArrayBuffer>();

const GOOGLE_FONT_UA: string =
  "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.14) Gecko/20080404 Firefox/2.0.0.14";

/**
 * 日本語（Noto Sans JP）のサブセットを Google Fonts から取る。
 * 古い UA を送ると woff2 ではなく TTF が返る（satori が読める形式）。
 */
export async function loadJapaneseSubset(segment: string): Promise<Result<ArrayBuffer, string>> {
  const cached: Maybe<ArrayBuffer> = Maybe.of(cjkCache.get(segment));
  if (cached.isJust) {
    return Result.ok(cached.value);
  }
  const cssUrl: string = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP&text=${encodeURIComponent(segment)}`;
  const cssResponse: Result<Response, unknown> = await asyncResult(
    fetch(cssUrl, { headers: { "User-Agent": GOOGLE_FONT_UA } }),
  );
  if (cssResponse.isErr || !cssResponse.value.ok) {
    return Result.err("google fonts css failed");
  }
  const css: string = await cssResponse.value.text();
  const fontUrl: Maybe<string> = Maybe.of(css.match(/url\((?<url>[^)]+)\)/)?.groups?.url);
  if (fontUrl.isNothing) {
    return Result.err("google fonts url not found");
  }
  const fontResponse: Result<Response, unknown> = await asyncResult(
    fetch(fontUrl.value, { headers: { "User-Agent": GOOGLE_FONT_UA } }),
  );
  if (fontResponse.isErr || !fontResponse.value.ok) {
    return Result.err("google fonts file failed");
  }
  const buffer: Result<ArrayBuffer, unknown> = await asyncResult(fontResponse.value.arrayBuffer());
  if (buffer.isErr) {
    return Result.err("google fonts read failed");
  }
  if (cjkCache.size >= CJK_CACHE_LIMIT) {
    cjkCache.clear();
  }
  cjkCache.set(segment, buffer.value);
  return Result.ok(buffer.value);
}
