import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { Package, LogIn, AlertCircle, Wifi, WifiOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error);
      setLoading(false);
      
      // リトライ可能なエラーの場合
      if (result.canRetry) {
        setRetryCount(prev => prev + 1);
      }
    }
  };

  const handleRetry = () => {
    setError('');
    handleSubmit(new Event('submit'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ネットワーク状態インジケーター */}
        <div className="flex items-center justify-center mb-4">
          {navigator.onLine ? (
            <div className="flex items-center space-x-2 text-green-600 text-sm">
              <Wifi className="w-4 h-4" />
              <span>オンライン</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <WifiOff className="w-4 h-4" />
              <span>オフライン</span>
            </div>
          )}
        </div>

        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-900 to-orange-900 rounded-2xl shadow-xl mb-4">
            <Package className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            家具買取管理システム
          </h1>
          <p className="text-gray-600">Furniture Purchase Management</p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-amber-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">ログイン</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-700 text-sm whitespace-pre-wrap">{error}</p>
                  {retryCount > 0 && retryCount < 3 && (
                    <button
                      onClick={handleRetry}
                      className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      もう一度試す
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="your@email.com"
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
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !navigator.onLine}
              className="w-full bg-gradient-to-r from-amber-900 to-orange-900 text-white font-bold py-4 rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>ログイン中...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>ログイン</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない場合は、管理者にお問い合わせください
            </p>
          </div>

          {/* セキュリティ情報 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <p className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                通信はSSL/TLSで暗号化されています
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                5回連続失敗で30分間アカウントロック
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                30分間操作がないと自動ログアウト
              </p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© 2026 家具買取管理システム</p>
          <p className="mt-1 text-xs">Ver 2.0 - セキュリティ強化版</p>
        </div>
      </div>
    </div>
  );
}
