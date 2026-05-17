# Shift Share

管理者と従業員が協力してシフトを作成するウェブサービス。  
各従業員の「希望勤務時間との乖離」が均等になるよう調整しやすくすることを目的とする。

## 機能概要

- **従業員参加型シフト作成** — 希望日時の提出とオープン枠への直接応募
- **定期パターン登録** — 曜日・時間・希望度の組み合わせを定期パターンとして登録し、期間指定で一括適用
- **公平性ダッシュボード** — 希望時間との乖離を全員分一覧表示・標準偏差で公平性を数値化
- **年度管理** — 4/1〜翌3/31 を1年度として管理
- **シフト自動生成** — 曜日パターン（テンプレート）と営業日設定から年度分を一括生成
- **認証なし** — 従業員は名前選択のみ、管理者は `/admin` URL でアクセス

## 技術スタック

| 領域 | 採用技術 |
|---|---|
| フレームワーク | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui |
| ORM | Drizzle ORM |
| データベース | PostgreSQL |
| バリデーション | Zod |

## セットアップ

### 前提条件

- Node.js 20 以上
- PostgreSQL データベース（[Neon](https://neon.tech) / [Supabase](https://supabase.com) / ローカル）

### インストール

```bash
# 依存パッケージのインストール
npm install

# 環境変数の設定
cp .env.local.example .env.local
# .env.local を編集して DATABASE_URL を設定
```

**.env.local の例:**
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### データベースのセットアップ

```bash
# テーブルを作成
npm run db:push
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

## 使い方

### 初回セットアップ（管理者）

1. `/admin/workers` — 従業員を追加（名前・月間希望時間）
2. `/admin/fiscal-years` — 年度を作成
3. `/admin/fiscal-years/[year]/business-days` — 営業曜日と休業日を設定
4. `/admin/fiscal-years/[year]/templates` — シフトテンプレートを追加し「一括生成」を実行
5. `/admin/shifts` — 生成されたシフト枠を確認・調整

### 日常運用

| 操作 | URL | ロール |
|---|---|---|
| 名前選択 | `/` | 従業員 |
| シフト確認・応募 | `/worker/[id]` | 従業員 |
| 希望日時の提出（個別） | `/worker/[id]/availability` | 従業員 |
| 定期パターンの登録 | `/worker/[id]/recurring-availability` | 従業員 |
| 希望時間の設定 | `/worker/[id]/settings` | 従業員 |
| ダッシュボード | `/dashboard` | 全員 |
| シフト割当・確定 | `/admin/shifts/[id]` | 管理者 |

### 公平性の考え方

本サービスの「公平」とは絶対的な勤務時間ではなく、**希望時間との乖離が全員で均等**であることを指す。

```
乖離 = 割当時間 − 希望時間
公平性スコア = 全員の乖離の標準偏差（ゼロに近いほど公平）
```

ダッシュボードでは乖離率 ±20% 超の従業員をハイライト表示する。

## 開発用コマンド

```bash
npm run dev          # 開発サーバー起動（Turbopack）
npm run build        # 本番ビルド
npm run db:push      # スキーマをDBに反映
npm run db:studio    # Drizzle Studio でDB確認
npm run db:generate  # マイグレーションファイル生成
npm run db:migrate   # マイグレーション実行
npm run lint         # ESLint
```

## データモデル

```
fiscal_years                     年度
business_day_rules               営業曜日（年度ごと）
closed_dates                     休業日（祝日・臨時休業）
shift_templates                  シフトテンプレート（繰り返しパターン）
workers                          従業員（認証なし・名前のみ）
shift_slots                      シフト枠（テンプレート展開 or 個別作成）
availabilities                   希望提出
shift_assignments                割当
recurring_availability_patterns  定期パターン（曜日・時間・希望度）
recurring_pattern_applications   定期パターン適用履歴
```

## 将来対応（スコープ外）

- 認証（ログイン・パスワード管理）
- シフトの自動最適化
- メール・プッシュ通知
- 複数店舗・部署の管理
- 給与計算連携
