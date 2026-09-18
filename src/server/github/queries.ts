/**
 * GitHub GraphQL のクエリ文字列。
 * 統計・言語・草・リポジトリを 1 リクエストでまとめて取る（REST より
 * レート制限に強い）。アクティビティだけは events が REST 専用。
 */

export const CORE_QUERY: string = `
query Core($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    login
    name
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: { field: STARGAZERS, direction: DESC }) {
      totalCount
      nodes {
        name
        description
        stargazerCount
        forkCount
        isArchived
        pushedAt
        primaryLanguage { name color }
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
      }
    }
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays { date contributionCount contributionLevel }
        }
      }
    }
    mergedPullRequests: pullRequests(states: MERGED) { totalCount }
    issues { totalCount }
  }
}
`;

/** 集計に使う期間（日数）。GitHub の草は最大 1 年。 */
export const CONTRIBUTION_WINDOW_DAYS: number = 365;

/** アクティビティ取得のページサイズ（REST の上限は 100）。 */
export const ACTIVITY_PAGE_SIZE: number = 30;
