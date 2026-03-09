# movement-planner

行動予定（旅程や移動のスケジュール）を作成・管理するWebアプリケーション。

## 主な機能

- 旅程の作成・管理
- チケット・予算管理
- CSVデータ出力

## 技術スタック

- Frontend
  - TanStack Start
  - Tailwind CSS
  - Radix UI
- Backend / Database
  - Drizzle ORM
  - SQLite
- Tooling
  - Bun
  - Vite
  - Biome
  - (Vitest)

## セットアップ

### 前提

パッケージマネージャーとして [Bun](https://bun.sh/) を使用します。

### 手順

1. 依存関係のインストール
   ```bash
   bun install
   ```

2. 環境変数の設定
   `.env.sample` ファイルをコピーして `.env.local` を作成し、必要に応じて環境変数を設定します。
   ```bash
   cp .env.sample .env.local
   ```

3. データベースの設定
   マイグレーションを実行してデータベースを初期化します。
   ```bash
   bun run db:generate
   bun run db:migrate
   # または db:push を使用
   ```

4. 開発サーバーの起動
   ```bash
   bun run dev
   ```
   ブラウザで `http://localhost:3000` にアクセスして動作を確認します。

## ライセンス

MIT License
