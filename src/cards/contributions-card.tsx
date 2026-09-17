import { type ReactElement } from "react";

import { formatNumber } from "@/lib/format";
import type { ContributionDay, ContributionLevel, ContributionsData } from "@/shared/github";

import { CardFrame } from "./frame";
import { Empty, Metric } from "./primitives";
import { type CardTokens, color } from "./tokens";

export interface ContributionsCardProps {
  readonly caption: string;
  readonly data: ContributionsData;
  readonly tokens: CardTokens;
}

function levelOpacity(level: ContributionLevel): number {
  return [0.1, 0.3, 0.5, 0.7, 1][level] ?? 0.1;
}

/** 草の 1 週間分（縦 7 マス）。 */
function WeekColumn(props: {
  readonly days: readonly ContributionDay[];
  readonly tokens: CardTokens;
}): ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {props.days.map((day) => (
        <div
          key={day.date}
          style={{
            background: color(props.tokens.green, levelOpacity(day.level)),
            height: 6,
            width: 6,
          }}
        />
      ))}
    </div>
  );
}

/** コントリビューションカード（草 + ストリーク）。 */
export function ContributionsCard(props: ContributionsCardProps): ReactElement {
  const { data, tokens } = props;
  return (
    <CardFrame
      caption={props.caption}
      footer={`ACTIVE::${formatNumber(data.totalContributions)}`}
      statusLabel="TRACE::1Y"
      title="CONTRIBUTION TRACE"
      tokens={tokens}
    >
      {data.weeks.length === 0 ? (
        <Empty tokens={tokens} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, overflow: "hidden" }}>
            {data.weeks.map((week, index) => (
              <WeekColumn key={`week-${String(index)}`} days={week} tokens={tokens} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Metric
              accent
              label="CURRENT STREAK"
              tokens={tokens}
              value={`${formatNumber(data.currentStreak)}d`}
            />
            <Metric
              label="LONGEST"
              tokens={tokens}
              value={`${formatNumber(data.longestStreak)}d`}
            />
            <Metric
              label="LAST ACTIVE"
              tokens={tokens}
              value={data.lastContributedOn === "" ? "--" : data.lastContributedOn}
            />
          </div>
        </div>
      )}
    </CardFrame>
  );
}
