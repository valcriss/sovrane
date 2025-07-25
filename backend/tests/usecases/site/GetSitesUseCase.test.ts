import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetSitesUseCase } from '../../../usecases/site/GetSitesUseCase';
import { SiteRepositoryPort } from '../../../domain/ports/SiteRepositoryPort';
import { Site } from '../../../domain/entities/Site';

describe('GetSitesUseCase', () => {
  let repository: DeepMockProxy<SiteRepositoryPort>;
  let useCase: GetSitesUseCase;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<SiteRepositoryPort>();
    useCase = new GetSitesUseCase(repository);
    site = new Site('s', 'Site');
  });

  it('should return sites from repository', async () => {
    repository.findPage.mockResolvedValue({ items: [site], page: 1, limit: 20, total: 1 });

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([site]);
    expect(repository.findPage).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });
});
