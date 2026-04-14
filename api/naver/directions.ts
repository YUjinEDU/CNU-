import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkOrigin } from './_cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkOrigin(req, res)) return;
  const { start, goal, option } = req.query;
  if (!start || !goal) {
    return res.status(400).json({ error: 'start and goal parameters required' });
  }

  const clientId = process.env.VITE_NAVER_CLIENT_ID || process.env.NAVER_CLIENT_ID || '';
  const clientSecret = process.env.NAVER_CLIENT_SECRET || '';

  try {
    const params = new URLSearchParams({
      start: String(start),
      goal: String(goal),
      option: String(option || 'trafast'),
    });
    const response = await fetch(
      `https://maps.apigw.ntruss.com/map-direction/v1/driving?${params}`,
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
    return res.status(500).json({ error: err.message || 'Directions failed' });
  }
}
