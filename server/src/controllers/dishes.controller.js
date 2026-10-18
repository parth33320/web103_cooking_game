import { getOrderById, getAllIngredients } from '../repos/orders.repo.js';
import { createDish } from '../repos/dishes.repo.js';
import { score } from '../domain/scoring.js';
import { logAudit } from '../utils/audit.js';

/**
 * Controller for Orders and Ingredients
 */
export async function getOrder(req, res) {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Order ID must be a number' } });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    const ingredients = await getAllIngredients();
    return res.status(200).json({ order, ingredients });
  } catch (err) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

/**
 * Controller for Dish creation
 */
export async function postDish(req, res) {
  try {
    const { orderId, lines, seed } = req.body;
    if (!orderId || !Array.isArray(lines)) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'orderId and lines array are required' },
      });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    const ingredients = await getAllIngredients();

    const scoringResult = score({
      order,
      dish: { lines },
      prices: ingredients,
      seed: seed || orderId,
    });

    const dish = await createDish(orderId, lines, scoringResult.stars);

    logAudit('DISH_CREATED', { dishId: dish.id, orderId, stars: dish.stars });

    return res.status(201).json({
      dishId: dish.id,
      stars: dish.stars,
      review: scoringResult.review,
      breakdown: scoringResult.breakdown,
      lines: dish.lines,
    });
  } catch (err) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}
