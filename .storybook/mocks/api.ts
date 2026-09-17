import { fixtureSnapshot } from "@/server/github/fixture";
import { type GithubSnapshot, emptySnapshot } from "@/shared/github";

/**
 * Eden Treaty クライアント（@/lib/api）のモック。
 * ストーリーは setApiScenario でスナップショットを差し替える。
 */

const mockState: { snapshot: GithubSnapshot } = { snapshot: fixtureSnapshot() };

/** ストーリーから API シナリオを差し替える。 */
export function setApiScenario(snapshot: GithubSnapshot): void {
  mockState.snapshot = snapshot;
}

/** デフォルト（空スナップショット）へ戻す。 */
export function resetMocks(): void {
  mockState.snapshot = emptySnapshot();
}

interface SnapshotQueryResult {
  readonly data: {
    readonly data: GithubSnapshot;
    readonly fetchedAt: string;
    readonly status: "ok";
  };
  readonly error?: never;
}

interface ApiTree {
  readonly api: {
    readonly snapshot: {
      readonly QUERY: () => Promise<SnapshotQueryResult>;
    };
  };
}

export const api: ApiTree = {
  api: {
    snapshot: {
      QUERY: async (): Promise<SnapshotQueryResult> => ({
        data: { data: mockState.snapshot, fetchedAt: "2026-09-17T18:00:00Z", status: "ok" },
      }),
    },
  },
};
