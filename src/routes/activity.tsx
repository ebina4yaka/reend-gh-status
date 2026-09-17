import { createFileRoute } from "@tanstack/react-router";
import { type ReactElement } from "react";
import { Timeline, type TimelineItemProps } from "reend-components";

import { SnapshotGate } from "@/components/snapshot-gate";
import { formatDate } from "@/lib/format";
import type { ActivityItem, ActivityKind } from "@/shared/github";

export const Route = createFileRoute("/activity")({ component: ActivityPage });

const KIND_LABELS: Readonly<Record<ActivityKind, string>> = {
  commit: "COMMIT",
  issue: "ISSUE",
  other: "EVENT",
  "pull-request": "PULL REQUEST",
  release: "RELEASE",
};

/** 直近 24 時間なら current、それ以外は complete。 */
function statusOf(createdAt: string): "complete" | "current" {
  const ageMs: number = Date.now() - new Date(createdAt).getTime();
  return ageMs <= 24 * 60 * 60 * 1000 ? "current" : "complete";
}

function toTimelineItem(item: ActivityItem): TimelineItemProps {
  return {
    date: formatDate(item.createdAt),
    description: `${KIND_LABELS[item.kind]} — ${item.repo}${item.count > 1 ? ` (+${String(item.count)})` : ""}`,
    status: statusOf(item.createdAt),
    title: item.title,
  };
}

function ActivityPage(): ReactElement {
  return (
    <SnapshotGate>
      {({ snapshot }) => (
        <div className="flex flex-col gap-4">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
            PUBLIC EVENTS::{String(snapshot.activity.items.length)} RECORDS
          </p>
          <Timeline items={snapshot.activity.items.map(toTimelineItem)} />
        </div>
      )}
    </SnapshotGate>
  );
}
