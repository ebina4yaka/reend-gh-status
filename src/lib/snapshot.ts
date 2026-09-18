import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import type { GithubSnapshot } from "@/shared/github";

import { api } from "./api";

/** サーバーがまとめた 1 回分のスナップショット（取得時刻つき）。 */
export interface SnapshotResult {
  readonly fetchedAt: string;
  readonly snapshot: GithubSnapshot;
}

/**
 * ダッシュボードのデータ取得。サーバー側で 10 分キャッシュされるため、
 * 画面遷移のたびの再取得はしない。
 */
export function useSnapshot(): UseQueryResult<SnapshotResult> {
  return useQuery({
    queryFn: async (): Promise<SnapshotResult> => {
      const response: Awaited<ReturnType<typeof api.api.snapshot.QUERY>> =
        await api.api.snapshot.QUERY({});
      if (response.error) {
        throw new Error(`API ${String(response.error.status)}`);
      }
      if (response.data.status === "error") {
        throw new Error(response.data.message);
      }
      return { fetchedAt: response.data.fetchedAt, snapshot: response.data.data };
    },
    queryKey: ["snapshot"],
    retry: false,
  });
}
