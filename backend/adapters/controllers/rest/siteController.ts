import express, { Request, Response, Router } from 'express';
import { SiteRepositoryPort } from '../../../domain/ports/SiteRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { CreateSiteUseCase } from '../../../usecases/site/CreateSiteUseCase';
import { UpdateSiteUseCase } from '../../../usecases/site/UpdateSiteUseCase';
import { RemoveSiteUseCase } from '../../../usecases/site/RemoveSiteUseCase';
import { GetSitesUseCase } from '../../../usecases/site/GetSitesUseCase';
import { GetSiteUseCase } from '../../../usecases/site/GetSiteUseCase';
import { Site } from '../../../domain/entities/Site';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { getContext } from '../../../infrastructure/loggerContext';

/**
 * @openapi
 * components:
 *   schemas:
 *     Site:
 *       description: Physical office or facility managed by the organization.
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier of the site.
 *         label:
 *           type: string
 *           description: Human readable name of the site.
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
   *   get:
   *     summary: Get all sites
   *     description: Returns the list of all sites.
   *     tags:
   *       - Site
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Paginated site list.
   *         parameters:
   *           - in: query
   *             name: page
   *             schema:
   *               type: integer
   *               default: 1
   *             description: Page number (starts at 1).
   *           - in: query
   *             name: limit
   *             schema:
   *               type: integer
   *               default: 20
   *             description: Number of sites per page.
   *           - in: query
   *             name: search
   *             schema:
   *               type: string
   *             description: Search term on the site label.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 items:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Site'
   *                 page:
   *                   type: integer
   *                 limit:
   *                   type: integer
   *                 total:
   *                   type: integer
  */
  router.get('/sites', async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /sites', getContext());
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const useCase = new GetSitesUseCase(siteRepository);
    const result = await useCase.execute({
      page,
      limit,
      filters: { search: req.query.search as string | undefined },
    });
    logger.debug('Sites retrieved', getContext());
    res.json(result);
  });

  /**
   * @openapi
   * /sites/{id}:
   *   get:
   *     summary: Get site by ID
   *     description: Returns detailed information about a specific site.
   *     tags:
   *       - Site
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Unique identifier of the site.
   *     responses:
   *       200:
   *         description: Site details.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Site'
   *       404:
   *         description: Site not found.
   */
  router.get('/sites/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /sites/:id', getContext());
    const useCase = new GetSiteUseCase(siteRepository);
    const site = await useCase.execute(req.params.id);
    if (!site) {
      logger.warn('Site not found', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Site retrieved', getContext());
    res.json(site);
  });

  /**
   * @openapi
  * /sites:
 *   post:
 *     summary: Create a site.
 *     description: |
 *       Adds a new physical site to the system. Authentication is required and
 *       the caller must have administrator privileges.
 *     tags:
 *       - Site
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Site information to create.
 *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Site'
   *     responses:
 *       201:
 *         description: Newly created site
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
 *     description: Modify the label of an existing site. Requires
 *       administrator privileges.
 *     tags:
 *       - Site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the site to update.
 *     requestBody:
 *       description: New site data.
 *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Site'
   *     responses:
 *       200:
 *         description: Site after update
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
 *     description: |
 *       Deletes a site. The operation fails when users or departments are still
 *       attached to it. Requires administrator privileges.
 *     tags:
 *       - Site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the site to delete.
 *     responses:
 *       204:
 *         description: Site successfully deleted
 *       400:
 *         description: Operation failed due to existing attachments
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
