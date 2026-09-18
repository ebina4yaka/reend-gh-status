import { afterEach, describe, expect, test } from "bun:test";
import { Maybe } from "true-myth";

import { provideLocationForEmscripten } from "./emscripten-location";

/**
 * Workerd は WorkerGlobalScope を定義するが location を持たない。
 * Emscripten のグルーが `self.location.href` を読んで落ちるため、
 * location を補う。既にある環境では触らない。
 */

const original: Maybe<PropertyDescriptor> = Maybe.of(
  Object.getOwnPropertyDescriptor(globalThis, "location"),
);

/** Location を消す（テスト環境の happy-dom が定義している場合がある）。 */
function removeLocation(): boolean {
  return Reflect.deleteProperty(globalThis, "location");
}

afterEach((): void => {
  if (original.isJust && removeLocation()) {
    Object.defineProperty(globalThis, "location", original.value);
  }
});

describe("provideLocationForEmscripten", () => {
  test("location が無ければ補う", () => {
    expect(removeLocation()).toBe(true);
    expect(provideLocationForEmscripten().href).toBe("https://worker.invalid/");
    expect(globalThis.location.href).toBe("https://worker.invalid/");
  });

  test("location があれば書き換えない", () => {
    removeLocation();
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      value: { href: "https://example.com/" },
    });
    expect(provideLocationForEmscripten().href).toBe("https://example.com/");
  });
});
