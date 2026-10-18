import express from 'express';
import cors from 'cors';
import { logAudit } from './utils/audit.js';
import { getOrder, postDish } from './controllers/dishes.controller.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    logAudit('HEALTH_CHECK', { ip: req.ip });
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/orders/:id', getOrder);
  app.post('/api/dishes', postDish);

  return app;
}
