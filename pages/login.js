import { useState } from 'react';
import { useRouter } from 'next/router';
import { Package, LogIn, Wifi } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'ログインに失敗しました');
        setIsLoading(false);
        return;
      }

      // ログイン成功 - 強制的にリロードしてからリダイレクト
      console.log('Login successful:', data);
      window.location.href = '/';
      
    } catch (err) {
      console.error('Login error:', err);
      setError('ログインに失敗しました。もう一度お試しください。');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-700 to-orange-800 rounded-2xl flex items-center justify-center shadow-xl">
              <Package className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-semibold">オンライン</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            家具買取管理システム
          </h1>
          <p className="text-gray-600">Furniture Purchase Management</p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">ログイン</h2>

          {error && (
            <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-700 to-orange-800 hover:from-amber-800 hover:to-orange-900 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>{isLoading ? 'ログイン中...' : 'ログイン'}</span>
            </button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-6">
            アカウントをお持ちでない場合は、管理者にお問い合わせください
          </p>

          {/* セキュリティ情報 */}
          <div className="mt-8 space-y-2">
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-sm">通信はSSL/TLSで暗号化されています</span>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-sm">5回連続失敗で30分間アカウントロック</span>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-sm">30分間操作がないと自動ログアウト</span>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© 2026 家具買取管理システム</p>
          <p className="mt-1">Ver 3.0 - カスタム認証版</p>
        </div>
      </div>
    </div>
  );
}
