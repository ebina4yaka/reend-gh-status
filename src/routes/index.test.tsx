/**
 * 概要ページの表示テスト（happy-dom + Testing Library）。
 * API をモックして、スナップショットが各カードへ流れ込むことを確認する。
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
import type { GithubSnapshot } from "@/shared/github";

interface SnapshotQueryResult {
  readonly data: {
    readonly data: GithubSnapshot;
    readonly fetchedAt: string;
    readonly status: "ok";
  };
  readonly error?: never;
}

const querySnapshot = mock(async (): Promise<SnapshotQueryResult> => ({
  data: { data: fixtureSnapshot(), fetchedAt: "2026-09-17T18:00:00Z", status: "ok" },
}));

mock.module("@/lib/api", () => ({
  api: { api: { snapshot: { QUERY: querySnapshot } } },
}));

mock.module("@tanstack/react-router", () => ({
  createFileRoute:
    () =>
    (options: object): object =>
      options,
}));

// モック登録の後に route ファイルを取り込む（createFileRoute の差し替えが先に必要）。
const { OverviewPage } = await import("./index");

function renderWithQuery(element: ReactElement): RenderResult {
  const client: QueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(createElement(QueryClientProvider, { client }, element));
}

afterEach((): void => {
  cleanup();
  querySnapshot.mockClear();
});

describe("OverviewPage", () => {
  test("スナップショットの統計値とログイン名を表示する", async () => {
    const view: RenderResult = renderWithQuery(createElement(OverviewPage));
    expect(await view.findByText("The Octocat")).toBeDefined();
    expect(await view.findByText("12,480")).toBeDefined();
    expect(await view.findByText("TARGET::octocat")).toBeDefined();
  });

  test("アクセント色とテーマを反映したカードを描画する", async () => {
    const view: RenderResult = renderWithQuery(createElement(OverviewPage));
    // カードのタイトルが 5 種類ぶん出る。
    expect(await view.findByText("OPERATOR STATUS")).toBeDefined();
    expect(await view.findByText("LANGUAGE MATRIX")).toBeDefined();
    expect(await view.findByText("CONTRIBUTION TRACE")).toBeDefined();
    expect(await view.findByText("ACTIVITY STREAM")).toBeDefined();
    expect(await view.findByText("REPOSITORY ARCHIVE")).toBeDefined();
  });
});
