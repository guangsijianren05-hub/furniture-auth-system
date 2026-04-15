import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getClientIP, getUserAgent } from './security';

/**
 * 監査ログを記録
 */
export const logAudit = async (action, details = {}) => {
  try {
    const ip = await getClientIP();
    const userAgent = getUserAgent();
    
    const auditLog = {
      action, // 'login', 'logout', 'create_user', 'update_purchase', 'delete_purchase', etc.
      userId: details.userId || null,
      userEmail: details.userEmail || null,
      targetId: details.targetId || null, // 操作対象のID（依頼ID、ユーザーIDなど）
      targetType: details.targetType || null, // 'purchase', 'user', etc.
      changes: details.changes || null, // 変更内容
      result: details.result || 'success', // 'success', 'failure'
      errorMessage: details.errorMessage || null,
      ipAddress: ip,
      userAgent,
      timestamp: serverTimestamp(),
      metadata: details.metadata || {}
    };
    
    await addDoc(collection(db, 'audit_logs'), auditLog);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to log audit:', error);
    // 監査ログ失敗は処理を止めない
    return { success: false, error };
  }
};

/**
 * ログインログ
 */
export const logLogin = async (userId, userEmail, success = true, errorMessage = null) => {
  return await logAudit('login', {
    userId,
    userEmail,
    result: success ? 'success' : 'failure',
    errorMessage
  });
};

/**
 * ログアウトログ
 */
export const logLogout = async (userId, userEmail) => {
  return await logAudit('logout', {
    userId,
    userEmail
  });
};

/**
 * ユーザー作成ログ
 */
export const logUserCreation = async (creatorId, creatorEmail, newUserEmail, role) => {
  return await logAudit('create_user', {
    userId: creatorId,
    userEmail: creatorEmail,
    metadata: {
      newUserEmail,
      role
    }
  });
};

/**
 * ユーザー削除ログ
 */
export const logUserDeletion = async (deleterId, deleterEmail, deletedUserEmail) => {
  return await logAudit('delete_user', {
    userId: deleterId,
    userEmail: deleterEmail,
    metadata: {
      deletedUserEmail
    }
  });
};

/**
 * 買取依頼更新ログ
 */
export const logPurchaseUpdate = async (userId, userEmail, purchaseId, changes) => {
  return await logAudit('update_purchase', {
    userId,
    userEmail,
    targetId: purchaseId,
    targetType: 'purchase',
    changes
  });
};

/**
 * 買取依頼削除ログ
 */
export const logPurchaseDeletion = async (userId, userEmail, purchaseId) => {
  return await logAudit('delete_purchase', {
    userId,
    userEmail,
    targetId: purchaseId,
    targetType: 'purchase'
  });
};

/**
 * データエクスポートログ
 */
export const logDataExport = async (userId, userEmail, exportType) => {
  return await logAudit('export_data', {
    userId,
    userEmail,
    metadata: {
      exportType // 'csv', 'json', etc.
    }
  });
};

/**
 * データインポートログ
 */
export const logDataImport = async (userId, userEmail, importType, recordCount) => {
  return await logAudit('import_data', {
    userId,
    userEmail,
    metadata: {
      importType,
      recordCount
    }
  });
};

/**
 * 権限変更ログ
 */
export const logPermissionChange = async (changerId, changerEmail, targetUserEmail, oldRole, newRole) => {
  return await logAudit('change_permission', {
    userId: changerId,
    userEmail: changerEmail,
    metadata: {
      targetUserEmail,
      oldRole,
      newRole
    }
  });
};

/**
 * 不正アクセス試行ログ
 */
export const logUnauthorizedAccess = async (userId, userEmail, attemptedAction) => {
  return await logAudit('unauthorized_access', {
    userId,
    userEmail,
    result: 'failure',
    metadata: {
      attemptedAction
    }
  });
};

/**
 * セッションタイムアウトログ
 */
export const logSessionTimeout = async (userId, userEmail) => {
  return await logAudit('session_timeout', {
    userId,
    userEmail
  });
};
