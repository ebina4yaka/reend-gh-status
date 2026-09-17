import { type ReactElement } from "react";

import { formatCompact, formatDate } from "@/lib/format";
import type { RepoItem, ReposData } from "@/shared/github";

import { CardFrame, FONT_UI } from "./frame";
import { Empty, Label } from "./primitives";
import { type CardTokens, color } from "./tokens";

export interface ReposCardProps {
  readonly caption: string;
  readonly data: ReposData;
  readonly tokens: CardTokens;
}

function RepoRow(props: { readonly item: RepoItem; readonly tokens: CardTokens }): ReactElement {
  const { item, tokens } = props;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <span
          style={{
            color: color(tokens.textPrimary),
            fontFamily: FONT_UI,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </span>
        <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
          <div style={{ alignItems: "center", display: "flex", gap: 5 }}>
            <div
              style={{
                background: color(tokens.accent),
                height: 5,
                transform: "rotate(45deg)",
                width: 5,
              }}
            />
            <Label tokens={tokens}>{formatCompact(item.stars)}</Label>
          </div>
          <Label tokens={tokens}>{formatDate(item.pushedAt)}</Label>
        </div>
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
        {item.language !== "" && (
          <>
            <div
              style={{
                background:
                  item.languageColor === "" ? color(tokens.textMuted) : item.languageColor,
                height: 7,
                width: 7,
              }}
            />
            <Label tokens={tokens}>{item.language}</Label>
          </>
        )}
        {item.isArchived && (
          <Label tone={tokens.orange} tokens={tokens}>
            ARCHIVED
          </Label>
        )}
      </div>
      {item.description !== "" && (
        <span
          style={{
            color: color(tokens.textMuted),
            fontSize: 10,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.description}
        </span>
      )}
    </div>
  );
}

/** リポジトリカード（スター上位）。 */
export function ReposCard(props: ReposCardProps): ReactElement {
  const { data, tokens } = props;
  const items: readonly RepoItem[] = data.items.slice(0, 4);
  return (
    <CardFrame
      caption={props.caption}
      footer={`UNITS::${String(data.items.length)}`}
      statusLabel="ARCHIVE::SYNCED"
      title="REPOSITORY ARCHIVE"
      tokens={tokens}
    >
      {items.length === 0 ? (
        <Empty tokens={tokens} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item) => (
            <RepoRow item={item} key={item.name} tokens={tokens} />
          ))}
        </div>
      )}
    </CardFrame>
  );
}
