import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetSiteUseCase } from '../../usecases/site/GetSiteUseCase';
import { SiteRepositoryPort } from '../../domain/ports/SiteRepositoryPort';
import { Site } from '../../domain/entities/Site';

describe('GetSiteUseCase', () => {
  let repository: DeepMockProxy<SiteRepositoryPort>;
  let useCase: GetSiteUseCase;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<SiteRepositoryPort>();
    useCase = new GetSiteUseCase(repository);
    site = new Site('s', 'Site');
  });

  it('should return site by id', async () => {
    repository.findById.mockResolvedValue(site);

    const result = await useCase.execute('s');

    expect(result).toBe(site);
    expect(repository.findById).toHaveBeenCalledWith('s');
  });
});
