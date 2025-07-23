import express, { Request, Response, Router } from 'express';
import { SiteRepositoryPort } from '../../../domain/ports/SiteRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { CreateSiteUseCase } from '../../../usecases/site/CreateSiteUseCase';
import { UpdateSiteUseCase } from '../../../usecases/site/UpdateSiteUseCase';
import { RemoveSiteUseCase } from '../../../usecases/site/RemoveSiteUseCase';
import { Site } from '../../../domain/entities/Site';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { getContext } from '../../../infrastructure/loggerContext';

/**
 * Create an Express router exposing site management routes.
 *
 * @param siteRepository - Repository used to persist sites.
 * @param userRepository - Repository to check user attachments.
 * @param departmentRepository - Repository to check department attachments.
 */
export function createSiteRouter(
  siteRepository: SiteRepositoryPort,
  userRepository: UserRepositoryPort,
  departmentRepository: DepartmentRepositoryPort,
  logger: LoggerPort,
): Router {
  const router = express.Router();

  router.post('/sites', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /sites', getContext());
    const { id, label } = req.body;
    const useCase = new CreateSiteUseCase(siteRepository);
    const site = await useCase.execute(new Site(id, label));
    logger.debug('Site created', getContext());
    res.status(201).json(site);
  });

  router.put('/sites/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /sites/:id', getContext());
    const { label } = req.body;
    const { id } = req.params;
    const useCase = new UpdateSiteUseCase(siteRepository);
    const site = await useCase.execute(new Site(id, label));
    logger.debug('Site updated', getContext());
    res.json(site);
  });

  router.delete('/sites/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('DELETE /sites/:id', getContext());
    const { id } = req.params;
    const useCase = new RemoveSiteUseCase(siteRepository, userRepository, departmentRepository);
    try {
      await useCase.execute(id);
      logger.debug('Site deleted', getContext());
      res.status(204).end();
    } catch (err) {
      logger.warn('Site deletion failed', { ...getContext(), error: err });
      res.status(400).json({ error: (err as Error).message });
    }
  });

  return router;
}
