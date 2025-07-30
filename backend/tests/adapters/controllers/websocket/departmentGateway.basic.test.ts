import { registerDepartmentGateway } from '../../../../adapters/controllers/websocket/departmentGateway';

describe('DepartmentGateway export', () => {
  it('should export a register function', () => {
    expect(typeof registerDepartmentGateway).toBe('function');
  });
});
