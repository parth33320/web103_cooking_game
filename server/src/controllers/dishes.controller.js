import { getOrderById, getAllIngredients } from '../repos/orders.repo.js';
import { createDish, getAllDishes, getDishById, updateDish, deleteDish } from '../repos/dishes.repo.js';
import { score } from '../domain/scoring.js';
import { generateReviewText } from '../domain/review.js';
import { logAudit } from '../utils/audit.js';

/**
 * Helper to validate dish ingredient lines
 *
 * Inputs: lines (array of { ingredientId, quantityG }), allIngredients (array of objects)
 * Outputs: null if valid, or error object { code, message } if invalid
 */
function validateDishLines(lines, allIngredients) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { code: 'VALIDATION_ERROR', message: 'Lines must be a non-empty array' };
  }

  const validIngIds = new Set(allIngredients.map((i) => i.id));
  const seenIngIds = new Set();

  for (const line of lines) {
    if (!line || typeof line !== 'object') {
      return { code: 'VALIDATION_ERROR', message: 'Each line must be an object' };
    }

    const { ingredientId, quantityG } = line;

    if (!ingredientId || typeof ingredientId !== 'number') {
      return { code: 'VALIDATION_ERROR', message: 'ingredientId must be a valid number' };
    }

    if (!validIngIds.has(ingredientId)) {
      return { code: 'INGREDIENT_NOT_FOUND', message: `Ingredient #${ingredientId} does not exist` };
    }

    if (seenIngIds.has(ingredientId)) {
      return { code: 'VALIDATION_ERROR', message: `Duplicate ingredient #${ingredientId} in dish lines` };
    }
    seenIngIds.add(ingredientId);

    if (
      quantityG === undefined ||
      typeof quantityG !== 'number' ||
      !Number.isInteger(quantityG) ||
      quantityG < 1 ||
      quantityG > 2000
    ) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'quantityG must be an integer between 1 and 2000 grams',
      };
    }
  }

  return null;
}

/**
 * Controller for Orders and Ingredients
 * Inputs: req.params.id
 * Outputs: JSON response { order, ingredients }
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
 * Controller to list all dishes
 * Inputs: none
 * Outputs: JSON response { dishes: Array }
 */
export async function getDishes(req, res) {
  try {
    const dishes = await getAllDishes();
    return res.status(200).json({ dishes });
  } catch (err) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

/**
 * Controller to get single dish details
 * Inputs: req.params.id
 * Outputs: JSON response { dish }
 */
export async function getDish(req, res) {
  try {
    const dishId = parseInt(req.params.id, 10);
    if (isNaN(dishId)) {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Dish ID must be a number' } });
    }

    const dish = await getDishById(dishId);
    if (!dish) {
      return res.status(404).json({ error: { code: 'DISH_NOT_FOUND', message: 'Dish not found' } });
    }

    return res.status(200).json({ dish });
  } catch (err) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

/**
 * Controller for Dish creation
 * Inputs: req.body { orderId, lines, seed? }
 * Outputs: 201 Created { dishId, stars, review, breakdown, lines }
 */
export async function postDish(req, res) {
  try {
    const { orderId, lines, seed } = req.body || {};
    if (!orderId || typeof orderId !== 'number') {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'orderId is required and must be a number' },
      });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    const ingredients = await getAllIngredients();

    const valErr = validateDishLines(lines, ingredients);
    if (valErr) {
      return res.status(400).json({ error: valErr });
    }

    const scoringSeed = seed !== undefined ? seed : orderId;

    const scoringResult = score({
      order,
      dish: { lines },
      prices: ingredients,
      seed: scoringSeed,
    });

    const reviewText = generateReviewText({
      breakdown: scoringResult.breakdown,
      stars: scoringResult.stars,
      favoriteName: order.favoriteIngredientName,
      seed: scoringSeed,
    });

    const dish = await createDish(
      orderId,
      lines,
      scoringResult.stars,
      reviewText,
      scoringResult.breakdown
    );

    logAudit('DISH_CREATED', { dishId: dish.id, orderId, stars: dish.stars });

    return res.status(201).json({
      dishId: dish.id,
      stars: dish.stars,
      review: reviewText,
      breakdown: scoringResult.breakdown,
      lines: dish.lines,
    });
  } catch (err) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

/**
 * Controller for Dish updates (PATCH)
 * Inputs: req.params.id, req.body { lines }
 * Outputs: 200 OK { dishId, stars, review, breakdown, lines }
 */
export async function patchDish(req, res) {
  try {
    const { lines } = req.body || {};
    const ingredients = await getAllIngredients();

    const valErr = validateDishLines(lines, ingredients);
    if (valErr) {
      return res.status(400).json({ error: valErr });
    }

    const dishId = parseInt(req.params.id, 10);
    if (isNaN(dishId)) {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Dish ID must be a number' } });
    }

    const existingDish = await getDishById(dishId);
    if (!existingDish) {
      return res.status(404).json({ error: { code: 'DISH_NOT_FOUND', message: 'Dish not found' } });
    }

    const order = await getOrderById(existingDish.orderId);

    const scoringResult = score({
      order,
      dish: { lines },
      prices: ingredients,
      seed: existingDish.orderId,
    });

    const reviewText = generateReviewText({
      breakdown: scoringResult.breakdown,
      stars: scoringResult.stars,
      favoriteName: order?.favoriteIngredientName,
      seed: existingDish.orderId,
    });

    const updated = await updateDish(
      dishId,
      lines,
      scoringResult.stars,
      reviewText,
      scoringResult.breakdown
    );

    logAudit('DISH_UPDATED', { dishId, stars: updated.stars });

    return res.status(200).json({
      dishId: updated.id,
      stars: updated.stars,
      review: reviewText,
      breakdown: scoringResult.breakdown,
      lines: updated.lines,
    });
  } catch (err) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

/**
 * Controller for Dish deletion
 * Inputs: req.params.id
 * Outputs: 204 No Content
 */
export async function removeDish(req, res) {
  try {
    const dishId = parseInt(req.params.id, 10);
    if (isNaN(dishId)) {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Dish ID must be a number' } });
    }

    const deleted = await deleteDish(dishId);
    if (!deleted) {
      return res.status(404).json({ error: { code: 'DISH_NOT_FOUND', message: 'Dish not found' } });
    }

    logAudit('DISH_DELETED', { dishId });

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}
