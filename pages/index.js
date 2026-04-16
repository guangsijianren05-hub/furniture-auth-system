import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, Download, Upload, RefreshCw, Plus, X, Calendar, User, Package, Image as ImageIcon, History, Settings, FileText, MapPin, LogOut, CheckCircle } from 'lucide-react';

// ステータス定義（6段階） - コンポーネント外に移動
const STATUSES = {
  pending: { label: '未対応', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  inProgress: { label: '対応中', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  proposed: { label: '提案中', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  paymentPending: { label: '入金確認中', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  awaitingPickup: { label: '商品到着待ち', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  completed: { label: '完了', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
};

// カテゴリ定義 - コンポーネント外に移動
const CATEGORIES = ['ソファ', 'ラウンジチェア', 'ベッド', 'テーブル', 'チェア', 'デスク', '収納家具', 'その他'];

// 担当者リスト - コンポーネント外に移動
const STAFF = ['未割当', '山田', '佐藤', '鈴木', '田中'];

const FurniturePurchaseSystem = () => {
  const router = useRouter();
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  
  // すべてのフックを最初に配置（早期リターンの前）
  const fileInputRef = useRef(null);
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [selectedPurchases, setSelectedPurchases] = useState([]);
  const [bulkOperating, setBulkOperating] = useState(false);
  const [toast, setToast] = useState(null);

  // データ読み込み
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // フィルタリング
  useEffect(() => {
    let filtered = purchases;

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }

    setFilteredPurchases(filtered);
  }, [purchases, searchTerm, filterStatus, filterCategory]);

  // データ読み込み（Firestoreから）
  const loadData = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'purchases'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const purchasesData = [];
        querySnapshot.forEach((doc) => {
          purchasesData.push({ firestoreId: doc.id, ...doc.data() });
        });
        setPurchases(purchasesData);
      } else {
        // 初期サンプルデータ
        const sampleData = [
          {
            id: 'P0001',
            timestamp: '2026-04-15 10:30',
            customerName: '加納 大介',
            lineUserId: 'U61f69609bdbdd22b5a426cb16e56d433',
            lineName: 'kano',
            prefecture: '東京都',
            productName: 'ソファ - 匠ソファ LBワンアームカウチW1300',
            category: 'ソファ',
            brand: 'その他',
            purchaseYear: '1〜3年',
            condition: '目立った傷・汚れなし',
            photos: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400'],
            status: 'pending',
            assignedTo: '未割当',
            estimatedPrice: null,
            approved: false,
            approvedDate: null,
            paymentDate: null,
            paymentConfirmed: false,
            pickupDate: null,
            pickupConfirmed: false,
            pickupConfirmedBy: null,
            completedDate: null,
            notes: '匠ソファ　LBワンアームカウチW1300',
            history: [
              { timestamp: '2026-04-15 10:30', action: '新規依頼受付', user: 'システム' }
            ]
          },
          {
            id: 'P0002',
            timestamp: '2026-04-15 09:15',
            customerName: '佐藤映信',
            lineUserId: 'U3cd6fe334b81d97dda9ea9e0068f37a0',
            lineName: '佐藤映信/エイジン/A.Sato',
            prefecture: '福島県',
            productName: 'ソファ - by interiors SLED LOUNGE',
            category: 'ソファ',
            brand: 'その他',
            purchaseYear: '1〜3年',
            condition: '小さな傷・使用感あり',
            photos: [
              'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
              'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400'
            ],
            status: 'inProgress',
            assignedTo: '山田',
            estimatedPrice: null,
            approved: false,
            approvedDate: null,
            paymentDate: null,
            paymentConfirmed: false,
            pickupDate: null,
            pickupConfirmed: false,
            pickupConfirmedBy: null,
            completedDate: null,
            notes: 'デザイナーは津福達朗により設計されたこのソファは、同シリーズの「SLEDチェア」のプロポーションを継承し、ミニマルで洗練されたフォルムが特徴。',
            history: [
              { timestamp: '2026-04-15 09:15', action: '新規依頼受付', user: 'システム' },
              { timestamp: '2026-04-15 11:00', action: '担当者割当: 山田', user: '管理者' }
            ]
          },
          {
            id: 'P0003',
            timestamp: '2026-04-14 15:20',
            customerName: '小宮萌',
            lineUserId: 'U3bda2fc616fc688cb845650b7bde8f6c',
            lineName: 'moe futamura',
            prefecture: '東京都',
            productName: 'ベッド - シモンズ ケンドリック',
            category: 'ベッド',
            brand: 'その他',
            purchaseYear: '5年以上',
            condition: '目立った傷・汚れなし',
            photos: [
              'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400',
              'https://images.unsplash.com/photo-1578898886615-9b3e9f1e8e1f?w=400'
            ],
            status: 'proposed',
            assignedTo: '佐藤',
            estimatedPrice: 45000,
            approved: false,
            approvedDate: null,
            paymentDate: null,
            paymentConfirmed: false,
            pickupDate: null,
            pickupConfirmed: false,
            pickupConfirmedBy: null,
            completedDate: null,
            notes: 'シモンズで購入しました。ケンドリック、収納付きベッド、クイーン、ダークブラウン、サイドチェスト?あり',
            history: [
              { timestamp: '2026-04-14 15:20', action: '新規依頼受付', user: 'システム' },
              { timestamp: '2026-04-14 16:00', action: '担当者割当: 佐藤', user: '管理者' },
              { timestamp: '2026-04-15 10:00', action: '査定完了: ¥45,000', user: '佐藤' }
            ]
          }
        ];
        
        for (const purchase of sampleData) {
          await addDoc(collection(db, 'purchases'), purchase);
        }
        
        setPurchases(sampleData);
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      alert('データの読み込みに失敗しました。リロードしてください。');
    } finally {
      setIsLoading(false);
    }
  };

  // ログアウト処理
  const handleSignOut = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut();
      router.push('/login');
    }
  };

  // トースト通知を表示
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 購入依頼更新
  const updatePurchase = async (id, updates, actionDescription) => {
    try {
      const purchase = purchases.find(p => p.id === id);
      if (!purchase) return;

      const newHistory = [
        ...purchase.history,
        {
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          action: actionDescription,
          user: user?.email || '管理者'
        }
      ];

      let newStatus = purchase.status;
      
      if (updates.assignedTo && updates.assignedTo !== '未割当' && purchase.status === 'pending') {
        newStatus = 'inProgress';
      }
      
      if (updates.estimatedPrice !== null && updates.estimatedPrice !== undefined && purchase.status === 'inProgress') {
        newStatus = 'proposed';
      }
      
      if (updates.approved && purchase.status === 'proposed') {
        newStatus = 'paymentPending';
        updates.approvedDate = new Date().toISOString().substring(0, 10);
      }
      
      if (updates.paymentConfirmed && purchase.status === 'paymentPending') {
        newStatus = 'awaitingPickup';
      }
      
      if (updates.pickupConfirmed && purchase.status === 'awaitingPickup') {
        newStatus = 'completed';
        updates.completedDate = new Date().toISOString().substring(0, 10);
        updates.pickupConfirmedBy = user?.email || '管理者';
      }

      const updatedData = {
        ...updates,
        status: newStatus,
        history: newHistory
      };

      if (purchase.firestoreId) {
        await updateDoc(doc(db, 'purchases', purchase.firestoreId), updatedData);
      }

      const updatedPurchases = purchases.map(p => 
        p.id === id ? { ...p, ...updatedData } : p
      );
      setPurchases(updatedPurchases);

      // ステータス変更時のトースト通知
      if (newStatus !== purchase.status) {
        const statusLabel = STATUSES[newStatus]?.label || newStatus;
        showToast(`ステータスを「${statusLabel}」に変更しました`, 'success');
      } else {
        showToast('更新しました', 'success');
      }

    } catch (error) {
      console.error('更新エラー:', error);
      showToast('データの更新に失敗しました', 'error');
    }
  };

  // 一括操作: 全選択/全解除
  const toggleSelectAll = () => {
    if (selectedPurchases.length === filteredPurchases.length) {
      setSelectedPurchases([]);
    } else {
      setSelectedPurchases(filteredPurchases.map(p => p.id));
    }
  };

  // 一括操作: 個別選択
  const toggleSelect = (id) => {
    if (selectedPurchases.includes(id)) {
      setSelectedPurchases(selectedPurchases.filter(pid => pid !== id));
    } else {
      setSelectedPurchases([...selectedPurchases, id]);
    }
  };

  // 一括操作: 担当者割り当て
  const bulkAssign = async (staffName) => {
    if (selectedPurchases.length === 0) {
      alert('依頼を選択してください');
      return;
    }
    
    if (!confirm(`選択した${selectedPurchases.length}件の依頼を ${staffName} に割り当てますか？`)) {
      return;
    }
    
    setBulkOperating(true);
    try {
      for (const purchaseId of selectedPurchases) {
        await updatePurchase(
          purchaseId,
          { assignedTo: staffName },
          `一括割当: ${staffName}`
        );
      }
      alert(`${selectedPurchases.length}件の依頼を ${staffName} に割り当てました`);
      setSelectedPurchases([]);
      await loadData();
    } catch (error) {
      console.error('一括割当エラー:', error);
      alert('一括割当に失敗しました');
    } finally {
      setBulkOperating(false);
    }
  };

  // 一括操作: ステータス変更
  const bulkChangeStatus = async (newStatus) => {
    if (selectedPurchases.length === 0) {
      alert('依頼を選択してください');
      return;
    }
    
    const statusLabel = STATUSES[newStatus]?.label || newStatus;
    if (!confirm(`選択した${selectedPurchases.length}件のステータスを「${statusLabel}」に変更しますか？`)) {
      return;
    }
    
    setBulkOperating(true);
    try {
      for (const purchaseId of selectedPurchases) {
        await updatePurchase(
          purchaseId,
          { status: newStatus },
          `一括ステータス変更: ${statusLabel}`
        );
      }
      alert(`${selectedPurchases.length}件のステータスを変更しました`);
      setSelectedPurchases([]);
      await loadData();
    } catch (error) {
      console.error('一括ステータス変更エラー:', error);
      alert('一括ステータス変更に失敗しました');
    } finally {
      setBulkOperating(false);
    }
  };

  // 一括操作: 選択分のみエクスポート
  const exportSelected = () => {
    if (selectedPurchases.length === 0) {
      alert('依頼を選択してください');
      return;
    }
    
    const selectedData = purchases.filter(p => selectedPurchases.includes(p.id));
    
    const headers = ['依頼ID', '受付日時', 'お客様名', '商品名', 'カテゴリ', '状態', 'ステータス', '担当者', '査定金額', '承認'];
    const rows = selectedData.map(p => [
      p.id,
      p.timestamp,
      p.customerName,
      p.productName,
      p.category,
      p.condition,
      STATUSES[p.status].label,
      p.assignedTo,
      p.estimatedPrice || '',
      p.approved ? '承認済' : '未承認'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `選択データ_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    alert(`${selectedPurchases.length}件をエクスポートしました`);
  };

  // CSVエクスポート
  const exportToCSV = () => {
    const headers = ['依頼ID', '受付日時', 'お客様名', '商品名', 'カテゴリ', '状態', 'ステータス', '担当者', '査定金額', '承認'];
    const rows = purchases.map(p => [
      p.id,
      p.timestamp,
      p.customerName,
      p.productName,
      p.category,
      p.condition,
      STATUSES[p.status].label,
      p.assignedTo,
      p.estimatedPrice || '',
      p.approved ? '承認済' : '未承認'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `買取データ_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Google Sheets同期
  const syncFromSheets = async () => {
    if (!sheetsUrl) {
      alert('設定でGoogle SheetsのURLを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      alert('Google Sheets APIと連携します。\n※本実装時にAPIキーを設定して実装します。');
    } catch (error) {
      console.error('同期エラー:', error);
      alert('Google Sheetsとの同期に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // CSV読み込み
  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const errors = [];
    let addedCount = 0;
    let updatedCount = 0;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const newPurchases = [];
      const updatedPurchases = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        try {
          const values = [];
          let current = '';
          let inQuotes = false;
          
          for (let char of lines[i]) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());

          if (!values[0] || !values[2]) {
            errors.push({ row: i + 1, error: 'LINE IDまたは回答日時が空です' });
            continue;
          }

          const photos = [];
          for (let j = 12; j <= 16; j++) {
            if (values[j] && values[j].startsWith('http')) {
              photos.push(values[j]);
            }
          }

          const purchaseData = {
            timestamp: values[2],
            customerName: values[6] || '不明',
            lineUserId: values[0],
            lineName: values[4],
            prefecture: values[7] || '',
            productName: `${values[8] || '家具'} - ${values[9] || ''}`.trim(),
            category: values[8] || 'その他',
            brand: values[9] || 'その他',
            purchaseYear: values[10] || '',
            condition: values[11] || '',
            photos: photos,
            notes: values[17] || ''
          };

          const existing = purchases.find(p => 
            p.lineUserId === purchaseData.lineUserId && 
            p.timestamp === purchaseData.timestamp
          );

          if (existing) {
            updatedPurchases.push({
              ...existing,
              ...purchaseData,
              history: [
                ...existing.history,
                {
                  timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                  action: 'CSV再取り込みによる更新',
                  user: user?.email || 'システム'
                }
              ]
            });
            updatedCount++;
          } else {
            newPurchases.push({
              id: `P${String(purchases.length + newPurchases.length + 1).padStart(4, '0')}`,
              ...purchaseData,
              status: 'pending',
              assignedTo: '未割当',
              estimatedPrice: null,
              approved: false,
              approvedDate: null,
              paymentDate: null,
              paymentConfirmed: false,
              pickupDate: null,
              pickupConfirmed: false,
              pickupConfirmedBy: null,
              completedDate: null,
              history: [{
                timestamp: purchaseData.timestamp,
                action: 'CSV読み込みによる新規依頼受付',
                user: 'システム'
              }]
            });
            addedCount++;
          }
        } catch (rowError) {
          errors.push({ row: i + 1, error: rowError.message });
        }
      }

      const savedPurchases = [];
      
      for (const purchase of newPurchases) {
        const docRef = await addDoc(collection(db, 'purchases'), purchase);
        savedPurchases.push({ ...purchase, firestoreId: docRef.id });
      }

      for (const purchase of updatedPurchases) {
        if (purchase.firestoreId) {
          await updateDoc(doc(db, 'purchases', purchase.firestoreId), purchase);
        }
        savedPurchases.push(purchase);
      }

      const updatedAll = purchases.map(p => {
        const updated = updatedPurchases.find(u => u.id === p.id);
        return updated || p;
      });
      const allPurchases = [...updatedAll, ...savedPurchases.filter(sp => !purchases.find(p => p.id === sp.id))];
      setPurchases(allPurchases);
      
      let message = `CSV取り込み完了\n\n新規追加: ${addedCount}件\n更新: ${updatedCount}件`;
      if (errors.length > 0) {
        message += `\nエラー: ${errors.length}件\n\n`;
        errors.slice(0, 3).forEach(e => {
          message += `${e.row}行目: ${e.error}\n`;
        });
      }
      alert(message);

    } catch (error) {
      console.error('CSV読み込みエラー:', error);
      alert('CSVの読み込みに失敗しました。ファイル形式を確認してください。');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ステータス別の件数を計算
  const statusCounts = Object.keys(STATUSES).reduce((acc, status) => {
    acc[status] = purchases.filter(p => p.status === status).length;
    return acc;
  }, {});

  // 認証中は何も表示しない（早期リターンは全フックの後）
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-amber-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-semibold text-gray-700">読み込み中...</p>
        </div>
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
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-amber-900" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">家具買取管理システム</h1>
                <p className="text-amber-200 text-sm mt-1">Furniture Purchase Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                <User className="w-4 h-4" />
                <div className="text-sm">
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-xs text-amber-200">
                    {userRole === 'master' ? 'マスター' : 
                     userRole === 'admin' ? '管理者' : 
                     userRole === 'staff' ? '査定員' : '閲覧者'}
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-white/20"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">CSV取込</span>
              </button>
              <button
                onClick={syncFromSheets}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-white/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">同期</span>
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-white/20"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">エクスポート</span>
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-white/20"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">設定</span>
              </button>
              {user?.email === 'kento.879301@gmail.com' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center space-x-2 bg-purple-500/20 hover:bg-purple-500/30 px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-purple-300/30"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">ユーザー管理</span>
                </button>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-blue-300/30"
              >
                <Package className="w-4 h-4" />
                <span className="text-sm font-medium">ダッシュボード</span>
              </button>
              <button
                onClick={() => router.push('/manual')}
                className="flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-green-300/30"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">マニュアル</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-red-300/30"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">ログアウト</span>
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold mb-4">Google Sheets連携設定</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">スプレッドシートURL</label>
                  <input
                    type="text"
                    value={sheetsUrl}
                    onChange={(e) => setSheetsUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <button
                  onClick={async () => {
                    await window.storage.set('sheets-url', sheetsUrl);
                    alert('設定を保存しました');
                    setShowSettings(false);
                  }}
                  className="bg-white text-amber-900 px-6 py-2 rounded-lg font-semibold hover:bg-amber-100 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 一括操作バー */}
      {selectedPurchases.length > 0 && (
        <div className="bg-blue-600 text-white px-6 py-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-lg">{selectedPurchases.length}件選択中</span>
              <button
                onClick={() => setSelectedPurchases([])}
                className="text-sm underline hover:no-underline"
              >
                選択解除
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    bulkAssign(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-4 py-2 rounded-lg bg-white text-gray-900 font-medium"
                disabled={bulkOperating}
              >
                <option value="">担当者を一括割当...</option>
                {STAFF.filter(s => s !== '未割当').map(staff => (
                  <option key={staff} value={staff}>{staff}</option>
                ))}
              </select>
              
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    bulkChangeStatus(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-4 py-2 rounded-lg bg-white text-gray-900 font-medium"
                disabled={bulkOperating}
              >
                <option value="">ステータスを一括変更...</option>
                {Object.entries(STATUSES).map(([key, status]) => (
                  <option key={key} value={key}>{status.label}</option>
                ))}
              </select>
              
              <button
                onClick={exportSelected}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2"
                disabled={bulkOperating}
              >
                <Download className="w-4 h-4" />
                <span>選択分をエクスポート</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Object.entries(STATUSES).map(([key, status]) => (
            <div
              key={key}
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-amber-100 hover:shadow-xl transition-all cursor-pointer hover:scale-105"
              onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{status.label}</p>
                  <p className="text-4xl font-bold text-amber-900 mt-2">{statusCounts[key]}</p>
                </div>
                <div className={`w-16 h-16 rounded-2xl ${status.color.split(' ')[0]} flex items-center justify-center`}>
                  <Package className={`w-8 h-8 ${status.color.split(' ')[1]}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-amber-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="お客様名、商品名、IDで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">全てのステータス</option>
              {Object.entries(STATUSES).map(([key, status]) => (
                <option key={key} value={key}>{status.label}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">全てのカテゴリ</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {Object.entries(STATUSES).map(([statusKey, status]) => {
            const statusPurchases = filteredPurchases.filter(p => p.status === statusKey);
            
            return (
              <div key={statusKey} className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border-2 border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">{status.label}</h3>
                  <span className="text-sm font-semibold text-gray-600 bg-amber-100 px-3 py-1 rounded-full">
                    {statusPurchases.length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {statusPurchases.map(purchase => (
                    <div
                      key={purchase.id}
                      className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-amber-400 relative"
                    >
                      {/* チェックボックス */}
                      <input
                        type="checkbox"
                        checked={selectedPurchases.includes(purchase.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(purchase.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 left-2 w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer z-10"
                      />
                      
                      <div onClick={() => setSelectedPurchase(purchase)} className="cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 ml-7">
                            <p className="text-xs font-semibold text-amber-600 mb-1">{purchase.id}</p>
                            <h4 className="font-bold text-gray-900 text-sm mb-1">{purchase.productName}</h4>
                            <p className="text-xs text-gray-600">{purchase.customerName}</p>
                          </div>
                          {purchase.photos && purchase.photos.length > 0 && (
                            <img
                              src={purchase.photos[0]}
                              alt={purchase.productName}
                              className="w-12 h-12 rounded-lg object-cover ml-2"
                            />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {purchase.timestamp.split(' ')[0]}
                          </span>
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {purchase.assignedTo}
                          </span>
                        </div>
                        
                        {purchase.estimatedPrice && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-sm font-bold text-amber-700">
                              ¥{purchase.estimatedPrice.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {statusPurchases.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      該当する依頼がありません
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-amber-900 to-orange-900 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">依頼詳細</h2>
                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">依頼ID</label>
                  <p className="text-lg font-bold text-amber-900 mt-1">{selectedPurchase.id}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">受付日時</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedPurchase.timestamp}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">お客様名</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedPurchase.customerName}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">都道府県</label>
                  <p className="text-lg font-bold text-gray-900 mt-1 flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-amber-600" />
                    {selectedPurchase.prefecture || '未登録'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">LINE名</label>
                  <p className="text-base text-gray-700 mt-1">{selectedPurchase.lineName || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">ステータス</label>
                  <p className={`inline-block px-4 py-2 rounded-lg text-sm font-bold mt-1 ${STATUSES[selectedPurchase.status].color}`}>
                    {STATUSES[selectedPurchase.status].label}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">商品情報</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">商品名</label>
                    <p className="text-base font-semibold text-gray-900 mt-1">{selectedPurchase.productName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">カテゴリ</label>
                      <p className="text-base text-gray-900 mt-1">{selectedPurchase.category}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">ブランド</label>
                      <p className="text-base text-gray-900 mt-1">{selectedPurchase.brand || 'その他'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">購入時期・使用年数</label>
                      <p className="text-base text-gray-900 mt-1">{selectedPurchase.purchaseYear || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">商品の状態</label>
                      <p className="text-base text-gray-900 mt-1">{selectedPurchase.condition}</p>
                    </div>
                  </div>
                  {selectedPurchase.notes && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">備考・詳細</label>
                      <p className="text-base text-gray-700 mt-1 whitespace-pre-wrap">{selectedPurchase.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedPurchase.photos && selectedPurchase.photos.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase mb-3 block">
                    商品写真（{selectedPurchase.photos.length}枚）
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedPurchase.photos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={photo}
                          alt={`商品写真 ${idx + 1}`}
                          className="w-full h-40 object-cover rounded-xl border-2 border-amber-200 group-hover:border-amber-400 transition-all cursor-pointer"
                          onClick={() => window.open(photo, '_blank')}
                        />
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {idx + 1}/{selectedPurchase.photos.length}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">※ 画像をクリックすると拡大表示されます</p>
                </div>
              )}

              <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">査定情報</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">担当者</label>
                    <select
                      value={selectedPurchase.assignedTo}
                      onChange={(e) => {
                        updatePurchase(
                          selectedPurchase.id,
                          { assignedTo: e.target.value },
                          `担当者割当: ${e.target.value}`
                        );
                        setSelectedPurchase({ ...selectedPurchase, assignedTo: e.target.value });
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      {STAFF.map(staff => (
                        <option key={staff} value={staff}>{staff}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">査定金額（円）</label>
                    <input
                      type="number"
                      value={selectedPurchase.estimatedPrice || ''}
                      onChange={(e) => {
                        const price = parseInt(e.target.value) || null;
                        updatePurchase(
                          selectedPurchase.id,
                          { estimatedPrice: price },
                          `査定完了: ¥${price?.toLocaleString() || 0}`
                        );
                        setSelectedPurchase({ ...selectedPurchase, estimatedPrice: price });
                      }}
                      placeholder="査定金額を入力"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-lg"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <input
                      type="checkbox"
                      id="approved"
                      checked={selectedPurchase.approved}
                      onChange={(e) => {
                        // バリデーション: 査定金額が入力されていない場合は承認不可
                        if (e.target.checked && !selectedPurchase.estimatedPrice) {
                          showToast('査定金額を入力してください', 'error');
                          return;
                        }
                        
                        updatePurchase(
                          selectedPurchase.id,
                          { approved: e.target.checked },
                          e.target.checked ? '買取承認' : '承認取消'
                        );
                        setSelectedPurchase({ ...selectedPurchase, approved: e.target.checked });
                      }}
                      className="w-6 h-6 rounded border-2 border-gray-300 text-amber-600 focus:ring-2 focus:ring-amber-500"
                    />
                    <label htmlFor="approved" className="text-base font-semibold text-gray-900">
                      買取承認
                      {!selectedPurchase.estimatedPrice && (
                        <span className="text-red-500 text-sm ml-2">（査定金額を入力してください）</span>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {(selectedPurchase.status === 'paymentPending' || selectedPurchase.status === 'awaitingPickup' || selectedPurchase.status === 'completed') && (
                <div className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">入金確認</h3>
                  <div className="space-y-4">
                    {selectedPurchase.approvedDate && (
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">承認日</label>
                        <p className="text-base text-gray-900 mt-1">{selectedPurchase.approvedDate}</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">入金日</label>
                      <input
                        type="date"
                        value={selectedPurchase.paymentDate || ''}
                        onChange={(e) => {
                          updatePurchase(
                            selectedPurchase.id,
                            { paymentDate: e.target.value },
                            `入金日設定: ${e.target.value}`
                          );
                          setSelectedPurchase({ ...selectedPurchase, paymentDate: e.target.value });
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                      <input
                        type="checkbox"
                        id="paymentConfirmed"
                        checked={selectedPurchase.paymentConfirmed}
                        onChange={(e) => {
                          // バリデーション: 承認されていない場合は入金確認不可
                          if (e.target.checked && !selectedPurchase.approved) {
                            showToast('買取承認が完了していません', 'error');
                            return;
                          }
                          
                          updatePurchase(
                            selectedPurchase.id,
                            { paymentConfirmed: e.target.checked },
                            e.target.checked ? '入金確認完了' : '入金確認取消'
                          );
                          setSelectedPurchase({ ...selectedPurchase, paymentConfirmed: e.target.checked });
                        }}
                        className="w-6 h-6 rounded border-2 border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500"
                        disabled={selectedPurchase.status !== 'paymentPending'}
                      />
                      <label htmlFor="paymentConfirmed" className="text-base font-semibold text-gray-900 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-orange-600" />
                        入金確認済み
                        {!selectedPurchase.approved && selectedPurchase.status === 'paymentPending' && (
                          <span className="text-red-500 text-sm ml-2">（買取承認が必要です）</span>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {(selectedPurchase.status === 'awaitingPickup' || selectedPurchase.status === 'completed') && (
                <div className="bg-cyan-50 rounded-2xl p-6 border-2 border-cyan-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">商品到着確認</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">商品到着日</label>
                      <input
                        type="date"
                        value={selectedPurchase.pickupDate || ''}
                        onChange={(e) => {
                          updatePurchase(
                            selectedPurchase.id,
                            { pickupDate: e.target.value },
                            `商品到着日設定: ${e.target.value}`
                          );
                          setSelectedPurchase({ ...selectedPurchase, pickupDate: e.target.value });
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                      <input
                        type="checkbox"
                        id="pickupConfirmed"
                        checked={selectedPurchase.pickupConfirmed}
                        onChange={(e) => {
                          // バリデーション: 入金確認されていない場合は商品到着確認不可
                          if (e.target.checked && !selectedPurchase.paymentConfirmed) {
                            showToast('入金確認が完了していません', 'error');
                            return;
                          }
                          
                          updatePurchase(
                            selectedPurchase.id,
                            { pickupConfirmed: e.target.checked },
                            e.target.checked ? '商品到着確認完了（担当者確認済み）' : '商品到着確認取消'
                          );
                          setSelectedPurchase({ ...selectedPurchase, pickupConfirmed: e.target.checked });
                        }}
                        className="w-6 h-6 rounded border-2 border-gray-300 text-cyan-600 focus:ring-2 focus:ring-cyan-500"
                        disabled={selectedPurchase.status !== 'awaitingPickup'}
                      />
                      <label htmlFor="pickupConfirmed" className="text-base font-semibold text-gray-900 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-cyan-600" />
                        商品到着確認済み（担当者が実物確認）
                        {!selectedPurchase.paymentConfirmed && selectedPurchase.status === 'awaitingPickup' && (
                          <span className="text-red-500 text-sm ml-2">（入金確認が必要です）</span>
                        )}
                      </label>
                    </div>

                    {selectedPurchase.pickupConfirmedBy && (
                      <div className="bg-white rounded-xl p-3 border border-cyan-200">
                        <label className="text-xs font-semibold text-gray-600 uppercase block">確認者</label>
                        <p className="text-base text-gray-900 mt-1">{selectedPurchase.pickupConfirmedBy}</p>
                      </div>
                    )}

                    {selectedPurchase.completedDate && (
                      <div className="bg-emerald-100 rounded-xl p-3 border-2 border-emerald-300">
                        <label className="text-xs font-semibold text-emerald-800 uppercase block">完了日</label>
                        <p className="text-base font-bold text-emerald-900 mt-1">{selectedPurchase.completedDate}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  変更履歴
                </h3>
                <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
                  <div className="space-y-3">
                    {selectedPurchase.history.map((entry, idx) => (
                      <div key={idx} className="flex items-start space-x-3 text-sm">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{entry.action}</p>
                          <p className="text-gray-600 text-xs mt-1">
                            {entry.timestamp} - {entry.user}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
              <p className="text-lg font-semibold text-gray-900">読み込み中...</p>
            </div>
          </div>
        </div>
      )}

      {/* トースト通知 */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
          <div className={`rounded-xl shadow-2xl p-4 min-w-[300px] border-2 ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
              : 'bg-red-50 border-red-300 text-red-900'
          }`}>
            <div className="flex items-center space-x-3">
              {toast.type === 'success' ? (
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              ) : (
                <X className="w-6 h-6 text-red-600" />
              )}
              <p className="font-semibold">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FurniturePurchaseSystem;
