// lib/security.js
// セキュリティ機能（既存機能 + 新機能統合）

import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

// パスワードポリシー
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};

// セッション設定
export const SESSION_CONFIG = {
  timeout: 30 * 60 * 1000,  // 30分
  warningTime: 5 * 60 * 1000  // 5分前に警告
};

// IPアドレス制限（開発環境）
export const ALLOWED_IPS = [
  '162.120.184.22'  // るいじさんのIP
];

// ========== 既存の関数（AuthContextが使用） ==========

// HTTPS強制（既存機能）
export function enforceHTTPS() {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      window.location.href = window.location.href.replace('http:', 'https:');
    }
  }
}

// セッションタイムアウトチェック（既存機能）
export function checkSessionTimeout() {
  if (typeof window === 'undefined') return true;
  
  const lastActivity = localStorage.getItem('lastActivity');
  if (!lastActivity) return false;
  
  const now = Date.now();
  const elapsed = now - parseInt(lastActivity);
  
  return elapsed > SESSION_CONFIG.timeout;
}

// セッション活動更新（既存機能）
export function updateSessionActivity() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lastActivity', Date.now().toString());
}

// ログイン試行チェック（既存機能）
const loginAttempts = new Map();

export function checkLoginAttempts(email) {
  const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  const now = Date.now();
  
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    const remainingMinutes = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
    return {
      allowed: false,
      locked: true,
      remainingMinutes
    };
  }
  
  return {
    allowed: true,
    remainingAttempts: 5 - attempts.count
  };
}

// ログイン試行リセット（既存機能）
export function resetLoginAttempts(email) {
  loginAttempts.delete(email);
}

// ログイン失敗記録（既存機能）
export function recordLoginFailure(email) {
  const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  attempts.count++;
  
  if (attempts.count >= 5) {
    attempts.lockedUntil = Date.now() + (30 * 60 * 1000); // 30分ロック
  }
  
  loginAttempts.set(email, attempts);
  
  return {
    remainingAttempts: Math.max(0, 5 - attempts.count),
    locked: attempts.count >= 5
  };
}

// クライアントIP取得（既存機能）
export function getClientIP() {
  // クライアント側では取得不可（サーバー側で実装必要）
  return 'unknown';
}

// ユーザーエージェント取得（既存機能）
export function getUserAgent() {
  if (typeof window === 'undefined') return 'unknown';
  return window.navigator.userAgent;
}

// ========== 新機能 ==========

// パスワード検証
export function validatePassword(password) {
  const errors = [];
  
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`パスワードは${PASSWORD_POLICY.minLength}文字以上である必要があります`);
  }
  
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('大文字を1文字以上含める必要があります');
  }
  
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('小文字を1文字以上含める必要があります');
  }
  
  if (PASSWORD_POLICY.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('数字を1文字以上含める必要があります');
  }
  
  if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('記号を1文字以上含める必要があります');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// 監査ログを記録
export async function logAuditEvent({
  userId,
  userEmail,
  action,
  resourceType,
  resourceId,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  success = true,
  errorMessage = null
}) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      userId,
      userEmail,
      action,
      resourceType,
      resourceId,
      oldValue,
      newValue,
      ipAddress: ipAddress || getClientIP(),
      success,
      errorMessage,
      timestamp: new Date().toISOString(),
      userAgent: getUserAgent()
    });
  } catch (error) {
    console.error('監査ログの記録に失敗:', error);
  }
}

// セッションタイムアウトチェック（クラス版）
export class SessionManager {
  constructor(timeout = SESSION_CONFIG.timeout) {
    this.timeout = timeout;
    this.lastActivity = Date.now();
    this.timer = null;
    this.warningCallback = null;
    this.timeoutCallback = null;
  }
  
  recordActivity() {
    this.lastActivity = Date.now();
    updateSessionActivity();
    this.resetTimer();
  }
  
  resetTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    const warningTime = this.timeout - SESSION_CONFIG.warningTime;
    setTimeout(() => {
      if (this.warningCallback) {
        this.warningCallback();
      }
    }, warningTime);
    
    this.timer = setTimeout(() => {
      if (this.timeoutCallback) {
        this.timeoutCallback();
      }
    }, this.timeout);
  }
  
  onWarning(callback) {
    this.warningCallback = callback;
  }
  
  onTimeout(callback) {
    this.timeoutCallback = callback;
  }
  
  start() {
    this.resetTimer();
    
    if (typeof window !== 'undefined') {
      ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, () => this.recordActivity());
      });
    }
  }
  
  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
}

// パスワード強度チェック
export function getPasswordStrength(password) {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  
  if (strength <= 2) return { level: 'weak', label: '弱い', color: 'red' };
  if (strength <= 4) return { level: 'medium', label: '普通', color: 'orange' };
  return { level: 'strong', label: '強い', color: 'green' };
}
