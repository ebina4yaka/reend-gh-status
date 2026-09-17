import { Result } from "true-myth";

import { type ActivityData, type GithubSnapshot, emptySnapshot } from "@/shared/github";

import { toActivityData } from "./domain/activity";
import { toContributionsData } from "./domain/contributions";
import { aggregateLanguages } from "./domain/languages";
import { toReposData } from "./domain/repos";
import { toStatsData } from "./domain/stats";
import { includePrivateContributions } from "./env";
import { type GithubFailure, fetchActivity, fetchCore, resolveUsername } from "./github/client";
import type { GithubEventPayload, GithubUserPayload } from "./github/schema";

/**
 * ダッシュボードとカードが必要とする 1 回分のスナップショット。
 * GraphQL 1 回（キャッシュあり）+ 公開イベント 1 回で組み立てる。
 */

export async function loadSnapshot(): Promise<Result<GithubSnapshot, GithubFailure>> {
  const username: Result<string, GithubFailure> = resolveUsername();
  if (username.isErr) {
    return Result.err(username.error);
  }
  const core: Result<GithubUserPayload, GithubFailure> = await fetchCore(username.value);
  if (core.isErr) {
    return Result.err(core.error);
  }
  const activity: Result<readonly GithubEventPayload[], GithubFailure> = await fetchActivity(
    username.value,
  );
  // アクティビティが取れなくても他のカードは出す。
  const activityData: ActivityData = activity.match<ActivityData>({
    Err: (): ActivityData => emptySnapshot().activity,
    Ok: (events): ActivityData => toActivityData(events),
  });
  const user: GithubUserPayload = core.value;
  return Result.ok({
    activity: activityData,
    contributions: toContributionsData(user.contributionsCollection),
    languages: aggregateLanguages(user.repositories.nodes),
    repos: toReposData(user.repositories.nodes, user.login),
    stats: toStatsData(user, includePrivateContributions()),
  });
}
