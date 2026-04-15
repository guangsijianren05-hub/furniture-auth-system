# 家具買取管理システム（認証機能付き本番版）

エルメ（L Message）からのCSVデータを取り込んで、買取依頼をカンバン形式で管理する本番運用システムです。

**🔐 このバージョンには完全な認証・権限管理機能が含まれています。**

## 🚀 機能

### 認証・セキュリティ
- ✅ メール＋パスワード認証（Firebase Authentication）
- ✅ 権限管理（マスター/管理者/査定員/閲覧者）
- ✅ 初期マスターユーザー：kento.879301@gmail.com
- ✅ ユーザー管理画面（マスター権限のみ）
- ✅ セキュアなデータベース（Firestore Security Rules）

### 買取管理機能
- ✅ CSV一括取り込み（エルメのエクスポートデータ対応）
- ✅ カンバン形式のステータス管理（未対応/対応中/提案中/完了）
- ✅ 自動ステータス更新（担当者割当→査定金額入力→承認）
- ✅ 複数写真表示（最大5枚）
- ✅ 検索・フィルター機能
- ✅ CSVエクスポート
- ✅ データ永続化（Firestore Database）
- ✅ 変更履歴管理
- ✅ スマホ完全対応
- ✅ リアルタイム同期（複数人で同時利用可能）

## 📋 デプロイ手順

### ⚠️ 重要: Firebase設定が必要です

このシステムを動かすには、まずFirebaseの設定が必要です。

**👉 [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) を参照してください**

Firebase設定完了後、以下の手順でデプロイします。

---

### ステップ1: GitHubにアップロード

1. GitHubにログイン: https://github.com
2. 右上の「+」→「New repository」をクリック
3. リポジトリ設定:
   - Repository name: `furniture-purchase-system`
   - Public または Private を選択
   - 「Create repository」をクリック

4. ローカルでこのプロジェクトフォルダを開き、以下のコマンドを実行:

```bash
git init
git add .
git commit -m "Initial commit: 家具買取管理システム"
git branch -M main
git remote add origin https://github.com/guangsijianren05-hub/furniture-purchase-system.git
git push -u origin main
```

### ステップ2: Vercelにデプロイ

1. Vercelにアクセス: https://vercel.com
2. GitHubアカウントでサインアップ/ログイン
3. 「New Project」をクリック
4. 「Import Git Repository」から `furniture-purchase-system` を選択
5. そのまま「Deploy」をクリック

**完了！** 数分でデプロイが完了し、URLが発行されます。

例: `https://furniture-purchase-system.vercel.app`

## 🔧 ローカルで開発する場合

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開く

## 📦 本番ビルド

```bash
npm run build
npm start
```

## 💰 コスト

- GitHub: 無料
- Vercel: 無料（Hobbyプラン）
- Firebase: 無料（Sparkプラン）
- 合計: **0円/月**

## 👥 権限管理

### 4つの役割

| 役割 | 権限 |
|------|------|
| **マスター** | 全ての操作 + ユーザー管理 |
| **管理者** | 買取依頼の全操作（作成/編集/削除/承認） |
| **査定員** | 担当依頼の査定金額入力のみ |
| **閲覧者** | 閲覧のみ（編集不可） |

### 初期マスターユーザー

- メール: `kento.879301@gmail.com`
- このユーザーは削除不可
- 他のユーザーを追加・削除できる唯一のアカウント

### ユーザー追加方法

1. マスターアカウントでログイン
2. 画面右上の「ユーザー管理」をクリック
3. 「新規ユーザー追加」ボタンをクリック
4. メール、パスワード、名前、権限を入力
5. 「追加」をクリック

## 💰 コスト

詳しい使い方は「使い方ガイド.md」を参照してください。

### 基本的な流れ

1. **CSV取り込み**: エルメからCSVをダウンロード → 「CSV取込」ボタンで読み込み
2. **担当者割当**: 依頼をクリック → 担当者を選択（自動で「対応中」に）
3. **査定金額入力**: 金額を入力（自動で「提案中」に）
4. **買取承認**: チェックを入れる（自動で「完了」に）

## 🔐 セキュリティ

現在のバージョンでは、データはブラウザのLocalStorageに保存されます。

本番運用時の推奨:
- Firebase認証を追加（ログイン機能）
- Firestoreでデータ共有（複数人利用）
- 権限管理（閲覧のみ/編集可能など）

## 📞 サポート

質問や改善要望があれば、GitHubのIssuesで報告してください。

---

開発: 2026年4月
バージョン: 2.0（本番運用版）
