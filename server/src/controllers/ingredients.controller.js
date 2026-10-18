import { getIngredients } from '../repos/orders.repo.js';

/**
 * Controller to list ingredients with category filtering and sorting
 *
 * Inputs: req.query { category?, sort?, order? }
 * Outputs: JSON response { ingredients: Array } or 400 validation error
 */
export async function listIngredients(req, res) {
  try {
    const { category, sort, order } = req.query || {};

    // Validate sort parameter
    if (sort !== undefined && sort !== 'price' && sort !== 'protein') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid sort field. Allowed values: price, protein',
        },
      });
    }

    // Validate order parameter
    if (order !== undefined && order !== 'asc' && order !== 'desc') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid order direction. Allowed values: asc, desc',
        },
      });
    }

    const ingredients = await getIngredients({ category, sort, order });
    return res.status(200).json({ ingredients });
  } catch (err) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message,
      },
    });
  }
}
