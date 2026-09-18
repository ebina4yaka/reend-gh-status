/**
 * Emscripten のグルーコード向けに `location` を補う。
 *
 * satori は harfbuzzjs を使い、その wasm グルー（harfbuzzjs/hb.js）は
 * モジュール評価時に起動される。グルーの中では `WorkerGlobalScope` が
 * あると `_scriptName = self.location.href` を実行するため、workerd のように
 * WorkerGlobalScope があって location が無い環境では
 * "Cannot read properties of undefined (reading 'href')" を投げる
 * （emscripten#25892、workerd#1521）。
 *
 * 失敗は同期 throw ではなく harfbuzzjs の Promise の reject になるので、
 * 表面には最初の描画時の "satori render failed" として出る。
 * wasm は同梱のモジュールを渡すため location の値は参照されない。
 * satori を import する前に、このモジュールを副作用で読み込むこと。
 */

interface LocationLike {
  readonly href: string;
}

/** Location が無ければ補い、補った（または既存の）location を返す。 */
export function provideLocationForEmscripten(): LocationLike {
  if ("location" in globalThis) {
    return globalThis.location;
  }
  const provided: LocationLike = { href: "https://worker.invalid/" };
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: provided,
    writable: true,
  });
  return provided;
}

provideLocationForEmscripten();
