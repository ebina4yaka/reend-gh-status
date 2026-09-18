import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview, StoryContext, StoryFn } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactElement, createElement } from "react";

import { resetMocks as resetApiMocks } from "./mocks/api";
import "../src/index.css";

/**
 * ページ系ストーリー用: React Query キャッシュへ事前投入するデータ。
 * useQuery はデータそのもの、useInfiniteQuery は { pages, pageParams } 形状。
 */
export interface QuerySeed {
  readonly data: Record<string, unknown>;
  readonly key: readonly unknown[];
}

/** ストーリー毎に新しいクライアントを張り、parameters.queryData をシードする */
function withProviders(Story: StoryFn, context: StoryContext): ReactElement {
  const client: QueryClient = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false, staleTime: Infinity },
    },
  });
  const seeds: readonly QuerySeed[] = context.parameters.queryData ?? [];
  for (const { data, key } of seeds) {
    client.setQueryData(key, data);
  }
  return createElement(QueryClientProvider, { client }, createElement(Story));
}

const preview: Preview = {
  beforeEach: (): void => {
    // ストーリー間で API のモック状態をリセット。
    resetApiMocks();
  },
  decorators: [
    withThemeByClassName({
      defaultTheme: "dark",
      themes: { dark: "dark", light: "light" },
    }),
    withProviders,
  ],
  initialGlobals: { theme: "dark" },
  parameters: {
    controls: {
      matchers: { color: /(?:background|color)$/i, date: /Date$/i },
    },
    layout: "fullscreen",
  },
};

export default preview;
