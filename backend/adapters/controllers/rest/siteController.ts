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
 * @openapi
 * components:
 *   schemas:
 *     Site:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         label:
 *           type: string
 *       required:
 *         - id
 *         - label
 */

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

  /**
   * @openapi
  * /sites:
  *   post:
  *     summary: Create a site.
   *     tags:
   *       - Site
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Site'
   *     responses:
   *       201:
   *         description: Site created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Site'
   */
  router.post('/sites', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /sites', getContext());
    const { id, label } = req.body;
    const useCase = new CreateSiteUseCase(siteRepository);
    const site = await useCase.execute(new Site(id, label));
    logger.debug('Site created', getContext());
    res.status(201).json(site);
  });

  /**
   * @openapi
  * /sites/{id}:
  *   put:
  *     summary: Update a site.
   *     tags:
   *       - Site
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Site'
   *     responses:
   *       200:
   *         description: Updated site
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Site'
   */
  router.put('/sites/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /sites/:id', getContext());
    const { label } = req.body;
    const { id } = req.params;
    const useCase = new UpdateSiteUseCase(siteRepository);
    const site = await useCase.execute(new Site(id, label));
    logger.debug('Site updated', getContext());
    res.json(site);
  });

  /**
   * @openapi
  * /sites/{id}:
  *   delete:
  *     summary: Remove a site.
   *     tags:
   *       - Site
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       204:
   *         description: Site deleted
   *       400:
   *         description: Operation failed
   */
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
