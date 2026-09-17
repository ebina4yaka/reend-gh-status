// Ponytail: @cloudflare/workers-types を全体で読むと bun test の expect 型と衝突するため、
// 必要な Fetcher の最小形だけここで宣言する（PRTS と同じ方針）。
declare interface Fetcher {
  fetch: (input: RequestInfo | URL) => Promise<Response>;
}
