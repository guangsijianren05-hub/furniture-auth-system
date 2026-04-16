import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Firestoreからユーザーを検索
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // ステータスチェック
    if (userData.status === 'disabled') {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    // パスワード検証
    const isPasswordValid = await bcrypt.compare(password, userData.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // JWTトークン生成
    const token = jwt.sign(
      {
        userId: userDoc.id,
        email: userData.email,
        role: userData.role || 'viewer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // httpOnly Cookieに保存
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      })
    );

    // ユーザー情報を返す（パスワードハッシュは除く）
    return res.status(200).json({
      user: {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'viewer'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
