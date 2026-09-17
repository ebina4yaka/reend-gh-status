import * as valibot from "valibot";

/**
 * GitHub API の応答を valibot で検証するスキーマ。
 * GraphQL は欠落フィールドを null で返すため、optional の既定値で
 * null を吸収し、この先のコードへ null を持ち込まない。
 */

const LanguageNodeSchema = valibot.object({
  color: valibot.optional(valibot.string(), ""),
  name: valibot.string(),
});

const RepoNodeSchema = valibot.object({
  description: valibot.optional(valibot.string(), ""),
  forkCount: valibot.number(),
  isArchived: valibot.boolean(),
  languages: valibot.object({
    edges: valibot.array(
      valibot.object({
        node: LanguageNodeSchema,
        size: valibot.number(),
      }),
    ),
  }),
  name: valibot.string(),
  primaryLanguage: valibot.optional(LanguageNodeSchema, { color: "", name: "" }),
  pushedAt: valibot.string(),
  stargazerCount: valibot.number(),
});

export type RepoNodePayload = valibot.InferOutput<typeof RepoNodeSchema>;

const ContributionDaySchema = valibot.object({
  contributionCount: valibot.number(),
  contributionLevel: valibot.optional(valibot.string(), "NONE"),
  date: valibot.string(),
});

export type ContributionDayPayload = valibot.InferOutput<typeof ContributionDaySchema>;

const ContributionsCollectionSchema = valibot.object({
  contributionCalendar: valibot.object({
    totalContributions: valibot.number(),
    weeks: valibot.array(
      valibot.object({
        contributionDays: valibot.array(ContributionDaySchema),
      }),
    ),
  }),
  restrictedContributionsCount: valibot.optional(valibot.number(), 0),
  totalCommitContributions: valibot.number(),
  totalIssueContributions: valibot.number(),
  totalPullRequestContributions: valibot.number(),
  totalPullRequestReviewContributions: valibot.number(),
});

export type ContributionsCollectionPayload = valibot.InferOutput<
  typeof ContributionsCollectionSchema
>;

const CountSchema = valibot.object({ totalCount: valibot.number() });

const GithubUserSchema = valibot.object({
  avatarUrl: valibot.optional(valibot.string(), ""),
  contributionsCollection: ContributionsCollectionSchema,
  followers: CountSchema,
  following: CountSchema,
  issues: CountSchema,
  login: valibot.string(),
  mergedPullRequests: CountSchema,
  name: valibot.optional(valibot.string(), ""),
  repositories: valibot.object({
    nodes: valibot.array(RepoNodeSchema),
    totalCount: valibot.number(),
  }),
});

export type GithubUserPayload = valibot.InferOutput<typeof GithubUserSchema>;

export const GraphqlEnvelopeSchema = valibot.object({
  data: valibot.optional(
    valibot.object({
      user: valibot.optional(GithubUserSchema),
    }),
    {},
  ),
  errors: valibot.optional(
    valibot.array(
      valibot.object({
        message: valibot.optional(valibot.string(), ""),
        type: valibot.optional(valibot.string(), ""),
      }),
    ),
    [],
  ),
});

/** REST /users/:login/events/public の 1 要素（必要な範囲だけ検証する）。 */
const EventSchema = valibot.looseObject({
  created_at: valibot.optional(valibot.string(), ""),
  id: valibot.string(),
  payload: valibot.optional(
    valibot.looseObject({
      action: valibot.optional(valibot.string(), ""),
      commits: valibot.optional(valibot.array(valibot.unknown()), []),
      issue: valibot.optional(
        valibot.looseObject({
          number: valibot.optional(valibot.number(), 0),
          title: valibot.optional(valibot.string(), ""),
        }),
        {},
      ),
      pull_request: valibot.optional(
        valibot.looseObject({
          number: valibot.optional(valibot.number(), 0),
          title: valibot.optional(valibot.string(), ""),
        }),
        {},
      ),
      ref: valibot.optional(valibot.string(), ""),
      release: valibot.optional(
        valibot.looseObject({
          tag_name: valibot.optional(valibot.string(), ""),
        }),
        {},
      ),
      size: valibot.optional(valibot.number(), 0),
    }),
    {},
  ),
  repo: valibot.optional(valibot.object({ name: valibot.optional(valibot.string(), "") }), {}),
  type: valibot.optional(valibot.string(), ""),
});

export type GithubEventPayload = valibot.InferOutput<typeof EventSchema>;

export const EventsSchema = valibot.array(EventSchema);
