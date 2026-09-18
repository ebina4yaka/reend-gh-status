import { STORAGE_KEY, type ThemeState, applyThemeToDocument } from "./theme";

/**
 * React レンダー前（モジュール評価時）に一度だけ実行するテーマ初期適用（FOUC 防止）。
 * main.tsx の最初に import すること。html のパース直後ではあるがバンドル読込後のため、
 * コールドロード時は既定テーマが一瞬見える。
 */

/** LocalStorage からテーマ保存値を読む。壊れていれば空にして既定テーマへ委ねる。 */
function readStoredTheme(): ThemeState {
  // oxlint-disable-next-line project/ban-try-catch -- JSON.parse 境界は try/catch で拾う（Result.tryOrElse と同値、ast-grep unchecked-throwing-call 対応）
  try {
    const parsed: ThemeState = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed;
  } catch {
    return { mode: "system", primary: "" };
  }
}

applyThemeToDocument(readStoredTheme());
