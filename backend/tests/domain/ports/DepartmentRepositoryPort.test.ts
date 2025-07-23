import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

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

  async findBySiteId(siteId: string): Promise<Department[]> {
    const result: Department[] = [];
    for (const dept of this.depts.values()) {
      if (dept.site.id === siteId) {
        result.push(dept);
      }
    }
    return result;
  }

  clear(): void {
    this.depts.clear();
    this.labelIndex.clear();
  }
}

describe('DepartmentRepositoryPort Interface', () => {
  let repo: MockDepartmentRepository;
  let dept: Department;
  let site: Site;

  beforeEach(() => {
    repo = new MockDepartmentRepository();
    site = new Site('site-1', 'HQ');
    dept = new Department('dept-1', 'IT', null, null, site);
  });

  afterEach(() => {
    repo.clear();
  });

  it('should create and retrieve a department', async () => {
    await repo.create(dept);
    expect(await repo.findById('dept-1')).toEqual(dept);
    expect(await repo.findByLabel('IT')).toEqual(dept);
    expect((await repo.findById('dept-1'))?.site).toBe(site);
  });

  it('should update an existing department', async () => {
    await repo.create(dept);
    dept.label = 'Tech';
    const updated = await repo.update(dept);
    expect(updated.label).toBe('Tech');
    expect(await repo.findByLabel('Tech')).toEqual(dept);
    expect(updated.site).toBe(site);
  });

  it('should return departments by site id', async () => {
    await repo.create(dept);
    const otherSite = new Site('site-2', 'Branch');
    const dept2 = new Department('dept-2', 'HR', null, null, otherSite);
    await repo.create(dept2);

    const result = await repo.findBySiteId('site-1');
    expect(result).toEqual([dept]);
  });

  it('should delete a department', async () => {
    await repo.create(dept);
    await repo.delete('dept-1');
    expect(await repo.findById('dept-1')).toBeNull();
  });
});
