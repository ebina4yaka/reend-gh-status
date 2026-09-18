/**
 * コードコメント抽出 → textlint 実行スクリプト。
 *
 * textlint は md/txt 用のため、TS ソースからコメントだけを抜き出し、
 * 行番号を保ったまま仮想テキストとして textlint の Node API に渡す。
 * 抽出は oxc-parser に任せる。oxlint と同じパーサーなので、文字列リテラルや
 * 正規表現の中の `//` をコメントと誤検出しない。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import type { TextlintMessage, TextlintResult } from "@textlint/kernel";
import { parseSync } from "oxc-parser";
import { createLinter, loadLinterFormatter, loadTextlintrc } from "textlint";

const ROOTS: readonly string[] = ["src", "scripts"];
const EXTS: ReadonlySet<string> = new Set([".ts", ".tsx"]);

// Lint 指示コメント（oxlint-disable 等は自然文でないため対象外）。
const DIRECTIVE: RegExp = /^\s*(?:oxlint|eslint|tslint|biome|prettier)[-_ ]*(?:disable|ignore)/;

// コメントは短い断片が多いので、文書向けの「文」単位ルールは判定不能で
// ノイズになる。コメントでは構造系（助詞・長さ・AI 文体）だけを見る。
// AI ガイドライン（ai-tech-writing-guideline）は文書全体の一貫性分析のため、
// 仮想テキストの集合には意味がなく除外する。
// Ponytail: メッセージフィルタ方式。プリセットの絞り込みが必要になったら
// Descriptor をクローンして Rules を差し替える。
const COMMENT_EXCLUDED_RULES: ReadonlySet<string> = new Set([
  "ja-no-mixed-period",
  "no-unmatched-pair",
  "max-kanji-continuous-len",
  "arabic-kanji-numbers",
  "ai-tech-writing-guideline",
]);

interface CommentRange {
  readonly startLine: number;
  readonly text: string;
}

/** JSDoc ブロックの行頭 `*` と行末の空白を落とす。 */
function stripMarkers(text: string): string {
  return text
    .split("\n")
    .map((line, index) => {
      const trimmed: string = line.trimStart();
      return (index === 0 ? trimmed : trimmed.replace(/^\*+ ?/, "")).trimEnd();
    })
    .join("\n");
}

/** Pos が何行目かを求める（1 始まり）。 */
function lineOf(source: string, pos: number): number {
  return source.slice(0, pos).split("\n").length;
}

/** ソースからコメント（行番号と本文）を抽出する。 */
function extractComments(source: string, fileName: string): readonly CommentRange[] {
  return parseSync(fileName, source).comments.map((comment) => ({
    startLine: lineOf(source, comment.start),
    text: stripMarkers(comment.value),
  }));
}

function collectFiles(dir: string, out: string[] = []): readonly string[] {
  for (const entry of readdirSync(dir)) {
    const full: string = join(dir, entry);
    const st: ReturnType<typeof statSync> = statSync(full);
    if (st.isDirectory()) {
      collectFiles(full, out);
    } else if (EXTS.has(entry.slice(entry.lastIndexOf("."))) && !entry.endsWith(".gen.ts")) {
      out.push(full);
    }
  }
  return out;
}

/** コメント行だけを残した仮想テキスト（他の行は空行にして行番号を保つ）。 */
function virtualTextOf(file: string): string {
  const source: string = readFileSync(file, "utf8");
  const comments: readonly CommentRange[] = extractComments(source, file).filter(
    (comment): boolean => !DIRECTIVE.test(comment.text),
  );
  const lines: string[] = source.split("\n").map(() => "");
  for (const comment of comments) {
    comment.text.split("\n").forEach((line, index) => {
      lines[comment.startLine + index] = line;
    });
  }
  return lines.join("\n");
}

const files: readonly string[] = ROOTS.flatMap((root) => collectFiles(root)).toSorted();
const descriptor = await loadTextlintrc();
const linter = createLinter({ descriptor });
const formatter = await loadLinterFormatter({ formatterName: "stylish" });

const reports: TextlintResult[] = [];
// Textlint の linter を使い回すため逐次で回す（並列にすると実行順が混ざる）。
for (const file of files) {
  const result: TextlintResult = await linter.lintText(virtualTextOf(file), `${file}.txt`);
  const messages: TextlintMessage[] = result.messages.filter(
    (message): boolean => !COMMENT_EXCLUDED_RULES.has(ruleNameOf(message)),
  );
  if (messages.length > 0) {
    reports.push({ filePath: file, messages });
  }
}

/** ルール ID からプリセット接頭辞を落とす（"preset/rule" → "rule"）。 */
function ruleNameOf(message: TextlintMessage): string {
  return message.ruleId.split("/").pop() ?? "";
}

if (reports.length > 0) {
  console.log(formatter.format(reports));
  const errorCount: number = reports.reduce(
    (sum: number, report: TextlintResult): number =>
      sum + report.messages.filter((message): boolean => message.severity >= 2).length,
    0,
  );
  console.error(`✖ ${String(errorCount)} comment problems in ${String(reports.length)} files`);
  process.exit(1);
}
console.log(`✓ ${String(files.length)} files' comments are clean`);
