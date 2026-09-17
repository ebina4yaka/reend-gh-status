import { type ReactElement } from "react";

import { formatNumber } from "@/lib/format";
import type { StatsData } from "@/shared/github";

import { CardFrame } from "./frame";
import { Empty, Heading, Label, Metric, RankBadge } from "./primitives";
import type { CardTokens } from "./tokens";

export interface StatsCardProps {
  readonly caption: string;
  readonly data: StatsData;
  readonly tokens: CardTokens;
}

/** 基本統計カード（本家 /api 相当）。 */
export function StatsCard(props: StatsCardProps): ReactElement {
  const { data, tokens } = props;
  return (
    <CardFrame
      caption={props.caption}
      footer="REEND::STATS"
      statusLabel="LINK::ACTIVE"
      title="OPERATOR STATUS"
      tokens={tokens}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Heading tokens={tokens}>
            {data.identity.name === "" ? data.identity.login : data.identity.name}
          </Heading>
          <Label tokens={tokens}>@{data.identity.login}</Label>
        </div>
        <RankBadge grade={data.rank.grade} percentile={data.rank.percentile} tokens={tokens} />
      </div>
      {data.identity.login === "" ? (
        <Empty tokens={tokens} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", width: "33%" }}>
              <Metric accent label="STARS" tokens={tokens} value={formatNumber(data.stars)} />
            </div>
            <div style={{ display: "flex", width: "33%" }}>
              <Metric label="COMMITS" tokens={tokens} value={formatNumber(data.commits)} />
            </div>
            <div style={{ display: "flex", width: "34%" }}>
              <Metric
                label="PRS MERGED"
                tokens={tokens}
                value={formatNumber(data.mergedPullRequests)}
              />
            </div>
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", width: "33%" }}>
              <Metric label="ISSUES" tokens={tokens} value={formatNumber(data.issues)} />
            </div>
            <div style={{ display: "flex", width: "33%" }}>
              <Metric label="FOLLOWERS" tokens={tokens} value={formatNumber(data.followers)} />
            </div>
            <div style={{ display: "flex", width: "34%" }}>
              <Metric label="REPOS" tokens={tokens} value={formatNumber(data.repositories)} />
            </div>
          </div>
        </div>
      )}
    </CardFrame>
  );
}
