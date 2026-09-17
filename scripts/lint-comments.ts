/**
 * コードコメント抽出 → textlint 実行スクリプト。
 *
 * textlint は md/txt 用のため、TS ソースからコメントだけを抜き出し、
 * 行番号を保ったまま仮想テキストとして textlint の Node API に渡す。
 * 抽出は正規表現でなく簡易スキャナで行う（文字列リテラル内の `//` を
 * 誤検出しないため。TS7 は JS API を提供しないので自前）。
 * ponytail: 正規表現リテラルの判定は「前置トークン」のヒューリスティック。
 * 誤判定したら lexer ライブラリへの置き換えを検討する。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { createLinter, loadLinterFormatter, loadTextlintrc } from "textlint";
import type { TextlintResult } from "@textlint/kernel";

const ROOTS = ["src", "scripts"];
const EXTS = new Set([".ts", ".tsx"]);

// Lint 指示コメント（oxlint-disable 等は自然文でないため対象外）。
const DIRECTIVE = /^\s*(?:oxlint|eslint|tslint|biome|prettier)[-_ ]*(?:disable|ignore)/;

// コメントは短い断片が多いので、文書向けの「文」単位ルールは判定不能で
// ノイズになる。コメントでは構造系（助詞・長さ・AI 文体）だけを見る。
// AI ガイドライン（ai-tech-writing-guideline）は文書全体の一貫性分析のため、
// 仮想テキストの集合には意味がなく除外する。
// Ponytail: メッセージフィルタ方式。プリセットの絞り込みが必要になったら
// Descriptor をクローンして Rules を差し替える。
const COMMENT_EXCLUDED_RULES = new Set([
  "ja-no-mixed-period",
  "no-unmatched-pair",
  "max-kanji-continuous-len",
  "arabic-kanji-numbers",
  "ai-tech-writing-guideline",
]);

interface CommentRange {
  startLine: number;
  endLine: number;
  text: string;
}

/** 前置トークンから正規表現リテラルか否かを推定する（式の開始位置なら regex）。 */
function regexAllowedBefore(prev: string): boolean {
  if (prev === "") {
    return true;
  }
  const ch = prev[prev.length - 1] ?? "";
  if ("([{;,:=!&|?+-*%~^<>".includes(ch)) {
    return true;
  }
  // 直前が演算子や開き括弧なら式の開始位置。単語の直後は識別子/除算の可能性。
  const word = prev.match(/(?<word>[A-Za-z_$]+)$/);
  if (word) {
    return [
      "return",
      "typeof",
      "instanceof",
      "in",
      "of",
      "new",
      "delete",
      "void",
      "case",
      "do",
      "else",
      "yield",
      "await",
    ].includes(word.groups?.word ?? "");
  }
  // `)` や `]` や `}` の直後は除算が自然（(a) / b）。識別子以外の記号の直後は式の開始。
  return false;
}

/** ソースからコメント（行番号と本文）を抽出する。 */
export function extractComments(source: string): CommentRange[] {
  const comments: CommentRange[] = [];
  const lineStarts: number[] = [0];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === "\n") {
      lineStarts.push(i + 1);
    }
  }
  const lineOf = (pos: number): number => {
    // 二分探索で pos を含む行番号を求める。
    const search = (lo: number, hi: number): number => {
      if (lo >= hi) {
        return lo;
      }
      const mid = (lo + hi + 1) >> 1;
      return (lineStarts[mid] ?? 0) <= pos ? search(mid, hi) : search(lo, mid - 1);
    };
    return search(0, lineStarts.length - 1);
  };

  let i = 0;
  let prevSig = ""; // 直前の意味のある文字列（regex 判定用）
  const n = source.length;
  while (i < n) {
    const ch: string = source[i] ?? "";
    const next: string = source[i + 1] ?? "";
    if (ch === "/" && next === "/") {
      const start = i;
      const nlPos: number = source.indexOf("\n", i);
      const end: number = nlPos === -1 ? n : nlPos;
      comments.push({
        endLine: lineOf(end - 1),
        startLine: lineOf(start),
        text: source.slice(start + 2, end).replace(/\s+$/, ""),
      });
      i = end;
      continue;
    }
    if (ch === "/" && next === "*") {
      const start = i;
      const closePos: number = source.indexOf("*/", i + 2);
      const end: number = closePos === -1 ? n : closePos + 2;
      comments.push({
        endLine: lineOf(end - 1),
        startLine: lineOf(start),
        text: source.slice(start + 2, end - 2),
      });
      i = end;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      // 文字列/テンプレートをスキップ（${} のネスト対応）。
      const quote = ch;
      i++;
      let depth = 0; // ${} 内にいるフラグ（template のみ）
      while (i < n) {
        const c: string = source[i] ?? "";
        if (c === "\\") {
          i += 2;
          continue;
        }
        if (quote === "`") {
          if (c === "$" && source[i + 1] === "{") {
            depth++;
            i += 2;
            continue;
          }
          if (c === "}" && depth > 0) {
            depth--;
            i++;
            continue;
          }
        }
        if (c === quote && depth === 0) {
          i++;
          break;
        }
        prevSig = c === "\n" ? prevSig : prevSig + c;
        i++;
      }
      continue;
    }
    if (ch === "/" && regexAllowedBefore(prevSig.replace(/\s+$/, ""))) {
      // 正規表現リテラルをスキップ（`//` や `/*` を誤ってコメント扱いしないため）。
      const start = i;
      i++;
      let inClass = false;
      let closed = false;
      while (i < n) {
        const c: string = source[i] ?? "";
        if (c === "\\") {
          i += 2;
          continue;
        }
        if (c === "\n") {
          break; // 改行をまたぐのは regex でない → 除算だった
        }
        if (c === "[") {
          inClass = true;
        } else if (c === "]") {
          inClass = false;
        } else if (c === "/" && !inClass) {
          closed = true;
          i++;
          // Flags
          while (i < n && /[a-z]/i.test(source[i] ?? "")) {
            i++;
          }
          break;
        }
        i++;
      }
      if (!closed) {
        i = start + 1; // Regex でなかった → 1 文字進めてやり直し
        prevSig += "/";
      }
      prevSig = "/";
      continue;
    }
    if (!/\s/.test(ch)) {
      // 単語の連続を保持する（regex 判定の return/typeof 等のため）。
      prevSig =
        /[A-Za-z0-9_$]/.test(ch) && /[A-Za-z0-9_$]/.test(prevSig.slice(-1)) ? prevSig + ch : ch;
    }
    i++;
  }
  return comments;
}

/** コメント本文からマーカー（//, /*, *, *\/）を取り除く。 */
function stripMarkers(text: string): string {
  const lines = text.split("\n");
  return lines
    .map((line, index) => {
      let t = line.trimStart();
      if (index === 0) {
        t = t.replace(/^\/\*+/, "");
      }
      if (index === lines.length - 1) {
        t = t.replace(/\*+\/\s*$/, "");
      }
      if (lines.length > 1 && index > 0) {
        t = t.replace(/^\*+ ?/, "");
      }
      return t.trimEnd();
    })
    .join("\n");
}

function collectFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectFiles(full, out);
    } else if (EXTS.has(entry.slice(entry.lastIndexOf("."))) && !entry.endsWith(".gen.ts")) {
      out.push(full);
    }
  }
  return out;
}

const files = ROOTS.flatMap((root) => collectFiles(root)).toSorted();
const descriptor = await loadTextlintrc();
const linter = createLinter({ descriptor });
const formatter = await loadLinterFormatter({ formatterName: "stylish" });

const results: TextlintResult[] = [];
let errorCount = 0;
for (const file of files) {
  const source = readFileSync(file, "utf8");
  const comments = extractComments(source).filter((c) => !DIRECTIVE.test(stripMarkers(c.text)));
  if (comments.length === 0) {
    continue;
  }
  const lines = source.split("\n").map(() => "");
  for (const c of comments) {
    const body = stripMarkers(c.text).split("\n");
    for (let k = 0; k < body.length; k++) {
      lines[c.startLine + k] = body[k] ?? "";
    }
  }
  const result = await linter.lintText(lines.join("\n"), `${file}.txt`);
  const messages = result.messages.filter(
    (m) => !COMMENT_EXCLUDED_RULES.has(m.ruleId.split("/").pop() ?? ""),
  );
  if (messages.length > 0) {
    errorCount += messages.filter((m) => m.severity >= 2).length;
    results.push({ filePath: relative(process.cwd(), file), messages });
  }
}

if (results.length > 0) {
  console.log(formatter.format(results));
  console.error(`✖ ${errorCount} comment problems in ${results.length} files`);
  process.exit(1);
}
console.log(`✓ ${files.length} files' comments are clean`);
