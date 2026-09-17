import { type CSSProperties, type ReactElement, type ReactNode } from "react";

import { type CardTokens, color } from "./tokens";

/**
 * カード共通の外枠。HUD のコーナーブラケット、ヘッダー行、方眼背景を描く。
 * satori では疑似要素が使えないため、装飾は絶対配置した div で組む。
 */

export interface CardFrameProps {
  readonly children: ReactNode;
  /** 右上に出す同期時刻などの短い文字列。 */
  readonly caption: string;
  /** フッター左に出すブランド表記。 */
  readonly footer: string;
  readonly statusLabel: string;
  readonly title: string;
  readonly tokens: CardTokens;
}

export const FONT_UI: string = "Orbitron";
export const FONT_MONO: string = "JetBrains Mono";

type CornerName = "bottom-left" | "bottom-right" | "top-left" | "top-right";

function cornerStyle(name: CornerName, tokens: CardTokens): CSSProperties {
  const border: string = `1px solid ${color(tokens.accentSoft, 0.85)}`;
  const bottom: boolean = name.startsWith("bottom");
  const right: boolean = name.endsWith("right");
  return {
    borderBottom: bottom ? border : "none",
    borderLeft: right ? "none" : border,
    borderRight: right ? border : "none",
    borderTop: bottom ? "none" : border,
    height: 10,
    position: "absolute",
    width: 10,
    // Satori の position オフセットは "auto" を受け付けないため、
    // 使わない辺はプロパティ自体を生やさない。
    ...(bottom ? { bottom: 0 } : { top: 0 }),
    ...(right ? { right: 0 } : { left: 0 }),
  };
}

/** HUD のコーナーブラケット。 */
function Corner(props: { readonly name: CornerName; readonly tokens: CardTokens }): ReactElement {
  return <div style={cornerStyle(props.name, props.tokens)} />;
}

/** タイトル左のステータスドット（回転した四角＝ダイヤ）。 */
function StatusDot(props: { readonly tokens: CardTokens }): ReactElement {
  return (
    <div
      style={{
        background: color(props.tokens.green),
        boxShadow: `0 0 6px ${color(props.tokens.green, 0.8)}`,
        height: 6,
        transform: "rotate(45deg)",
        width: 6,
      }}
    />
  );
}

export function CardFrame(props: CardFrameProps): ReactElement {
  const { tokens } = props;
  const gridLine: string = color(tokens.border, 0.05);
  return (
    <div
      style={{
        background: color(tokens.surface1),
        border: `1px solid ${color(tokens.border, 0.14)}`,
        color: color(tokens.textPrimary),
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT_MONO,
        height: "100%",
        overflow: "hidden",
        padding: 14,
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundImage: `linear-gradient(${gridLine} 1px, transparent 1px), linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          bottom: 0,
          left: 0,
          position: "absolute",
          right: 0,
          top: 0,
        }}
      />
      {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((name) => (
        <Corner key={name} name={name} tokens={tokens} />
      ))}
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
          <StatusDot tokens={tokens} />
          <span
            style={{
              color: color(tokens.accent),
              fontFamily: FONT_UI,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 3,
            }}
          >
            {props.title}
          </span>
        </div>
        <span style={{ color: color(tokens.textMuted), fontSize: 9, letterSpacing: 2 }}>
          {props.statusLabel}
        </span>
      </div>
      <div
        style={{
          background: `linear-gradient(90deg, ${color(tokens.accent, 0.7)}, ${color(tokens.border, 0.1)})`,
          height: 1,
          marginBottom: 12,
          marginTop: 8,
          position: "relative",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, position: "relative" }}>
        {props.children}
      </div>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <span style={{ color: color(tokens.textMuted), fontSize: 8, letterSpacing: 2 }}>
          {props.footer}
        </span>
        <span style={{ color: color(tokens.textMuted), fontSize: 8, letterSpacing: 2 }}>
          {props.caption}
        </span>
      </div>
    </div>
  );
}
