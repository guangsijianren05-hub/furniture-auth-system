import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';

const Manual = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [expandedSections, setExpandedSections] = useState({ 'workflow': true });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-900">読み込み中...</p>
      </div>
    );
  }

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
                <h1 className="text-3xl font-bold">システム利用マニュアル</h1>
                <p className="text-amber-100 text-sm mt-1">User Manual</p>
              </div>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-sm text-amber-100">ログイン中</p>
                <p className="font-semibold">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* 処理フロー */}
        <div className="mb-8">
          <button
            onClick={() => toggleSection('workflow')}
            className="w-full bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-6 hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-purple-900">📊 処理フロー（6段階）</h2>
              {expandedSections['workflow'] ? (
                <ChevronDown className="w-6 h-6 text-purple-600" />
              ) : (
                <ChevronRight className="w-6 h-6 text-purple-600" />
              )}
            </div>
          </button>
          
          {expandedSections['workflow'] && (
            <div className="mt-4 bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
              <div className="space-y-6">
                {/* フロー図 */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-6 text-xl">完全なワークフロー</h3>
                  
                  <div className="space-y-4">
                    {/* Step 1: 未対応 → 対応中 */}
                    <div className="bg-white rounded-xl p-5 border-l-4 border-amber-500 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                          <div>
                            <h4 className="font-bold text-gray-900">担当者を割り当てる</h4>
                            <p className="text-sm text-gray-600">未対応 → 対応中</p>
                          </div>
                        </div>
                        <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-semibold">必須</span>
                      </div>
                      <div className="ml-13 text-sm text-gray-700 space-y-2">
                        <p>・依頼カードをクリックして詳細を開く</p>
                        <p>・「担当者」ドロップダウンから選択</p>
                        <p>・自動保存され、ステータスが「対応中」に変わる</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-purple-300 to-purple-500"></div>
                    </div>

                    {/* Step 2: 対応中 → 提案中 */}
                    <div className="bg-white rounded-xl p-5 border-l-4 border-blue-500 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                          <div>
                            <h4 className="font-bold text-gray-900">査定金額を入力</h4>
                            <p className="text-sm text-gray-600">対応中 → 提案中</p>
                          </div>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">必須</span>
                      </div>
                      <div className="ml-13 text-sm text-gray-700 space-y-2">
                        <p>・「査定金額（円）」欄に金額を入力</p>
                        <p>・例：100000 → ¥100,000 と表示される</p>
                        <p>・自動保存され、ステータスが「提案中」に変わる</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-purple-300 to-purple-500"></div>
                    </div>

                    {/* Step 3: 提案中 → 入金確認中 */}
                    <div className="bg-white rounded-xl p-5 border-l-4 border-purple-500 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                          <div>
                            <h4 className="font-bold text-gray-900">買取承認</h4>
                            <p className="text-sm text-gray-600">提案中 → 入金確認中</p>
                          </div>
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold">必須</span>
                      </div>
                      <div className="ml-13 text-sm text-gray-700 space-y-2">
                        <p>・「買取承認」チェックボックスをクリック</p>
                        <p className="text-red-600 font-semibold">⚠️ 査定金額が未入力だと承認できません</p>
                        <p>・自動保存され、ステータスが「入金確認中」に変わる</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-purple-300 to-purple-500"></div>
                    </div>

                    {/* Step 4: 入金確認中 → 商品到着待ち */}
                    <div className="bg-white rounded-xl p-5 border-l-4 border-orange-500 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                          <div>
                            <h4 className="font-bold text-gray-900">入金確認</h4>
                            <p className="text-sm text-gray-600">入金確認中 → 商品到着待ち</p>
                          </div>
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold">必須</span>
                      </div>
                      <div className="ml-13 text-sm text-gray-700 space-y-2">
                        <p>・「入金日」をカレンダーから選択</p>
                        <p>・「入金確認済み」チェックボックスをクリック</p>
                        <p className="text-red-600 font-semibold">⚠️ 買取承認されていないと確認できません</p>
                        <p>・自動保存され、ステータスが「商品到着待ち」に変わる</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-purple-300 to-purple-500"></div>
                    </div>

                    {/* Step 5: 商品到着待ち → 完了 */}
                    <div className="bg-white rounded-xl p-5 border-l-4 border-cyan-500 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold">5</div>
                          <div>
                            <h4 className="font-bold text-gray-900">商品到着確認</h4>
                            <p className="text-sm text-gray-600">商品到着待ち → 完了</p>
                          </div>
                        </div>
                        <span className="text-xs bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full font-semibold">必須</span>
                      </div>
                      <div className="ml-13 text-sm text-gray-700 space-y-2">
                        <p>・「商品到着日」をカレンダーから選択</p>
                        <p>・「商品到着確認済み」チェックボックスをクリック</p>
                        <p className="text-red-600 font-semibold">⚠️ 入金確認されていないと確認できません</p>
                        <p>・自動保存され、ステータスが「完了」に変わる</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-purple-300 to-purple-500"></div>
                    </div>

                    {/* Step 6: 完了 */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-5 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white text-emerald-600 rounded-full flex items-center justify-center font-bold">✓</div>
                        <div className="text-white">
                          <h4 className="font-bold text-lg">完了</h4>
                          <p className="text-sm text-emerald-100">取引が完了しました！</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 基本操作 */}
        <div className="mb-8">
          <button
            onClick={() => toggleSection('basic')}
            className="w-full bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6 hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-blue-900">🎯 基本操作</h2>
              {expandedSections['basic'] ? (
                <ChevronDown className="w-6 h-6 text-blue-600" />
              ) : (
                <ChevronRight className="w-6 h-6 text-blue-600" />
              )}
            </div>
          </button>
          
          {expandedSections['basic'] && (
            <div className="mt-4 bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
              <div className="space-y-6">
                {/* 検索 */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">🔍 検索</h3>
                  <p className="text-gray-700 mb-2">検索ボックスで以下を検索できます：</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>お客様名（例：「加納」「佐藤」）</li>
                    <li>商品名（例：「ソファ」「ベッド」）</li>
                    <li>依頼ID（例：「P0001」）</li>
                  </ul>
                </div>

                {/* フィルター */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">🎛️ フィルター</h3>
                  <p className="text-gray-700 mb-2">ステータスやカテゴリで絞り込みができます：</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>ステータス選択：「未対応」のみ表示など</li>
                    <li>カテゴリ選択：「ソファ」のみ表示など</li>
                    <li>組み合わせ：「未対応」の「ソファ」のみ表示</li>
                  </ul>
                </div>

                {/* CSV取り込み */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">📥 CSV取り込み</h3>
                  <p className="text-gray-700 mb-2">LINEからのデータを取り込む：</p>
                  <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
                    <li>「CSV取込」ボタンをクリック</li>
                    <li>CSVファイルを選択</li>
                    <li>自動的に読み込まれる</li>
                    <li>結果が表示される（新規追加・更新・エラー件数）</li>
                  </ol>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-yellow-900"><span className="font-semibold">💡 ポイント：</span> 同じLINE ID + 回答日時の場合は更新されます</p>
                  </div>
                </div>

                {/* 一括操作 */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">✨ 一括操作</h3>
                  <p className="text-gray-700 mb-2">複数の依頼を同時に処理：</p>
                  <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
                    <li>カード左上のチェックボックスをクリック（複数選択可）</li>
                    <li>画面上部に青いバーが表示される</li>
                    <li>「担当者を一括割当」で全員に同じ担当者を割当</li>
                    <li>「エクスポート」で選択分のみCSV出力</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* よくある質問 */}
        <div className="mb-8">
          <button
            onClick={() => toggleSection('faq')}
            className="w-full bg-white rounded-2xl shadow-lg border-2 border-amber-200 p-6 hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-amber-900">❓ よくある質問</h2>
              {expandedSections['faq'] ? (
                <ChevronDown className="w-6 h-6 text-amber-600" />
              ) : (
                <ChevronRight className="w-6 h-6 text-amber-600" />
              )}
            </div>
          </button>
          
          {expandedSections['faq'] && (
            <div className="mt-4 bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Q. 間違って承認してしまいました</h4>
                  <p className="text-gray-700">A. チェックボックスをもう一度クリックすると解除できます。（完了以外のステータスは元に戻せます）</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Q. 自動的にログアウトされました</h4>
                  <p className="text-gray-700">A. 30分間操作がないと自動でログアウトします。再度ログインしてください。（セキュリティのための機能です）</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Q. 査定金額を間違えました</h4>
                  <p className="text-gray-700">A. もう一度正しい金額を入力してください。上書き保存されます。</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Q. 依頼を削除したい</h4>
                  <p className="text-gray-700">A. 現在、削除機能はありません。管理者に連絡してください。（誤削除を防ぐため）</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Q. パスワードを忘れました</h4>
                  <p className="text-gray-700">A. 管理者（kento.879301@gmail.com）に連絡してください。パスワードをリセットします。</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* サポート */}
        <div className="bg-gradient-to-r from-amber-900 to-orange-900 text-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">📞 サポートが必要ですか？</h2>
          <p className="text-amber-100 mb-6">
            問題が発生した場合や、ご不明な点がございましたら<br />
            お気軽に管理者までご連絡ください。
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 inline-block">
            <p className="text-sm text-amber-200 mb-1">管理者連絡先</p>
            <p className="font-bold text-lg">kento.879301@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manual;
