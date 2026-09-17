import { type ReactElement, type ReactNode, createElement } from "react";

/**
 * TanStack Router（@tanstack/react-router）のモック。
 * ルート定義（createFileRoute / createRootRoute）とリンク・ナビゲーションを
 * Storybook 上で動かすための最小実装。PRTS と同じ方針。
 */

export interface MockLinkProps {
  readonly "aria-current"?: "page";
  readonly "aria-label"?: string;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly params?: Readonly<Record<string, string>>;
  readonly search?: Readonly<Record<string, string>>;
  readonly title?: string;
  readonly to: string;
}

/** パステンプレート（/repos/$name）と params から表示用 href を組む。 */
function hrefOf(props: MockLinkProps): string {
  const base: string = props.to.replace(
    /\$(?<key>\w+)/g,
    (_match, key: string): string => props.params?.[key] ?? "",
  );
  if (props.search && Object.keys(props.search).length > 0) {
    return `${base}?${new URLSearchParams(props.search).toString()}`;
  }
  return base;
}

export function Link(props: MockLinkProps): ReactElement {
  return createElement(
    "a",
    {
      "aria-current": props["aria-current"],
      "aria-label": props["aria-label"],
      className: props.className,
      href: hrefOf(props),
      title: props.title,
    },
    props.children,
  );
}

/** ナビゲーションは noop（ストーリーでは遷移しない）。 */
export function useNavigate(): (options: object) => void {
  return (_options: object): void => {};
}

interface MockRouterLocation {
  readonly pathname: string;
}

interface MockRouterState {
  readonly location: MockRouterLocation;
}

const routerState: { location: MockRouterLocation } = { location: { pathname: "" } };

export function useRouterState(selector?: (state: MockRouterState) => unknown): unknown {
  if (selector) {
    return selector(routerState);
  }
  return routerState;
}

/** ストーリーから現在パスを差し替える。 */
export function setRouterPathname(pathname: string): void {
  routerState.location = { pathname };
}

interface FileRouteOptions {
  readonly component: (props?: object) => ReactElement;
  readonly head?: (context: object) => object;
}

interface FileRoute extends FileRouteOptions {
  readonly useParams: () => Readonly<Record<string, string>>;
}

export function createFileRoute(_path: string): (options: FileRouteOptions) => FileRoute {
  return (options: FileRouteOptions): FileRoute => ({
    ...options,
    useParams: (): Readonly<Record<string, string>> => ({}),
  });
}

export function createRootRoute(options: FileRouteOptions): FileRouteOptions {
  return options;
}

/** RootLayout の Outlet（ストーリーでは子を描画しない）。 */
export function Outlet(): ReactElement {
  return <></>;
}

/** デフォルト状態へ戻す。 */
export function resetMocks(): void {
  routerState.location = { pathname: "" };
}
