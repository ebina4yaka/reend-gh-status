import { type ReactElement } from "react";

import { formatBytes } from "@/lib/format";
import type { TopLangsData } from "@/shared/github";

import { CardFrame } from "./frame";
import { Bar, Empty, Label } from "./primitives";
import { type CardTokens, color } from "./tokens";

export interface TopLangsCardProps {
  readonly caption: string;
  readonly data: TopLangsData;
  readonly tokens: CardTokens;
}

/** トップ言語カード（本家 /api/top-langs 相当）。 */
export function TopLangsCard(props: TopLangsCardProps): ReactElement {
  const { data, tokens } = props;
  const items = data.items.slice(0, 5);
  return (
    <CardFrame
      caption={props.caption}
      footer={`SCAN::${formatBytes(data.totalBytes)}`}
      statusLabel="CODEC::INDEXED"
      title="LANGUAGE MATRIX"
      tokens={tokens}
    >
      {items.length === 0 ? (
        <Empty tokens={tokens} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => (
            <div key={item.name} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}
              >
                <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
                  <div
                    style={{
                      background: item.color === "" ? color(tokens.textMuted) : item.color,
                      height: 8,
                      width: 8,
                    }}
                  />
                  <span
                    style={{ color: color(tokens.textPrimary), fontSize: 11, letterSpacing: 1 }}
                  >
                    {item.name}
                  </span>
                </div>
                <Label tokens={tokens}>{`${item.percent.toFixed(1)}%`}</Label>
              </div>
              <Bar
                percent={item.percent}
                tokens={tokens}
                {...(item.color === "" ? {} : { tone: item.color })}
              />
            </div>
          ))}
        </div>
      )}
    </CardFrame>
  );
}
