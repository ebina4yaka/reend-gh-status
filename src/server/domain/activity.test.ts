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
  test("Push はブランチ名と件数をタイトルにする", () => {
    const data = toActivityData([eventOf({ payload: { ref: "refs/heads/main", size: 3 } })]);
    expect(data.items[0]?.kind).toBe("commit");
    expect(data.items[0]?.title).toBe("Pushed 3 commits to main");
    expect(data.items[0]?.count).toBe(3);
  });

  test("PR / Issue / Release をそれぞれ拾う", () => {
    const data = toActivityData([
      eventOf({
        id: "pr",
        payload: { pull_request: { number: 1, title: "Fix brackets" } },
        type: "PullRequestEvent",
      }),
      eventOf({
        id: "is",
        payload: { issue: { number: 2, title: "Rate limit が返る" } },
        type: "IssuesEvent",
      }),
      eventOf({
        id: "rl",
        payload: { release: { tag_name: "v0.2.0" } },
        type: "ReleaseEvent",
      }),
    ]);
    expect(data.items.map((item) => item.kind)).toEqual(["pull-request", "issue", "release"]);
    expect(data.items[1]?.title).toBe("Rate limit が返る");
  });

  test("表示に使わない種別は落とす", () => {
    const data = toActivityData([
      eventOf({ type: "WatchEvent" }),
      eventOf({ type: "ForkEvent" }),
      eventOf({ id: "keep" }),
    ]);
    expect(data.items.map((item) => item.id)).toEqual(["keep"]);
  });

  test("日時が空のイベントは落とす", () => {
    const data = toActivityData([eventOf({ created_at: "", id: "nodate" })]);
    expect(data.items).toEqual([]);
  });
});
