import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
    perf: "error",
    style: "error",
    suspicious: "error",
  },
  ignorePatterns: ["src/routeTree.gen.ts"],
  jsPlugins: ["./oxlint-plugin.ts"],
  overrides: [
    {
      // 設定ファイル自身はスタイルルール対象外（PRTS と同じ扱い。
      // ignorePatterns だと pre-commit フックの明示指定時に exit 1 になるため override で無効化）
      files: ["oxlint.config.ts"],
      rules: {
        "capitalized-comments": "off",
        "sort-keys": "off",
      },
    },
    {
      // ルール定義ファイル自身は AST 内省のため副作用専用の void 関数が多い。
      files: ["oxlint-plugin.ts"],
      rules: {
        "project/ban-type-assertion": "off",
        "project/no-void-return": "off",
      },
    },
    {
      // Storybook pins beforeEach/play to `... | void` unions (like React's Destructor),
      // so story wiring and test-double setters cannot return a value.
      files: ["**/*.stories.tsx", ".storybook/preview.tsx", ".storybook/mocks/**"],
      rules: {
        "project/no-void-return": "off",
      },
    },
    {
      files: ["**/server/**"],
      rules: {
        // Server-side fetch is allowed (GitHub API calls, font fetching).
        "project/no-fetch": "off",
        // Server parses untrusted external payloads (GitHub GraphQL/REST);
        // narrowing `unknown` to a domain type needs `as`, which the ban forbids.
        "project/ban-type-assertion": "off",
        // Express 専用ルール（Express は rejected promise を自動処理しない）。
        // 本プロジェクトのサーバーは Elysia で、全ルートハンドラが async なため無効化。
        "oxc/no-async-endpoint-handlers": "off",
      },
    },
    {
      // Comment-extraction scanner is inherently imperative (char-by-char scan
      // with loop indices and multi-state skipping); forcing it into the
      // declarative style would obscure the tokenizer logic.
      files: ["scripts/lint-comments.ts"],
      rules: {
        "project/ban-let": "off",
        "id-length": "off",
        "no-continue": "off",
        "func-style": "off",
        "project/cognitive-complexity": "off",
        // 型注釈の一貫性よりもスキャナの見通しを優先（認証境界等ではない）。
        "project/require-const-type-annotation": "off",
        "eslint/no-await-in-loop": "off",
      },
    },
    {
      // カード部品は satori とブラウザの両方で同じ JSX を描くため、
      // スタイルをインラインのオブジェクトリテラルで組み立てる。
      // 大きな style オブジェクトは入れ子が深くなりやすい。
      files: ["src/cards/**"],
      rules: {
        "unicorn/max-nested-calls": "off",
      },
    },
    {
      // フォントは 5 ファイルだけなので逐次で読む（失敗したファイル名を
      // そのまま返せる）。Promise.all にすると失敗箇所の特定が遠くなる。
      files: ["src/server/svg/fonts.ts"],
      rules: {
        "eslint/no-await-in-loop": "off",
      },
    },
    {
      // Test doubles must cast onto globals like `globalThis.fetch`, which requires
      // `as` (no clean type-guard alternative). The ban applies to project source.
      // テストの afterEach / cleanup は値を返さないのが自然なため void 戻り値も許可する。
      files: ["**/*.test.ts", "**/*.test.tsx"],
      rules: {
        "project/ban-type-assertion": "off",
        "project/no-void-return": "off",
      },
    },
  ],
  plugins: ["typescript", "unicorn", "oxc", "react"],
  rules: {
    "project/ban-switch": "error",
    "project/cognitive-complexity": "error",
    "project/ban-try-catch": "error",
    "project/ban-let": "error",
    "project/no-fetch": "error",
    "project/ban-eden-fetch": "error",
    "project/ban-type-assertion": "error",
    "project/no-use-effect": "error",
    "project/no-void-return": "error",

    "react/rules-of-hooks": "error",
    "react/exhaustive-deps": "error",
    // JSX uses the automatic runtime (tsconfig jsx: react-jsx)
    "react/react-in-jsx-scope": "off",
    // false positive on JSX returned from ts-pattern match branches
    "react/no-unstable-nested-components": "off",
    // reend-components spreads props by design
    "react/jsx-props-no-spreading": "off",

    "no-undefined": "error",
    "unicorn/no-null": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-restricted-types": [
      "error",
      {
        types: {
          null: "null is banned. Model absence with Maybe (true-myth) or a discriminated union.",
          undefined:
            "undefined is banned. Model absence with Maybe (true-myth) or a discriminated union.",
        },
      },
    ],
    "typescript/no-non-null-assertion": "error",
    "typescript/explicit-function-return-type": "error",
    // Explicit type annotations on consts are required project-wide, so the
    // default "trivially inferable" warning directly contradicts that rule.
    "typescript/no-inferrable-types": "off",

    "project/require-const-type-annotation": "error",

    // --- style category tuning ---
    // function declarations (matches reend-components style)
    "func-style": ["error", "declaration"],
    // HTTP status codes, canvas coordinates, ms constants, etc. are idiomatic
    // as literals; naming every one is pure noise.
    "no-magic-numbers": "off",
    // React components and route handlers are naturally long by statement count.
    "max-statements": "off",
    // react-easy-crop's Point API mandates { x, y }; single-letter generics are idiomatic.
    "id-length": ["error", { checkGeneric: false, exceptions: ["x", "y"] }],
    // member order within an import is enforced; statement order is left free
    "sort-imports": ["error", { ignoreDeclarationSort: true }],
    // uppercase factory functions without `new` are idiomatic (t.Object, Maybe.just)
    "new-cap": "off",
    // one declaration per line keeps React hooks readable
    "one-var": "off",
    "no-ternary": "off",
    // declarative builders nest calls legitimately (satori trees, ts-pattern)
    "unicorn/max-nested-calls": "off",
    // declarative UI nests JSX legitimately (Card > CardBody > form > …)
    "react/jsx-max-depth": "off",
  },
});
