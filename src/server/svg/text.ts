/**
 * カード描画前に日本語文字をまとめて拾うためのユーティリティ。
 *
 * satori の loadAdditionalAsset は languageCode 単位で結果を覚えるため、
 * セグメントごとに別のサブセットを返すと最初のフォントが使い回されて
 * 2 文字目以降が豆腐になる。先に必要な文字を全部集めて 1 つの
 * サブセットを作り、それを返す方式にする。
 */

/** 値の中の文字列を再帰的に集める。 */
export function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, out);
    }
    return out;
  }
  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      collectStrings(item, out);
    }
  }
  return out;
}

const ASCII_MAX: number = 127;

/** 文字列群から非 ASCII 文字を重複なしで抜き出す（Noto Sans JP のサブセット要求用）。 */
export function nonAsciiChars(values: readonly string[]): string {
  const chars: Set<string> = new Set<string>();
  for (const value of values) {
    for (const char of value) {
      if ((char.codePointAt(0) ?? 0) > ASCII_MAX) {
        chars.add(char);
      }
    }
  }
  return [...chars].join("");
}
