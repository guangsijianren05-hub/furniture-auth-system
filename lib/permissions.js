// lib/permissions.js
// 権限管理システム

export const ROLES = {
  master: {
    label: 'マスター（開発者）',
    permissions: ['*']  // すべての権限
  },
  admin: {
    label: '管理者（BTF社員）',
    permissions: [
      'view',           // 閲覧
      'edit',           // 編集
      'delete',         // 削除
      'assign',         // 担当者割り当て
      'approve',        // 承認
      'estimate',       // 査定
      'payment',        // 入金確認
      'pickup',         // 商品到着確認
      'csv_import',     // CSV取込
      'csv_export',     // CSVエクスポート
      'bulk_operations' // 一括操作
    ]
  },
  viewer: {
    label: '閲覧専用',
    permissions: [
      'view'  // 閲覧のみ
    ]
  }
};

// マスターユーザーのメールアドレス
export const MASTER_USERS = [
  'kento.879301@gmail.com'  // るいじさん
];

// 権限チェック関数
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  
  const role = ROLES[user.role];
  if (!role) return false;
  
  // マスターは全権限
  if (role.permissions.includes('*')) return true;
  
  // 指定された権限を持っているか
  return role.permissions.includes(permission);
}

// 複数の権限をチェック（いずれか1つでもOK）
export function hasAnyPermission(user, permissions) {
  return permissions.some(p => hasPermission(user, p));
}

// 複数の権限をチェック（すべて必要）
export function hasAllPermissions(user, permissions) {
  return permissions.every(p => hasPermission(user, p));
}

// ユーザーの役割を取得
export function getUserRole(email) {
  if (MASTER_USERS.includes(email)) {
    return 'master';
  }
  // デフォルトはadmin（Firestoreから取得した値で上書き）
  return 'admin';
}

// 編集可能かチェック（自分の担当のみ編集可能な場合の処理）
export function canEditPurchase(user, purchase) {
  if (hasPermission(user, 'edit')) return true;
  
  // 閲覧専用は編集不可
  if (user.role === 'viewer') return false;
  
  // 自分の担当のみ編集可能
  if (purchase.assignedTo === user.email) return true;
  
  return false;
}
