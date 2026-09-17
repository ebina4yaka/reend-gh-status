// FOUC 防止: React レンダー前にテーマを確定させる。必ず最初に import すること。
import "./lib/theme-init";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactElement, StrictMode } from "react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { Maybe } from "true-myth";
import { SonnerToaster } from "reend-components";

import { routeTree } from "./routeTree.gen";
import { useApplyTheme, useTheme } from "./lib/theme";
import "./index.css";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // GitHub 側はサーバーの Cache API で 10 分キャッシュ済み。クライアントは
      // 画面遷移で再取得しない程度に短く保つ。
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});

export function App(): ReactElement {
  // テーマ（ライト/ダーク/メインカラー）を全ルートへ適用。
  useApplyTheme();
  const { mode } = useTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* 同期完了などの一時的な操作結果を伝えるトースト（テーマ連動）。 */}
      <SonnerToaster theme={mode} />
    </QueryClientProvider>
  );
}

const rootElement: Maybe<HTMLElement> = Maybe.of(document.getElementById("root"));
// DOM API returns nullable values; the entry point is the one legitimate place to assert.
if (rootElement.isNothing) {
  throw new Error("Root element #root is missing in index.html");
}

createRoot(rootElement.value).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
