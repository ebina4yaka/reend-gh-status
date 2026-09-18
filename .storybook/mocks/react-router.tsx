import type { ReactElement } from "react";

/**
 * TanStack Router（@tanstack/react-router）のモック。
 * ストーリーが読み込むルート定義は createFileRoute だけなので、そこだけを
 * 差し替える（ルートツリーやナビゲーションは Storybook では組み立てない）。
 */

interface FileRouteOptions {
  readonly component: (props?: Record<string, unknown>) => ReactElement;
}

export function createFileRoute(_path: string): (options: FileRouteOptions) => FileRouteOptions {
  return (options: FileRouteOptions): FileRouteOptions => options;
}
