import { Result } from "true-myth";

/**
 * True-myth 9 に async 版 tryOr が無いため、Promise の then 分岐で Result に
 * 畳む。try/catch の代わりに失敗を Result でモデル化する境界で使う。
 */
export function asyncResult<T>(promise: Promise<T>): Promise<Result<T, unknown>> {
  return promise.then(
    (value) => Result.ok(value),
    (error) => Result.err(error),
  );
}
