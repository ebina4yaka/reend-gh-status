import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useSyncExternalStore } from "react";

import type { CardAccentName, CardThemeName } from "@/cards/tokens";

import { useTheme } from "./theme";

/** カードの見た目設定（アクセント色）と、テーマ解決の共有フック。 */

export const CARD_ACCENTS: readonly CardAccentName[] = ["yellow", "blue", "cyan"];

const accentAtom = atomWithStorage<CardAccentName>("reend-gh-status.accent", "yellow");

export function useCardAccent(): {
  readonly accent: CardAccentName;
  readonly setAccent: (value: CardAccentName) => void;
} {
  const [stored, setStored] = useAtom(accentAtom);
  return {
    accent: CARD_ACCENTS.includes(stored) ? stored : "yellow",
    setAccent: setStored,
  };
}

function subscribeSystemDark(onChange: () => void): () => void {
  const media: MediaQueryList = globalThis.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  // oxlint-disable-next-line project/no-void-return -- useSyncExternalStore の cleanup は void を要求する
  return (): void => media.removeEventListener("change", onChange);
}

function readSystemDark(): boolean {
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** OS 設定のダークモードを購読する。 */
function useSystemDark(): boolean {
  return useSyncExternalStore(subscribeSystemDark, readSystemDark, () => true);
}

/** アプリのテーマ設定を、カードへ渡す dark / light に解決する。 */
export function useResolvedCardTheme(): CardThemeName {
  const { mode } = useTheme();
  const systemDark: boolean = useSystemDark();
  if (mode === "dark" || mode === "light") {
    return mode;
  }
  return systemDark ? "dark" : "light";
}
