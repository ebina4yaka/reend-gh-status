import { Maybe } from "true-myth";

/**
 * Workers の binding と secrets。`wrangler.toml` の `[vars]` と
 * `wrangler secret put` で設定する。Bun 開発時は process.env を読む。
 */
export interface WorkerEnv {
  ASSETS?: Fetcher;
  GITHUB_TOKEN?: string;
  GITHUB_USERNAME?: string;
  INCLUDE_PRIVATE?: string;
}

interface EnvHolder {
  env?: WorkerEnv;
}

/** リクエスト毎に binding を差し込む（Elysia の CloudflareAdapter は env を渡さない）。 */
export function setWorkerEnv(env: WorkerEnv): WorkerEnv {
  (globalThis as EnvHolder).env = env;
  return env;
}

function readWorkerEnv(): WorkerEnv {
  return (globalThis as EnvHolder).env ?? {};
}

type StringEnvKey = "GITHUB_TOKEN" | "GITHUB_USERNAME" | "INCLUDE_PRIVATE";

function readValue(name: StringEnvKey): Maybe<string> {
  const fromProcess: string = process.env[name] ?? "";
  const fromWorker: string = readWorkerEnv()[name] ?? "";
  const value: string = fromProcess !== "" ? fromProcess : fromWorker;
  return value === "" ? Maybe.nothing<string>() : Maybe.just(value);
}

/** GitHub PAT。未設定なら公開 API 相当の低いレート制限で動く。 */
export function getGithubToken(): Maybe<string> {
  return readValue("GITHUB_TOKEN");
}

/** 表示対象のログイン名。固定運用なので、これが無いと API は 503 を返す。 */
export function getGithubUsername(): Maybe<string> {
  return readValue("GITHUB_USERNAME");
}

/** 非公開リポジトリのコントリビューションを合計に含めるか。既定は false。 */
export function includePrivateContributions(): boolean {
  return readValue("INCLUDE_PRIVATE").unwrapOr("false") === "true";
}

/** 静的アセット binding（フォント読み込みに使う）。Workers 本番のみ存在する。 */
export function getAssets(): Maybe<Fetcher> {
  return Maybe.of(readWorkerEnv().ASSETS);
}
