# デプロイ手順書（完全版）

このファイルは、技術的な知識がない方でもGitHubとVercelにデプロイできるように、詳しく説明します。

---

## 📋 必要なもの

1. **GitHubアカウント** - 持っている ✅
2. **Vercelアカウント** - これから作成
3. **このプロジェクトフォルダ** - ダウンロード済み

---

## 🚀 手順1: GitHubにアップロード（2つの方法）

### 方法A: GitHub Desktopを使う（超簡単・推奨）

#### 1-A-1: GitHub Desktopをインストール

https://desktop.github.com/ からダウンロード&インストール

#### 1-A-2: GitHub Desktopでログイン

アプリを開く → GitHubアカウントでサインイン

#### 1-A-3: リポジトリを作成

1. 「File」→「New Repository」
2. 名前: `furniture-purchase-system`
3. Local Path: このプロジェクトフォルダを選択
4. 「Create Repository」をクリック

#### 1-A-4: GitHubに公開

1. 「Publish repository」をクリック
2. Public または Private を選択
3. 「Publish Repository」をクリック

**完了！** GitHubにアップロードされました。

---

### 方法B: ブラウザで直接アップロード（技術的）

#### 1-B-1: 新規リポジトリ作成

1. https://github.com にアクセス
2. 右上の「+」→「New repository」
3. 名前: `furniture-purchase-system`
4. 「Create repository」をクリック

#### 1-B-2: ファイルをアップロード

1. 「uploading an existing file」をクリック
2. プロジェクトフォルダの中身を全部ドラッグ&ドロップ
3. 「Commit changes」をクリック

**完了！** GitHubにアップロードされました。

---

## 🌐 手順2: Vercelでデプロイ

### 2-1: Vercelアカウント作成

1. https://vercel.com にアクセス
2. 「Sign Up」をクリック
3. 「Continue with GitHub」を選択
4. GitHubアカウントで連携

### 2-2: プロジェクトをインポート

1. Vercelのダッシュボードで「Add New...」→「Project」
2. 「Import Git Repository」セクションで `furniture-purchase-system` を探す
3. 「Import」をクリック

### 2-3: デプロイ設定

**重要: そのままでOKです！**

- Framework Preset: Next.js（自動検出）
- Root Directory: ./
- Build Command: `npm run build`（自動設定）
- Output Directory: `.next`（自動設定）

「Deploy」ボタンをクリック

### 2-4: デプロイ完了を待つ

1〜3分待つと、デプロイが完了します。

画面に表示されるURL（例: `https://furniture-purchase-system.vercel.app`）があなたのシステムのURLです！

---

## ✅ 確認

### デプロイされたURLにアクセス

ブラウザで発行されたURLを開く

**正しく表示されれば成功！**

---

## 🔄 更新方法（将来的に）

システムを改善したい場合:

### 方法A: GitHub Desktop使用時

1. ファイルを編集
2. GitHub Desktopで変更を確認
3. 「Commit to main」
4. 「Push origin」

**自動的にVercelに反映されます！**

### 方法B: ブラウザ使用時

1. GitHubのリポジトリページを開く
2. 編集したいファイルをクリック
3. 鉛筆アイコン（Edit）をクリック
4. 編集して「Commit changes」

**自動的にVercelに反映されます！**

---

## 🎯 URLの使い方

### 発行されたURL例

```
https://furniture-purchase-system.vercel.app
```

このURLを:
- ✅ るいじさんに共有
- ✅ BTFさんに見せる
- ✅ スタッフに配布
- ✅ ブックマーク保存

**誰でもアクセスできます！**

---

## 💡 カスタムドメイン（オプション）

もっとかっこいいURLにしたい場合（例: `btf-kaitori.com`）:

1. お名前.comなどでドメイン購入（年1,000円〜）
2. Vercelの設定で「Domains」→ドメインを追加
3. DNS設定を変更

**これは後からでもOKです！**

---

## 🆘 トラブルシューティング

### Q1: デプロイが失敗する

**回答:**
- Vercelのログを確認
- エラーメッセージをコピーして連絡ください

### Q2: URLにアクセスできない

**回答:**
- デプロイ完了まで1〜3分かかります
- 少し待ってからアクセスしてください

### Q3: 画面が真っ白

**回答:**
- ブラウザのキャッシュをクリア
- シークレットモードで開く

---

## 📞 サポート

わからないことがあれば、いつでも連絡してください！

**スクリーンショットを送ってもらえると、すぐに解決できます。**

---

作成日: 2026年4月15日
更新日: 2026年4月15日
