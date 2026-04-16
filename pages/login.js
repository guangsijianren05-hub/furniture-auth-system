import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Trash2, Shield, Mail, Key, ArrowLeft, UserPlus } from 'lucide-react';

const MASTER_USERS = ['kento.879301@gmail.com'];

const AdminPage = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin'
  });

  // セッションチェック
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      setCurrentUser(data.user);
      loadUsers();
    } catch (error) {
      console.error('Session check error:', error);
      router.push('/login');
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersData);
    } catch (error) {
      console.error('ユーザー読み込みエラー:', error);
      alert('ユーザー情報の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.password) {
      alert('メールアドレスとパスワードは必須です');
      return;
    }

    if (newUser.password.length < 8) {
      alert('パスワードは8文字以上必要です');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        alert('エラー: ' + data.error);
        setIsCreating(false);
        return;
      }

      alert(`ユーザー ${newUser.email} を作成しました！\n\nこのアカウントですぐにログインできます。`);
      
      setNewUser({ email: '', password: '', name: '', role: 'admin' });
      setShowAddUser(false);
      loadUsers();
    } catch (error) {
      console.error('Create user error:', error);
      alert('ユーザーの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (MASTER_USERS.includes(email)) {
      alert('マスターユーザーは削除できません');
      return;
    }

    if (!confirm(`ユーザー ${email} を削除しますか？`)) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      alert('ユーザーを削除しました');
      loadUsers();
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      alert('ユーザーの削除に失敗しました');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-900">読み込み中...</p>
      </div>
    );
  }

  const userRole = currentUser.role;
  const canManageUsers = userRole === 'master' || userRole === 'admin';

  const totalUsers = users.length;
  const masterCount = users.filter(u => u.role === 'master').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const viewerCount = users.filter(u => u.role === 'viewer').length;

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
              <p className="font-semibold">{currentUser.email}</p>
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
                <p className="text-sm font-semibold text-gray-600 uppercase">管理者</p>
                <p className="text-4xl font-bold text-green-900 mt-2">{adminCount}</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 新規ユーザー追加ボタン */}
        {canManageUsers && (
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className="mb-6 flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg"
          >
            <UserPlus className="w-5 h-5" />
            <span>新規ユーザーを追加</span>
          </button>
        )}

        {/* 新規ユーザー追加フォーム */}
        {showAddUser && canManageUsers && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">新規ユーザーを追加</h2>
            <p className="text-sm text-gray-600 mb-6">
              作成したアカウントはすぐにログイン可能になります。
            </p>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  メールアドレス（必須）
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  氏名
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="山田 太郎"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  パスワード（必須）
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500 mt-1">8文字以上を推奨</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">
                  <Shield className="w-4 h-4 inline mr-1" />
                  権限
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                  disabled={isCreating}
                >
                  <option value="admin">admin（管理者） - すべての操作が可能</option>
                  <option value="viewer">viewer（閲覧専用） - 閲覧のみ</option>
                  {userRole === 'master' && (
                    <option value="master">master（マスター） - 開発者専用</option>
                  )}
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? '作成中...' : 'アカウントを作成'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUser({ email: '', password: '', name: '', role: 'admin' });
                  }}
                  disabled={isCreating}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  キャンセル
                </button>
              </div>
            </form>

            <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-900">
                <span className="font-semibold">✓ すぐに使える:</span> 作成後すぐにログイン可能<br />
                <span className="font-semibold">✓ セキュア:</span> パスワードは暗号化して保存<br />
                <span className="font-semibold">✓ シンプル:</span> Firebase Console 不要
              </p>
            </div>
          </div>
        )}

        {/* ユーザー一覧 */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b-2 border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">ユーザー一覧</h2>
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
                        u.role === 'master' 
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {u.role === 'master' && 'マスター'}
                        {u.role === 'admin' && '管理者'}
                        {u.role === 'viewer' && '閲覧専用'}
                      </span>
                      {u.status === 'disabled' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          無効
                        </span>
                      )}
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
                    {/* 削除ボタン */}
                    {!MASTER_USERS.includes(u.email) && canManageUsers && (
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
