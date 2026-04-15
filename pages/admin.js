import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, UserPlus, Trash2, Shield, Mail, Key, ArrowLeft } from 'lucide-react';

const AdminPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'general',
    name: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user?.email !== 'kento.879301@gmail.com') {
      alert('マスター権限が必要です');
      router.push('/');
    }
  }, [user, loading, router]);

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
      setUsers(usersData);
    } catch (error) {
      console.error('ユーザー読み込みエラー:', error);
      alert('ユーザー情報の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.password) {
      alert('メールアドレスとパスワードは必須です');
      return;
    }

    try {
      await addDoc(collection(db, 'users'), {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: new Date().toISOString(),
        createdBy: user.email
      });

      alert(`ユーザー ${newUser.email} を追加しました\n\n注意: Firebase Authenticationへの登録は別途必要です`);
      
      setNewUser({ email: '', password: '', role: 'general', name: '' });
      setShowAddUser(false);
      loadUsers();
    } catch (error) {
      console.error('ユーザー追加エラー:', error);
      alert('ユーザーの追加に失敗しました');
    }
  };

  const handleDeleteUser = async (userId, email) => {
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

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'master' ? 'general' : 'master';
    
    if (!confirm(`権限を ${newRole === 'master' ? 'マスター' : '一般'} に変更しますか？`)) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      alert('権限を変更しました');
      loadUsers();
    } catch (error) {
      console.error('権限変更エラー:', error);
      alert('権限の変更に失敗しました');
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-900">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
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
                <p className="text-amber-100 text-sm mt-1">User Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-amber-100">マスター</p>
                <p className="font-semibold">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">総ユーザー数</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">マスター</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">
                  {users.filter(u => u.role === 'master').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">一般ユーザー</p>
                <p className="text-3xl font-bold text-emerald-900 mt-2">
                  {users.filter(u => u.role === 'general').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center space-x-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>新規ユーザー追加</span>
          </button>
        </div>

        {showAddUser && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">新規ユーザー追加</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  メールアドレス（必須）
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  氏名
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="山田 太郎"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  初期パスワード（必須）
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="8文字以上"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Shield className="w-4 h-4 inline mr-1" />
                  権限
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">一般ユーザー</option>
                  <option value="master">マスター</option>
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  追加
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>

            <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800">
                <strong>注意:</strong> このフォームではFirestoreにユーザー情報を保存します。
                Firebase Authenticationへの登録は別途Firebase Consoleで行う必要があります。
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b-2 border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">ユーザー一覧</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">メールアドレス</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">氏名</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">権限</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">作成日</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{u.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        u.role === 'master' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role === 'master' ? (
                          <><Shield className="w-3 h-3 mr-1" /> マスター</>
                        ) : (
                          <><User className="w-3 h-3 mr-1" /> 一般</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-sm">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
                          disabled={u.email === 'kento.879301@gmail.com'}
                        >
                          権限変更
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors flex items-center space-x-1"
                          disabled={u.email === 'kento.879301@gmail.com'}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>削除</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
