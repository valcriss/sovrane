import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';

class MockDepartmentRepository implements DepartmentRepositoryPort {
  private depts: Map<string, Department> = new Map();
  private labelIndex: Map<string, string> = new Map();

  async findById(id: string): Promise<Department | null> {
    return this.depts.get(id) || null;
  }

  async findByLabel(label: string): Promise<Department | null> {
    const id = this.labelIndex.get(label);
    return id ? this.depts.get(id) || null : null;
  }

  async create(dept: Department): Promise<Department> {
    this.depts.set(dept.id, dept);
    this.labelIndex.set(dept.label, dept.id);
    return dept;
  }

  async update(dept: Department): Promise<Department> {
    if (!this.depts.has(dept.id)) {
      throw new Error('Department not found');
    }
    const existing = this.depts.get(dept.id);
    if (existing) this.labelIndex.delete(existing.label);
    this.depts.set(dept.id, dept);
    this.labelIndex.set(dept.label, dept.id);
    return dept;
  }

  async delete(id: string): Promise<void> {
    const dept = this.depts.get(id);
    if (dept) {
      this.depts.delete(id);
      this.labelIndex.delete(dept.label);
    }
  }

  clear(): void {
    this.depts.clear();
    this.labelIndex.clear();
  }
}

describe('DepartmentRepositoryPort Interface', () => {
  let repo: MockDepartmentRepository;
  let dept: Department;

  beforeEach(() => {
    repo = new MockDepartmentRepository();
    dept = new Department('dept-1', 'IT');
  });

  afterEach(() => {
    repo.clear();
  });

  it('should create and retrieve a department', async () => {
    await repo.create(dept);
    expect(await repo.findById('dept-1')).toEqual(dept);
    expect(await repo.findByLabel('IT')).toEqual(dept);
  });

  it('should update an existing department', async () => {
    await repo.create(dept);
    dept.label = 'Tech';
    const updated = await repo.update(dept);
    expect(updated.label).toBe('Tech');
    expect(await repo.findByLabel('Tech')).toEqual(dept);
  });

  it('should delete a department', async () => {
    await repo.create(dept);
    await repo.delete('dept-1');
    expect(await repo.findById('dept-1')).toBeNull();
  });
});
