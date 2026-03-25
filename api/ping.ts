import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ 
    pong: true, 
    env: process.env.NODE_ENV, 
    vercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString()
  });
}
