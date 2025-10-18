export const config = { runtime: 'nodejs18.x' };

export default function handler(_req: any, res: any) {
  return res.status(200).json({ message: 'hello from api', ts: Date.now() });
}