import { getSuppliersWithTrust } from '../repos/suppliers.repo.js';

/**
 * Controller to list suppliers with kitchen trust and active discount percentage.
 *
 * Inputs: req (Express request)
 * Outputs: JSON response { suppliers: Array } or 500 error
 */
export async function getSuppliers(req, res) {
  try {
    const rawKitchenId = req.headers['x-kitchen-id'];
    const kitchenId = rawKitchenId ? parseInt(rawKitchenId, 10) : 1;
    const suppliers = await getSuppliersWithTrust(isNaN(kitchenId) ? 1 : kitchenId);
    return res.status(200).json({ suppliers });
  } catch (err) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message,
      },
    });
  }
}
