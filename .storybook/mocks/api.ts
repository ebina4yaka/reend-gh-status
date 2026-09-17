import type {
  ActivityResponse,
  ContributionsResponse,
  ReposResponse,
  StatsResponse,
  TopLangsResponse,
} from "@/server/app";
import { type GithubSnapshot, emptySnapshot } from "@/shared/github";

/**
 * Eden Treaty クライアント（@/lib/api）のモック。
 * ストーリーは setApiScenario でスナップショットを差し替える。
 */

// シナリオ（ストーリーが setApiScenario で差し替える）。ban-let 対策で可変オブジェクト。
const mockState: { snapshot: GithubSnapshot } = { snapshot: emptySnapshot() };

/** ストーリーから API シナリオを差し替える。 */
export function setApiScenario(snapshot: GithubSnapshot): void {
  mockState.snapshot = snapshot;
}

/** デフォルト（空スナップショット）へ戻す。 */
export function resetMocks(): void {
  mockState.snapshot = emptySnapshot();
}

// 成功レスポンス（Eden は { data, error } を返し、成功時 error は undefined）。
interface EdenResult<TPayload> {
  readonly data: TPayload;
  readonly error?: never;
}

function ok<TPayload extends object>(payload: TPayload): EdenResult<TPayload> {
  return { data: payload };
}

interface ApiTree {
  readonly api: {
    readonly activity: { readonly GET: () => Promise<EdenResult<ActivityResponse>> };
    readonly contributions: { readonly GET: () => Promise<EdenResult<ContributionsResponse>> };
    readonly repos: { readonly GET: () => Promise<EdenResult<ReposResponse>> };
    readonly stats: { readonly GET: () => Promise<EdenResult<StatsResponse>> };
    readonly topLangs: { readonly GET: () => Promise<EdenResult<TopLangsResponse>> };
  };
}

export const api: ApiTree = {
  api: {
    activity: {
      GET: async (): Promise<EdenResult<ActivityResponse>> => ok(mockState.snapshot.activity),
    },
    contributions: {
      GET: async (): Promise<EdenResult<ContributionsResponse>> =>
        ok(mockState.snapshot.contributions),
    },
    repos: { GET: async (): Promise<EdenResult<ReposResponse>> => ok(mockState.snapshot.repos) },
    stats: { GET: async (): Promise<EdenResult<StatsResponse>> => ok(mockState.snapshot.stats) },
    topLangs: {
      GET: async (): Promise<EdenResult<TopLangsResponse>> => ok(mockState.snapshot.languages),
    },
  },
};
