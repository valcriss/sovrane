import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UpdateSiteUseCase } from '../../usecases/UpdateSiteUseCase';
import { SiteRepositoryPort } from '../../domain/ports/SiteRepositoryPort';
import { Site } from '../../domain/entities/Site';

describe('UpdateSiteUseCase', () => {
  let repository: DeepMockProxy<SiteRepositoryPort>;
  let useCase: UpdateSiteUseCase;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<SiteRepositoryPort>();
    useCase = new UpdateSiteUseCase(repository);
    site = new Site('site-1', 'HQ');
  });

  it('should update a site via repository', async () => {
    repository.update.mockResolvedValue(site);

    const result = await useCase.execute(site);

    expect(result).toBe(site);
    expect(repository.update).toHaveBeenCalledWith(site);
  });
});
