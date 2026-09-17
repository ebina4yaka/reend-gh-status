import { STORAGE_KEY, foregroundFor, hexToHslTriplet, isValidHex } from "./theme";

/** 保存値の生の形。mode / primary の妥当性は適用時に判定する。 */
interface StoredTheme {
  mode: unknown;
  primary: unknown;
}

/**
 * React レンダー前（モジュール評価時）に一度だけ実行するテーマ初期適用（FOUC 防止）。
 * main.tsx の最初に import すること。html のパース直後ではあるがバンドル読込後のため、
 * コールドロード時は既定テーマが一瞬見える。
 * 判定・変換は src/lib/theme.ts の useApplyTheme と同一。
 */
/** LocalStorage からテーマ保存値を読む。壊れていれば既定値へフォールバック。 */
function parseStoredTheme(): StoredTheme {
  // oxlint-disable-next-line project/ban-try-catch -- JSON.parse 境界は try/catch で拾う（Result.tryOrElse と同値、ast-grep unchecked-throwing-call 対応）
  try {
    const parsed: StoredTheme = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed;
  } catch {
    return { mode: "system", primary: "" };
  }
}

/** 適用結果が dark テーマかどうかを返す。 */
function applyTheme(): boolean {
  const stored: StoredTheme = parseStoredTheme();
  const dark: boolean =
    stored.mode === "dark" ||
    (stored.mode === "system" && globalThis.matchMedia("(prefers-color-scheme: dark)").matches);
  const root: HTMLElement = document.documentElement;
  root.classList.toggle("light", !dark);
  root.classList.toggle("dark", dark);
  if (isValidHex(stored.primary)) {
    root.style.setProperty("--primary", hexToHslTriplet(stored.primary));
    root.style.setProperty("--primary-foreground", foregroundFor(stored.primary));
  } else {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--primary-foreground");
  }
  return dark;
}

applyTheme();
