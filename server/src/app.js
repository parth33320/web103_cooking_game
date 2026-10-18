import express from 'express';
import cors from 'cors';
import { logAudit } from './utils/audit.js';
import { getOrder, postDish, getDishes, getDish, patchDish, removeDish } from './controllers/dishes.controller.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    logAudit('HEALTH_CHECK', { ip: req.ip });
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/orders/:id', getOrder);
  app.get('/api/dishes', getDishes);
  app.get('/api/dishes/:id', getDish);
  app.post('/api/dishes', postDish);
  app.patch('/api/dishes/:id', patchDish);
  app.delete('/api/dishes/:id', removeDish);

  return app;
}
