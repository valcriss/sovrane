import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetDepartmentParentUseCase } from '../../../usecases/department/GetDepartmentParentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';


describe('GetDepartmentParentUseCase', () => {
  let repo: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: GetDepartmentParentUseCase;
  let site: Site;
  let parent: Department;
  let child: Department;

  beforeEach(() => {
    repo = mockDeep<DepartmentRepositoryPort>();
    useCase = new GetDepartmentParentUseCase(repo);
    site = new Site('s', 'Site');
    parent = new Department('p','Parent',null,null,site);
    child = new Department('c','Child','p',null,site);
  });

  it('should return parent department', async () => {
    repo.findById.mockResolvedValueOnce(child).mockResolvedValueOnce(parent);

    const result = await useCase.execute('c');

    expect(result).toBe(parent);
    expect(repo.findById).toHaveBeenCalledTimes(2);
  });

  it('should return null when no parent', async () => {
    repo.findById.mockResolvedValue(new Department('c','Child',null,null,site));

    const result = await useCase.execute('c');

    expect(result).toBeNull();
  });
});
