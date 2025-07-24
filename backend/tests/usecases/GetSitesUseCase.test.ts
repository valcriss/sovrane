import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetSitesUseCase } from '../../usecases/site/GetSitesUseCase';
import { SiteRepositoryPort } from '../../domain/ports/SiteRepositoryPort';
import { Site } from '../../domain/entities/Site';

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
    repository.findAll.mockResolvedValue([site]);

    const result = await useCase.execute();

    expect(result).toEqual([site]);
    expect(repository.findAll).toHaveBeenCalled();
  });
});
