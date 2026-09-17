import type { Meta, StoryObj } from "@storybook/react-vite";

import { fixtureSnapshot } from "@/server/github/fixture";

import { OverviewPage } from "./index";

/**
 * 概要ページのカタログ。React Query のキャッシュへスナップショットを
 * 事前投入し、API を叩かずに 5 カードの並びを確認する。
 */

const meta: Meta<typeof OverviewPage> = {
  component: OverviewPage,
  parameters: {
    layout: "fullscreen",
    queryData: [
      {
        data: { fetchedAt: "2026-09-17T18:00:00Z", snapshot: fixtureSnapshot() },
        key: ["snapshot"],
      },
    ],
  },
  title: "Pages/Overview",
};

export default meta;

type Story = StoryObj<typeof OverviewPage>;

export const Default: Story = {};
