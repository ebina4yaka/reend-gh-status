import * as valibot from "valibot";

import type { CardAccentName, CardThemeName } from "@/cards/tokens";

/** カード種別とクエリパラメータの定義（クライアントとサーバーで共用）。 */

export type CardType = "stats" | "top-langs" | "contributions" | "activity" | "repos";

export const CARD_TYPES: readonly CardType[] = [
  "stats",
  "top-langs",
  "contributions",
  "activity",
  "repos",
];

export const CARD_LABELS: Readonly<Record<CardType, string>> = {
  activity: "ACTIVITY",
  contributions: "CONTRIBUTIONS",
  repos: "REPOSITORIES",
  stats: "STATS",
  "top-langs": "TOP LANGS",
};

export function isCardType(value: string): value is CardType {
  return CARD_TYPES.some((type) => type === value);
}

/** `/card/stats.svg` のような拡張子付きパスを受け付けられるようにする。 */
export function normalizeCardType(raw: string): string {
  return raw.endsWith(".svg") ? raw.slice(0, -".svg".length) : raw;
}

export const CardQuerySchema = valibot.object({
  accent: valibot.optional(
    valibot.picklist(["yellow", "blue", "cyan"] satisfies readonly CardAccentName[]),
    "yellow",
  ),
  theme: valibot.optional(
    valibot.picklist(["dark", "light"] satisfies readonly CardThemeName[]),
    "dark",
  ),
});
