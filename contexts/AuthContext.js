import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { 
  validatePassword, 
  checkLoginAttempts, 
  recordLoginFailure, 
  resetLoginAttempts,
  checkSessionTimeout,
  updateSessionActivity,
  enforceHTTPS
} from '../lib/security';
import { 
  getFirebaseErrorMessage, 
  logError, 
  retryOperation,
  checkNetworkConnection 
} from '../lib/errorHandler';
import { 
  logLogin, 
  logLogout, 
  logUserCreation,
  logSessionTimeout 
} from '../lib/audit';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // HTTPS強制
  useEffect(() => {
    enforceHTTPS();
  }, []);

  // セッションタイムアウトチェック
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (checkSessionTimeout()) {
        handleSessionTimeout();
      }
    }, 60000); // 1分ごとにチェック

    return () => clearInterval(interval);
  }, [user]);

  // アクティビティ監視
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      updateSessionActivity();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [user]);

  const handleSessionTimeout = async () => {
    if (user) {
      await logSessionTimeout(user.uid, user.email);
      await firebaseSignOut(auth);
      setUser(null);
      setUserRole(null);
      alert('セッションがタイムアウトしました。再度ログインしてください。');
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // ユーザー情報とロールを取得
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUser(user);
            setUserRole(userDoc.data().role);
            updateSessionActivity(); // セッション開始
          } else {
            setUser(null);
            setUserRole(null);
          }
        } catch (error) {
          await logError(error, { context: 'auth_state_changed' });
          setUser(null);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    try {
      // ネットワークチェック
      const networkStatus = checkNetworkConnection();
      if (!networkStatus.online) {
        return {
          success: false,
          error: networkStatus.message,
          code: 'network-offline'
        };
      }

      // ログイン試行制限チェック
      const attemptCheck = checkLoginAttempts(email);
      if (attemptCheck.isLocked) {
        return {
          success: false,
          error: attemptCheck.message,
          code: 'account-locked'
        };
      }

      // リトライ機能付きログイン
      const result = await retryOperation(async () => {
        return await signInWithEmailAndPassword(auth, email, password);
      });

      // ログイン成功
      resetLoginAttempts(email);
      updateSessionActivity();
      
      // 監査ログ
      await logLogin(result.user.uid, result.user.email, true);

      return { success: true, user: result.user };
    } catch (error) {
      // ログイン失敗を記録
      const failureResult = recordLoginFailure(email);
      
      // 監査ログ
      await logLogin(null, email, false, error.message);
      
      // エラーログ
      await logError(error, { context: 'sign_in', email });

      let errorMessage = getFirebaseErrorMessage(error.code);
      
      if (failureResult.locked) {
        errorMessage = failureResult.message;
      } else if (failureResult.remainingAttempts) {
        errorMessage += `\n残り試行回数: ${failureResult.remainingAttempts}回`;
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code,
        canRetry: error.code === 'auth/network-request-failed'
      };
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        await logLogout(user.uid, user.email);
      }
      
      await firebaseSignOut(auth);
      setUser(null);
      setUserRole(null);
      return { success: true };
    } catch (error) {
      await logError(error, { context: 'sign_out' });
      return {
        success: false,
        error: getFirebaseErrorMessage(error.code)
      };
    }
  };

  const createUser = async (email, password, role, name) => {
    try {
      // パスワード強度チェック
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join('\n'),
          code: 'weak-password'
        };
      }

      // ネットワークチェック
      const networkStatus = checkNetworkConnection();
      if (!networkStatus.online) {
        return {
          success: false,
          error: networkStatus.message,
          code: 'network-offline'
        };
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Firestoreにユーザー情報を保存
      await setDoc(doc(db, 'users', result.user.uid), {
        email,
        role,
        name,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || null
      });

      // 監査ログ
      if (user) {
        await logUserCreation(user.uid, user.email, email, role);
      }

      return { success: true, user: result.user };
    } catch (error) {
      await logError(error, { context: 'create_user', email, role });
      
      return {
        success: false,
        error: getFirebaseErrorMessage(error.code),
        code: error.code
      };
    }
  };

  const value = {
    user,
    userRole,
    loading,
    signIn,
    signOut,
    createUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
