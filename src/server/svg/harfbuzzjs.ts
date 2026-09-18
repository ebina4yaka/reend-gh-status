import { Result } from "true-myth";
import createHarfBuzz from "harfbuzzjs/hb.js";
import hbjs, { type HarfbuzzApi } from "harfbuzzjs/hbjs.js";
import hbWasm from "harfbuzzjs/hb.wasm";

import { asyncResult } from "../async-result";

/**
 * Harfbuzzjs の差し替え。wrangler.toml の `[alias]` で "harfbuzzjs" を
 * このモジュールへ向ける（satori は harfbuzzjs をそのまま import する）。
 *
 * 差し替える理由は 2 つ。どちらも workerd でだけ表面化する。
 *
 * 1. 本家 index.js は hb.wasm を自分で探して読む。node では fs、ブラウザでは
 *    fetch を使うが workerd にはどちらも無い。デプロイ時に CompiledWasm として
 *    読み込まれる wasm を instantiateWasm で直接渡し、探索させない。
 * 2. Emscripten の環境判定が workerd の globals と噛み合わない。
 *    WorkerGlobalScope があるのに location が無く、nodejs_compat があるので
 *    node 分岐にも入る。判定はファクトリ呼び出しの中で同期的に走るため、
 *    その前にダミーの globals を置いておく。
 *
 * satori は本家と同じく、このモジュールの default export（Promise）を待つ。
 */

interface LocationLike {
  readonly href: string;
}

/** Worker 分岐の `_scriptName = self.location.href` を読ませるためのダミー。 */
function provideLocation(): LocationLike {
  const provided: LocationLike = { href: "https://worker.invalid/" };
  if (!("location" in globalThis)) {
    Reflect.set(globalThis, "location", provided);
  }
  return provided;
}

/** Node 分岐の `scriptDirectory = __dirname + "/"` を読ませるためのダミー。 */
function provideDirname(): string {
  const provided: string = "/";
  if (!("__dirname" in globalThis)) {
    Reflect.set(globalThis, "__dirname", provided);
  }
  return provided;
}

provideLocation();
provideDirname();

async function compileFromFile(path: string): Promise<Result<WebAssembly.Module, string>> {
  const compiled: Result<WebAssembly.Module, unknown> = await asyncResult(
    Bun.file(path)
      .arrayBuffer()
      .then((buffer) => WebAssembly.compile(buffer)),
  );
  return compiled.mapErr((error) => `harfbuzz wasm compile failed: ${String(error)}`);
}

/** 同梱の wasm を渡して HarfBuzz を初期化する。 */
async function createHarfBuzzApi(): Promise<HarfbuzzApi> {
  const loaded: Result<WebAssembly.Module, string> =
    typeof hbWasm === "string" ? await compileFromFile(hbWasm) : Result.ok(hbWasm);
  if (loaded.isErr) {
    throw new Error(loaded.error);
  }
  const wasmModule: WebAssembly.Module = loaded.value;
  const instance: unknown = await createHarfBuzz({
    instantiateWasm(
      imports: WebAssembly.Imports,
      successCallback: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void,
    ): WebAssembly.Exports {
      const created: WebAssembly.Instance = new WebAssembly.Instance(wasmModule, imports);
      successCallback(created, wasmModule);
      return created.exports;
    },
  });
  return hbjs(instance);
}

export default createHarfBuzzApi();
