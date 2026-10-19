import express from 'express';
import { getCosmetics, handlePurchaseCosmetic, handleEquipCosmetic } from '../controllers/cosmetics.controller.js';

export const cosmeticsRouter = express.Router();

cosmeticsRouter.get('/', getCosmetics);
cosmeticsRouter.post('/:id/purchase', handlePurchaseCosmetic);
cosmeticsRouter.post('/:id/equip', handleEquipCosmetic);
