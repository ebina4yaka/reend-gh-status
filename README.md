# reend-gh-status

HUD 風の GitHub 統計ツール。ダッシュボードと README 埋め込み用 SVG カードを同じコードベースで提供する。

| レイヤー | 技術                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------- |
| Frontend | React 19 + React Compiler + TanStack Router（ファイルベース）+ Tailwind CSS v4 + ReEnd Components |
| Backend  | ElysiaJS on Bun（開発）/ Cloudflare Workers（本番）                                               |
| カード   | satori（standalone）+ 共有カード部品（ブラウザ表示と SVG 生成で同じ JSX を使う）                  |
| 言語規約 | true-myth (`Maybe` / `Result`) / ts-pattern / valibot / oxlint（JS プラグイン含む）+ oxfmt        |
| API 連携 | Eden Treaty（ダッシュボードは HTTP QUERY、README 用 SVG だけ GET）                                |
| 秘密情報 | dotenvx（`.env.local`、gitignore 済み）/ `wrangler secret`                                        |

## セットアップ

```sh
bun install
cp .env.example .env.local   # GITHUB_USERNAME と GITHUB_TOKEN を記入
bun run dev                  # api (:3001) と web (:5173) を同時起動
```

トークンには classic PAT の `read:user` を推奨する。fine-grained token では非公開コントリビューションの件数が取れない。

## 環境変数

| 名前              | 設定場所                         | 用途                                                  |
| ----------------- | -------------------------------- | ----------------------------------------------------- |
| `GITHUB_USERNAME` | `.env.local` / `[vars]`          | 表示対象のログイン名。固定運用                        |
| `GITHUB_TOKEN`    | `.env.local` / `wrangler secret` | GraphQL と REST の呼び出し                            |
| `INCLUDE_PRIVATE` | `.env.local` / `[vars]`          | `true` のとき非公開リポジトリのコミットを合計に含める |

## 構成

```
src/
├── cards/     # satori 互換の共有カード部品（tokens / frame / primitives / 5 種のカード）
├── routes/    # TanStack Router のファイルベースルート
├── server/    # Elysia アプリ（GitHub クライアント、ドメイン計算、SVG 生成）
└── shared/    # クライアントとサーバーで共用する型とスキーマ
```

データは `/api/snapshot` が 1 回でまとめて返す。サーバーは GitHub へ GraphQL 1 回と公開イベント 1 回を投げ、Cache API に 10 分載せる。カードは `/card/:type` が同じ共有部品から SVG を生成する。

## README への埋め込み

```md
[![GitHub stats](https://<host>/card/stats?theme=dark&accent=yellow)](https://github.com/<username>)
```

ダークとライトを OS 設定で出し分ける場合は `<picture>` を使う。

```html
<picture>
  <source srcset="https://<host>/card/stats?theme=dark" media="(prefers-color-scheme: dark)" />
  <img src="https://<host>/card/stats?theme=light" alt="GitHub stats" />
</picture>
```

`/export` ページが URL とタグを生成するので、コピーして貼るだけでよい。カード種別は `stats`、`top-langs`、`contributions`、`activity`、`repos` の 5 つ。`top-langs` は `layout=donut`（既定）と `layout=bars` を切り替えられる。

## コマンド

```sh
bun run dev            # api + web
bun run check          # 型チェック (tsc --noEmit)
bun run lint           # oxlint（ネイティブルール + 独自 JS プラグイン）
bun run lint:text      # README とコードコメントの日本語検査
bun run fmt            # oxfmt
bun run knip           # 未使用の export / 依存
bun test               # ユニットテスト
bun run build          # フロントエンドのビルド
bun run build:worker   # Workers 向けバンドルの検証（wrangler deploy --dry-run）
bun run storybook      # カードカタログ (:6006)
bun run deploy         # Cloudflare Workers へデプロイ
```

## 規約

PRTS の規約をそのまま使う。lint で強制されるため、違反はコミット前に止まる。

- 値の欠落は `Maybe`、エラーは `Result`（true-myth）で表す。`null` と `undefined` は禁止
- `switch` の代わりに ts-pattern の `match` を使う
- `let` は禁止。派生値は `map` / `filter` / `reduce` で作る
- 読み取りは HTTP QUERY を使う。`/card/*` だけ GET を許す（GitHub の camo は GET しか送れない）
- `useEffect` は禁止。外部システムとの同期だけ例外
- 型アサーション（`as`）は禁止。外部 API の応答は valibot で検証する
- コメントも日本語の文章ルールで検査する

## デプロイ

```sh
wrangler secret put GITHUB_TOKEN   # PAT を Worker に隠す
bun run deploy
```

`wrangler.toml` の `[vars]` に `GITHUB_USERNAME` と `INCLUDE_PRIVATE` を書く。`main` へ push すると CI が fmt / lint / textlint / tsc / knip / test を実行する。通過後は deploy ジョブが Worker を更新する。そのためには `CLOUDFLARE_API_TOKEN` と `GH_STATS_TOKEN` をリポジトリのシークレットに設定しておく。

## 非公開コントリビューションの扱い

`INCLUDE_PRIVATE=true` にすると、非公開リポジトリでのコミット数が統計へ加算される。値は Worker 側で合算し、ブラウザへは合計だけを返す。公開リポジトリの README から参照する場合は既定の `false` のままにしておく。

## フォント

カードは Orbitron、JetBrains Mono、Noto Sans JP を使う。Latin の 2 書体は `public/fonts/` の TTF を satori へ渡し、日本語は Google Fonts のサブセットを実行時に取得する。ライセンスは `public/fonts/LICENSES.md` を参照。
