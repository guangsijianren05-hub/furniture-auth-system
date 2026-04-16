import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { hasPermission } from '../lib/permissions';
import { 
  TrendingUp, Users, Package, DollarSign, Clock, 
  AlertCircle, CheckCircle, ArrowLeft, BarChart3, PieChart 
} from 'lucide-react';

const Dashboard = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, loading, router]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'purchases'));
      const purchasesData = [];
      querySnapshot.forEach((doc) => {
        purchasesData.push({ firestoreId: doc.id, ...doc.data() });
      });
      setPurchases(purchasesData);
      calculateStats(purchasesData);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data) => {
    // 総依頼件数
    const totalPurchases = data.length;
    
    // 完了率
    const completedCount = data.filter(p => p.status === 'completed').length;
    const completionRate = totalPurchases > 0 ? (completedCount / totalPurchases * 100).toFixed(1) : 0;
    
    // 総売上（完了分のみ）
    const totalRevenue = data
      .filter(p => p.status === 'completed' && p.estimatedPrice)
      .reduce((sum, p) => sum + (p.estimatedPrice || 0), 0);
    
    // 平均処理時間（日）
    const completedPurchases = data.filter(p => p.status === 'completed' && p.completedDate);
    const avgProcessingTime = completedPurchases.length > 0
      ? completedPurchases.reduce((sum, p) => {
          const start = new Date(p.timestamp);
          const end = new Date(p.completedDate);
          const days = (end - start) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / completedPurchases.length
      : 0;
    
    // ステータス別
    const byStatus = {
      pending: data.filter(p => p.status === 'pending').length,
      inProgress: data.filter(p => p.status === 'inProgress').length,
      proposed: data.filter(p => p.status === 'proposed').length,
      paymentPending: data.filter(p => p.status === 'paymentPending').length,
      awaitingPickup: data.filter(p => p.status === 'awaitingPickup').length,
      completed: completedCount
    };
    
    // 担当者別
    const byStaff = {};
    data.forEach(p => {
      const staff = p.assignedTo || '未割当';
      if (!byStaff[staff]) {
        byStaff[staff] = {
          total: 0,
          completed: 0,
          totalRevenue: 0,
          avgEstimate: 0
        };
      }
      byStaff[staff].total++;
      if (p.status === 'completed') {
        byStaff[staff].completed++;
        byStaff[staff].totalRevenue += p.estimatedPrice || 0;
      }
    });
    
    // 平均査定額を計算
    Object.keys(byStaff).forEach(staff => {
      if (byStaff[staff].completed > 0) {
        byStaff[staff].avgEstimate = Math.round(byStaff[staff].totalRevenue / byStaff[staff].completed);
      }
    });
    
    // 月別売上
    const monthlyRevenue = {};
    data
      .filter(p => p.status === 'completed' && p.completedDate && p.estimatedPrice)
      .forEach(p => {
        const month = p.completedDate.substring(0, 7); // YYYY-MM
        if (!monthlyRevenue[month]) {
          monthlyRevenue[month] = 0;
        }
        monthlyRevenue[month] += p.estimatedPrice;
      });
    
    // アラート
    const alerts = [];
    const now = new Date();
    data.forEach(p => {
      if (p.status === 'inProgress') {
        const start = new Date(p.timestamp);
        const days = (now - start) / (1000 * 60 * 60 * 24);
        if (days > 3) {
          alerts.push({
            type: 'warning',
            message: `対応中が3日以上: ${p.id} - ${p.customerName}`
          });
        }
      }
      if (p.status === 'paymentPending') {
        const start = new Date(p.approvedDate || p.timestamp);
        const days = (now - start) / (1000 * 60 * 60 * 24);
        if (days > 7) {
          alerts.push({
            type: 'danger',
            message: `入金確認待ちが7日以上: ${p.id} - ${p.customerName}`
          });
        }
      }
    });
    
    setStats({
      overview: {
        totalPurchases,
        completionRate,
        totalRevenue,
        avgProcessingTime: avgProcessingTime.toFixed(1)
      },
      byStatus,
      byStaff,
      monthlyRevenue,
      alerts
    });
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

  if (!stats) return null;

  // 月別売上のグラフデータ
  const monthlyData = Object.entries(stats.monthlyRevenue).sort();
  const maxRevenue = Math.max(...Object.values(stats.monthlyRevenue));

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
                <h1 className="text-3xl font-bold">ダッシュボード</h1>
                <p className="text-amber-100 text-sm mt-1">Analytics & Reports</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-amber-100">ログイン中</p>
              <p className="font-semibold">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* 概要統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">総依頼件数</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{stats.overview.totalPurchases}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">完了率</p>
                <p className="text-3xl font-bold text-emerald-900 mt-2">{stats.overview.completionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">総売上</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">
                  ¥{stats.overview.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">平均処理時間</p>
                <p className="text-3xl font-bold text-orange-900 mt-2">{stats.overview.avgProcessingTime}日</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* アラート */}
        {stats.alerts.length > 0 && (
          <div className="bg-red-50 rounded-2xl p-6 shadow-lg border-2 border-red-200 mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-red-900">アラート ({stats.alerts.length}件)</h2>
            </div>
            <div className="space-y-2">
              {stats.alerts.slice(0, 5).map((alert, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border-l-4 border-red-500">
                  <p className="text-sm text-gray-900">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 月別売上グラフ */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">月別売上</h2>
            </div>
            <div className="space-y-3">
              {monthlyData.length > 0 ? (
                monthlyData.map(([month, revenue]) => (
                  <div key={month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700">{month}</span>
                      <span className="text-sm font-bold text-purple-900">
                        ¥{revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                        style={{ width: `${(revenue / maxRevenue) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">データがありません</p>
              )}
            </div>
          </div>

          {/* ステータス別 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="flex items-center space-x-2 mb-6">
              <PieChart className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">ステータス別</h2>
            </div>
            <div className="space-y-3">
              {Object.entries(stats.byStatus).map(([status, count]) => {
                const labels = {
                  pending: '未対応',
                  inProgress: '対応中',
                  proposed: '提案中',
                  paymentPending: '入金確認中',
                  awaitingPickup: '商品到着待ち',
                  completed: '完了'
                };
                const colors = {
                  pending: 'bg-amber-500',
                  inProgress: 'bg-blue-500',
                  proposed: 'bg-purple-500',
                  paymentPending: 'bg-orange-500',
                  awaitingPickup: 'bg-cyan-500',
                  completed: 'bg-emerald-500'
                };
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${colors[status]}`}></div>
                      <span className="text-sm font-medium text-gray-700">{labels[status]}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{count}件</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 担当者別統計 */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b-2 border-gray-200">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">担当者別統計</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">担当者</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">担当件数</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">完了件数</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">完了率</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">総売上</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">平均査定額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(stats.byStaff).map(([staff, data]) => (
                  <tr key={staff} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{staff}</td>
                    <td className="px-6 py-4 text-gray-700">{data.total}件</td>
                    <td className="px-6 py-4 text-gray-700">{data.completed}件</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                        {data.total > 0 ? ((data.completed / data.total) * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-purple-900">
                      ¥{data.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      ¥{data.avgEstimate.toLocaleString()}
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

export default Dashboard;
