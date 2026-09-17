import { type ReactElement, type ReactNode } from "react";

import { FONT_MONO, FONT_UI } from "./frame";
import { type CardTokens, color } from "./tokens";

/** ラベル（英字大文字、字間広め）。 */
export function Label(props: {
  readonly children: ReactNode;
  readonly tokens: CardTokens;
  readonly tone?: string;
}): ReactElement {
  return (
    <span
      style={{
        color: color(props.tone ?? props.tokens.textMuted),
        fontFamily: FONT_MONO,
        fontSize: 9,
        letterSpacing: 1.5,
        textTransform: "uppercase",
      }}
    >
      {props.children}
    </span>
  );
}

/** 数値・主役テキスト。 */
function Readout(props: {
  readonly children: ReactNode;
  readonly size?: number;
  readonly tokens: CardTokens;
  readonly tone?: string;
}): ReactElement {
  return (
    <span
      style={{
        color: color(props.tone ?? props.tokens.textPrimary),
        fontFamily: FONT_MONO,
        fontSize: props.size ?? 20,
        fontWeight: 700,
        letterSpacing: 0.5,
      }}
    >
      {props.children}
    </span>
  );
}

/** セクション見出し（Orbitron）。 */
export function Heading(props: {
  readonly children: ReactNode;
  readonly tokens: CardTokens;
}): ReactElement {
  return (
    <span
      style={{
        color: color(props.tokens.textSecondary),
        fontFamily: FONT_UI,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 2,
      }}
    >
      {props.children}
    </span>
  );
}

/** KPI 1 つ分（値 + ラベル）。 */
export function Metric(props: {
  readonly accent?: boolean;
  readonly label: string;
  readonly tokens: CardTokens;
  readonly value: string;
}): ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Readout
        size={19}
        tokens={props.tokens}
        {...(props.accent === true ? { tone: props.tokens.accent } : {})}
      >
        {props.value}
      </Readout>
      <Label tokens={props.tokens}>{props.label}</Label>
    </div>
  );
}

/** 横棒グラフ。 */
export function Bar(props: {
  readonly percent: number;
  readonly tokens: CardTokens;
  readonly tone?: string;
}): ReactElement {
  const width: string = `${Math.max(0, Math.min(100, props.percent))}%`;
  return (
    <div
      style={{
        background: color(props.tokens.border, 0.1),
        display: "flex",
        height: 6,
        width: "100%",
      }}
    >
      <div style={{ background: color(props.tone ?? props.tokens.accent), width }} />
    </div>
  );
}

/** ランク表示（グレード + 上位 %）。 */
export function RankBadge(props: {
  readonly grade: string;
  readonly percentile: number;
  readonly tokens: CardTokens;
}): ReactElement {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
      <div
        style={{
          alignItems: "center",
          border: `1px solid ${color(props.tokens.accent, 0.6)}`,
          display: "flex",
          height: 34,
          justifyContent: "center",
          width: 34,
        }}
      >
        <Readout size={14} tokens={props.tokens} tone={props.tokens.accent}>
          {props.grade}
        </Readout>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Label tokens={props.tokens}>RANK</Label>
        <Label tokens={props.tokens}>TOP {props.percentile.toFixed(1)}%</Label>
      </div>
    </div>
  );
}

/** 空データの案内。カードが崩れないように中央へ置く。 */
export function Empty(props: { readonly tokens: CardTokens }): ReactElement {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexGrow: 1,
        justifyContent: "center",
      }}
    >
      <Label tokens={props.tokens}>NO DATA</Label>
    </div>
  );
}
