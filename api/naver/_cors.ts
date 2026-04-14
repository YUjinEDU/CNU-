import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  'https://cnu-car.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

export function checkOrigin(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || req.headers.referer || '';
  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
  if (!isAllowed && origin) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}
