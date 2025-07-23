import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AddChildDepartmentUseCase } from '../../../usecases/department/AddChildDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('AddChildDepartmentUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: AddChildDepartmentUseCase;
  let child: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    useCase = new AddChildDepartmentUseCase(repository);
    site = new Site('site-1', 'HQ');
    child = new Department('child', 'IT', null, null, site);
  });

  it('should set parent on child department', async () => {
    repository.findById.mockResolvedValue(child);
    repository.update.mockResolvedValue(child);

    const result = await useCase.execute('parent', 'child');

    expect(result).toBe(child);
    expect(child.parentDepartmentId).toBe('parent');
    expect(repository.update).toHaveBeenCalledWith(child);
  });

  it('should return null when child not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('parent', 'missing');

    expect(result).toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
