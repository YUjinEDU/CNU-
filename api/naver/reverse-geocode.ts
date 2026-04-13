import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { coords, output, orders } = req.query;
  if (!coords) {
    return res.status(400).json({ error: 'coords parameter required' });
  }

  const clientId = process.env.VITE_NAVER_CLIENT_ID || process.env.NAVER_CLIENT_ID || '';
  const clientSecret = process.env.NAVER_CLIENT_SECRET || '';

  try {
    const params = new URLSearchParams({
      coords: String(coords),
      output: String(output || 'json'),
      orders: String(orders || 'roadaddr,addr'),
    });
    const response = await fetch(
      `https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc?${params}`,
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
    return res.status(500).json({ error: err.message || 'Reverse geocoding failed' });
  }
}
