import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetInvitationUseCase } from '../../../usecases/invitation/GetInvitationUseCase';
import { InvitationRepositoryPort } from '../../../domain/ports/InvitationRepositoryPort';
import { Invitation } from '../../../domain/entities/Invitation';

describe('GetInvitationUseCase', () => {
  let repo: DeepMockProxy<InvitationRepositoryPort>;
  let useCase: GetInvitationUseCase;
  let invitation: Invitation;

  beforeEach(() => {
    repo = mockDeep<InvitationRepositoryPort>();
    useCase = new GetInvitationUseCase(repo);
    invitation = new Invitation('a', 't', 'pending', new Date(Date.now() + 1000));
  });

  it('should return invitation when valid', async () => {
    repo.findByToken.mockResolvedValue(invitation);
    const result = await useCase.execute('t');
    expect(result).toBe(invitation);
  });

  it('should return null when not found', async () => {
    repo.findByToken.mockResolvedValue(null);
    const result = await useCase.execute('x');
    expect(result).toBeNull();
  });

  it('should return null when expired', async () => {
    repo.findByToken.mockResolvedValue(new Invitation('a', 't', 'pending', new Date(Date.now() - 1000)));
    const result = await useCase.execute('t');
    expect(result).toBeNull();
  });
});
