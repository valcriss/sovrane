/* istanbul ignore file */
import { createPrisma } from './infrastructure/createPrisma';
import { ConsoleLoggerAdapter } from './adapters/logger/ConsoleLoggerAdapter';
import { PrismaAudit } from './adapters/audit/PrismaAudit';
import { PrismaUserRepository } from './adapters/repositories/PrismaUserRepository';
import { PermissionChecker } from './domain/services/PermissionChecker';
import { UpdateUserProfileUseCase } from './usecases/user/UpdateUserProfileUseCase';
import { Role } from './domain/entities/Role';
import { Site } from './domain/entities/Site';
import { Department } from './domain/entities/Department';
import { User } from './domain/entities/User';

async function main(): Promise<void> {
  const logger = new ConsoleLoggerAdapter();
  const prisma = createPrisma(logger);
  await prisma.$connect();

  const audit = new PrismaAudit(prisma, logger);
  const userRepo = new PrismaUserRepository(prisma, logger);

  const checker = new PermissionChecker(
    new User(
      'actor',
      'A',
      'B',
      'actor@example.com',
      [new Role('r', 'role')],
      'active',
      new Department('d', 'Dept', null, null, new Site('s', 'Site')),
      new Site('s', 'Site'),
    ),
  );

  const useCase = new UpdateUserProfileUseCase(userRepo, checker, audit);
  const user = await userRepo.findById('user-id');
  if (user) {
    await useCase.execute(user);
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
});
