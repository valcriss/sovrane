import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveChildDepartmentUseCase } from '../../../usecases/department/RemoveChildDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('RemoveChildDepartmentUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: RemoveChildDepartmentUseCase;
  let child: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    useCase = new RemoveChildDepartmentUseCase(repository);
    site = new Site('site-1', 'HQ');
    child = new Department('child', 'IT', 'parent', null, site);
  });

  it('should remove parent from child department', async () => {
    repository.findById.mockResolvedValue(child);
    repository.update.mockResolvedValue(child);

    const result = await useCase.execute('child');

    expect(result).toBe(child);
    expect(child.parentDepartmentId).toBeNull();
    expect(repository.update).toHaveBeenCalledWith(child);
  });

  it('should return null when child not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing');

    expect(result).toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
