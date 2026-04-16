import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // JWTトークン検証
    const decoded = jwt.verify(token, JWT_SECRET);

    // Firestoreから最新のユーザー情報を取得
    const userDoc = await getDoc(doc(db, 'users', decoded.userId));

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // ステータスチェック
    if (userData.status === 'disabled') {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    return res.status(200).json({
      user: {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'viewer'
      }
    });

  } catch (error) {
    console.error('Session error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
