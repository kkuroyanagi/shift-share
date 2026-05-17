# テスト実装ガイド

## 概要
このプロジェクトでは、カレンダー機能とシフト管理システムのテストカバレッジ向上のため、Vitestベースのテスト環境を構築しました。

## テスト環境構成

### フレームワーク
- **Vitest**: 高速なViteベーステストランナー
- **Testing Library**: Reactコンポーネントテスト
- **jsdom**: ブラウザ環境シミュレーション
- **jest-dom**: DOM要素用の追加マッチャー

### 設定ファイル
```
vitest.config.ts           # Vitestメイン設定
src/test/setup.ts         # テスト環境セットアップ
src/test/utils.tsx        # テストヘルパーユーティリティ
```

## テスト構造

### 1. ユーティリティ関数テスト
```
lib/utils.test.ts         # 年度計算、時間フォーマット等
lib/year.test.ts          # 年度選択ロジック
```

### 2. UIコンポーネントテスト
```
components/ui/button.test.tsx     # ボタンコンポーネント
components/ui/card.test.tsx       # カードコンポーネント
components/year-selector.test.tsx # 年度セレクター
components/pattern-preview.test.tsx # パターンプレビュー
```

### 3. ページコンポーネントテスト
```
app/dashboard/page.test.tsx       # ダッシュボードページ
```

### 4. サーバーアクションテスト
```
app/actions/assignments.test.ts   # シフト割当アクション
```

### 5. インテグレーションテスト
```
src/test/integration/shift-workflow.test.tsx  # エンドツーエンドワークフロー
```

## NPMスクリプト

```bash
npm run test              # テスト実行
npm run test:watch        # ウォッチモードでテスト実行
npm run test:coverage     # カバレッジレポート付きテスト実行
npm run test:ui           # UIでテスト実行
npm run type-check        # TypeScript型チェック
```

## カバレッジ目標

- **ユーティリティ関数**: 95%以上
- **UIコンポーネント**: 80%以上
- **ページコンポーネント**: 70%以上
- **統合ワークフロー**: 60%以上

## テスト実行

### 基本実行
```bash
npm install  # 依存関係のインストール
npm run test # テスト実行
```

### カバレッジ確認
```bash
npm run test:coverage
```

### 継続的テスト (開発時)
```bash
npm run test:watch
```

## Pre-commitフック

`.github/hooks/pre-commit`に以下を自動実行するフックを設定：

1. テスト実行
2. Lint実行
3. 型チェック
4. カバレッジ確認

フックを有効にするには：
```bash
chmod +x .github/hooks/pre-commit
git config core.hooksPath .github/hooks
```

## テスト作成ガイドライン

### 1. ユーティリティ関数
```typescript
// 各関数の境界値と異常ケースを含む包括的テスト
describe('utilityFunction', () => {
  it('should handle normal cases', () => {});
  it('should handle edge cases', () => {});
  it('should handle error cases', () => {});
});
```

### 2. Reactコンポーネント
```typescript
// レンダリング、プロパティ、ユーザーインタラクションのテスト
describe('Component', () => {
  it('should render correctly', () => {});
  it('should handle props', () => {});
  it('should handle user interactions', () => {});
});
```

### 3. インテグレーションテスト
```typescript
// 実際のユーザーワークフローをシミュレート
describe('User Workflow', () => {
  it('should complete end-to-end task', () => {});
});
```

## モックとスタブ

### Next.jsモジュール
```typescript
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}));
```

### データベース
```typescript
vi.mock('@/lib/db', () => ({
  db: mockDbQuery
}));
```

## トラブルシューティング

### 一般的な問題

1. **import エラー**: `vitest.config.ts`のパスエイリアス設定確認
2. **DOM関連エラー**: `jsdom`環境設定とsetupファイル確認
3. **非同期テストタイムアウト**: `waitFor`や適切な`await`使用

### デバッグ

```bash
npm run test:ui     # ブラウザUIでテスト状況確認
npm run test -- --reporter=verbose  # 詳細レポート
```

## 今後の拡張

1. **E2Eテスト**: Playwrightを追加検討
2. **ビジュアル回帰テスト**: Chromatic/Storybookとの統合
3. **パフォーマンステスト**: 大量データでのレンダリング性能測定
4. **アクセシビリティテスト**: axe-coreとの統合

このテスト環境により、安定したカレンダー機能とシフト管理システムの継続的な品質向上を実現します。