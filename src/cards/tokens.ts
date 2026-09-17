/**
 * ReEnd のデザイントークン実値（CSS 変数と同じ値）。カード部品は Tailwind を使わず、
 * インライン style へ直接埋める。そのため dark / light の 2 組をここに持つ。
 * 値は reend-components/src/styles/variables.css と同期させる。
 *
 * 形式は "H, S%, L%" の三つ組。color() が hsl()/hsla() へ組み立てる
 * （satori の CSS パーサーはカンマ区切りを確実に解釈する）。
 */

export type CardThemeName = "dark" | "light";
export type CardAccentName = "cyan" | "blue" | "yellow";

export interface CardTokens {
  /** アクセント色（カードの主線と強調値）。 */
  readonly accent: string;
  readonly accentSoft: string;
  readonly background: string;
  readonly blue: string;
  readonly border: string;
  readonly borderAccent: string;
  readonly borderStrong: string;
  readonly cyan: string;
  readonly green: string;
  readonly orange: string;
  readonly purple: string;
  readonly red: string;
  readonly surface1: string;
  readonly surface2: string;
  readonly surface3: string;
  readonly textMuted: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly yellow: string;
}

/** "H, S%, L%" + 不透明度から CSS 色を組み立てる。 */
export function color(triplet: string, opacity: number = 1): string {
  return opacity >= 1 ? `hsl(${triplet})` : `hsla(${triplet}, ${opacity})`;
}

const ACCENTS: Readonly<Record<CardAccentName, { dark: string; light: string }>> = {
  blue: { dark: "201, 66%, 58%", light: "201, 66%, 42%" },
  cyan: { dark: "186, 100%, 50%", light: "186, 80%, 35%" },
  yellow: { dark: "48, 100%, 58%", light: "42, 90%, 42%" },
};

interface ThemePalette {
  readonly background: string;
  readonly border: string;
  readonly borderStrong: string;
  readonly surface1: string;
  readonly surface2: string;
  readonly surface3: string;
  readonly textMuted: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
}

const PALETTES: Readonly<Record<CardThemeName, ThemePalette>> = {
  dark: {
    background: "0, 0%, 4%",
    border: "0, 0%, 100%",
    borderStrong: "0, 0%, 100%",
    surface1: "0, 0%, 7.8%",
    surface2: "0, 0%, 10%",
    surface3: "0, 0%, 13.3%",
    textMuted: "0, 0%, 60%",
    textPrimary: "0, 0%, 94.1%",
    textSecondary: "0, 0%, 87.8%",
  },
  light: {
    background: "0, 0%, 97%",
    border: "0, 0%, 0%",
    borderStrong: "0, 0%, 0%",
    surface1: "0, 0%, 100%",
    surface2: "0, 0%, 97%",
    surface3: "0, 0%, 93%",
    textMuted: "0, 0%, 45%",
    textPrimary: "0, 0%, 8%",
    textSecondary: "0, 0%, 20%",
  },
};

/** テーマ名とアクセント名からカード用トークンを解決する。 */
export function cardTokens(theme: CardThemeName, accent: CardAccentName): CardTokens {
  const palette: ThemePalette = PALETTES[theme];
  const accentColor: string = ACCENTS[accent][theme];
  const isDark: boolean = theme === "dark";
  return {
    accent: accentColor,
    accentSoft: accentColor,
    background: palette.background,
    blue: isDark ? "201, 66%, 58%" : "201, 66%, 42%",
    border: palette.border,
    borderAccent: accentColor,
    borderStrong: palette.borderStrong,
    cyan: isDark ? "186, 100%, 50%" : "186, 80%, 35%",
    green: isDark ? "145, 67%, 51%" : "145, 60%, 38%",
    orange: isDark ? "39, 100%, 50%" : "39, 90%, 38%",
    purple: isDark ? "270, 77%, 64%" : "270, 65%, 50%",
    red: isDark ? "355, 100%, 64%" : "355, 85%, 48%",
    surface1: palette.surface1,
    surface2: palette.surface2,
    surface3: palette.surface3,
    textMuted: palette.textMuted,
    textPrimary: palette.textPrimary,
    textSecondary: palette.textSecondary,
    yellow: isDark ? "48, 100%, 58%" : "42, 90%, 42%",
  };
}

/** カードの共通寸法（satori の width / height と一致させる）。 */
export const CARD_WIDTH: number = 480;

export interface CardSize {
  readonly height: number;
}

export const CARD_SIZES: Readonly<Record<string, CardSize>> = {
  activity: { height: 280 },
  contributions: { height: 200 },
  repos: { height: 320 },
  stats: { height: 220 },
  "top-langs": { height: 220 },
};
