import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Trash2, Plus, ArrowLeft, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { validatePassword } from '../lib/security';

export default function UsersManagement() {
  const router = useRouter();
  const { user, userRole, loading: authLoading, createUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'viewer'
  });

  // マスター権限チェック
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (userRole !== 'master') {
        router.push('/');
      }
    }
  }, [user, userRole, authLoading, router]);

  // ユーザー一覧読み込み
  useEffect(() => {
    if (user && userRole === 'master') {
      loadUsers();
    }
  }, [user, userRole]);

  const loadUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersData);
    } catch (error) {
      console.error('ユーザー読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await createUser(
      newUser.email,
      newUser.password,
      newUser.role,
      newUser.name
    );

    if (result.success) {
      alert('ユーザーを追加しました');
      setNewUser({ email: '', password: '', name: '', role: 'viewer' });
      setShowAddUser(false);
      await loadUsers();
    } else {
      alert(`エラー: ${result.error}`);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userEmail === 'kento.879301@gmail.com') {
      alert('マスターユーザーは削除できません');
      return;
    }

    if (confirm(`${userEmail} を削除しますか？`)) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        alert('ユーザーを削除しました');
        await loadUsers();
      } catch (error) {
        alert(`削除エラー: ${error.message}`);
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-amber-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-semibold text-gray-700">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'master') {
    return null;
  }

  const roleLabels = {
    master: 'マスター',
    admin: '管理者',
    staff: '査定員',
    viewer: '閲覧者'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-amber-900 hover:text-amber-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>管理画面に戻る</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-900 to-orange-900 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
                <p className="text-gray-600 mt-1">User Management</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-900 to-orange-900 text-white px-6 py-3 rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">新規ユーザー追加</span>
            </button>
          </div>
        </div>

        {/* ユーザー一覧 */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-amber-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">登録ユーザー一覧</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b-2 border-amber-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">メールアドレス</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">名前</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">権限</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">登録日</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-amber-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {user.email === 'kento.879301@gmail.com' && (
                          <Shield className="w-4 h-4 text-amber-600" />
                        )}
                        <span className="text-sm font-medium text-gray-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold
                        ${user.role === 'master' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'staff' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.email !== 'kento.879301@gmail.com' && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 新規ユーザー追加モーダル */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">新規ユーザー追加</h3>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    パスワード
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => {
                      setNewUser({ ...newUser, password: e.target.value });
                      if (e.target.value) {
                        setPasswordStrength(validatePassword(e.target.value));
                      } else {
                        setPasswordStrength(null);
                      }
                    }}
                    required
                    minLength={12}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="12文字以上（英大小文字+数字+記号）"
                  />
                  
                  {/* パスワード強度インジケーター */}
                  {passwordStrength && (
                    <div className="mt-2">
                      {passwordStrength.isValid ? (
                        <div className="flex items-center space-x-2 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>強力なパスワードです</span>
                        </div>
                      ) : (
                        <div className="space-y-1 mt-2">
                          {passwordStrength.errors.map((error, index) => (
                            <div key={index} className="flex items-start space-x-2 text-red-600 text-xs">
                              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    名前
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="山田 太郎"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    権限
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="admin">管理者</option>
                    <option value="staff">査定員</option>
                    <option value="viewer">閲覧者</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUser(false);
                      setNewUser({ email: '', password: '', name: '', role: 'viewer' });
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-900 to-orange-900 text-white font-semibold rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all shadow-lg disabled:opacity-50"
                  >
                    {loading ? '追加中...' : '追加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
