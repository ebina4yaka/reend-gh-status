import { Maybe } from "true-myth";

import type { GithubEventPayload } from "../github/schema";
import type { ActivityData, ActivityItem, ActivityKind } from "@/shared/github";

/**
 * GitHub の公開イベントをフィード表示用に写す。
 * 表示に意味のある種別だけ残し、それ以外は落とす。
 */

const MAX_ITEMS: number = 10;

interface Draft {
  readonly count: number;
  readonly kind: ActivityKind;
  readonly title: string;
}

function pushDraft(event: GithubEventPayload): Draft {
  const count: number = event.payload.size > 0 ? event.payload.size : event.payload.commits.length;
  const branch: string =
    event.payload.ref === "" ? "" : ` to ${event.payload.ref.replace("refs/heads/", "")}`;
  return {
    count,
    kind: "commit",
    title: `Pushed ${String(count)} commit${count === 1 ? "" : "s"}${branch}`,
  };
}

function draftOf(event: GithubEventPayload): Maybe<Draft> {
  if (event.type === "PushEvent") {
    return Maybe.just(pushDraft(event));
  }
  if (event.type === "PullRequestEvent") {
    return Maybe.just({
      count: 1,
      kind: "pull-request",
      title:
        event.payload.pull_request.title === "" ? "Pull request" : event.payload.pull_request.title,
    });
  }
  if (event.type === "IssuesEvent") {
    return Maybe.just({
      count: 1,
      kind: "issue",
      title: event.payload.issue.title === "" ? "Issue" : event.payload.issue.title,
    });
  }
  if (event.type === "ReleaseEvent") {
    return Maybe.just({
      count: 1,
      kind: "release",
      title: event.payload.release.tag_name === "" ? "Release" : event.payload.release.tag_name,
    });
  }
  return Maybe.nothing<Draft>();
}

function toItem(event: GithubEventPayload, draft: Draft): ActivityItem {
  return {
    count: draft.count,
    createdAt: event.created_at,
    id: event.id,
    kind: draft.kind,
    repo: event.repo.name,
    title: draft.title,
    url: `https://github.com/${event.repo.name}`,
  };
}

export function toActivityData(events: readonly GithubEventPayload[]): ActivityData {
  const items: ActivityItem[] = [];
  for (const event of events) {
    if (items.length >= MAX_ITEMS) {
      break;
    }
    const draft: Maybe<Draft> = draftOf(event);
    if (event.created_at !== "" && draft.isJust) {
      items.push(toItem(event, draft.value));
    }
  }
  return { items };
}
