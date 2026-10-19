import { listCosmetics, purchaseCosmetic, equipCosmetic } from '../repos/cosmetics.repo.js';
import { logAudit } from '../utils/audit.js';

/**
 * Controller for Cosmetics Shop
 */

export async function getCosmetics(req, res, next) {
  try {
    const cosmetics = await listCosmetics(1);
    res.status(200).json({ cosmetics });
  } catch (err) {
    next(err);
  }
}

export async function handlePurchaseCosmetic(req, res, next) {
  try {
    const cosmeticId = parseInt(req.params.id, 10);
    if (isNaN(cosmeticId) || cosmeticId <= 0) {
      const err = new Error('Invalid cosmetic ID parameter');
      err.code = 'INVALID_PARAMETER';
      err.status = 400;
      return next(err);
    }

    const result = await purchaseCosmetic(1, cosmeticId);
    await logAudit('PURCHASE_COSMETIC', { kitchenId: 1, cosmeticId, price: result.cosmetic.price, remainingWallet: result.wallet });

    res.status(200).json({
      message: 'Cosmetic purchased successfully',
      cosmetic: result.cosmetic,
      wallet: result.wallet,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleEquipCosmetic(req, res, next) {
  try {
    const cosmeticId = parseInt(req.params.id, 10);
    if (isNaN(cosmeticId) || cosmeticId <= 0) {
      const err = new Error('Invalid cosmetic ID parameter');
      err.code = 'INVALID_PARAMETER';
      err.status = 400;
      return next(err);
    }

    const result = await equipCosmetic(1, cosmeticId);
    await logAudit('EQUIP_COSMETIC', { kitchenId: 1, cosmeticId, type: result.type });

    res.status(200).json({
      message: 'Cosmetic equipped successfully',
      cosmeticId: result.cosmeticId,
      type: result.type,
      equipped: true,
    });
  } catch (err) {
    next(err);
  }
}
