import type { GithubUserPayload } from "../github/schema";
import type { StatsData } from "@/shared/github";

import { computeRank } from "./rank";

/** プロフィール本体と集計値を 1 つの統計データへまとめる。 */
export function toStatsData(user: GithubUserPayload, includePrivate: boolean): StatsData {
  const commits: number =
    user.contributionsCollection.totalCommitContributions +
    (includePrivate ? user.contributionsCollection.restrictedContributionsCount : 0);
  const stars: number = user.repositories.nodes.reduce(
    (sum: number, repo) => sum + repo.stargazerCount,
    0,
  );
  const mergedPullRequests: number = user.mergedPullRequests.totalCount;
  const issues: number = user.issues.totalCount;
  return {
    commits,
    followers: user.followers.totalCount,
    following: user.following.totalCount,
    identity: {
      avatarUrl: user.avatarUrl,
      login: user.login,
      name: user.name,
    },
    issues,
    mergedPullRequests,
    pullRequests: user.contributionsCollection.totalPullRequestContributions,
    rank: computeRank({ commits, issues, pullRequests: mergedPullRequests, stars }),
    repositories: user.repositories.totalCount,
    stars,
  };
}
