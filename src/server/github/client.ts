import { Maybe, Result } from "true-myth";
import * as valibot from "valibot";

import type { ApiErrorReason } from "@/shared/github";

import { asyncResult } from "../async-result";
import { withCache } from "../cache";
import { getGithubToken, getGithubUsername } from "../env";
import { ACTIVITY_PAGE_SIZE, CONTRIBUTION_WINDOW_DAYS, CORE_QUERY } from "./queries";
import {
  EventsSchema,
  type GithubEventPayload,
  type GithubUserPayload,
  GraphqlEnvelopeSchema,
} from "./schema";

/**
 * GitHub API クライアント。認証はサーバー側の PAT のみ。
 * 応答は Cache API に 10 分載せ、レート制限を守る。
 */

export type GithubFailure =
  | { readonly kind: "http"; readonly status: number }
  | { readonly kind: "invalid-payload"; readonly message: string }
  | { readonly kind: "missing-token" }
  | { readonly kind: "missing-username" }
  | { readonly kind: "network"; readonly message: string }
  | { readonly kind: "not-found" }
  | { readonly kind: "rate-limited" };

const CACHE_TTL_SECONDS: number = 600;
const GITHUB_GRAPHQL_URL: string = "https://api.github.com/graphql";
const GITHUB_API_URL: string = "https://api.github.com";

/** 失敗を画面表示用の理由へ畳む。 */
export function describeFailure(failure: GithubFailure): {
  readonly message: string;
  readonly reason: ApiErrorReason;
} {
  if (failure.kind === "missing-username") {
    return { message: "GITHUB_USERNAME が未設定です。", reason: "missing-username" };
  }
  if (failure.kind === "missing-token") {
    return { message: "GITHUB_TOKEN が未設定です。", reason: "missing-username" };
  }
  if (failure.kind === "not-found") {
    return { message: "ユーザーが見つかりません。", reason: "not-found" };
  }
  if (failure.kind === "rate-limited") {
    return { message: "GitHub のレート制限に達しました。", reason: "rate-limited" };
  }
  if (failure.kind === "invalid-payload") {
    return { message: `応答を解釈できません: ${failure.message}`, reason: "github-error" };
  }
  if (failure.kind === "network") {
    return { message: `GitHub へ接続できません: ${failure.message}`, reason: "github-error" };
  }
  return { message: `GitHub が ${String(failure.status)} を返しました。`, reason: "github-error" };
}

function isRateLimited(response: Response): boolean {
  const remaining: string = response.headers.get("x-ratelimit-remaining") ?? "";
  return response.status === 429 || (response.status === 403 && remaining === "0");
}

async function toFailure(response: Response): Promise<GithubFailure> {
  if (response.status === 404) {
    return { kind: "not-found" };
  }
  if (isRateLimited(response)) {
    return { kind: "rate-limited" };
  }
  if (response.status === 401) {
    return { kind: "missing-token" };
  }
  return { kind: "http", status: response.status };
}

function authHeaders(token: Maybe<string>): Record<string, string> {
  return token.match({
    Just: (value): Record<string, string> => ({
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${value}`,
      "User-Agent": "gh-reend-status",
      "X-GitHub-Api-Version": "2022-11-28",
    }),
    Nothing: (): Record<string, string> => ({
      Accept: "application/vnd.github+json",
      "User-Agent": "gh-reend-status",
      "X-GitHub-Api-Version": "2022-11-28",
    }),
  });
}

/** ISO 日時から n 日前を求める。 */
function daysAgoIso(days: number): string {
  const date: Date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

async function postGraphql(
  query: string,
  variables: object,
  token: Maybe<string>,
): Promise<Result<Response, unknown>> {
  return asyncResult(
    fetch(GITHUB_GRAPHQL_URL, {
      body: JSON.stringify({ query, variables }),
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      method: "POST",
    }),
  );
}

/** GitHub ユーザーの統計・言語・草・リポジトリを 1 リクエストで取る。 */
export async function fetchCore(
  username: string,
): Promise<Result<GithubUserPayload, GithubFailure>> {
  const response: Result<Response, unknown> = await withCache(
    `github/core/${username}`,
    CACHE_TTL_SECONDS,
    () =>
      postGraphql(
        CORE_QUERY,
        {
          from: daysAgoIso(CONTRIBUTION_WINDOW_DAYS),
          login: username,
          to: new Date().toISOString(),
        },
        getGithubToken(),
      ),
  );
  if (response.isErr) {
    return Result.err({ kind: "network", message: String(response.error) });
  }
  if (!response.value.ok) {
    return Result.err(await toFailure(response.value));
  }
  const json: Result<unknown, unknown> = await asyncResult(response.value.json());
  if (json.isErr) {
    return Result.err({ kind: "invalid-payload", message: "json parse failed" });
  }
  const parsed: valibot.SafeParseResult<typeof GraphqlEnvelopeSchema> = valibot.safeParse(
    GraphqlEnvelopeSchema,
    json.value,
  );
  if (!parsed.success) {
    return Result.err({ kind: "invalid-payload", message: parsed.issues[0]?.message ?? "schema" });
  }
  const user: Maybe<GithubUserPayload> = Maybe.of(parsed.output.data.user);
  if (user.isNothing) {
    const message: string = parsed.output.errors[0]?.message ?? "";
    return Result.err(
      message.includes("Could not resolve")
        ? { kind: "not-found" }
        : { kind: "invalid-payload", message: message === "" ? "user is empty" : message },
    );
  }
  return Result.ok(user.value);
}

/** 直近の公開イベント（REST 専用）を取る。 */
export async function fetchActivity(
  username: string,
): Promise<Result<readonly GithubEventPayload[], GithubFailure>> {
  const response: Result<Response, unknown> = await withCache(
    `github/events/${username}`,
    CACHE_TTL_SECONDS,
    () =>
      asyncResult(
        fetch(
          `${GITHUB_API_URL}/users/${encodeURIComponent(username)}/events/public?per_page=${String(ACTIVITY_PAGE_SIZE)}`,
          {
            headers: authHeaders(getGithubToken()),
          },
        ),
      ),
  );
  if (response.isErr) {
    return Result.err({ kind: "network", message: String(response.error) });
  }
  if (!response.value.ok) {
    return Result.err(await toFailure(response.value));
  }
  const json: Result<unknown, unknown> = await asyncResult(response.value.json());
  if (json.isErr) {
    return Result.err({ kind: "invalid-payload", message: "json parse failed" });
  }
  const parsed: valibot.SafeParseResult<typeof EventsSchema> = valibot.safeParse(
    EventsSchema,
    json.value,
  );
  if (!parsed.success) {
    return Result.err({ kind: "invalid-payload", message: parsed.issues[0]?.message ?? "schema" });
  }
  return Result.ok(parsed.output);
}

/** 固定運用のログイン名を返す。未設定は失敗として扱う。 */
export function resolveUsername(): Result<string, GithubFailure> {
  return getGithubUsername().match({
    Just: (value): Result<string, GithubFailure> => Result.ok(value),
    Nothing: (): Result<string, GithubFailure> => Result.err({ kind: "missing-username" }),
  });
}
