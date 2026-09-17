import { type ReactElement } from "react";

import { formatDate } from "@/lib/format";
import type { ActivityData, ActivityItem, ActivityKind } from "@/shared/github";

import { CardFrame, FONT_UI } from "./frame";
import { Empty, Label } from "./primitives";
import { type CardTokens, color } from "./tokens";

export interface ActivityCardProps {
  readonly caption: string;
  readonly data: ActivityData;
  readonly tokens: CardTokens;
}

/** イベント種別 → 表示コードと色。 */
function kindStyle(kind: ActivityKind, tokens: CardTokens): { code: string; tone: string } {
  if (kind === "pull-request") {
    return { code: "PR", tone: tokens.purple };
  }
  if (kind === "issue") {
    return { code: "IS", tone: tokens.orange };
  }
  if (kind === "release") {
    return { code: "RL", tone: tokens.blue };
  }
  if (kind === "commit") {
    return { code: "CM", tone: tokens.green };
  }
  return { code: "--", tone: tokens.textMuted };
}

function ActivityRow(props: {
  readonly item: ActivityItem;
  readonly tokens: CardTokens;
}): ReactElement {
  const style: { code: string; tone: string } = kindStyle(props.item.kind, props.tokens);
  const title: string = props.item.count > 1 ? `${props.item.title}` : props.item.title;
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 8, width: "100%" }}>
      <span
        style={{
          border: `1px solid ${color(style.tone, 0.7)}`,
          color: color(style.tone),
          fontFamily: FONT_UI,
          fontSize: 9,
          padding: "2px 4px",
        }}
      >
        {style.code}
      </span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          gap: 1,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            color: color(props.tokens.textPrimary),
            fontSize: 11,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
        <Label tokens={props.tokens}>{props.item.repo}</Label>
      </div>
      <Label tokens={props.tokens}>{formatDate(props.item.createdAt)}</Label>
    </div>
  );
}

/** 直近アクティビティのカード。 */
export function ActivityCard(props: ActivityCardProps): ReactElement {
  const { data, tokens } = props;
  const items: readonly ActivityItem[] = data.items.slice(0, 5);
  return (
    <CardFrame
      caption={props.caption}
      footer="FEED::PUBLIC"
      statusLabel="EVENTS::LIVE"
      title="ACTIVITY STREAM"
      tokens={tokens}
    >
      {items.length === 0 ? (
        <Empty tokens={tokens} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => (
            <ActivityRow item={item} key={item.id} tokens={tokens} />
          ))}
        </div>
      )}
    </CardFrame>
  );
}
