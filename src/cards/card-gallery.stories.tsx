import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactElement } from "react";

import { fixtureSnapshot } from "@/server/github/fixture";
import { emptySnapshot } from "@/shared/github";

import { ActivityCard } from "./activity-card";
import { ContributionsCard } from "./contributions-card";
import { ReposCard } from "./repos-card";
import { StatsCard } from "./stats-card";
import { type CardAccentName, type CardThemeName, cardTokens } from "./tokens";
import { TopLangsCard } from "./top-langs-card";

/**
 * 5 種のカードを一覧するカタログ。ダッシュボードと同じ共有部品を描く
 * （satori へ渡すのと同じ JSX がブラウザでどう出るかを目視で確認する用途）。
 */

interface GalleryProps {
  readonly accent: CardAccentName;
  readonly theme: CardThemeName;
}

const CAPTION: string = "SYNC 2026-09-17 18:00";

function CardGallery(props: GalleryProps): ReactElement {
  const tokens = cardTokens(props.theme, props.accent);
  const snapshot = fixtureSnapshot();
  const background: string = props.theme === "dark" ? "#0a0a0a" : "#f7f7f7";
  return (
    <div
      style={{
        background,
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        padding: 24,
      }}
    >
      <StatsCard caption={CAPTION} data={snapshot.stats} tokens={tokens} />
      <TopLangsCard caption={CAPTION} data={snapshot.languages} layout="donut" tokens={tokens} />
      <TopLangsCard caption={CAPTION} data={snapshot.languages} layout="bars" tokens={tokens} />
      <ContributionsCard caption={CAPTION} data={snapshot.contributions} tokens={tokens} />
      <ActivityCard caption={CAPTION} data={snapshot.activity} tokens={tokens} />
      <ReposCard caption={CAPTION} data={snapshot.repos} tokens={tokens} />
    </div>
  );
}

const meta: Meta<GalleryProps> = {
  argTypes: {
    accent: { control: "select", options: ["yellow", "blue", "cyan"] satisfies CardAccentName[] },
    theme: { control: "select", options: ["dark", "light"] satisfies CardThemeName[] },
  },
  args: { accent: "yellow", theme: "dark" },
  component: CardGallery,
  parameters: { layout: "fullscreen" },
  title: "Cards/Gallery",
};

export default meta;

type Story = StoryObj<GalleryProps>;

export const Dark: Story = {};

export const Light: Story = { args: { theme: "light" } };

export const CyanAccent: Story = { args: { accent: "cyan" } };

/** 空スナップショットでもカードが崩れないことの確認用。 */
export const EmptyData: Story = {
  render: (args): ReactElement => {
    const tokens = cardTokens(args.theme, args.accent);
    const empty = emptySnapshot();
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: 24 }}>
        <StatsCard caption={CAPTION} data={empty.stats} tokens={tokens} />
        <TopLangsCard caption={CAPTION} data={empty.languages} layout="donut" tokens={tokens} />
        <TopLangsCard caption={CAPTION} data={empty.languages} layout="bars" tokens={tokens} />
        <ContributionsCard caption={CAPTION} data={empty.contributions} tokens={tokens} />
        <ActivityCard caption={CAPTION} data={empty.activity} tokens={tokens} />
        <ReposCard caption={CAPTION} data={empty.repos} tokens={tokens} />
      </div>
    );
  },
};
