import { type ReactElement } from "react";
import { match } from "ts-pattern";

import { ActivityCard } from "@/cards/activity-card";
import { ContributionsCard } from "@/cards/contributions-card";
import { ReposCard } from "@/cards/repos-card";
import { StatsCard } from "@/cards/stats-card";
import { TopLangsCard } from "@/cards/top-langs-card";
import type { CardTokens } from "@/cards/tokens";
import type { CardType } from "@/shared/cards";
import type { GithubSnapshot } from "@/shared/github";

export interface BuildCardOptions {
  readonly caption: string;
  readonly snapshot: GithubSnapshot;
  readonly tokens: CardTokens;
  readonly type: CardType;
}

/** カード種別から satori へ渡す要素を組み立てる。 */
export function buildCard(options: BuildCardOptions): ReactElement {
  const { caption, snapshot, tokens, type } = options;
  return match(type)
    .with("stats", () => <StatsCard caption={caption} data={snapshot.stats} tokens={tokens} />)
    .with("top-langs", () => (
      <TopLangsCard caption={caption} data={snapshot.languages} tokens={tokens} />
    ))
    .with("contributions", () => (
      <ContributionsCard caption={caption} data={snapshot.contributions} tokens={tokens} />
    ))
    .with("activity", () => (
      <ActivityCard caption={caption} data={snapshot.activity} tokens={tokens} />
    ))
    .with("repos", () => <ReposCard caption={caption} data={snapshot.repos} tokens={tokens} />)
    .exhaustive();
}
