import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createSiteRouter } from '../../../../adapters/controllers/rest/siteController';
import { SiteRepositoryPort } from '../../../../domain/ports/SiteRepositoryPort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { DepartmentRepositoryPort } from '../../../../domain/ports/DepartmentRepositoryPort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { Site } from '../../../../domain/entities/Site';

describe('Site REST controller', () => {
  let app: express.Express;
  let siteRepo: DeepMockProxy<SiteRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let deptRepo: DeepMockProxy<DepartmentRepositoryPort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let site: Site;

  beforeEach(() => {
    siteRepo = mockDeep<SiteRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    deptRepo = mockDeep<DepartmentRepositoryPort>();
    logger = mockDeep<LoggerPort>();
    site = new Site('s', 'Site');
    userRepo.findBySiteId.mockResolvedValue([]);
    deptRepo.findBySiteId.mockResolvedValue([]);

    app = express();
    app.use(express.json());
    app.use('/api', createSiteRouter(siteRepo, userRepo, deptRepo, logger));
  });

  it('should create a site', async () => {
    siteRepo.create.mockResolvedValue(site);

    const res = await request(app)
      .post('/api/sites')
      .send({ id: 's', label: 'Site' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 's', label: 'Site' });
    expect(siteRepo.create).toHaveBeenCalled();
  });

  it('should update a site', async () => {
    const updated = new Site('s', 'New');
    siteRepo.update.mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/sites/s')
      .send({ label: 'New' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 's', label: 'New' });
    expect(siteRepo.update).toHaveBeenCalled();
  });

  it('should delete a site', async () => {
    const res = await request(app).delete('/api/sites/s');

    expect(res.status).toBe(204);
    expect(siteRepo.delete).toHaveBeenCalled();
  });

  it('should return 400 when deletion fails', async () => {
    userRepo.findBySiteId.mockResolvedValue([{} as any]);

    const res = await request(app).delete('/api/sites/s');

    expect(res.status).toBe(400);
    expect(siteRepo.delete).not.toHaveBeenCalled();
  });
});
