import { createFileRoute } from "@tanstack/react-router";
import { type ReactElement } from "react";
import { StatusBar, TacticalBadge } from "reend-components";

import { cardTokens } from "@/cards/tokens";
import type { CardType } from "@/shared/cards";
import { CardPreview } from "@/components/card-preview";
import { SnapshotGate } from "@/components/snapshot-gate";
import { useCardAccent, useResolvedCardTheme } from "@/lib/card-style";
import { formatSyncCaption } from "@/lib/format";

export const Route = createFileRoute("/")({ component: OverviewPage });

interface CardSlot {
  readonly span: string;
  readonly type: CardType;
}

const CARD_SLOTS: readonly CardSlot[] = [
  { span: "lg:col-span-1", type: "stats" },
  { span: "lg:col-span-1", type: "top-langs" },
  { span: "lg:col-span-1", type: "contributions" },
  { span: "lg:col-span-1", type: "activity" },
  { span: "lg:col-span-2", type: "repos" },
] as const;

export function OverviewPage(): ReactElement {
  const { accent } = useCardAccent();
  const theme = useResolvedCardTheme();
  return (
    <SnapshotGate>
      {({ fetchedAt, snapshot }) => {
        const tokens = cardTokens(theme, accent);
        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <TacticalBadge variant="success">LINK ACTIVE</TacticalBadge>
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                  TARGET::{snapshot.stats.identity.login}
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                {formatSyncCaption(fetchedAt)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                RANK
              </span>
              <StatusBar
                label="RANK PROGRESS"
                max={100}
                segments={20}
                showValue
                value={Math.round(100 - snapshot.stats.rank.percentile)}
                variant="experience"
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {CARD_SLOTS.map((slot) => (
                <div className={slot.span} key={slot.type}>
                  <CardPreview
                    caption={formatSyncCaption(fetchedAt)}
                    layout="donut"
                    snapshot={snapshot}
                    tokens={tokens}
                    type={slot.type}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }}
    </SnapshotGate>
  );
}
