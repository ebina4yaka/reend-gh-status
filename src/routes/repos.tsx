import { createFileRoute } from "@tanstack/react-router";
import { type ReactElement, useState } from "react";
import { TacticalTable, type TacticalTableColumn } from "reend-components";

import { SnapshotGate } from "@/components/snapshot-gate";
import { formatCompact, formatDate } from "@/lib/format";

export const Route = createFileRoute("/repos")({ component: ReposPage });

/** TacticalTable の T は Record<string, unknown> を要求する。 */
type RepoRow = Record<string, unknown> & {
  readonly description: string;
  readonly forks: number;
  readonly language: string;
  readonly languageColor: string;
  readonly name: string;
  readonly pushedAt: string;
  readonly stars: number;
  readonly url: string;
};

const COLUMNS: readonly TacticalTableColumn<RepoRow>[] = [
  {
    cell: (row) => (
      <a
        className="underline-offset-4 hover:text-primary hover:underline"
        href={row.url}
        rel="noreferrer"
        target="_blank"
      >
        {row.name}
      </a>
    ),
    header: "REPOSITORY",
    key: "name",
    sortable: true,
  },
  {
    cell: (row) => (
      <span className="flex items-center gap-2">
        <span
          className="inline-block h-2 w-2"
          style={row.languageColor === "" ? {} : { background: row.languageColor }}
        />
        {row.language === "" ? "--" : row.language}
      </span>
    ),
    header: "LANG",
    key: "language",
    sortable: true,
  },
  {
    align: "right",
    cell: (row) => formatCompact(row.stars),
    header: "STARS",
    key: "stars",
    sortable: true,
  },
  { align: "right", header: "FORKS", key: "forks", sortable: true },
  {
    align: "right",
    cell: (row) => formatDate(row.pushedAt),
    header: "PUSHED",
    key: "pushedAt",
    sortable: true,
  },
];

function ReposPage(): ReactElement {
  const [sortKey, setSortKey] = useState<keyof RepoRow & string>("stars");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  return (
    <SnapshotGate>
      {({ snapshot }) => {
        const rows: RepoRow[] = snapshot.repos.items
          .map((item): RepoRow => ({
            description: item.description,
            forks: item.forks,
            language: item.language,
            languageColor: item.languageColor,
            name: item.name,
            pushedAt: item.pushedAt,
            stars: item.stars,
            url: item.url,
          }))
          .toSorted((left, right) => {
            const leftValue: unknown = left[sortKey];
            const rightValue: unknown = right[sortKey];
            const compared: number =
              typeof leftValue === "number" && typeof rightValue === "number"
                ? leftValue - rightValue
                : String(leftValue).localeCompare(String(rightValue));
            return sortDirection === "desc" ? -compared : compared;
          });
        return (
          <TacticalTable
            caption={`${String(rows.length)} REPOSITORIES`}
            columns={[...COLUMNS]}
            data={rows}
            emptyState={<span className="font-mono text-xs">NO REPOSITORIES</span>}
            onSort={(key) => {
              if (key === sortKey) {
                setSortDirection(sortDirection === "desc" ? "asc" : "desc");
              } else {
                setSortKey(key);
                setSortDirection("desc");
              }
            }}
            sortDirection={sortDirection}
            sortKey={sortKey}
          />
        );
      }}
    </SnapshotGate>
  );
}
