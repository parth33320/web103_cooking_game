import express from 'express';
import { getSuppliers } from '../controllers/suppliers.controller.js';

export const suppliersRouter = express.Router();

suppliersRouter.get('/', getSuppliers);
