import { Link, Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { type ReactElement } from "react";

export const Route = createRootRoute({ component: RootLayout });

const MENU_LINK_CLASS: string =
  "cursor-pointer touch-target inline-flex items-center justify-center bg-transparent font-mono text-xs tracking-widest hover:underline";

interface NavItem {
  label: string;
  to: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "OVERVIEW", to: "/" },
  { label: "REPOS", to: "/repos" },
  { label: "ACTIVITY", to: "/activity" },
  { label: "EXPORT", to: "/export" },
  { label: "SETTINGS", to: "/settings" },
];

function HeaderNav(): ReactElement {
  const pathname: string = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav aria-label="Main" className="flex items-center gap-4 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const active: boolean = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            {...(active ? { "aria-current": "page" as const } : {})}
            className={`${MENU_LINK_CLASS}${active ? " text-primary underline underline-offset-4" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function RootLayout(): ReactElement {
  return (
    <div className="font-body flex min-h-dvh flex-col bg-background text-foreground">
      <header className="z-sticky flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border-strong bg-surface-1 px-4 md:px-6">
        <Link to="/" className="font-ui shrink-0 text-sm font-bold tracking-[0.3em] text-primary">
          REEND<span className="text-muted-foreground">::STATS</span>
        </Link>
        <HeaderNav />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">
        <Outlet />
      </main>
      <footer className="border-t border-border px-4 py-3 text-center font-mono text-[10px] tracking-widest text-muted-foreground">
        REEND::STATS — GITHUB STATISTICS TERMINAL
      </footer>
    </div>
  );
}
