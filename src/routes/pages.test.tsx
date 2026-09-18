/**
 * 全ページの描画スモークテスト。フィクスチャと空データの両方で描画し、
 * 日付のような文字列前提の値が壊れていないことを確認する。
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// 複数のテストファイルが同じプロセスで動くため、二重登録を避ける。
if (!GlobalRegistrator.isRegistered) {
  GlobalRegistrator.register();
}

import { afterEach, describe, expect, mock, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, type RenderResult } from "@testing-library/react";
import { createElement, type ReactElement } from "react";

import { fixtureSnapshot } from "@/server/github/fixture";
import { emptySnapshot, type GithubSnapshot } from "@/shared/github";

interface SnapshotQueryResult {
  readonly data: {
    readonly data: GithubSnapshot;
    readonly fetchedAt: string;
    readonly status: "ok";
  };
  readonly error?: never;
}

const mockState: { snapshot: GithubSnapshot } = { snapshot: emptySnapshot() };

mock.module("@/lib/api", () => ({
  api: {
    api: {
      snapshot: {
        QUERY: async (): Promise<SnapshotQueryResult> => ({
          data: { data: mockState.snapshot, fetchedAt: "2026-09-18T00:00:00.000Z", status: "ok" },
        }),
      },
    },
  },
}));

mock.module("@tanstack/react-router", () => ({
  createFileRoute:
    () =>
    (options: Record<string, unknown>): Record<string, unknown> =>
      options,
}));

const { OverviewPage } = await import("./index");
const { ReposPage } = await import("./repos");
const { ActivityPage } = await import("./activity");
const { ExportPage } = await import("./export");
const { SettingsPage } = await import("./settings");

function renderWithQuery(element: ReactElement): RenderResult {
  const client: QueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(createElement(QueryClientProvider, { client }, element));
}

afterEach((): void => {
  cleanup();
});

const PAGES: readonly { readonly element: ReactElement; readonly name: string }[] = [
  { element: createElement(OverviewPage), name: "overview" },
  { element: createElement(ReposPage), name: "repos" },
  { element: createElement(ActivityPage), name: "activity" },
  { element: createElement(ExportPage), name: "export" },
  { element: createElement(SettingsPage), name: "settings" },
];

function renderAllPages(): void {
  for (const page of PAGES) {
    const view: RenderResult = renderWithQuery(page.element);
    expect(view.container.innerHTML.length).toBeGreaterThan(0);
    cleanup();
  }
}

const CARD_TITLES: readonly string[] = [
  "OPERATOR STATUS",
  "LANGUAGE MATRIX",
  "CONTRIBUTION TRACE",
  "ACTIVITY STREAM",
  "REPOSITORY ARCHIVE",
];

describe("全ページの描画", () => {
  test("概要ページは統計値・ログイン名・5 種のカードを表示する", async () => {
    mockState.snapshot = fixtureSnapshot();
    const view: RenderResult = renderWithQuery(createElement(OverviewPage));
    expect(await view.findByText("The Octocat")).toBeDefined();
    expect(await view.findByText("12,480")).toBeDefined();
    expect(await view.findByText("TARGET::octocat")).toBeDefined();
    for (const title of CARD_TITLES) {
      expect(view.getByText(title)).toBeDefined();
    }
  });

  test("空データでも落ちない", () => {
    mockState.snapshot = emptySnapshot();
    renderAllPages();
  });

  test("フィクスチャでも落ちない", () => {
    mockState.snapshot = fixtureSnapshot();
    renderAllPages();
  });

  test("日付フィールドは文字列である（Date 復元の回帰防止）", () => {
    const snapshot: GithubSnapshot = fixtureSnapshot();
    expect(typeof snapshot.repos.items[0]?.pushedAt).toBe("string");
    expect(typeof snapshot.activity.items[0]?.createdAt).toBe("string");
  });
});
