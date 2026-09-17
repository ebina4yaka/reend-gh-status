import type { RepoNodePayload } from "../github/schema";
import type { LanguageStat, TopLangsData } from "@/shared/github";

interface LanguageTotal {
  bytes: number;
  color: string;
}

/**
 * 所有リポジトリの言語バイト数を合算する。
 * 色は最初に見つかった言語ノードの色を使う（GitHub 側で言語ごとに固定）。
 */
export function aggregateLanguages(repos: readonly RepoNodePayload[]): TopLangsData {
  const totals: Map<string, LanguageTotal> = new Map<string, LanguageTotal>();
  for (const repo of repos) {
    for (const edge of repo.languages.edges) {
      const current: LanguageTotal = totals.get(edge.node.name) ?? {
        bytes: 0,
        color: edge.node.color,
      };
      totals.set(edge.node.name, { bytes: current.bytes + edge.size, color: current.color });
    }
  }
  const totalBytes: number = [...totals.values()].reduce(
    (sum: number, entry: LanguageTotal) => sum + entry.bytes,
    0,
  );
  const items: LanguageStat[] = [...totals.entries()]
    .map(([name, entry]): LanguageStat => ({
      bytes: entry.bytes,
      color: entry.color,
      name,
      percent: totalBytes === 0 ? 0 : (entry.bytes / totalBytes) * 100,
    }))
    .toSorted((left, right) => right.bytes - left.bytes);
  return { items, totalBytes };
}
