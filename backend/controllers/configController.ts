/* istanbul ignore file */
import express, { Request, Response, Router } from 'express';
import { GetConfigUseCase } from '../usecases/config/GetConfigUseCase';
import { UpdateConfigUseCase } from '../usecases/config/UpdateConfigUseCase';
import { LoggerPort } from '../domain/ports/LoggerPort';

/**
 * Create an Express router for application configuration management.
 */
export function createConfigRouter(
  getUseCase: GetConfigUseCase,
  updateUseCase: UpdateConfigUseCase,
  logger: LoggerPort,
): Router {
  const router = express.Router();

  router.get('/config/:key', async (req: Request, res: Response) => {
    const value = await getUseCase.execute(req.params.key);
    if (value === null) {
      res.status(404).end();
      return;
    }
    res.json({ key: req.params.key, value });
  });

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
