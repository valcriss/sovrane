/* istanbul ignore file */
import express, { Request, Response, Router } from 'express';
import { GetConfigUseCase } from '../../../usecases/config/GetConfigUseCase';
import { UpdateConfigUseCase } from '../../../usecases/config/UpdateConfigUseCase';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     ConfigEntry:
 *       description: Application configuration entry.
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *           description: Configuration key.
 *         value:
 *           description: Stored configuration value.
 *           oneOf:
 *             - type: string
 *             - type: number
 *             - type: boolean
 *             - type: object
 *       required:
 *         - key
 *         - value
 * tags:
 *   - name: Config
 *     description: Manage application configuration
 */

/**
 * Create an Express router for application configuration management.
 */
export function createConfigRouter(
  getUseCase: GetConfigUseCase,
  updateUseCase: UpdateConfigUseCase,
  logger: LoggerPort,
): Router {
  const router = express.Router();

  /**
   * @openapi
   * /config/{key}:
   *   get:
   *     summary: Get configuration value
   *     description: Return the value for the specified configuration key.
   *     tags:
   *       - Config
   *     parameters:
   *       - in: path
   *         name: key
   *         required: true
   *         schema:
   *           type: string
   *         description: Identifier of the configuration entry.
   *     responses:
   *       200:
   *         description: Configuration value
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ConfigEntry'
   *       404:
   *         description: Configuration entry not found
   */
  router.get('/config/:key', async (req: Request, res: Response) => {
    const value = await getUseCase.execute(req.params.key);
    if (value === null) {
      res.status(404).end();
      return;
    }
    res.json({ key: req.params.key, value });
  });

  /**
   * @openapi
   * /config/{key}:
   *   put:
   *     summary: Update configuration value
   *     description: Update the value of a configuration entry.
   *     tags:
   *       - Config
   *     requestBody:
   *       description: New value and user identifier performing the update.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               value:
   *                 description: New value to store.
   *               updatedBy:
   *                 type: string
   *                 description: Identifier of the user updating the value.
   *             required:
   *               - value
   *               - updatedBy
   *     responses:
   *       204:
   *         description: Configuration updated successfully
   *       400:
   *         description: Validation error
   */
  router.put('/config/:key', async (req: Request, res: Response) => {
    try {
      await updateUseCase.execute(req.params.key, req.body.value, req.body.updatedBy);
      res.status(204).end();
    } catch (err) {
      logger.warn('Failed to update config', { error: err });
      res.status(400).json({ message: (err as Error).message });
    }
  });

  return router;
}
