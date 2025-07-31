import { mockDeep } from 'jest-mock-extended';
import { DummyCronUseCase } from '../../../usecases/cron/DummyCronUseCase';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

describe('DummyCronUseCase', () => {
  it('should log execution', async () => {
    const logger = mockDeep<LoggerPort>();
    const useCase = new DummyCronUseCase(logger);

    await useCase.execute();

    expect(logger.info).toHaveBeenCalledWith('DummyCronUseCase executed');
  });
});
