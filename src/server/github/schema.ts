import * as valibot from "valibot";

/**
 * GitHub API の応答を valibot で検証するスキーマ。
 * GraphQL は欠落フィールドを null で返す。nullish の既定値で null を吸収し、
 * この先のコードへ null を持ち込まない（optional は null を受け付けない）。
 */

const LanguageNodeSchema = valibot.object({
  color: valibot.nullish(valibot.string(), ""),
  name: valibot.string(),
});

const RepoNodeSchema = valibot.object({
  description: valibot.nullish(valibot.string(), ""),
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
  primaryLanguage: valibot.nullish(LanguageNodeSchema, { color: "", name: "" }),
  pushedAt: valibot.nullish(valibot.string(), ""),
  stargazerCount: valibot.number(),
});

export type RepoNodePayload = valibot.InferOutput<typeof RepoNodeSchema>;

const ContributionDaySchema = valibot.object({
  contributionCount: valibot.number(),
  contributionLevel: valibot.nullish(valibot.string(), "NONE"),
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
  restrictedContributionsCount: valibot.nullish(valibot.number(), 0),
  totalCommitContributions: valibot.number(),
});

export type ContributionsCollectionPayload = valibot.InferOutput<
  typeof ContributionsCollectionSchema
>;

const CountSchema = valibot.object({ totalCount: valibot.number() });

const GithubUserSchema = valibot.object({
  contributionsCollection: ContributionsCollectionSchema,
  followers: CountSchema,
  issues: CountSchema,
  login: valibot.string(),
  mergedPullRequests: CountSchema,
  name: valibot.nullish(valibot.string(), ""),
  repositories: valibot.object({
    nodes: valibot.array(RepoNodeSchema),
    totalCount: valibot.number(),
  }),
});

export type GithubUserPayload = valibot.InferOutput<typeof GithubUserSchema>;

export const GraphqlEnvelopeSchema = valibot.object({
  data: valibot.nullish(
    valibot.object({
      user: valibot.nullish(GithubUserSchema),
    }),
    {},
  ),
  errors: valibot.nullish(
    valibot.array(
      valibot.object({
        message: valibot.nullish(valibot.string(), ""),
        type: valibot.nullish(valibot.string(), ""),
      }),
    ),
    [],
  ),
});

/** REST /users/:login/events/public の 1 要素（必要な範囲だけ検証する）。 */
const EventSchema = valibot.looseObject({
  created_at: valibot.nullish(valibot.string(), ""),
  id: valibot.string(),
  payload: valibot.nullish(
    valibot.looseObject({
      action: valibot.nullish(valibot.string(), ""),
      commits: valibot.nullish(valibot.array(valibot.unknown()), []),
      issue: valibot.nullish(
        valibot.looseObject({
          number: valibot.nullish(valibot.number(), 0),
          title: valibot.nullish(valibot.string(), ""),
        }),
        {},
      ),
      pull_request: valibot.nullish(
        valibot.looseObject({
          number: valibot.nullish(valibot.number(), 0),
          title: valibot.nullish(valibot.string(), ""),
        }),
        {},
      ),
      ref: valibot.nullish(valibot.string(), ""),
      release: valibot.nullish(
        valibot.looseObject({
          tag_name: valibot.nullish(valibot.string(), ""),
        }),
        {},
      ),
      size: valibot.nullish(valibot.number(), 0),
    }),
    {},
  ),
  repo: valibot.nullish(valibot.object({ name: valibot.nullish(valibot.string(), "") }), {}),
  type: valibot.nullish(valibot.string(), ""),
});

export type GithubEventPayload = valibot.InferOutput<typeof EventSchema>;

export const EventsSchema = valibot.array(EventSchema);
