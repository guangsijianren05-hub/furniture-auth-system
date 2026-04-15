// エラーハンドリングユーティリティ

/**
 * Firebaseエラーを日本語のユーザーフレンドリーなメッセージに変換
 */
export const getFirebaseErrorMessage = (errorCode) => {
  const errorMessages = {
    // 認証エラー
    'auth/invalid-email': 'メールアドレスの形式が正しくありません',
    'auth/user-disabled': 'このアカウントは無効化されています。管理者にお問い合わせください',
    'auth/user-not-found': 'このメールアドレスは登録されていません',
    'auth/wrong-password': 'パスワードが正しくありません',
    'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
    'auth/weak-password': 'パスワードが弱すぎます。より強力なパスワードを設定してください',
    'auth/operation-not-allowed': 'この操作は許可されていません',
    'auth/too-many-requests': 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください',
    'auth/invalid-credential': '認証情報が無効です。もう一度お試しください',
    
    // ネットワークエラー
    'auth/network-request-failed': 'ネットワークエラーが発生しました。インターネット接続を確認してください',
    
    // Firestoreエラー
    'permission-denied': 'この操作を実行する権限がありません',
    'not-found': '要求されたデータが見つかりません',
    'already-exists': 'このデータは既に存在します',
    'resource-exhausted': 'リソースが不足しています。しばらく待ってから再試行してください',
    'unauthenticated': '認証が必要です。ログインしてください',
    'unavailable': 'サービスが一時的に利用できません。しばらく待ってから再試行してください',
    
    // デフォルト
    'default': '予期しないエラーが発生しました。もう一度お試しください'
  };
  
  return errorMessages[errorCode] || errorMessages['default'];
};

/**
 * エラーログを記録
 */
export const logError = async (error, context = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    code: error.code,
    stack: error.stack,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // 開発環境ではコンソールに出力
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorLog);
  }
  
  // 本番環境ではFirestoreに保存（オプション）
  // try {
  //   await addDoc(collection(db, 'error_logs'), errorLog);
  // } catch (e) {
  //   console.error('Failed to log error:', e);
  // }
};

/**
 * ネットワーク接続チェック
 */
export const checkNetworkConnection = () => {
  if (!navigator.onLine) {
    return {
      online: false,
      message: 'インターネット接続がありません。接続を確認してください'
    };
  }
  
  return {
    online: true
  };
};

/**
 * リトライロジック
 */
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // ネットワークエラーの場合のみリトライ
      if (error.code === 'auth/network-request-failed' || 
          error.code === 'unavailable') {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      } else {
        throw error;
      }
    }
  }
};

/**
 * エラー詳細情報を取得
 */
export const getErrorDetails = (error) => {
  return {
    code: error.code || 'unknown',
    message: error.message || 'Unknown error',
    timestamp: new Date().toISOString(),
    userMessage: getFirebaseErrorMessage(error.code),
    canRetry: ['auth/network-request-failed', 'unavailable', 'resource-exhausted'].includes(error.code)
  };
};

/**
 * エラー通知表示用ヘルパー
 */
export const createErrorNotification = (error, options = {}) => {
  const details = getErrorDetails(error);
  
  return {
    type: 'error',
    title: options.title || 'エラーが発生しました',
    message: details.userMessage,
    action: details.canRetry ? {
      label: 'もう一度試す',
      onClick: options.onRetry
    } : null,
    duration: options.duration || 5000
  };
};

/**
 * バリデーションエラーをまとめる
 */
export const collectValidationErrors = (validations) => {
  const errors = [];
  
  for (const [field, validation] of Object.entries(validations)) {
    if (!validation.isValid) {
      errors.push({
        field,
        message: validation.message || `${field}が正しくありません`
      });
    }
  }
  
  return errors;
};

/**
 * オフライン時の動作
 */
export const handleOfflineMode = () => {
  const offlineData = localStorage.getItem('offline_queue');
  return JSON.parse(offlineData || '[]');
};

/**
 * オフライン時のデータをキューに追加
 */
export const queueOfflineAction = (action) => {
  const queue = handleOfflineMode();
  queue.push({
    ...action,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('offline_queue', JSON.stringify(queue));
};

/**
 * オンライン復帰時にキューを処理
 */
export const processOfflineQueue = async (processFunction) => {
  const queue = handleOfflineMode();
  const results = [];
  
  for (const action of queue) {
    try {
      await processFunction(action);
      results.push({ success: true, action });
    } catch (error) {
      results.push({ success: false, action, error });
    }
  }
  
  // 成功したアクションをキューから削除
  const remainingQueue = queue.filter((_, index) => !results[index].success);
  localStorage.setItem('offline_queue', JSON.stringify(remainingQueue));
  
  return results;
};
