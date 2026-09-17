import type { RepoNodePayload } from "../github/schema";
import type { RepoItem, ReposData } from "@/shared/github";

/** カードとダッシュボードに載せるリポジトリ数。 */
const MAX_REPOS: number = 10;

export function toReposData(repos: readonly RepoNodePayload[], login: string): ReposData {
  const items: RepoItem[] = repos
    .map((repo: RepoNodePayload): RepoItem => ({
      description: repo.description,
      forks: repo.forkCount,
      isArchived: repo.isArchived,
      language: repo.primaryLanguage.name,
      languageColor: repo.primaryLanguage.color,
      name: repo.name,
      pushedAt: repo.pushedAt,
      stars: repo.stargazerCount,
      url: `https://github.com/${login}/${repo.name}`,
    }))
    .toSorted((left, right) => right.stars - left.stars)
    .slice(0, MAX_REPOS);
  return { items };
}
