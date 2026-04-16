import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole } from '../lib/permissions';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { User, Trash2, Shield, Mail, Key, ArrowLeft, Save, X } from 'lucide-react';

const MASTER_USERS = ['kento.879301@gmail.com'];

const AdminPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPassword, setEditingPassword] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const userRole = user ? getUserRole(user.email) : null;

  // アクセス制御
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // ユーザー一覧読み込み
  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      
      // 権限に応じてフィルタリング
      let filteredUsers = usersData;
      
      if (userRole === 'viewer') {
        // viewerは自分のアカウントのみ表示
        filteredUsers = usersData.filter(u => u.email === user.email);
      } else if (userRole === 'admin') {
        // adminはadminとviewerのみ表示（masterは非表示）
        filteredUsers = usersData.filter(u => {
          const role = u.role || 'admin';
          return role !== 'master';
        });
      }
      // masterは全員表示（フィルタなし）
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('ユーザー読み込みエラー:', error);
      alert('ユーザー情報の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    // masterユーザーは削除不可
    if (MASTER_USERS.includes(email)) {
      alert('マスターユーザーは削除できません');
      return;
    }

    // 削除権限チェック
    if (userRole !== 'master' && userRole !== 'admin') {
      alert('削除の権限がありません');
      return;
    }

    if (!confirm(`ユーザー ${email} を削除しますか？\n\n注意: Firebase Authenticationからも手動で削除する必要があります`)) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      alert('ユーザーを削除しました');
      loadUsers();
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      alert('ユーザーの削除に失敗しました');
    }
  };

  const handleChangePassword = async (targetEmail) => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      alert('新しいパスワードを入力してください');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('パスワードが一致しません');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('パスワードは8文字以上必要です');
      return;
    }

    // 自分のパスワードを変更する場合は現在のパスワードが必要
    if (targetEmail === user.email) {
      if (!passwordData.currentPassword) {
        alert('現在のパスワードを入力してください');
        return;
      }

      try {
        // 再認証
        const credential = EmailAuthProvider.credential(
          user.email,
          passwordData.currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        
        // パスワード変更
        await updatePassword(auth.currentUser, passwordData.newPassword);
        
        alert('パスワードを変更しました');
        setEditingPassword(null);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } catch (error) {
        console.error('パスワード変更エラー:', error);
        if (error.code === 'auth/wrong-password') {
          alert('現在のパスワードが正しくありません');
        } else {
          alert('パスワードの変更に失敗しました: ' + error.message);
        }
      }
    } else {
      // 他のユーザーのパスワード変更（masterのみ）
      if (userRole !== 'master') {
        alert('他のユーザーのパスワードを変更する権限がありません');
        return;
      }

      alert('他のユーザーのパスワード変更はFirebase Consoleから行ってください');
      setEditingPassword(null);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-900">読み込み中...</p>
      </div>
    );
  }

  
  // 統計
  const totalUsers = users.length;
  const masterCount = users.filter(u => (u.role || 'admin') === 'master').length;
  const adminCount = users.filter(u => (u.role || 'admin') === 'admin').length;
  const viewerCount = users.filter(u => (u.role || 'admin') === 'viewer').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-amber-900 via-orange-900 to-amber-800 text-white shadow-xl border-b-4 border-amber-700">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="w-10 h-10 bg-amber-100/20 hover:bg-amber-100/30 rounded-xl flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">ユーザー管理</h1>
                <p className="text-amber-100 text-sm">User Management</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-amber-100">
                {userRole === 'master' && 'マスター'}
                {userRole === 'admin' && '管理者'}
                {userRole === 'viewer' && '閲覧専用'}
              </p>
              <p className="font-semibold">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">総ユーザー数</p>
                <p className="text-4xl font-bold text-blue-900 mt-2">{totalUsers}</p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {userRole === 'master' && (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase">マスター</p>
                  <p className="text-4xl font-bold text-purple-900 mt-2">{masterCount}</p>
                </div>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">
                  {userRole === 'master' ? '一般ユーザー' : '管理者'}
                </p>
                <p className="text-4xl font-bold text-green-900 mt-2">
                  {userRole === 'master' ? (adminCount + viewerCount) : adminCount}
                </p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 新規ユーザー追加は Firebase Console から行ってください */}
        <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <h3 className="font-bold text-blue-900 mb-2">📝 新規ユーザーの追加方法</h3>
          <p className="text-sm text-blue-800">
            新しいアカウントを作成する場合は、Firebase Console から行ってください。<br />
            詳しくは運用マニュアルをご確認ください。
          </p>
        </div>



        {/* ユーザー一覧 */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b-2 border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              ユーザー一覧
              {userRole === 'viewer' && ' （自分のアカウントのみ）'}
              {userRole === 'admin' && ' （管理者・閲覧専用）'}
            </h2>
          </div>

          <div className="divide-y-2 divide-gray-100">
            {users.map((u) => (
              <div key={u.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <span className="font-semibold text-gray-900">{u.email}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        (u.role || 'admin') === 'master' 
                          ? 'bg-purple-100 text-purple-800'
                          : (u.role || 'admin') === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {(u.role || 'admin') === 'master' && 'マスター'}
                        {(u.role || 'admin') === 'admin' && '管理者'}
                        {(u.role || 'admin') === 'viewer' && '閲覧専用'}
                      </span>
                    </div>
                    {u.name && (
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{u.name}</span>
                      </div>
                    )}
                    {u.createdAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        作成日: {new Date(u.createdAt).toLocaleString('ja-JP')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* パスワード変更ボタン */}
                    {(u.email === user.email || userRole === 'master') && (
                      <button
                        onClick={() => {
                          setEditingPassword(editingPassword === u.id ? null : u.id);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors text-sm flex items-center space-x-2"
                      >
                        <Key className="w-4 h-4" />
                        <span>パスワード変更</span>
                      </button>
                    )}

                    {/* 削除ボタン */}
                    {!MASTER_USERS.includes(u.email) && (userRole === 'master' || userRole === 'admin') && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors text-sm flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>削除</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* パスワード変更フォーム */}
                {editingPassword === u.id && (
                  <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <h3 className="font-bold text-amber-900 mb-3">パスワード変更</h3>
                    <div className="space-y-3">
                      {u.email === user.email && (
                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">
                            現在のパスワード
                          </label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            placeholder="現在のパスワード"
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">
                          新しいパスワード
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="新しいパスワード"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">
                          パスワード確認
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder="パスワードを再入力"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => handleChangePassword(u.email)}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>変更</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingPassword(null);
                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          }}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>キャンセル</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
