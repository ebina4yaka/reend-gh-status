import { type ReactElement } from "react";

import type { CardLayout } from "@/shared/cards";
import type { LanguageStat, TopLangsData } from "@/shared/github";

import { DONUT_SIZE, buildWedges, remainderPercent, ringGradient, wedgePolygon } from "./donut";
import { CardFrame } from "./frame";
import { Empty, Label } from "./primitives";
import { type CardTokens, color } from "./tokens";

export interface TopLangsCardProps {
  readonly caption: string;
  readonly data: TopLangsData;
  readonly layout: CardLayout;
  readonly tokens: CardTokens;
}

/** 言語色が未設定のときの代替色（ReEnd のアクセント）。 */
const FALLBACK_TRIPLETS: readonly string[] = [
  "48, 100%, 58%",
  "201, 66%, 58%",
  "186, 100%, 50%",
  "270, 77%, 64%",
  "145, 67%, 51%",
  "39, 100%, 50%",
];

const MAX_ROWS: number = 5;

function fallbackColors(): readonly string[] {
  return FALLBACK_TRIPLETS.map((triplet: string) => color(triplet));
}

function colorOf(item: LanguageStat): string {
  return item.color === "" ? color("0, 0%, 60%") : item.color;
}

function LegendRow(props: {
  readonly item: LanguageStat;
  readonly tokens: CardTokens;
}): ReactElement {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 6, width: "100%" }}>
      <div style={{ background: colorOf(props.item), height: 8, width: 8 }} />
      <span
        style={{
          color: color(props.tokens.textPrimary),
          flexGrow: 1,
          fontSize: 11,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {props.item.name}
      </span>
      <Label tokens={props.tokens}>{`${props.item.percent.toFixed(1)}%`}</Label>
    </div>
  );
}

/** OTHER 行（上位 5 言語に含まれない残り）。 */
function OtherRow(props: { readonly percent: number; readonly tokens: CardTokens }): ReactElement {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 6, width: "100%" }}>
      <div style={{ background: color(props.tokens.border, 0.25), height: 8, width: 8 }} />
      <span
        style={{
          color: color(props.tokens.textMuted),
          flexGrow: 1,
          fontSize: 11,
          letterSpacing: 1,
        }}
      >
        OTHER
      </span>
      <Label tokens={props.tokens}>{`${props.percent.toFixed(1)}%`}</Label>
    </div>
  );
}

function Donut(props: { readonly data: TopLangsData; readonly tokens: CardTokens }): ReactElement {
  const wedges: readonly {
    readonly color: string;
    readonly end: number;
    readonly start: number;
  }[] = buildWedges(props.data.items, fallbackColors());
  const remainder: number = remainderPercent(props.data.items);
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 16 }}>
      <div
        style={{
          display: "flex",
          height: DONUT_SIZE,
          position: "relative",
          width: DONUT_SIZE,
        }}
      >
        {/* 背景リング（上位 5 言語に含まれない残りと、セグメント間の隙間） */}
        <div
          style={{
            backgroundImage: ringGradient(color(props.tokens.border, 0.18)),
            borderRadius: "50%",
            height: "100%",
            left: 0,
            position: "absolute",
            top: 0,
            width: "100%",
          }}
        />
        {wedges.map((wedge, index) => (
          // Satori は要素自身の clipPath を自分の描画へ適用しないため、
          // クリップ役（親）と描画役（子）を分ける。
          <div
            key={`wedge-${String(index)}`}
            style={{
              clipPath: wedgePolygon(wedge.start, wedge.end),
              display: "flex",
              height: "100%",
              left: 0,
              position: "absolute",
              top: 0,
              width: "100%",
            }}
          >
            <div
              style={{
                backgroundImage: ringGradient(wedge.color),
                borderRadius: "50%",
                height: "100%",
                width: "100%",
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, gap: 7 }}>
        {props.data.items.slice(0, MAX_ROWS).map((item) => (
          <LegendRow item={item} key={item.name} tokens={props.tokens} />
        ))}
        {remainder >= 1 && <OtherRow percent={remainder} tokens={props.tokens} />}
      </div>
    </div>
  );
}

function Bars(props: { readonly data: TopLangsData; readonly tokens: CardTokens }): ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {props.data.items.slice(0, MAX_ROWS).map((item) => (
        <div key={item.name} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
            <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
              <div style={{ background: colorOf(item), height: 8, width: 8 }} />
              <span
                style={{ color: color(props.tokens.textPrimary), fontSize: 11, letterSpacing: 1 }}
              >
                {item.name}
              </span>
            </div>
            <Label tokens={props.tokens}>{`${item.percent.toFixed(1)}%`}</Label>
          </div>
          <div
            style={{
              background: color(props.tokens.border, 0.1),
              display: "flex",
              height: 6,
              width: "100%",
            }}
          >
            <div
              style={{
                background: colorOf(item),
                width: `${String(Math.max(0, Math.min(100, item.percent)))}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 本文（空 → バー → ドーナツの順に解決する）。 */
function CardBody(props: TopLangsCardProps): ReactElement {
  if (props.data.items.length === 0) {
    return <Empty tokens={props.tokens} />;
  }
  if (props.layout === "bars") {
    return <Bars data={props.data} tokens={props.tokens} />;
  }
  return <Donut data={props.data} tokens={props.tokens} />;
}

/** トップ言語カード（ドーナツまたは積み上げバー）。 */
export function TopLangsCard(props: TopLangsCardProps): ReactElement {
  return (
    <CardFrame
      caption={props.caption}
      footer={`LANGS::${String(props.data.items.length)}`}
      statusLabel="CODEC::INDEXED"
      title="LANGUAGE MATRIX"
      tokens={props.tokens}
    >
      <CardBody {...props} />
    </CardFrame>
  );
}
