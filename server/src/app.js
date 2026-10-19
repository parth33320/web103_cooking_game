import express from 'express';
import cors from 'cors';
import { logAudit } from './utils/audit.js';
import { getOrder, postDish, getDishes, getDish, patchDish, removeDish } from './controllers/dishes.controller.js';
import { listIngredients } from './controllers/ingredients.controller.js';
import { handleResetGame, handleNewGame, handleGetGameState, handleNextDay } from './controllers/game.controller.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    logAudit('HEALTH_CHECK', { ip: req.ip });
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/ingredients', listIngredients);
  app.get('/api/orders/:id', getOrder);
  app.get('/api/dishes', getDishes);
  app.get('/api/dishes/:id', getDish);
  app.post('/api/dishes', postDish);
  app.patch('/api/dishes/:id', patchDish);
  app.delete('/api/dishes/:id', removeDish);

  // Game control routes
  app.post('/api/game/reset', handleResetGame);
  app.post('/api/game/new', handleNewGame);
  app.get('/api/game/state', handleGetGameState);
  app.post('/api/game/next-day', handleNextDay);

  // Not found middleware for unmatched /api routes
  app.use('/api', notFoundHandler);

  // General error handling middleware
  app.use(errorHandler);

  return app;
}
