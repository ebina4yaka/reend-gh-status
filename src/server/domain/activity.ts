import { Maybe } from "true-myth";

import type { GithubEventPayload } from "../github/schema";
import type { ActivityData, ActivityItem, ActivityKind } from "@/shared/github";

/**
 * GitHub の公開イベントをフィード表示用に写す。
 * 表示に意味のある種別だけ残し、それ以外は落とす。
 *
 * 公開イベント API の payload は webhook より貧しい。PushEvent には
 * commits と size が無い。PullRequestEvent の pull_request にも title が無い。
 * そのため件数や action、番号でタイトルを組み立てる。
 */

const MAX_ITEMS: number = 10;

interface Draft {
  readonly count: number;
  readonly kind: ActivityKind;
  readonly title: string;
}

/** PushEvent のブランチ名。refs/heads/ を落とす。 */
function branchOf(event: GithubEventPayload): string {
  const branch: string = event.payload.ref.replace("refs/heads/", "");
  return branch === "" ? "a branch" : branch;
}

function pushDraft(event: GithubEventPayload): Draft {
  const count: number = event.payload.size > 0 ? event.payload.size : event.payload.commits.length;
  return {
    count: Math.max(count, 1),
    kind: "commit",
    // 公開イベント API は件数を返さない。0 のときは件数を書かない。
    title:
      count > 0
        ? `Pushed ${String(count)} commit${count === 1 ? "" : "s"} to ${branchOf(event)}`
        : `Pushed to ${branchOf(event)}`,
  };
}

function actionLabel(action: string): Maybe<string> {
  if (action === "opened") {
    return Maybe.just("Opened");
  }
  if (action === "merged") {
    return Maybe.just("Merged");
  }
  if (action === "closed") {
    return Maybe.just("Closed");
  }
  if (action === "reopened") {
    return Maybe.just("Reopened");
  }
  return Maybe.nothing<string>();
}

function pullRequestDraft(event: GithubEventPayload): Draft {
  const title: string = event.payload.pull_request.title;
  const number: number = event.payload.pull_request.number;
  const action: Maybe<string> = actionLabel(event.payload.action);
  return {
    count: 1,
    kind: "pull-request",
    title: title !== "" ? title : `${action.unwrapOr("Updated")} pull request #${String(number)}`,
  };
}

function issuesDraft(event: GithubEventPayload): Draft {
  const title: string = event.payload.issue.title;
  const number: number = event.payload.issue.number;
  const action: Maybe<string> = actionLabel(event.payload.action);
  return {
    count: 1,
    kind: "issue",
    title: title !== "" ? title : `${action.unwrapOr("Updated")} issue #${String(number)}`,
  };
}

function issueCommentDraft(event: GithubEventPayload): Draft {
  const title: string = event.payload.issue.title;
  const number: number = event.payload.issue.number;
  return {
    count: 1,
    kind: "comment",
    title: title !== "" ? title : `Commented on issue #${String(number)}`,
  };
}

function releaseDraft(event: GithubEventPayload): Draft {
  const tag: string = event.payload.release.tag_name;
  return {
    count: 1,
    kind: "release",
    title: tag === "" ? "Release" : tag,
  };
}

function draftOf(event: GithubEventPayload): Maybe<Draft> {
  if (event.type === "PushEvent") {
    return Maybe.just(pushDraft(event));
  }
  if (event.type === "PullRequestEvent") {
    return Maybe.just(pullRequestDraft(event));
  }
  if (event.type === "IssuesEvent") {
    return Maybe.just(issuesDraft(event));
  }
  if (event.type === "IssueCommentEvent") {
    return Maybe.just(issueCommentDraft(event));
  }
  if (event.type === "ReleaseEvent") {
    return Maybe.just(releaseDraft(event));
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
