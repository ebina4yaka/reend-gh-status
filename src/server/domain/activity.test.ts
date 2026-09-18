import { describe, expect, test } from "bun:test";

import type { GithubEventPayload } from "../github/schema";

import { toActivityData } from "./activity";

type EventPayload = GithubEventPayload["payload"];

/** Valibot の既定値と同じ形の payload を作る（テストは検証を通さないため）。 */
function payloadOf(overrides: Partial<EventPayload>): EventPayload {
  return {
    action: "",
    commits: [],
    issue: { number: 0, title: "" },
    pull_request: { number: 0, title: "" },
    ref: "",
    release: { tag_name: "" },
    size: 0,
    ...overrides,
  };
}

function eventOf(overrides: {
  readonly created_at?: string;
  readonly id?: string;
  readonly payload?: Partial<EventPayload>;
  readonly type?: string;
}): GithubEventPayload {
  return {
    created_at: overrides.created_at ?? "2026-09-17T00:00:00Z",
    id: overrides.id ?? "ev",
    payload: payloadOf(overrides.payload ?? {}),
    repo: { name: "octocat/repo" },
    type: overrides.type ?? "PushEvent",
  };
}

describe("toActivityData", () => {
  test("件数つきの Push はブランチ名と件数をタイトルにする", () => {
    const data = toActivityData([eventOf({ payload: { ref: "refs/heads/main", size: 3 } })]);
    expect(data.items[0]?.kind).toBe("commit");
    expect(data.items[0]?.title).toBe("Pushed 3 commits to main");
    expect(data.items[0]?.count).toBe(3);
  });

  test("公開イベント API のように件数が無い Push は件数を書かない", () => {
    const data = toActivityData([eventOf({ payload: { ref: "refs/heads/main" } })]);
    expect(data.items[0]?.title).toBe("Pushed to main");
    expect(data.items[0]?.count).toBe(1);
  });

  test("タイトルの無い PullRequestEvent は action と番号から組み立てる", () => {
    const data = toActivityData([
      eventOf({
        payload: { action: "merged", pull_request: { number: 19, title: "" } },
        type: "PullRequestEvent",
      }),
    ]);
    expect(data.items[0]?.title).toBe("Merged pull request #19");
  });

  test("タイトルのある PullRequestEvent はそれを優先する", () => {
    const data = toActivityData([
      eventOf({
        payload: { action: "opened", pull_request: { number: 20, title: "Fix brackets" } },
        type: "PullRequestEvent",
      }),
    ]);
    expect(data.items[0]?.title).toBe("Fix brackets");
  });

  test("Issue と IssueComment をそれぞれ拾う", () => {
    const data = toActivityData([
      eventOf({
        id: "is",
        payload: { action: "opened", issue: { number: 2, title: "Rate limit が返る" } },
        type: "IssuesEvent",
      }),
      eventOf({
        id: "ic",
        payload: { action: "created", issue: { number: 17, title: "" } },
        type: "IssueCommentEvent",
      }),
      eventOf({ id: "rl", payload: { release: { tag_name: "v0.2.0" } }, type: "ReleaseEvent" }),
    ]);
    expect(data.items.map((item) => item.kind)).toEqual(["issue", "comment", "release"]);
    expect(data.items[0]?.title).toBe("Rate limit が返る");
    expect(data.items[1]?.title).toBe("Commented on issue #17");
  });

  test("表示に使わない種別は落とす", () => {
    const data = toActivityData([
      eventOf({ type: "WatchEvent" }),
      eventOf({ type: "ForkEvent" }),
      eventOf({ type: "CreateEvent" }),
      eventOf({ id: "keep" }),
    ]);
    expect(data.items.map((item) => item.id)).toEqual(["keep"]);
  });

  test("日時が空のイベントは落とす", () => {
    const data = toActivityData([eventOf({ created_at: "", id: "nodate" })]);
    expect(data.items).toEqual([]);
  });

  test("上限 10 件で切る", () => {
    const events: GithubEventPayload[] = Array.from({ length: 15 }, (_unused, index) =>
      eventOf({ id: `ev-${String(index)}` }),
    );
    expect(toActivityData(events).items.length).toBe(10);
  });
});
