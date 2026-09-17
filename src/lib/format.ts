/** 数値表示の共有フォーマッタ。 */

const NUMBER: Intl.NumberFormat = new Intl.NumberFormat("en-US");

/** 12345 → "12,345"。 */
export function formatNumber(value: number): string {
  return NUMBER.format(value);
}

/** 大きい数は桁を落として読みやすくする（12345 → "12.3K"）。 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 10_000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return NUMBER.format(value);
}

/** ISO 8601 → "2026-09-10"。空文字はそのまま返す。 */
export function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

/** カードのキャプション（"SYNC 2026-09-17 18:00"）。 */
export function formatSyncCaption(iso: string): string {
  return `SYNC ${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

/** バイト数を KB / MB 表記にする。 */
export function formatBytes(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} MB`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} KB`;
  }
  return `${String(value)} B`;
}
