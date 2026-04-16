import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Cookieを削除
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })
  );

  return res.status(200).json({ message: 'Logged out successfully' });
}
