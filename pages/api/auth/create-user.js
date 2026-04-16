import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 認証チェック
async function verifyAuth(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.auth_token;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 認証チェック
  const currentUser = await verifyAuth(req);
  
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 権限チェック（masterまたはadminのみ）
  if (currentUser.role !== 'master' && currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { email, password, name, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // パスワードポリシー
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // 既存ユーザーチェック
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    // Firestoreに保存
    const docRef = await addDoc(collection(db, 'users'), {
      email,
      passwordHash,
      name: name || email.split('@')[0],
      role: role || 'viewer',
      createdAt: new Date().toISOString(),
      createdBy: currentUser.email,
      status: 'active'
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: docRef.id,
        email,
        name: name || email.split('@')[0],
        role: role || 'viewer'
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
