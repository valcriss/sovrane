import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetInvitationUseCase } from '../../../usecases/invitation/GetInvitationUseCase';
import { InvitationRepositoryPort } from '../../../domain/ports/InvitationRepositoryPort';
import { Invitation } from '../../../domain/entities/Invitation';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('GetInvitationUseCase', () => {
  let repo: DeepMockProxy<InvitationRepositoryPort>;
  let checker: DeepMockProxy<PermissionChecker>;
  let invitation: Invitation;

  beforeEach(() => {
    repo = mockDeep<InvitationRepositoryPort>();
    checker = mockDeep<PermissionChecker>();
    invitation = new Invitation('a', 't', 'pending', new Date(Date.now() + 1000));
  });

  describe('without permission checker (public access)', () => {
    let useCase: GetInvitationUseCase;

    beforeEach(() => {
      useCase = new GetInvitationUseCase(repo);
    });

    it('should return invitation when valid without checking permission', async () => {
      repo.findByToken.mockResolvedValue(invitation);
      const result = await useCase.execute('t');
      expect(checker.check).not.toHaveBeenCalled();
      expect(result).toBe(invitation);
    });

    it('should return null when not found without checking permission', async () => {
      repo.findByToken.mockResolvedValue(null);
      const result = await useCase.execute('x');
      expect(checker.check).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when expired without checking permission', async () => {
      repo.findByToken.mockResolvedValue(new Invitation('a', 't', 'pending', new Date(Date.now() - 1000)));
      const result = await useCase.execute('t');
      expect(checker.check).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
