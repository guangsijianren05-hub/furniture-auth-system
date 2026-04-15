// セキュリティユーティリティ

/**
 * パスワード強度チェック
 */
export const validatePassword = (password) => {
  const errors = [];
  
  // 最低12文字
  if (password.length < 12) {
    errors.push('パスワードは12文字以上必要です');
  }
  
  // 英大文字を含む
  if (!/[A-Z]/.test(password)) {
    errors.push('英大文字を1文字以上含めてください');
  }
  
  // 英小文字を含む
  if (!/[a-z]/.test(password)) {
    errors.push('英小文字を1文字以上含めてください');
  }
  
  // 数字を含む
  if (!/[0-9]/.test(password)) {
    errors.push('数字を1文字以上含めてください');
  }
  
  // 記号を含む
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('記号を1文字以上含めてください');
  }
  
  // よくあるパスワードをブロック
  const commonPasswords = [
    'password123', 'password1234', '123456789012',
    'qwerty123456', 'admin123456'
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('このパスワードは一般的すぎます');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * メールアドレスマスキング
 * 例: kento.879301@gmail.com → ke***@gmail.com
 */
export const maskEmail = (email) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  return `${local.substring(0, 2)}***@${domain}`;
};

/**
 * 電話番号マスキング
 * 例: 090-1234-5678 → 090-****-5678
 */
export const maskPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3');
};

/**
 * 住所マスキング
 * 例: 東京都渋谷区〇〇 → 東京都***
 */
export const maskAddress = (address) => {
  if (!address) return '';
  const prefectures = ['都', '道', '府', '県'];
  for (const pref of prefectures) {
    const index = address.indexOf(pref);
    if (index !== -1) {
      return address.substring(0, index + 1) + '***';
    }
  }
  return address.substring(0, 3) + '***';
};

/**
 * お客様名マスキング
 * 例: 山田太郎 → 山田*
 */
export const maskCustomerName = (name) => {
  if (!name || name.length <= 1) return name;
  return name.substring(0, 2) + '*'.repeat(Math.max(0, name.length - 2));
};

/**
 * XSS対策: HTMLエスケープ
 */
export const escapeHtml = (text) => {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * SQL Injection対策: 入力サニタイズ
 */
export const sanitizeInput = (input) => {
  if (!input) return '';
  // 危険な文字を除去
  return input.replace(/[;'"\\]/g, '');
};

/**
 * ログイン試行制限チェック
 */
export const checkLoginAttempts = (email) => {
  const storageKey = `login_attempts_${email}`;
  const attempts = JSON.parse(localStorage.getItem(storageKey) || '{"count": 0, "lockedUntil": null}');
  
  // ロック中かチェック
  if (attempts.lockedUntil && new Date(attempts.lockedUntil) > new Date()) {
    const remainingMinutes = Math.ceil((new Date(attempts.lockedUntil) - new Date()) / 60000);
    return {
      isLocked: true,
      remainingMinutes,
      message: `アカウントがロックされています。${remainingMinutes}分後に再試行してください。`
    };
  }
  
  return {
    isLocked: false,
    attempts: attempts.count
  };
};

/**
 * ログイン失敗を記録
 */
export const recordLoginFailure = (email) => {
  const storageKey = `login_attempts_${email}`;
  const attempts = JSON.parse(localStorage.getItem(storageKey) || '{"count": 0, "lockedUntil": null}');
  
  attempts.count += 1;
  
  // 5回失敗でロック（30分）
  if (attempts.count >= 5) {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + 30);
    attempts.lockedUntil = lockUntil.toISOString();
    attempts.count = 0; // リセット
    
    localStorage.setItem(storageKey, JSON.stringify(attempts));
    return {
      locked: true,
      message: '5回連続でログインに失敗しました。30分間ロックされます。'
    };
  }
  
  localStorage.setItem(storageKey, JSON.stringify(attempts));
  return {
    locked: false,
    remainingAttempts: 5 - attempts.count
  };
};

/**
 * ログイン成功時にリセット
 */
export const resetLoginAttempts = (email) => {
  const storageKey = `login_attempts_${email}`;
  localStorage.removeItem(storageKey);
};

/**
 * セッションタイムアウトチェック（30分）
 */
export const checkSessionTimeout = () => {
  const lastActivity = localStorage.getItem('last_activity');
  if (!lastActivity) return false;
  
  const now = new Date().getTime();
  const last = new Date(lastActivity).getTime();
  const thirtyMinutes = 30 * 60 * 1000;
  
  return (now - last) > thirtyMinutes;
};

/**
 * セッションアクティビティ更新
 */
export const updateSessionActivity = () => {
  localStorage.setItem('last_activity', new Date().toISOString());
};

/**
 * IPアドレス取得（フロントエンドから）
 */
export const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
};

/**
 * ユーザーエージェント取得
 */
export const getUserAgent = () => {
  return navigator.userAgent;
};

/**
 * セキュアなランダム文字列生成
 */
export const generateSecureToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
};

/**
 * HTTPS強制チェック
 */
export const enforceHTTPS = () => {
  if (typeof window !== 'undefined' && 
      window.location.protocol === 'http:' && 
      window.location.hostname !== 'localhost') {
    window.location.href = window.location.href.replace('http:', 'https:');
  }
};
