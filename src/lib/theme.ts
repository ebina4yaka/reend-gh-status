import { useAtom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useLayoutEffect } from "react";

export type ThemeMode = "system" | "light" | "dark";

/** メインカラー。"" はテーマ既定色（未カスタマイズ）。 */
interface ThemeState {
  mode: ThemeMode;
  primary: string;
}

export const STORAGE_KEY: string = "prts.theme";
const DEFAULT_STATE: ThemeState = { mode: "system", primary: "" };

// LocalStorage へ自動永続化される jotai atom。
const themeStateAtom = atomWithStorage<ThemeState>(STORAGE_KEY, DEFAULT_STATE);

export function isValidHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

/** 保存値が壊れていても既定へフォールバックする安全なゲッター。 */
function useValidatedTheme(): {
  mode: ThemeMode;
  primary: string;
  setState: (update: Partial<ThemeState>) => ThemeState;
} {
  const [state, rawSetState] = useAtom(themeStateAtom);
  // 更新後の状態を返す（妥当性検証は呼び出し側の getter と同じく読み出し時に行う）。
  function setState(update: Partial<ThemeState>): ThemeState {
    const next: ThemeState = { ...state, ...update };
    rawSetState(next);
    return next;
  }
  return {
    mode:
      state.mode === "light" || state.mode === "dark" || state.mode === "system"
        ? state.mode
        : "system",
    primary: isValidHex(state.primary) ? state.primary : "",
    setState,
  };
}

export function useTheme(): {
  mode: ThemeMode;
  primary: string;
  setMode: (mode: ThemeMode) => ThemeState;
  setPrimaryColor: (hex: string) => ThemeState;
} {
  const { mode, primary, setState } = useValidatedTheme();
  return {
    mode,
    primary,
    setMode: (next: ThemeMode): ThemeState => setState({ mode: next }),
    // "" = 既定色へ戻す（リセット）
    setPrimaryColor: (hex: string): ThemeState => setState({ primary: hex }),
  };
}

/** HSL の色相（0〜1）を RGB から求める。 */
function hueOf(red: number, green: number, blue: number): number {
  const max = Math.max(red, green, blue);
  const delta: number = max - Math.min(red, green, blue);
  if (max === red) {
    return ((green - blue) / delta + (green < blue ? 6 : 0)) / 6;
  }
  if (max === green) {
    return ((blue - red) / delta + 2) / 6;
  }
  return ((red - green) / delta + 4) / 6;
}

/** #rrggbb → HSL 三つ組文字列（reend-components の --primary 形式）。 */
export function hexToHslTriplet(hex: string): string {
  const red: number = parseInt(hex.slice(1, 3), 16) / 255;
  const green: number = parseInt(hex.slice(3, 5), 16) / 255;
  const blue: number = parseInt(hex.slice(5, 7), 16) / 255;
  const maxChannel: number = Math.max(red, green, blue);
  const minChannel: number = Math.min(red, green, blue);
  const lightness: number = (maxChannel + minChannel) / 2;
  if (maxChannel === minChannel) {
    return `0 0% ${Math.round(lightness * 100)}%`;
  }
  const delta: number = maxChannel - minChannel;
  const saturation: number =
    lightness > 0.5 ? delta / (2 - maxChannel - minChannel) : delta / (maxChannel + minChannel);
  const hue: number = hueOf(red, green, blue);
  return `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

/** 線形化した sRGB チャンネル値（0〜1）。channelIndex: 0=R, 1=G, 2=B。 */
function srgbChannel(hex: string, channelIndex: number): number {
  const raw: number = parseInt(hex.slice(1 + channelIndex * 2, 3 + channelIndex * 2), 16) / 255;
  return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
}

/** 相対輝度が暗い色なら白文字、明るい色なら黒文字（WCAG 系のおおまかな判定）。 */
export function foregroundFor(hex: string): string {
  const luminance: number =
    0.2126 * srgbChannel(hex, 0) + 0.7152 * srgbChannel(hex, 1) + 0.0722 * srgbChannel(hex, 2);
  return luminance > 0.35 ? "0 0% 10%" : "0 0% 98%";
}

/**
 * テーマ状態を <html> へ適用する。App の先頭で一度だけ呼ぶ。
 * system 追従は matchMedia を購読し、OS 切替にも即座に反応する。
 * 適用対象の状態を返す。
 */
export function useApplyTheme(): ThemeState {
  const { mode, primary } = useAtomValue(themeStateAtom);
  useLayoutEffect(() => {
    const root: HTMLElement = document.documentElement;
    const media: MediaQueryList = globalThis.matchMedia("(prefers-color-scheme: dark)");
    // 適用結果が dark かどうかを返す。
    function apply(): boolean {
      const dark: boolean =
        mode === "dark" ||
        (mode === "system" && globalThis.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("light", !dark);
      root.classList.toggle("dark", dark);
      if (isValidHex(primary)) {
        root.style.setProperty("--primary", hexToHslTriplet(primary));
        root.style.setProperty("--primary-foreground", foregroundFor(primary));
      } else {
        root.style.removeProperty("--primary");
        root.style.removeProperty("--primary-foreground");
      }
      return dark;
    }
    apply();
    media.addEventListener("change", apply);
    // oxlint-disable-next-line project/no-void-return -- React の Destructor 型は cleanup の void 返しを要求する
    return (): void => media.removeEventListener("change", apply);
  }, [mode, primary]);
  return { mode, primary };
}
