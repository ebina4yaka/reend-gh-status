/**
 * Harfbuzzjs（satori がテキスト整形に使う）は型を同梱しない。
 * 差し替えモジュールが使う範囲だけ宣言する。
 */

declare module "harfbuzzjs/hb.js" {
  export interface EmscriptenModuleOptions {
    /**
     * Wasm の instantiate を差し替える。指定すると Emscripten は
     * ファイル/URL からの読み込みを行わない。
     */
    readonly instantiateWasm?: (
      imports: WebAssembly.Imports,
      successCallback: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void,
    ) => WebAssembly.Exports;
  }

  /** Emscripten のモジュールファクトリ。 */
  export default function createHarfBuzz(options: EmscriptenModuleOptions): Promise<unknown>;
}

declare module "harfbuzzjs/hbjs.js" {
  /** Hbjs が返す API のうち、satori が使う入り口。 */
  export interface HarfbuzzApi {
    readonly createBlob: (data: Uint8Array) => unknown;
    readonly createBuffer: () => unknown;
    readonly createFace: (blob: unknown, index: number) => unknown;
    readonly createFont: (face: unknown) => unknown;
  }

  /** Emscripten のインスタンスを hbjs の API で包む。 */
  export default function hbjs(instance: unknown): HarfbuzzApi;
}
