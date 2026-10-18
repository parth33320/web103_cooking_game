import { resetDatabase, newGame, getGameState, processNextDay } from '../repos/game.repo.js';
import { logAudit } from '../utils/audit.js';

/**
 * Controller for POST /api/game/reset
 * Inputs: req (Express Request)
 * Outputs: 200 OK { message, player, kitchen, orders }
 */
export async function handleResetGame(req, res) {
  try {
    const gameState = await resetDatabase();
    logAudit('GAME_RESET', {
      playerId: gameState.player.id,
      kitchenId: gameState.kitchen.id,
    });

    return res.status(200).json({
      message: 'Database reset to default seed state',
      player: gameState.player,
      kitchen: gameState.kitchen,
      orders: gameState.orders,
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
}

/**
 * Controller for POST /api/game/new
 * Inputs: req.body { playerName?, kitchenName? }
 * Outputs: 201 Created { message, player, kitchen, orders }
 */
export async function handleNewGame(req, res) {
  try {
    const { playerName, kitchenName } = req.body || {};

    if (playerName !== undefined) {
      if (typeof playerName !== 'string' || playerName.length > 100) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'playerName must be a string up to 100 characters' },
        });
      }
    }

    if (kitchenName !== undefined) {
      if (typeof kitchenName !== 'string' || kitchenName.length > 100) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'kitchenName must be a string up to 100 characters' },
        });
      }
    }

    const gameState = await newGame({
      playerName: playerName ? playerName.trim() : undefined,
      kitchenName: kitchenName ? kitchenName.trim() : undefined,
    });

    logAudit('GAME_NEW', {
      playerId: gameState.player.id,
      kitchenId: gameState.kitchen.id,
      playerName: gameState.player.name,
      kitchenName: gameState.kitchen.name,
    });

    return res.status(201).json({
      message: 'New game started',
      player: gameState.player,
      kitchen: gameState.kitchen,
      orders: gameState.orders,
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
}

/**
 * Controller for GET /api/game/state
 * Inputs: req (Express Request)
 * Outputs: 200 OK { player, kitchen, orders, activeEvents }
 */
export async function handleGetGameState(req, res) {
  try {
    const gameState = await getGameState();
    return res.status(200).json(gameState);
  } catch (err) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
}

/**
 * Controller for POST /api/game/next-day
 * Inputs: req.body { kitchenId? }
 * Outputs: 200 OK { message, rentCharged, unservedPenalties, unservedOrdersCount, gameOver, gameOverReason, player, kitchen, orders, activeEvents }
 */
export async function handleNextDay(req, res) {
  try {
    const { kitchenId } = req.body || {};

    if (kitchenId !== undefined) {
      if (!Number.isInteger(kitchenId) || kitchenId <= 0) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'kitchenId must be a positive integer' },
        });
      }
    }

    const result = await processNextDay(kitchenId);

    logAudit('GAME_NEXT_DAY', {
      kitchenId: result.kitchen.id,
      day: result.kitchen.day,
      wallet: result.kitchen.wallet,
      reputation: result.kitchen.reputation,
      gameOver: result.gameOver,
    });

    return res.status(200).json(result);
  } catch (err) {
    if (err.message === 'Kitchen not found') {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: err.message },
      });
    }
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
}
