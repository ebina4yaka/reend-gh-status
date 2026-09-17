import { Result } from "true-myth";
import yogaWasm from "satori/yoga.wasm";

import { asyncResult } from "../async-result";

/**
 * Satori の standalone ビルドへ渡す Yoga の wasm モジュール。
 *
 * Cloudflare Workers は実行時の wasm コンパイルを禁じるため、wrangler が
 * `CompiledWasm` として読み込んだ静的モジュールをそのまま使う。
 * Bun 開発サーバーでは `.wasm` の import がファイルパス文字列になるので、
 * その場合だけ実行時にコンパイルする（Bun は実行時コンパイルを許可する）。
 */

const cache: { loaded: boolean; module: Result<WebAssembly.Module, string> } = {
  loaded: false,
  module: Result.err("yoga wasm not loaded"),
};

async function compileFromFile(path: string): Promise<Result<WebAssembly.Module, string>> {
  const compiled: Result<WebAssembly.Module, unknown> = await asyncResult(
    Bun.file(path)
      .arrayBuffer()
      .then((buffer) => WebAssembly.compile(buffer)),
  );
  return compiled.mapErr((error) => `yoga wasm compile failed: ${String(error)}`);
}

export async function loadYoga(): Promise<Result<WebAssembly.Module, string>> {
  if (cache.loaded) {
    return cache.module;
  }
  const loaded: Result<WebAssembly.Module, string> =
    typeof yogaWasm === "string" ? await compileFromFile(yogaWasm) : Result.ok(yogaWasm);
  cache.loaded = true;
  cache.module = loaded;
  return loaded;
}
