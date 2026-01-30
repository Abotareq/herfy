import app from './index.js';
import { connecToDb } from './utils/dbConnecion.js';

let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected) {
    try {
      await connecToDb();
      isConnected = true;
    } catch (error) {
      console.error('DB connection failed:', error);
      return res.status(500).json({ error: 'Database connection failed' });
    }
  }

  return app(req, res);
}

