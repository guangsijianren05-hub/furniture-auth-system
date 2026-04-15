# Firebase設定手順書

このシステムでは、認証とデータベースにFirebaseを使用します。

## 📋 必要なもの

- Googleアカウント（無料）
- 5分程度の時間

---

## 🚀 手順1: Firebaseプロジェクト作成

### 1-1: Firebaseコンソールにアクセス

https://console.firebase.google.com/

### 1-2: 新しいプロジェクトを作成

1. 「プロジェクトを追加」をクリック
2. プロジェクト名を入力
   - 例: `furniture-purchase-system`
3. Googleアナリティクス: **無効にする**（不要）
4. 「プロジェクトを作成」をクリック

---

## 🔧 手順2: Authentication（認証）設定

### 2-1: Authenticationを有効化

1. 左メニューから「Authentication」をクリック
2. 「始める」をクリック

### 2-2: メール/パスワード認証を有効化

1. 「Sign-in method」タブをクリック
2. 「メール/パスワード」を選択
3. 「有効にする」をON
4. 「保存」をクリック

### 2-3: 初期マスターユーザーを作成

1. 「Users」タブをクリック
2. 「ユーザーを追加」をクリック
3. メール: `kento.879301@gmail.com`
4. パスワード: 任意のパスワード（6文字以上）
5. 「ユーザーを追加」をクリック

### 2-4: マスター権限を設定

1. 左メニューから「Firestore Database」をクリック
2. 「コレクションを開始」をクリック
3. コレクションID: `users`
4. 「次へ」をクリック
5. ドキュメントID: **上記で作成したユーザーのUID**
   - （Authenticationの「Users」タブで確認できます）
6. フィールドを追加:
   ```
   email (string): kento.879301@gmail.com
   role (string): master
   name (string): マスター管理者
   createdAt (string): 2026-04-15
   ```
7. 「保存」をクリック

---

## 💾 手順3: Firestore Database設定

### 3-1: Firestoreを有効化

1. 左メニューから「Firestore Database」をクリック
2. 「データベースの作成」をクリック
3. ロケーション: `asia-northeast1`（東京）
4. 「本番環境モード」で開始
5. 「有効にする」をクリック

### 3-2: セキュリティルールを設定

1. 「ルール」タブをクリック
2. 以下のルールを貼り付け:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // usersコレクション: 認証済みユーザーのみ読み取り可能、マスターのみ書き込み可能
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'master';
    }
    
    // purchasesコレクション: 認証済みユーザーのみアクセス可能
    match /purchases/{purchaseId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                       (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['master', 'admin', 'staff']);
      allow delete: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['master', 'admin'];
    }
  }
}
```

3. 「公開」をクリック

---

## 🔑 手順4: Web アプリを追加

### 4-1: アプリを追加

1. プロジェクトの概要ページに戻る
2. 「ウェブアプリ」（</>アイコン）をクリック
3. アプリのニックネーム: `furniture-system-web`
4. Firebase Hosting: チェック不要
5. 「アプリを登録」をクリック

### 4-2: 設定情報をコピー

表示された`firebaseConfig`の内容をメモしてください。

例:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxxxxxxxx"
};
```

---

## 📝 手順5: 環境変数を設定

### 5-1: .env.localファイルを作成

プロジェクトのルートに`.env.local`ファイルを作成:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxxxxxxxxxx
```

**重要:** 上記の値を、手順4-2でコピーした実際の値に置き換えてください。

---

## 🌐 手順6: Vercelに環境変数を設定

### 6-1: Vercelダッシュボード

1. https://vercel.com にアクセス
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」

### 6-2: 環境変数を追加

以下の6つの環境変数を追加:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | （Firebase設定値） |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | （Firebase設定値） |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | （Firebase設定値） |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | （Firebase設定値） |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | （Firebase設定値） |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | （Firebase設定値） |

### 6-3: 再デプロイ

環境変数を追加したら、Vercelで「Deployments」→「Redeploy」

---

## ✅ 完了確認

### テスト手順

1. デプロイされたURLにアクセス
2. ログイン画面が表示される
3. マスターアカウントでログイン:
   - メール: `kento.879301@gmail.com`
   - パスワード: （手順2-3で設定したパスワード）
4. ログイン成功！管理画面が表示される

---

## 💰 費用

**完全無料！**

- Firebase Authentication: 無料枠（月50,000ユーザー）
- Firestore: 無料枠（1GB、50,000読み取り/日）
- このシステムの規模なら無料枠で十分

---

## 🔒 セキュリティ

### 重要な注意事項

1. **`.env.local`ファイルはGitにコミットしない**
   - すでに`.gitignore`に含まれています
   - 環境変数は秘密情報です

2. **マスターパスワードは強力なものを設定**
   - 最低12文字以上
   - 英数字+記号の組み合わせ

3. **定期的にFirestoreのルールを確認**
   - 不正アクセスがないかチェック

---

## 🆘 トラブルシューティング

### Q1: ログインできない

**確認事項:**
- Firebaseのメール/パスワード認証が有効か
- ユーザーがAuthenticationに登録されているか
- パスワードは正しいか

### Q2: 環境変数エラー

**確認事項:**
- `.env.local`ファイルが正しい場所にあるか
- 環境変数名が正確か（スペルミス、アンダースコアの位置など）
- Vercelの環境変数が設定されているか

### Q3: Firestoreにデータが保存されない

**確認事項:**
- Firestoreのセキュリティルールが正しいか
- ユーザーの`role`フィールドが正しく設定されているか

---

完了です！🎉

何かわからないことがあれば、スクリーンショットを送ってください。
