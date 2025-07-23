import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreateSiteUseCase } from '../../usecases/CreateSiteUseCase';
import { SiteRepositoryPort } from '../../domain/ports/SiteRepositoryPort';
import { Site } from '../../domain/entities/Site';

describe('CreateSiteUseCase', () => {
  let repository: DeepMockProxy<SiteRepositoryPort>;
  let useCase: CreateSiteUseCase;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<SiteRepositoryPort>();
    useCase = new CreateSiteUseCase(repository);
    site = new Site('site-1', 'HQ');
  });

  it('should create a site via repository', async () => {
    repository.create.mockResolvedValue(site);

    const result = await useCase.execute(site);

    expect(result).toBe(site);
    expect(repository.create).toHaveBeenCalledWith(site);
  });
});
