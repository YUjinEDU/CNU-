import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkOrigin } from './_cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkOrigin(req, res)) return;
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'query parameter required' });
  }

  const clientId = process.env.VITE_NAVER_CLIENT_ID || process.env.NAVER_CLIENT_ID || '';
  const clientSecret = process.env.NAVER_CLIENT_SECRET || '';

  try {
    const params = new URLSearchParams({ query: String(query) });
    const response = await fetch(
      `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?${params}`,
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': clientId,
          'X-NCP-APIGW-API-KEY': clientSecret,
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: `Naver API error: ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Geocoding failed' });
  }
}
